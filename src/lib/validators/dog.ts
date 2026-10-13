import { z } from 'zod';

const ageRangeValues = ['puppy', 'young', 'adult', 'senior'] as const;
const sizeValues = ['small', 'medium', 'large', 'extra_large'] as const;

export const dogFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Dog name is required')
    .max(100, 'Name is too long'),
  breed: z
    .string()
    .max(100, 'Breed name is too long')
    .optional()
    .or(z.literal('')),
  ageRange: z.enum(ageRangeValues, 'Please select an age range'),
  size: z.enum(sizeValues, 'Please select a size'),
  temperament: z
    .string()
    .max(500, 'Temperament description is too long')
    .optional()
    .or(z.literal('')),
  walkingBehaviorNotes: z
    .string()
    .max(1000, 'Walking notes are too long')
    .optional()
    .or(z.literal('')),
  leadHarnessInstructions: z
    .string()
    .max(500, 'Lead/harness instructions are too long')
    .optional()
    .or(z.literal('')),
  emergencyContactName: z
    .string()
    .max(100, 'Contact name is too long')
    .optional()
    .or(z.literal('')),
  emergencyContactPhone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
});

export type DogFormData = z.infer<typeof dogFormSchema>;