export const DOG_AGE_RANGES = ['puppy', 'young', 'adult', 'senior'] as const;
export type DogAgeRange = (typeof DOG_AGE_RANGES)[number];

export const DOG_SIZES = ['small', 'medium', 'large', 'extra_large'] as const;
export type DogSize = (typeof DOG_SIZES)[number];

export interface Dog {
  id: string;
  customer_id: string;
  name: string;
  breed: string | null;
  age_range: DogAgeRange | null;
  size: DogSize | null;
  temperament: string | null;
  walking_behavior_notes: string | null;
  lead_harness_instructions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  photo_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AGE_RANGE_LABELS: Record<DogAgeRange, string> = {
  puppy: 'Puppy (under 1 year)',
  young: 'Young (1–3 years)',
  adult: 'Adult (3–8 years)',
  senior: 'Senior (8+ years)',
};

export const SIZE_LABELS: Record<DogSize, string> = {
  small: 'Small (under 10 kg)',
  medium: 'Medium (10–25 kg)',
  large: 'Large (25–40 kg)',
  extra_large: 'Extra Large (40+ kg)',
};