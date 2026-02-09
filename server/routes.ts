import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/image"; // Reusing the openai client from the integration

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Analyze Waste Endpoint
  app.post(api.waste.analyze.path, async (req, res) => {
    // Only authenticated users can analyze (optional, but good for tracking history)
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { image } = api.waste.analyze.input.parse(req.body);

      // Call OpenAI for analysis
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are WasteLens AI, an expert waste-segregation assistant.
            Analyze the image and respond in the following JSON format ONLY:
            {
              "detected_item": "string",
              "category": "Wet Waste" | "Dry Waste" | "Recyclable Waste",
              "confidence": number (0-100),
              "certainty": "certain" | "uncertain", // uncertain if confidence < 60
              "disposal_instruction": "string",
              "educational_explanation": "string (max 2 lines, simple language)",
              "retry_message": "string (optional, if uncertain)"
            }
            Focus only on the primary waste item.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this waste item." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const analysisRaw = response.choices[0].message.content;
      if (!analysisRaw) {
        throw new Error("Failed to get analysis from AI");
      }

      const analysis = JSON.parse(analysisRaw);

      // Create a record in the database (even if uncertain, we log it)
      const userId = (req.user as any).claims.sub;
      const savedItem = await storage.createWasteItem({
        userId,
        imageUrl: "image_stored_temporarily", // In a real app, upload to object storage. Here we just mock or leave empty for now as we don't have object storage set up in this specific flow yet.
        detectedItem: analysis.detected_item,
        category: analysis.category,
        confidence: analysis.confidence,
        certainty: analysis.certainty,
        disposalInstruction: analysis.disposal_instruction,
        educationalExplanation: analysis.educational_explanation,
      });

      // Update user stats (increment scan count)
      await storage.updateUserPoints(userId, 0); // Just ensure entry exists and increment scan count

      res.json({
        id: savedItem.id,
        ...analysis
      });

    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // Confirm Disposal Endpoint
  app.post(api.waste.confirmDisposal.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { wasteItemId, binType } = api.waste.confirmDisposal.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const item = await storage.getWasteItem(wasteItemId);
      if (!item) {
        return res.status(404).json({ message: "Waste item not found" });
      }

      // Validate disposal
      // "Correct disposal → +10 points", "Incorrect disposal → −5 points"
      const correct = item.category === binType;
      const pointsChange = correct ? 10 : -5;

      // Update Waste Item
      await storage.updateWasteItemDisposal(wasteItemId, correct, pointsChange);

      // Update User Points
      const newStats = await storage.updateUserPoints(userId, pointsChange);

      res.json({
        correct,
        pointsChange,
        totalPoints: newStats.totalPoints,
        message: correct ? "Great job! +10 Points" : `Oops! That belongs in ${item.category}. -5 Points`
      });

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // History Endpoint
  app.get(api.waste.history.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const history = await storage.getUserWasteHistory(userId);
    res.json(history);
  });

  // Leaderboard Endpoint
  app.get(api.leaderboard.list.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  // User Stats Endpoint
  app.get(api.leaderboard.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    // Ensure stats exist
    await storage.ensureLeaderboardEntry(userId);
    
    const stats = await storage.getUserStats(userId);
    const recentScans = await storage.getUserWasteHistory(userId);
    
    // We can limit recent scans here if needed
    const limitedScans = recentScans.slice(0, 5);

    if (!stats) {
       return res.status(500).json({ message: "Failed to fetch stats" });
    }

    res.json({
      totalPoints: stats.totalPoints,
      scansCount: stats.scansCount,
      recentScans: limitedScans
    });
  });

  // Seed Data (if empty)
  (async () => {
    const leaderboard = await storage.getLeaderboard();
    if (leaderboard.length === 0) {
      console.log("Seeding initial leaderboard data...");
      // Create some dummy users directly in DB or just leaderboard entries linked to no user if schema allows, 
      // but schema says userId references users.id. 
      // So we can't easily seed users via storage without auth flow usually.
      // However, we can use the `users` table directly if we import it.
      // For now, let's skip complex seeding that requires user creation to avoid auth complications 
      // or create a dummy user if really needed.
      // A better approach is to rely on the app usage, or if I must, I can insert into `users` then `leaderboard`.
      
      // Let's just log that we are ready.
      console.log("Database ready. No seed data added to avoid auth conflicts.");
    }
  })();

  return httpServer;
}
