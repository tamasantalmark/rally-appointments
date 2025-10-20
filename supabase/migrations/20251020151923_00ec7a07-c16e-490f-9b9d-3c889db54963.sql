-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Anyone can view services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Tenant owners can manage services" 
ON public.services 
FOR ALL 
USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modify availability_slots: remove slot_duration
ALTER TABLE public.availability_slots DROP COLUMN slot_duration;

-- Modify appointments: add service_id and price
ALTER TABLE public.appointments ADD COLUMN service_id UUID;
ALTER TABLE public.appointments ADD COLUMN price DECIMAL(10,2);