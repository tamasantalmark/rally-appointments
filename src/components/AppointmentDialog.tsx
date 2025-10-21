import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Mail, Phone, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface AppointmentDialogProps {
  appointment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}

const AppointmentDialog = ({ 
  appointment, 
  open, 
  onOpenChange,
  onConfirm,
  onCancel 
}: AppointmentDialogProps) => {
  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "scheduled": return "secondary";
      case "cancelled": return "destructive";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{appointment.customer_name}</span>
            <Badge variant={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {appointment.services?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(appointment.appointment_date), "EEEE, MMMM dd, yyyy")}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</span>
          </div>

          {appointment.price && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.price.toLocaleString('hu-HU')} Ft</span>
            </div>
          )}

          {appointment.customer_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${appointment.customer_email}`} className="hover:underline">
                {appointment.customer_email}
              </a>
            </div>
          )}

          {appointment.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${appointment.customer_phone}`} className="hover:underline">
                {appointment.customer_phone}
              </a>
            </div>
          )}

          {appointment.notes && (
            <div className="text-sm">
              <p className="font-medium mb-1">Megjegyzések:</p>
              <p className="text-muted-foreground">{appointment.notes}</p>
            </div>
          )}

          {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
            <div className="flex gap-2 pt-4">
              {appointment.status === "scheduled" && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    onConfirm(appointment.id);
                    onOpenChange(false);
                  }}
                >
                  Confirm
                </Button>
              )}
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => {
                  onCancel(appointment.id);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
