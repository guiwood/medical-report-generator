-- Medical Report Generator Database Schema
-- Run these commands in your Supabase SQL Editor

-- 1. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    doctor_name TEXT,
    crm_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create templates table
CREATE TABLE public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create reports table (optional - for history)
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    report_data JSONB NOT NULL,
    generated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Templates policies
CREATE POLICY "Users can view own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create indexes for better performance
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);