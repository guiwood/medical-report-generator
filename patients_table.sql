-- Tabela para armazenar dados dos pacientes
-- Cada usuário terá seus próprios pacientes para manter sigilo médico

CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados básicos do paciente
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    cpf VARCHAR(14), -- Formato: 000.000.000-00
    phone VARCHAR(20), -- Formato: (00) 00000-0000
    
    -- Dados do convênio
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    
    -- Dados do atendimento (pode variar por relatório)
    default_care_number VARCHAR(100),
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) para garantir que cada usuário veja apenas seus pacientes
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver seus próprios pacientes
CREATE POLICY "Users can view their own patients" ON patients
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Usuários só podem inserir pacientes para si mesmos
CREATE POLICY "Users can insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem atualizar seus próprios pacientes
CREATE POLICY "Users can update their own patients" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Usuários só podem deletar seus próprios pacientes
CREATE POLICY "Users can delete their own patients" ON patients
    FOR DELETE USING (auth.uid() = user_id);

-- Índice para melhorar performance das consultas por usuário
CREATE INDEX idx_patients_user_id ON patients(user_id);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();