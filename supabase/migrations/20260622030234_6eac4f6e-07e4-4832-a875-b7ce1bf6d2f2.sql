
CREATE TABLE public.students (
  id text PRIMARY KEY,
  name text NOT NULL,
  grade int NOT NULL,
  class_id text NOT NULL,
  tiers jsonb NOT NULL DEFAULT '{}'::jsonb,
  concerns jsonb NOT NULL DEFAULT '[]'::jsonb,
  interventions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  watch boolean NOT NULL DEFAULT false,
  created_at_ms bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX students_class_id_idx ON public.students(class_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read students" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can insert students" ON public.students FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can update students" ON public.students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete students" ON public.students FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER TABLE public.students REPLICA IDENTITY FULL;
