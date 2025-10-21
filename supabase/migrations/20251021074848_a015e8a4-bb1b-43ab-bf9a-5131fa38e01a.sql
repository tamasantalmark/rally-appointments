-- Drop the existing RLS policy that uses a subquery
DROP POLICY IF EXISTS "Tenant owners can view their appointments" ON appointments;

-- Create a simpler, more reliable RLS policy for viewing appointments
CREATE POLICY "Tenant owners can view their appointments"
ON appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenants 
    WHERE tenants.id = appointments.tenant_id 
    AND tenants.user_id = auth.uid()
  )
);