import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CreditCard, User, Mail, Phone, FileText, Download } from "lucide-react";
import { format, parse } from "date-fns";
import { hu } from "date-fns/locale";

interface BookingDetails {
  businessName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking as BookingDetails;

  if (!booking) {
    navigate("/");
    return null;
  }

  const generateCalendarLinks = () => {
    const dateObj = parse(booking.date, "yyyy-MM-dd", new Date());
    const startTimeObj = parse(booking.startTime, "HH:mm:ss", new Date());
    const endTimeObj = parse(booking.endTime, "HH:mm:ss", new Date());
    
    // Combine date and time
    const startDateTime = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      startTimeObj.getHours(),
      startTimeObj.getMinutes()
    );
    
    const endDateTime = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      endTimeObj.getHours(),
      endTimeObj.getMinutes()
    );

    // Format for calendar files
    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${booking.serviceName} - ${booking.businessName}`);
    const details = encodeURIComponent(
      `Szolgáltatás: ${booking.serviceName}\n` +
      `Helyszín: ${booking.businessName}\n` +
      `Időtartam: ${booking.duration} perc\n` +
      (booking.price ? `Ár: ${booking.price.toLocaleString('hu-HU')} Ft\n` : '') +
      (booking.notes ? `Megjegyzés: ${booking.notes}` : '')
    );

    // Google Calendar
    const googleStart = formatCalendarDate(startDateTime).replace('Z', '');
    const googleEnd = formatCalendarDate(endDateTime).replace('Z', '');
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${googleStart}/${googleEnd}&details=${details}`;

    // Outlook/Teams Calendar
    const outlookStart = startDateTime.toISOString();
    const outlookEnd = endDateTime.toISOString();
    const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${details}`;

    // iCal format (works for Apple Calendar and others)
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatCalendarDate(startDateTime)}
DTEND:${formatCalendarDate(endDateTime)}
SUMMARY:${booking.serviceName} - ${booking.businessName}
DESCRIPTION:Szolgáltatás: ${booking.serviceName}\\nHelyszín: ${booking.businessName}\\nIdőtartam: ${booking.duration} perc${booking.price ? `\\nÁr: ${booking.price.toLocaleString('hu-HU')} Ft` : ''}${booking.notes ? `\\nMegjegyzés: ${booking.notes}` : ''}
END:VEVENT
END:VCALENDAR`;

    return { googleUrl, outlookUrl, icalContent };
  };

  const { googleUrl, outlookUrl, icalContent } = generateCalendarLinks();

  const downloadIcal = () => {
    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'foglalas.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formattedDate = format(parse(booking.date, "yyyy-MM-dd", new Date()), "yyyy. MMMM d. (EEEE)", { locale: hu });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Sikeres foglalás!</h1>
          <p className="text-muted-foreground">
            A foglalásod visszaigazolását elküldtük emailben
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{booking.businessName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Szolgáltatás</p>
                  <p className="text-muted-foreground">{booking.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{booking.duration} perc</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Időpont</p>
                  <p className="text-muted-foreground">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Kezdés</p>
                  <p className="text-muted-foreground">
                    {format(parse(booking.startTime, "HH:mm:ss", new Date()), "HH:mm")} - {format(parse(booking.endTime, "HH:mm:ss", new Date()), "HH:mm")}
                  </p>
                </div>
              </div>

              {booking.price && (
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Ár</p>
                    <p className="text-muted-foreground">{booking.price.toLocaleString('hu-HU')} Ft</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold">Kapcsolattartó adatok</h3>
              
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <p className="text-muted-foreground">{booking.customerName}</p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <p className="text-muted-foreground">{booking.customerEmail}</p>
              </div>

              {booking.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <p className="text-muted-foreground">{booking.customerPhone}</p>
                </div>
              )}

              {booking.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Megjegyzés</p>
                    <p className="text-muted-foreground">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Hozzáadás naptárhoz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(googleUrl, '_blank')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M17.1,13.5h-2.6v2.6h-1.8v-2.6H10v-1.8h2.6V9.1h1.8v2.6h2.6V13.5z" />
              </svg>
              Google Naptár
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(outlookUrl, '_blank')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V14H17V10H7M7,16V20H17V16H7Z" />
              </svg>
              Outlook / Teams Naptár
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadIcal}
            >
              <Download className="w-5 h-5 mr-2" />
              Apple Naptár / iCal letöltés
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Vissza a főoldalra
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
