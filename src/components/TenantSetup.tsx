import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const tenantSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  slug: z.string().trim().min(3, "Slug must be at least 3 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(500).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
});

interface TenantSetupProps {
  userId: string;
  onTenantCreated: (tenant: any) => void;
}

const TenantSetup = ({ userId, onTenantCreated }: TenantSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    slug: "",
    description: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      tenantSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("tenants")
      .insert({
        user_id: userId,
        business_name: formData.businessName,
        slug: formData.slug,
        description: formData.description || null,
        email: formData.email || null,
        phone: formData.phone || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes("unique") 
          ? "This slug is already taken. Please choose another one."
          : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create tenant_users record with owner role
    const { error: tenantUserError } = await supabase
      .from("tenant_users")
      .insert({
        tenant_id: data.id,
        user_id: userId,
        role: "owner",
      });

    if (tenantUserError) {
      toast({
        title: "Error",
        description: "Failed to assign ownership. Please contact support.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    onTenantCreated(data);

    setLoading(false);
  };

  const generateSlug = () => {
    const slug = formData.businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, slug });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Set Up Your Business Profile</CardTitle>
          <CardDescription>
            Create your business profile to start accepting appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                onBlur={generateSlug}
                required
                placeholder="Acme Consulting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Booking Page URL * 
                <span className="text-muted-foreground text-sm ml-2">
                  (will be: /book/{formData.slug || "your-slug"})
                </span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="acme-consulting"
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell your clients about your business..."
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Business Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSetup;