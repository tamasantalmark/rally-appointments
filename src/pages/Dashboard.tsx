import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut, Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TenantSetup from "@/components/TenantSetup";
import AppointmentsList from "@/components/AppointmentsList";
import AvailabilityManager from "@/components/AvailabilityManager";
import ServicesManager from "@/components/ServicesManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await fetchTenant(session.user.id);
  };

  const fetchTenant = async (userId: string) => {
    setLoading(true);
    
    // Fetch tenant through tenant_users junction table
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (tenantUsersError) {
      console.error("Error fetching tenant users:", tenantUsersError);
      setLoading(false);
      return;
    }

    if (!tenantUsers) {
      setTenant(null);
      setLoading(false);
      return;
    }

    // Fetch the actual tenant data
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantUsers.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching tenant:", error);
    } else {
      setTenant(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  const handleTenantCreated = (newTenant: any) => {
    setTenant(newTenant);
    toast({
      title: "Success!",
      description: "Your business profile has been created",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return <TenantSetup userId={user?.id} onTenantCreated={handleTenantCreated} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{tenant.business_name}</h1>
                <p className="text-sm text-muted-foreground">
                  Booking page: <span className="text-primary">/book/{tenant.slug}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/book/${tenant.slug}`)}>
                View Booking Page
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <ServicesManager tenantId={tenant.id} />
            <AvailabilityManager tenantId={tenant.id} />
          </div>

          {/* Right Column - Appointments */}
          <div className="lg:col-span-2">
            <AppointmentsList tenantId={tenant.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;