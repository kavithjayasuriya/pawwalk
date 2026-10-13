import { z } from 'zod';

export const createBookingSchema = z.object({
  dogIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one dog')
    .max(2, 'Maximum 2 dogs per booking'),
  serviceId: z.string().uuid('Please select a service'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
  pickupAddress: z
    .string()
    .min(1, 'Pickup address is required')
    .max(500, 'Address is too long'),
  pickupNotes: z
    .string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal('')),
  idempotencyKey: z.string().uuid('Invalid idempotency key'),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z
    .string()
    .max(500, 'Reason is too long')
    .optional()
    .or(z.literal('')),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;