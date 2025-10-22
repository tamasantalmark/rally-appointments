-- Create enum for tenant roles
CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'staff');

-- Create tenant_users junction table
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check tenant role
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role tenant_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
  )
$$;

-- RLS Policies for tenant_users
CREATE POLICY "Tenant members can view their membership"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'admin'));

CREATE POLICY "Tenant owners and admins can manage members"
ON public.tenant_users
FOR ALL
TO authenticated
USING (public.has_tenant_role(auth.uid(), tenant_id, 'owner') OR public.has_tenant_role(auth.uid(), tenant_id, 'admin'));

-- Migrate existing data: create tenant_users records for existing tenants
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT id, user_id, 'owner'
FROM public.tenants
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Update RLS policies for other tables to use tenant_users

-- Update services policies
DROP POLICY IF EXISTS "Tenant owners can manage services" ON public.services;
CREATE POLICY "Tenant members can manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Update availability_slots policies
DROP POLICY IF EXISTS "Tenant owners can manage availability" ON public.availability_slots;
CREATE POLICY "Tenant members can manage availability"
ON public.availability_slots
FOR ALL
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Update appointments policies
DROP POLICY IF EXISTS "Tenant owners can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant owners can update their appointments" ON public.appointments;

CREATE POLICY "Tenant members can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Update tenants policies
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON public.tenants;

CREATE POLICY "Tenant members can view their tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (public.is_tenant_member(auth.uid(), id));

CREATE POLICY "Tenant owners can update their tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (public.has_tenant_role(auth.uid(), id, 'owner'));