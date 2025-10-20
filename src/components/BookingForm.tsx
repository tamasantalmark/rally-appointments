import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parse } from "date-fns";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
});

interface BookingFormProps {
  tenant: any;
}

const BookingForm = ({ tenant }: BookingFormProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();

    const { data: availability, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("day_of_week", dayOfWeek);

    if (error || !availability || availability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    // Get existing appointments for this day
    const { data: appointments } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("tenant_id", tenant.id)
      .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      .neq("status", "cancelled");

    const bookedTimes = new Set(appointments?.map(a => a.start_time) || []);

    // Generate time slots
    const slots: string[] = [];
    availability.forEach((slot) => {
      const startTime = parse(slot.start_time, "HH:mm:ss", new Date());
      const endTime = parse(slot.end_time, "HH:mm:ss", new Date());
      const duration = slot.slot_duration;

      let currentTime = startTime;
      while (currentTime < endTime) {
        const timeStr = format(currentTime, "HH:mm:ss");
        if (!bookedTimes.has(timeStr)) {
          slots.push(format(currentTime, "HH:mm"));
        }
        currentTime = addMinutes(currentTime, duration);
      }
    });

    setAvailableSlots(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      bookingSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    // Get slot duration from availability
    const dayOfWeek = selectedDate.getDay();
    const { data: availability } = await supabase
      .from("availability_slots")
      .select("slot_duration")
      .eq("tenant_id", tenant.id)
      .eq("day_of_week", dayOfWeek)
      .single();

    const duration = availability?.slot_duration || 30;
    const startTime = parse(selectedTime, "HH:mm", new Date());
    const endTime = addMinutes(startTime, duration);

    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenant.id,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone || null,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: format(startTime, "HH:mm:ss"),
      end_time: format(endTime, "HH:mm:ss"),
      notes: formData.notes || null,
    });

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your appointment has been booked",
      });
      // Reset form
      setFormData({ name: "", email: "", phone: "", notes: "" });
      setSelectedDate(undefined);
      setSelectedTime("");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border mt-2"
          />
        </div>

        {selectedDate && (
          <div className="space-y-2">
            <Label>Available Times</Label>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots for this day</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className="w-full"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !selectedDate || !selectedTime}>
        {loading ? "Booking..." : "Book Appointment"}
      </Button>
    </form>
  );
};

export default BookingForm;