import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AppointmentsListProps {
  tenantId: string;
}

const AppointmentsList = ({ tenantId }: AppointmentsListProps) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Appointment marked as ${newStatus}`,
      });
      fetchAppointments();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "scheduled": return "secondary";
      case "cancelled": return "destructive";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>
          Manage your upcoming and past appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No appointments yet</p>
            <p className="text-sm">Share your booking page to start receiving appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{appointment.customer_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm mb-4">
                    {appointment.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${appointment.customer_email}`} className="hover:underline">
                          {appointment.customer_email}
                        </a>
                      </div>
                    )}
                    {appointment.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${appointment.customer_phone}`} className="hover:underline">
                          {appointment.customer_phone}
                        </a>
                      </div>
                    )}
                    {appointment.notes && (
                      <p className="text-muted-foreground mt-2">{appointment.notes}</p>
                    )}
                  </div>

                  {appointment.status === "scheduled" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appointment.id, "confirmed")}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, "completed")}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appointment.id, "cancelled")}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentsList;