import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const guestAuthSchema = z.object({
  deviceId: z.string().min(1),
});
