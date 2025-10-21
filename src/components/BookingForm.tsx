import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, parse } from "date-fns";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(1, "A név megadása kötelező").max(100),
  email: z.string().trim().email("Érvénytelen email cím").max(255),
  phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
});

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  description: string | null;
}

interface BookingFormProps {
  tenant: any;
}

const BookingForm = ({ tenant }: BookingFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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
    fetchServices();
  }, [tenant.id]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name");

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return;

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

    // Generate time slots based on service duration
    const slots: string[] = [];
    const serviceDuration = selectedService.duration;

    availability.forEach((slot) => {
      const slotStart = parse(slot.start_time, "HH:mm:ss", new Date());
      const slotEnd = parse(slot.end_time, "HH:mm:ss", new Date());

      let currentTime = slotStart;
      while (currentTime < slotEnd) {
        const proposedEnd = addMinutes(currentTime, serviceDuration);
        
        // Check if the full service duration fits within this availability slot
        if (proposedEnd > slotEnd) break;

        const timeStr = format(currentTime, "HH:mm:ss");
        const endStr = format(proposedEnd, "HH:mm:ss");

        // Check if this time slot overlaps with any existing appointment
        const hasConflict = appointments?.some(apt => {
          const aptStart = parse(apt.start_time, "HH:mm:ss", new Date());
          const aptEnd = parse(apt.end_time, "HH:mm:ss", new Date());
          const proposedStart = parse(timeStr, "HH:mm:ss", new Date());
          const proposedEndTime = parse(endStr, "HH:mm:ss", new Date());
          
          // Check if there's any overlap
          return (proposedStart < aptEnd && proposedEndTime > aptStart);
        });

        if (!hasConflict) {
          slots.push(format(currentTime, "HH:mm"));
        }

        currentTime = addMinutes(currentTime, 15); // Check every 15 minutes
      }
    });

    setAvailableSlots(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !selectedService) {
      toast({
        title: "Hiányzó információ",
        description: "Válassz szolgáltatást, dátumot és időpontot",
        variant: "destructive",
      });
      return;
    }

    try {
      bookingSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Érvénytelen adat",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const startTime = parse(selectedTime, "HH:mm", new Date());
    const endTime = addMinutes(startTime, selectedService.duration);

    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenant.id,
      service_id: selectedService.id,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone || null,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: format(startTime, "HH:mm:ss"),
      end_time: format(endTime, "HH:mm:ss"),
      price: selectedService.price,
      notes: formData.notes || null,
    });

    if (error) {
      toast({
        title: "Foglalás sikertelen",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      // Navigate to confirmation page with booking details
      navigate("/booking-confirmation", {
        state: {
          booking: {
            businessName: tenant.business_name,
            serviceName: selectedService.name,
            date: format(selectedDate, "yyyy-MM-dd"),
            startTime: format(startTime, "HH:mm:ss"),
            endTime: format(endTime, "HH:mm:ss"),
            duration: selectedService.duration,
            price: selectedService.price,
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            notes: formData.notes,
          }
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Szolgáltatás választása *</Label>
          <Select 
            value={selectedService?.id} 
            onValueChange={(value) => {
              const service = services.find(s => s.id === value);
              setSelectedService(service || null);
              setSelectedTime(""); // Reset time when service changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Válassz szolgáltatást" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - {service.duration} perc
                  {service.price && ` (${service.price.toLocaleString('hu-HU')} Ft)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedService?.description && (
            <p className="text-sm text-muted-foreground">{selectedService.description}</p>
          )}
        </div>

        {selectedService && (
          <>
            <div>
              <Label>Dátum választása</Label>
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
                <Label>Elérhető időpontok</Label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ezen a napon nincs szabad időpont</p>
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
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Név *</Label>
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
          <Label htmlFor="phone">Telefonszám</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Megjegyzés</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !selectedDate || !selectedTime || !selectedService}>
        {loading ? "Foglalás..." : "Időpont foglalása"}
      </Button>
    </form>
  );
};

export default BookingForm;
