ALTER TABLE public.class_staff ADD COLUMN IF NOT EXISTS ast_teachers jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS advisor text NOT NULL DEFAULT '';