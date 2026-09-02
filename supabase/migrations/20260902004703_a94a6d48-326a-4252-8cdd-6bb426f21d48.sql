CREATE POLICY "Public read mtss files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'mtss-files');
CREATE POLICY "Public upload mtss files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'mtss-files');
CREATE POLICY "Public update mtss files" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'mtss-files') WITH CHECK (bucket_id = 'mtss-files');
CREATE POLICY "Public delete mtss files" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'mtss-files');