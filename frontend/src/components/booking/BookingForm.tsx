import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Service, Master, AvailableSlot } from "@/types";
import { formatCurrency } from "@/utils/formatters";
import { formatTime } from "@/utils/dates";
import { NATIONALITIES } from "@/components/ui/NationalitySelect";

const schema = z.object({
  client_name: z.string().min(2, "Name is required"),
  client_phone: z.string().min(6, "Phone is required"),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  client_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  salonId: number;
  services: Service[];
  masters: Master[];
  onSubmit: (data: {
    service_id: number;
    master_id?: number;
    slot: AvailableSlot;
    client_name: string;
    client_phone: string;
    client_email?: string;
    client_notes?: string;
  }) => void;
  isLoading?: boolean;
  availableSlots: AvailableSlot[];
  onServiceChange: (serviceId: number) => void;
  onMasterChange: (masterId?: number) => void;
  onDateChange: (date: string) => void;
  selectedDate: string;
  preselectedMasterId?: number;
  preselectedServiceId?: number;
}

export function BookingForm({
  services,
  masters,
  onSubmit,
  isLoading,
  availableSlots,
  onServiceChange,
  onMasterChange,
  onDateChange,
  selectedDate,
  preselectedMasterId,
  preselectedServiceId,
}: BookingFormProps) {
  const [selectedService, setSelectedService] = useState<number | null>(preselectedServiceId ?? null);
  const [selectedMaster, setSelectedMaster] = useState<number | undefined>(preselectedMasterId);

  useEffect(() => {
    if (preselectedMasterId !== undefined) {
      onMasterChange(preselectedMasterId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleServiceChange = (val: string) => {
    const id = Number(val);
    setSelectedService(id);
    setSelectedSlot(null);
    onServiceChange(id);
  };

  const handleMasterChange = (val: string) => {
    const id = val === "any" ? undefined : Number(val);
    setSelectedMaster(id);
    setSelectedSlot(null);
    onMasterChange(id);
  };

  const onFormSubmit = (values: FormValues) => {
    if (!selectedService || !selectedSlot) return;
    onSubmit({
      service_id: selectedService,
      master_id: selectedMaster,
      slot: selectedSlot,
      client_name: values.client_name,
      client_phone: values.client_phone,
      client_email: values.client_email || undefined,
      client_notes: values.client_notes,
    });
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Service */}
      <div className="space-y-1">
        <Label>Service *</Label>
        <Select onValueChange={handleServiceChange} defaultValue={preselectedServiceId ? String(preselectedServiceId) : undefined}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} — {formatCurrency(s.price)} ({s.duration_minutes} min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Professional — hidden when pre-selected via URL */}
      {preselectedMasterId === undefined && (
        <div className="space-y-1">
          <Label>Professional (optional)</Label>
          <Select onValueChange={handleMasterChange} defaultValue="any">
            <SelectTrigger>
              <SelectValue placeholder="Any available professional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any available professional</SelectItem>
              {masters.map((m) => {
                const flag = m.nationality
                  ? (NATIONALITIES.find((n) => n.label === m.nationality)?.flag ?? "")
                  : "";
                return (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {flag ? `${flag} ${m.name}` : m.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1">
        <Label>Date *</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => { onDateChange(e.target.value); setSelectedSlot(null); }}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* Time slots */}
      {selectedService && selectedDate && (
        <div className="space-y-2">
          <Label>Available Time Slots</Label>
          {availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center border rounded-md">
              No available slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedSlot === slot
                      ? "border-gray-700 bg-gray-50 text-gray-700"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {formatTime(`2000-01-01T${slot.start_time}`)}
                  {slot.professional_name && (
                    <div className="text-xs text-muted-foreground truncate">{slot.professional_name}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client info */}
      <div className="space-y-1">
        <Label>Your Name *</Label>
        <Input {...register("client_name")} placeholder="Jane Doe" />
        {errors.client_name && <p className="text-xs text-destructive">{errors.client_name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Phone *</Label>
        <Input {...register("client_phone")} type="tel" placeholder="+1 (555) 000-0000" />
        {errors.client_phone && <p className="text-xs text-destructive">{errors.client_phone.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Email (optional)</Label>
        <Input {...register("client_email")} type="email" placeholder="jane@example.com" />
      </div>

      <div className="space-y-1">
        <Label>Notes (optional)</Label>
        <Input {...register("client_notes")} placeholder="Any special requests..." />
      </div>

      {/* Summary */}
      {selectedServiceData && selectedSlot && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm">
          <p className="font-semibold text-gray-800">Booking Summary</p>
          <p className="mt-1 text-gray-700">Service: {selectedServiceData.name}</p>
          <p className="text-gray-700">Time: {formatTime(`2000-01-01T${selectedSlot.start_time}`)}</p>
          <p className="text-gray-700">Professional: {selectedSlot.professional_name}</p>
          <p className="font-semibold text-gray-800">Price: {formatCurrency(selectedServiceData.price)}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedService || !selectedSlot || isLoading}
      >
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        Book Appointment
      </Button>
    </form>
  );
}
