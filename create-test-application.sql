-- Create test application with interview marks for testing mark list download

-- Insert test KG application
INSERT INTO kg_std_applications (
  application_number,
  full_name,
  mobile_number,
  status,
  interview_date,
  interview_time,
  created_at
) VALUES (
  'KG2024001',
  'Test Student',
  '9876543210',
  'interview_complete',
  '2024-01-15',
  '10:00 AM',
  NOW()
) ON CONFLICT (application_number) DO UPDATE SET
  status = EXCLUDED.status,
  interview_date = EXCLUDED.interview_date,
  interview_time = EXCLUDED.interview_time;

-- Get the application ID for inserting interview marks
DO $$
DECLARE
  app_id UUID;
BEGIN
  -- Get the application ID
  SELECT id INTO app_id FROM kg_std_applications WHERE application_number = 'KG2024001';
  
  -- Delete existing interview marks for this application
  DELETE FROM interview_subjects WHERE application_id = app_id AND application_type = 'kg_std';
  
  -- Insert interview marks
  INSERT INTO interview_subjects (
    application_id,
    application_type,
    subject_name,
    marks_obtained,
    max_marks,
    display_order
  ) VALUES 
    (app_id, 'kg_std', 'English', 20, 25, 1),
    (app_id, 'kg_std', 'Mathematics', 22, 25, 2),
    (app_id, 'kg_std', 'General Knowledge', 18, 25, 3),
    (app_id, 'kg_std', 'Drawing', 24, 25, 4);
    
  RAISE NOTICE 'Test application KG2024001 created with interview marks';
END $$;

-- Verify the data
SELECT 
  a.application_number,
  a.full_name,
  a.status,
  a.interview_date,
  COUNT(i.id) as interview_subjects_count
FROM kg_std_applications a
LEFT JOIN interview_subjects i ON a.id = i.application_id AND i.application_type = 'kg_std'
WHERE a.application_number = 'KG2024001'
GROUP BY a.id, a.application_number, a.full_name, a.status, a.interview_date;

-- Show interview marks
SELECT 
  i.subject_name,
  i.marks_obtained,
  i.max_marks,
  i.display_order
FROM interview_subjects i
JOIN kg_std_applications a ON a.id = i.application_id
WHERE a.application_number = 'KG2024001' AND i.application_type = 'kg_std'
ORDER BY i.display_order;