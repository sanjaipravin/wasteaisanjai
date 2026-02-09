import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AnalyzeWasteRequest, type ConfirmDisposalRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useWasteAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AnalyzeWasteRequest) => {
      const res = await apiRequest("POST", api.waste.analyze.path, data);
      return api.waste.analyze.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate history so it updates with the new tentative item if saved
      queryClient.invalidateQueries({ queryKey: [api.waste.history.path] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useConfirmDisposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ConfirmDisposalRequest) => {
      const res = await apiRequest("POST", api.waste.confirmDisposal.path, data);
      return api.waste.confirmDisposal.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.waste.history.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.leaderboard.list.path] });
      
      toast({
        title: data.correct ? "Well Done! 🎉" : "Oops! ⚠️",
        description: data.message,
        variant: data.correct ? "default" : "destructive", // Or a custom 'warning' variant if available
        className: data.correct ? "bg-green-600 text-white border-none" : undefined
      });
    },
  });
}

export function useWasteHistory() {
  return useQuery({
    queryKey: [api.waste.history.path],
    queryFn: async () => {
      const res = await fetch(api.waste.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.waste.history.responses[200].parse(await res.json());
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaderboard.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.leaderboard.list.responses[200].parse(await res.json());
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: [api.leaderboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.leaderboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.leaderboard.stats.responses[200].parse(await res.json());
    },
  });
}
