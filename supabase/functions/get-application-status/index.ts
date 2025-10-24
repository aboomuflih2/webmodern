import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ApplicationRecord = Record<string, unknown> & {
  id: string;
  application_number: string;
  mobile_number: string;
};

type InterviewSubject = {
  subject_name: string;
  marks_obtained: number | null;
  max_marks: number | null;
  display_order: number | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Lazily create client per request to avoid init-time throws
    const supabaseKey = serviceRoleKey ?? anonKey;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase URL or Key' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    let applicationNumber: unknown = undefined;
    let mobileNumber: unknown = undefined;
    try {
      const body = await req.json();
      applicationNumber = body?.applicationNumber;
      mobileNumber = body?.mobileNumber;
    } catch (_) {
      // If body is not JSON, treat as missing input and return a friendly 200 response
      return new Response(
        JSON.stringify({ error: 'Application number and mobile number are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof applicationNumber !== 'string' || typeof mobileNumber !== 'string') {
      // Return 200 with error payload so the frontend can surface clear messages
      return new Response(
        JSON.stringify({ error: 'Application number and mobile number are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedApplication = applicationNumber.trim();
    const sanitizedMobile = mobileNumber.trim();

    if (!sanitizedApplication || !sanitizedMobile) {
      return new Response(
        JSON.stringify({ error: 'Application number and mobile number are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tables: Array<{ name: 'kg_std_applications' | 'plus_one_applications'; formType: 'kg_std' | 'plus_one' }> = [
      { name: 'kg_std_applications', formType: 'kg_std' },
      { name: 'plus_one_applications', formType: 'plus_one' },
    ];

    let application: ApplicationRecord | null = null;
    let applicationType: 'kg_std' | 'plus_one' | null = null;

    for (const table of tables) {
      const { data, error } = await supabase
        .from<ApplicationRecord>(table.name)
        .select('*')
        .eq('application_number', sanitizedApplication)
        .eq('mobile_number', sanitizedMobile)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error querying ${table.name}:`, error);
        // Return 200 with a clear error payload to avoid generic non-2xx client errors
        return new Response(
          JSON.stringify({ error: 'Failed to load application' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data) {
        application = data;
        applicationType = table.formType;
        break;
      }
    }

    if (!application || !applicationType) {
      // Return 200 with error payload to avoid generic non-2xx error messages client-side
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: formMeta } = await supabase
      .from('admission_forms')
      .select('academic_year')
      .eq('form_type', applicationType)
      .maybeSingle();

    // Fetch interview subjects marks and templates separately to align with schema
    type SubjectMarkRow = { subject_name: string; marks: number | null };
    type TemplateRow = { subject_name: string; max_marks: number; display_order: number | null };

    const { data: subjectMarks, error: subjectsError } = await supabase
      .from('interview_subjects')
      .select('subject_name, marks')
      .eq('application_id', application.id)
      .eq('application_type', applicationType);

    if (subjectsError && subjectsError.code !== 'PGRST116') {
      console.error('Error loading interview_subjects:', subjectsError);
    }

    const { data: templates, error: templatesError } = await supabase
      .from('interview_subject_templates')
      .select('subject_name, max_marks, display_order')
      .eq('form_type', applicationType)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (templatesError && templatesError.code !== 'PGRST116') {
      console.error('Error loading interview_subject_templates:', templatesError);
    }

    // Build combined interview marks with template info
    let interviewMarks: Array<{ subject_name: string; marks_obtained: number | null; max_marks: number | null; display_order: number | null }> = [];

    if (templates && templates.length > 0) {
      const marksByName = (subjectMarks as SubjectMarkRow[] | null || []).reduce<Record<string, number | null>>((acc, s) => {
        acc[s.subject_name] = s.marks ?? null;
        return acc;
      }, {});

      interviewMarks = (templates as TemplateRow[]).map((t) => ({
        subject_name: t.subject_name,
        marks_obtained: marksByName[t.subject_name] ?? null,
        max_marks: t.max_marks,
        display_order: t.display_order ?? null,
      }));
    } else if (subjectMarks && subjectMarks.length > 0) {
      // Fallback: we have marks but no templates; assume max 25 each and keep original order
      interviewMarks = (subjectMarks as SubjectMarkRow[]).map((s, idx) => ({
        subject_name: s.subject_name,
        marks_obtained: s.marks ?? null,
        max_marks: 25,
        display_order: idx + 1,
      }));
    }

    const safeApplication = Object.fromEntries(
      Object.entries(application).filter(([_, value]) => value !== null && value !== undefined)
    );

    return new Response(
      JSON.stringify({
        application: safeApplication,
        applicationType,
        academicYear: formMeta?.academic_year ?? null,
        interviewMarks,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('get-application-status error:', error);
    // Return 200 with error payload to provide clear feedback to the client
    return new Response(
      JSON.stringify({ error: 'Unexpected error while loading application status' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
