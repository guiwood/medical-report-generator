-- Update profiles table to include CRM state and RQE
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN crm_state TEXT,
ADD COLUMN rqe_number TEXT;