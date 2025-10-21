import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addWeeks, startOfWeek } from "date-fns";
import { hu } from "date-fns/locale";
import CalendarView from "./CalendarView";
import AppointmentDialog from "./AppointmentDialog";

interface AppointmentsListProps {
  tenantId: string;
}

const AppointmentsList = ({ tenantId }: AppointmentsListProps) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    // Fetch appointments
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      setLoading(false);
      return;
    }

    // Fetch services separately
    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId);

    if (servicesError) {
      console.error("Error fetching services:", servicesError);
    }

    // Manually join the data
    const appointmentsWithServices = (appointmentsData || []).map(appointment => {
      const service = servicesData?.find(s => s.id === appointment.service_id);
      return {
        ...appointment,
        services: service ? {
          name: service.name,
          duration: service.duration,
          price: service.price
        } : null
      };
    });

    setAppointments(appointmentsWithServices);
    setLoading(false);
  };

  const handleConfirm = async (appointmentId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointmentId);

    if (error) {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Megerősítve",
        description: "A foglalás megerősítve",
      });
      fetchAppointments();
    }
  };

  const handleCancel = async (appointmentId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Törölve",
        description: "A foglalás törölve",
      });
      fetchAppointments();
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(prev => direction === "next" ? addWeeks(prev, 1) : addWeeks(prev, -1));
    } else {
      setCurrentDate(prev => direction === "next" ? addDays(prev, 1) : addDays(prev, -1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Foglalások</CardTitle>
          <CardDescription>
            Naptárnézetben kezelheted a foglalásaidat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincsenek foglalások</p>
              <p className="text-sm">Oszd meg a foglalási oldaladat, hogy időpontokat fogadhass</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToToday}
                  >
                    Ma
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateDate("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="font-medium ml-2">
                    {viewMode === "week" 
                      ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d", { locale: hu })} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "MMM d, yyyy", { locale: hu })}`
                      : format(currentDate, "MMMM d, yyyy", { locale: hu })
                    }
                  </span>
                </div>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "week" | "day")}>
                  <TabsList>
                    <TabsTrigger value="week">Heti</TabsTrigger>
                    <TabsTrigger value="day">Napi</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Calendar */}
              <CalendarView
                appointments={appointments}
                currentDate={currentDate}
                viewMode={viewMode}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default AppointmentsList;