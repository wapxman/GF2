CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  area_sqm numeric(12,2) NOT NULL CHECK (area_sqm > 0),
  rent_rate_usd numeric(12,2) NOT NULL CHECK (rent_rate_usd >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ownerships (
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  share_pct numeric(5,2) NOT NULL CHECK (share_pct >= 0 AND share_pct <= 100),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.expense_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  type_id uuid NOT NULL REFERENCES public.expense_types(id) ON DELETE RESTRICT,
  date timestamptz NOT NULL DEFAULT now(),
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd > 0),
  comment text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  year int NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_properties_name ON public.properties(name);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS idx_ownerships_user_id ON public.ownerships(user_id);
CREATE INDEX IF NOT EXISTS idx_ownerships_property_id ON public.ownerships(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type_id ON public.expenses(type_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_income_property_id ON public.income(property_id);
CREATE INDEX IF NOT EXISTS idx_income_year_month ON public.income(year, month);

INSERT INTO public.expense_types (name, description, is_system)
VALUES 
  ('Коммунальные услуги', 'Электричество, вода, газ, отопление', true),
  ('Налоги', 'Налог на недвижимость и другие обязательные платежи', true),
  ('Ремонт', 'Текущий и капитальный ремонт', true),
  ('Уборка', 'Клининговые услуги и содержание', true),
  ('Охрана', 'Услуги охраны и безопасности', true),
  ('Юридические услуги', 'Консультации и правовое сопровождение', true),
  ('Комиссии', 'Агентские и банковские комиссии', true),
  ('Маркетинг', 'Реклама и продвижение объектов', true),
  ('Страхование', 'Страхование недвижимости', true),
  ('Прочее', 'Прочие расходы', true)
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_updated_at 
    BEFORE UPDATE ON public.income 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
