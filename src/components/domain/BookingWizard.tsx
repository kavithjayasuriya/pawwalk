'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Dog } from '@/lib/types/dog';
import type { TimeSlot } from '@/lib/types/booking';
import { createBookingViaPython } from '@/lib/api/python-backend';
import { getAvailableSlots } from '@/lib/queries/availability-browser';
import { DogSelector } from '@/components/domain/DogSelector';
import { ServiceSelector } from '@/components/domain/ServiceSelector';
import { DateSelector } from '@/components/domain/DateSelector';
import { TimeSlotGrid } from '@/components/domain/TimeSlotGrid';
import { BookingReview } from '@/components/domain/BookingReview';
import { formatPrice } from '@/lib/utils/dates';
import { SECOND_DOG_FEE_CENTS } from '@/lib/constants/schedule';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  base_price_cents: number;
}

interface BookingWizardProps {
  dogs: Dog[];
  services: Service[];
  defaultAddress: string;
  defaultNotes: string;
}

const STEPS = [
  'Select Dogs',
  'Select Service',
  'Select Date',
  'Select Time',
  'Pickup Details',
  'Review & Confirm',
];

export function BookingWizard({
  dogs,
  services,
  defaultAddress,
  defaultNotes,
}: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState(defaultAddress);
  const [pickupNotes, setPickupNotes] = useState(defaultNotes);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Idempotency key: one UUID per logical booking attempt.
  // Reset when booking-defining inputs change.
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    idempotencyKeyRef.current = null;
  }, [selectedDogIds, selectedServiceId, selectedDate, selectedTime, pickupAddress, pickupNotes]);

  const selectedDogs = dogs.filter((d) => selectedDogIds.includes(d.id));
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const dogCount = selectedDogIds.length;
  const secondDogFee = dogCount === 2 ? SECOND_DOG_FEE_CENTS : 0;
  const basePrice = selectedService?.base_price_cents ?? 0;
  const totalPrice = basePrice + secondDogFee;

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    getAvailableSlots(selectedServiceId, selectedDate)
      .then((data) => setSlots(data))
      .finally(() => setSlotsLoading(false));
  }, [selectedServiceId, selectedDate]);

  function canProceed(): boolean {
    switch (step) {
      case 0: return selectedDogIds.length >= 1;
      case 1: return selectedServiceId !== null;
      case 2: return selectedDate !== null;
      case 3: return selectedTime !== null;
      case 4: return pickupAddress.trim().length > 0;
      case 5: return true;
      default: return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    // Generate key on first attempt; reuse on retry
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const result = await createBookingViaPython({
        service_id: selectedServiceId!,
        dog_ids: selectedDogIds,
        date: selectedDate!,
        time: selectedTime!,
        pickup_address: pickupAddress,
        pickup_notes: pickupNotes || null,
        idempotency_key: idempotencyKeyRef.current,
      });

      if ('error' in result) {
        setError(result.error);
      } else {
        idempotencyKeyRef.current = null;
        router.push(`/bookings/${result.bookingId}`);
        return; // keep submitting=true during redirect
      }
    } catch {
      // Network/CORS exception that escaped apiFetch
      setError('Unable to connect to the booking service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  i < step
                    ? 'bg-emerald-600 text-white'
                    : i === step
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600'
                      : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-emerald-600' : 'bg-zinc-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-sm font-medium text-zinc-700">{STEPS[step]}</div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6">
        {step === 0 && <DogSelector dogs={dogs} selectedIds={selectedDogIds} onChange={setSelectedDogIds} />}
        {step === 1 && <ServiceSelector services={services} selectedId={selectedServiceId} dogCount={dogCount} onChange={setSelectedServiceId} />}
        {step === 2 && <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />}
        {step === 3 && <TimeSlotGrid slots={slots} selectedTime={selectedTime} onChange={setSelectedTime} loading={slotsLoading} />}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="pickupAddress" className="mb-1 block text-sm font-medium text-zinc-700">
                Pickup address <span className="text-red-500">*</span>
              </label>
              <input id="pickupAddress" type="text" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="123 Main St, Melbourne" />
            </div>
            <div>
              <label htmlFor="pickupNotes" className="mb-1 block text-sm font-medium text-zinc-700">
                Pickup instructions <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea id="pickupNotes" rows={3} value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Gate code, parking instructions, etc." />
            </div>
          </div>
        )}
        {step === 5 && selectedService && selectedDate && selectedTime && (
          <BookingReview selectedDogs={selectedDogs} serviceName={selectedService.name} serviceDuration={selectedService.duration_minutes}
            basePriceCents={basePrice} date={selectedDate} time={selectedTime} pickupAddress={pickupAddress} pickupNotes={pickupNotes}
            secondDogFeeCents={secondDogFee} totalPriceCents={totalPrice} />
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setStep(step - 1); setError(null); }}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => { setStep(step + 1); setError(null); }} disabled={!canProceed()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Continue</button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Confirming…' : `Confirm booking · ${formatPrice(totalPrice)}`}
          </button>
        )}
      </div>
    </div>
  );
}