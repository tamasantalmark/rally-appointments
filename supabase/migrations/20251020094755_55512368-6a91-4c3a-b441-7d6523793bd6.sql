-- Create tenants table for businesses
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create availability_slots table
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tenant"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenant"
  ON public.tenants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view tenants for booking"
  ON public.tenants FOR SELECT
  USING (true);

-- RLS Policies for appointments
CREATE POLICY "Tenant owners can view their appointments"
  ON public.appointments FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Tenant owners can update their appointments"
  ON public.appointments FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for availability_slots
CREATE POLICY "Tenant owners can manage availability"
  ON public.availability_slots FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view availability"
  ON public.availability_slots FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_availability_tenant ON public.availability_slots(tenant_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_user ON public.tenants(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();