-- Insert sample admission application data for testing
-- This migration adds test data to kg_std_applications and plus_one_applications tables

-- Insert sample KG/STD applications
INSERT INTO public.kg_std_applications (
    application_number,
    full_name,
    mobile_number,
    status,
    created_at
) VALUES 
    ('MHS2024-1001', 'Arjun Kumar', '9876543210', 'submitted', NOW() - INTERVAL '2 days'),
    ('MHS2024-1002', 'Priya Sharma', '9876543211', 'under_review', NOW() - INTERVAL '1 day'),
    ('MHS2024-1003', 'Rahul Nair', '9876543212', 'shortlisted_for_interview', NOW() - INTERVAL '3 hours'),
    ('MHS2024-1004', 'Sneha Menon', '9876543213', 'interview_complete', NOW() - INTERVAL '1 hour'),
    ('MHS2024-1005', 'Kiran Raj', '9876543214', 'admitted', NOW() - INTERVAL '30 minutes')
ON CONFLICT (application_number) DO NOTHING;

-- Insert sample Plus One applications
INSERT INTO public.plus_one_applications (
    application_number,
    full_name,
    mobile_number,
    status,
    stream,
    created_at
) VALUES 
    ('MHS2024-2001', 'Aditya Krishnan', '9876543220', 'submitted', 'Science', NOW() - INTERVAL '4 days'),
    ('MHS2024-2002', 'Meera Pillai', '9876543221', 'under_review', 'Commerce', NOW() - INTERVAL '2 days'),
    ('MHS2024-2003', 'Vishnu Das', '9876543222', 'shortlisted_for_interview', 'Science', NOW() - INTERVAL '1 day'),
    ('MHS2024-2004', 'Lakshmi Nair', '9876543223', 'interview_complete', 'Arts', NOW() - INTERVAL '6 hours'),
    ('MHS2024-2005', 'Anand Kumar', '9876543224', 'admitted', 'Science', NOW() - INTERVAL '2 hours'),
    ('MHS2024-2006', 'Divya Menon', '9876543225', 'not_admitted', 'Commerce', NOW() - INTERVAL '1 hour')
ON CONFLICT (application_number) DO NOTHING;