-- Add 'name' column to reports table
-- Execute this SQL in Supabase SQL Editor

ALTER TABLE public.reports 
ADD COLUMN name TEXT;

-- Update existing records with auto-generated names
-- (This will create names based on patient_name and created_at for existing records)
UPDATE public.reports 
SET name = CONCAT(
    COALESCE(patient_name, 'Sem paciente'), 
    ' - ', 
    TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY')
)
WHERE name IS NULL;

-- Make the name column NOT NULL after updating existing records
ALTER TABLE public.reports 
ALTER COLUMN name SET NOT NULL;

-- Add policy for update operations (was missing)
CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Add index for better performance on name searches
CREATE INDEX idx_reports_name ON public.reports(name);