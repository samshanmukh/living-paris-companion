CREATE TABLE public.user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  traits JSONB NOT NULL DEFAULT '{}'::jsonb,
  intent JSONB NOT NULL DEFAULT '{}'::jsonb,
  itineraries JSONB NOT NULL DEFAULT '[]'::jsonb,
  turns INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profile TO authenticated;
GRANT ALL ON public.user_profile TO service_role;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.user_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.user_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.user_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.user_profile FOR DELETE TO authenticated USING (auth.uid() = user_id);