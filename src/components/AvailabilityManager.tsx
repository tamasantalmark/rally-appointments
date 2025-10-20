import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityManagerProps {
  tenantId: string;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const AvailabilityManager = ({ tenantId }: AvailabilityManagerProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
  });

  useEffect(() => {
    fetchSlots();
  }, [tenantId]);

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.error("Error fetching slots:", error);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  const addSlot = async () => {
    const { error } = await supabase
      .from("availability_slots")
      .insert({
        tenant_id: tenantId,
        ...newSlot,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot added",
      });
      fetchSlots();
    }
  };

  const deleteSlot = async (slotId: string) => {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", slotId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Availability slot removed",
      });
      fetchSlots();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
        <CardDescription>Set your available time slots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Slot */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Add Time Slot</h3>
            
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newSlot.day_of_week.toString()}
                onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slot Duration (minutes)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={newSlot.slot_duration}
                onChange={(e) => setNewSlot({ ...newSlot, slot_duration: parseInt(e.target.value) })}
              />
            </div>

            <Button onClick={addSlot} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>

          {/* Current Slots */}
          <div className="space-y-2">
            <h3 className="font-medium">Current Availability</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability slots set</p>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {DAYS.find((d) => d.value === slot.day_of_week)?.label}
                      </div>
                      <div className="text-muted-foreground">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} ({slot.slot_duration}min slots)
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;