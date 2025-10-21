import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { hu } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CalendarViewProps {
  appointments: any[];
  currentDate: Date;
  viewMode: "week" | "day";
  onAppointmentClick: (appointment: any) => void;
}

const CalendarView = ({ 
  appointments, 
  currentDate, 
  viewMode,
  onAppointmentClick 
}: CalendarViewProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const daysToShow = viewMode === "week" ? 7 : 1;
  const days = Array.from({ length: daysToShow }, (_, i) => 
    viewMode === "week" ? addDays(weekStart, i) : currentDate
  );

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

  const getAppointmentsForDayAndHour = (day: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.appointment_date);
      const aptHour = parseInt(apt.start_time.split(':')[0]);
      return isSameDay(aptDate, day) && aptHour === hour;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-primary text-primary-foreground";
      case "scheduled": return "bg-secondary text-secondary-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header with days */}
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${daysToShow}, 1fr)` }}>
        <div className="bg-muted p-3 border-b border-r font-medium text-sm">Idő</div>
        {days.map((day, i) => (
          <div key={i} className="bg-muted p-3 border-b text-center">
            <div className="font-semibold">{format(day, "EEE", { locale: hu })}</div>
            <div className="text-sm text-muted-foreground">{format(day, "MMM d")}</div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map(hour => (
          <div 
            key={hour} 
            className="grid border-b last:border-b-0"
            style={{ gridTemplateColumns: `80px repeat(${daysToShow}, 1fr)`, minHeight: '80px' }}
          >
            <div className="border-r p-2 text-sm text-muted-foreground font-medium">
              {hour}:00
            </div>
            {days.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDayAndHour(day, hour);
              return (
                <div 
                  key={dayIndex} 
                  className="border-r last:border-r-0 p-1 relative"
                >
                  {dayAppointments.map((apt, aptIndex) => (
                    <Card
                      key={apt.id}
                      className={`p-2 mb-1 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(apt.status)}`}
                      onClick={() => onAppointmentClick(apt)}
                    >
                      <div className="text-xs font-semibold truncate">
                        {apt.customer_name}
                      </div>
                      <div className="text-xs truncate">
                        {apt.services?.name}
                      </div>
                      <div className="text-xs opacity-80">
                        {apt.start_time.slice(0, 5)}
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
