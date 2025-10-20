import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";

const BookingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant();
  }, [slug]);

  const fetchTenant = async () => {
    if (!slug) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      console.error("Tenant not found");
      navigate("/");
      return;
    }

    setTenant(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tenant.business_name}</h1>
              {tenant.description && (
                <p className="text-muted-foreground">{tenant.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Booking Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Book an Appointment</CardTitle>
              <CardDescription>
                Select a date and time that works for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingForm tenant={tenant} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;