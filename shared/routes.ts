import { z } from 'zod';
import { insertWasteItemSchema, wasteItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  waste: {
    analyze: {
      method: 'POST' as const,
      path: '/api/waste/analyze' as const,
      input: z.object({
        image: z.string(), // Base64
      }),
      responses: {
        200: z.object({
          id: z.number().optional(),
          detected_item: z.string(),
          category: z.enum(["Wet Waste", "Dry Waste", "Recyclable Waste"]),
          confidence: z.number(),
          certainty: z.enum(["certain", "uncertain"]),
          disposal_instruction: z.string(),
          educational_explanation: z.string(),
          retry_message: z.string().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    confirmDisposal: {
      method: 'POST' as const,
      path: '/api/waste/confirm' as const,
      input: z.object({
        wasteItemId: z.number(),
        binType: z.enum(["Wet Waste", "Dry Waste", "Recyclable Waste"]),
      }),
      responses: {
        200: z.object({
          correct: z.boolean(),
          pointsChange: z.number(),
          totalPoints: z.number(),
          message: z.string(),
        }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/waste/history' as const,
      responses: {
        200: z.array(z.custom<typeof wasteItems.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  leaderboard: {
    list: {
      method: 'GET' as const,
      path: '/api/leaderboard' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          userId: z.string().nullable(),
          totalPoints: z.number(),
          scansCount: z.number(),
          updatedAt: z.string().nullable(), // timestamp returns as string in JSON
          username: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          profileImageUrl: z.string().nullable(),
        })),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          totalPoints: z.number(),
          scansCount: z.number(),
          recentScans: z.array(z.custom<typeof wasteItems.$inferSelect>()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
