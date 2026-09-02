CREATE TABLE public.class_staff (
  class_id text PRIMARY KEY,
  subject_teachers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ast_teacher text NOT NULL DEFAULT '',
  lst_teacher text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_staff TO anon, authenticated;
GRANT ALL ON public.class_staff TO service_role;

ALTER TABLE public.class_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read class staff" ON public.class_staff FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can insert class staff" ON public.class_staff FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can update class staff" ON public.class_staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete class staff" ON public.class_staff FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_class_staff_updated_at BEFORE UPDATE ON public.class_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();