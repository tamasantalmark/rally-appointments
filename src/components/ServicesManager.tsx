import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServicesManagerProps {
  tenantId: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
  description: string | null;
}

const ServicesManager = ({ tenantId }: ServicesManagerProps) => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 30,
    price: "",
    description: "",
  });

  useEffect(() => {
    fetchServices();
  }, [tenantId]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Hiba",
        description: "A szolgáltatás neve kötelező",
        variant: "destructive",
      });
      return;
    }

    const serviceData = {
      tenant_id: tenantId,
      name: formData.name,
      duration: formData.duration,
      price: formData.price ? parseFloat(formData.price) : null,
      description: formData.description || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Hiba",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sikeres",
          description: "Szolgáltatás frissítve",
        });
        resetForm();
        fetchServices();
      }
    } else {
      const { error } = await supabase.from("services").insert(serviceData);

      if (error) {
        toast({
          title: "Hiba",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sikeres",
          description: "Szolgáltatás hozzáadva",
        });
        resetForm();
        fetchServices();
      }
    }
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      toast({
        title: "Hiba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Törölve",
        description: "Szolgáltatás eltávolítva",
      });
      fetchServices();
    }
  };

  const editService = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price?.toString() || "",
      description: service.description || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      duration: 30,
      price: "",
      description: "",
    });
  };

  if (loading) return <div>Betöltés...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szolgáltatások</CardTitle>
        <CardDescription>Kezeld a kínált szolgáltatásaidat</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add/Edit Form */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {editingId ? "Szolgáltatás szerkesztése" : "Új szolgáltatás"}
              </h3>
              {editingId && (
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Szolgáltatás neve *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="pl. Hajvágás"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Időtartam (perc) *</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ár (Ft)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Leírás</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Rövid leírás a szolgáltatásról..."
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? "Mentés" : "Hozzáadás"}
            </Button>
          </div>

          {/* Services List */}
          <div className="space-y-2">
            <h3 className="font-medium">Szolgáltatások listája</h3>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Még nincs szolgáltatás hozzáadva</p>
            ) : (
              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.duration} perc
                        {service.price && ` • ${service.price.toLocaleString('hu-HU')} Ft`}
                      </div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => editService(service)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default ServicesManager;
