-- Insert default interview subjects for kg_std and plus_one application types

-- Insert subjects for KG/Standard applications
INSERT INTO public.interview_subject_templates (form_type, subject_name, max_marks, display_order, is_active)
VALUES 
  ('kg_std', 'English', 25, 1, true),
  ('kg_std', 'Mathematics', 25, 2, true),
  ('kg_std', 'General Knowledge', 25, 3, true),
  ('kg_std', 'Reasoning', 25, 4, true)
ON CONFLICT (form_type, subject_name) DO NOTHING;

-- Insert subjects for Plus One applications
INSERT INTO public.interview_subject_templates (form_type, subject_name, max_marks, display_order, is_active)
VALUES 
  ('plus_one', 'English', 25, 1, true),
  ('plus_one', 'Mathematics', 25, 2, true),
  ('plus_one', 'Science', 25, 3, true),
  ('plus_one', 'Social Studies', 25, 4, true),
  ('plus_one', 'General Knowledge', 25, 5, true)
ON CONFLICT (form_type, subject_name) DO NOTHING;

SELECT 'Default interview subjects inserted successfully' as message;