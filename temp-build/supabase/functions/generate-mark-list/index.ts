import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Mark list generation function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationNumber, applicationType, mobileNumber } = await req.json();
    console.log('Request data:', { applicationNumber, applicationType });

    if (!applicationNumber || !applicationType || !mobileNumber) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Application number, type, and mobile number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application data
    const tableName = applicationType === 'kg_std' ? 'kg_std_applications' : 'plus_one_applications';
    console.log('Fetching from table:', tableName);

    const sanitizedApplicationNumber = String(applicationNumber).trim();
    const sanitizedMobileNumber = String(mobileNumber).trim();

    if (!sanitizedApplicationNumber || !sanitizedMobileNumber) {
      return new Response(
        JSON.stringify({ error: 'Application number, type, and mobile number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: application, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('application_number', sanitizedApplicationNumber)
      .eq('mobile_number', sanitizedMobileNumber)
      .single();

    if (error || !application) {
      console.error('Application not found:', error);
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Application found:', application.full_name);

    // Check if application is eligible for mark list
    const eligibleStatuses = ['interview_complete', 'admitted', 'not_admitted'];
    if (!eligibleStatuses.includes(application.status)) {
      console.error('Application not eligible for mark list');
      return new Response(
        JSON.stringify({ error: 'Mark list is not available for this application status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch interview subjects and marks (no FK join available) and templates separately
    type SubjectMarkRow = { subject_name: string; marks: number | null };
    type TemplateRow = { subject_name: string; max_marks: number; display_order: number };

    const { data: subjectMarks, error: subjectsError } = await supabase
      .from('interview_subjects')
      .select('subject_name, marks')
      .eq('application_id', application.id)
      .eq('application_type', applicationType);

    if (subjectsError) {
      console.error('Error fetching interview_subjects:', subjectsError);
      // Don't fail hard here – proceed to use templates so we can still render a structured mark list
    }

    // Fetch templates for this form type to provide structure and max marks
    const { data: templates, error: templatesError } = await supabase
      .from('interview_subject_templates')
      .select('subject_name, max_marks, display_order')
      .eq('form_type', applicationType)
      .eq('is_active', true)
      .order('display_order');

    if (templatesError) {
      console.error('Error fetching interview_subject_templates:', templatesError);
    }

    // Build subjects array using templates order; merge marks by subject_name
    let subjectsWithTemplate: Array<{ subject_name: string; marks: number | null; template: { max_marks: number; display_order: number } }> = [];

    if (templates && templates.length > 0) {
      const marksByName = (subjectMarks as SubjectMarkRow[] | null || []).reduce<Record<string, number | null>>((acc, s) => {
        acc[s.subject_name] = s.marks ?? null;
        return acc;
      }, {});

      subjectsWithTemplate = (templates as TemplateRow[]).map((t) => ({
        subject_name: t.subject_name,
        marks: marksByName[t.subject_name] ?? null,
        template: { max_marks: t.max_marks, display_order: t.display_order }
      }));
    } else if (subjectMarks && subjectMarks.length > 0) {
      // Fallback: we have marks but no templates; assume max 25 each and keep original order
      subjectsWithTemplate = (subjectMarks as SubjectMarkRow[]).map((s, idx) => ({
        subject_name: s.subject_name,
        marks: s.marks ?? null,
        template: { max_marks: 25, display_order: idx + 1 }
      }));
    } else {
      subjectsWithTemplate = [];
    }

    console.log('Subjects resolved (after merge):', subjectsWithTemplate.length);

    // Calculate total marks using template max_marks
    const totalMarks = subjectsWithTemplate?.reduce((sum, subject) => sum + (subject.marks || 0), 0) || 0;
    const maxMarks = subjectsWithTemplate?.reduce((sum, subject) => sum + (subject.template?.max_marks || 25), 0) || 0;
    const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : '0.00';

    // Determine result
    const isAdmitted = application.status === 'admitted';
    const resultStatus = isAdmitted ? 'ADMITTED' : application.status === 'not_admitted' ? 'NOT ADMITTED' : 'PENDING';

    // Generate HTML content for Mark List PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
            .letterhead { 
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              margin-bottom: 20px;
              border-bottom: 3px solid #0066cc; 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .letterhead-content {
              flex: 1;
              text-align: left;
            }
            .letterhead-logo {
              flex-shrink: 0;
              margin-left: 20px;
            }
            .logo {
              max-width: 120px;
              height: auto;
            }
            .school-name { 
              font-size: 18px; 
              font-weight: bold; 
              color: #0066cc; 
              margin: 0 0 10px 0; 
            }
            .contact-info { 
              font-size: 11px; 
              color: #666; 
              line-height: 1.4;
            }
            .document-title { font-size: 20px; font-weight: bold; margin: 30px 0; text-align: center; text-decoration: underline; }
            .student-details { background: #f8f9fa; padding: 20px; border-left: 4px solid #0066cc; margin: 20px 0; }
            .marks-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .marks-table th, .marks-table td { border: 1px solid #333; padding: 12px; text-align: center; }
            .marks-table th { background: #0066cc; color: white; font-weight: bold; }
            .marks-table tr:nth-child(even) { background: #f9f9f9; }
            .result-section { background: ${isAdmitted ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isAdmitted ? '#c3e6cb' : '#f5c6cb'}; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
            .result-status { font-size: 24px; font-weight: bold; color: ${isAdmitted ? '#155724' : '#721c24'}; }
            .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
            .field-group { margin-bottom: 12px; }
            .field-label { font-weight: bold; display: inline-block; width: 150px; }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-content">
              <div class="school-name">MODERN HIGHER SECONDARY SCHOOL, POTTUR</div>
              <div class="contact-info">
                Mudur P.O., Vattamkulam Via, Edappal, Malappuram, Kerala - 679578<br>
                Email: modernpotur@gmail.com | Phone: 0494-2699645, 96454 99921<br>
                DHSE Code: 11181
              </div>
            </div>
            <div class="letterhead-logo">
              <img src="/lovable-uploads/d526aeda-08eb-46c2-a4d1-d0a41f2fe9de.png" alt="School Logo" class="logo">
            </div>
          </div>

          <div class="document-title">
            ADMISSION INTERVIEW - MARK LIST
          </div>

          <div class="student-details">
            <h3 style="margin-top: 0; color: #0066cc;">Student Information</h3>
            <div class="field-group">
              <span class="field-label">Application No:</span>
              <span>${application.application_number}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Student Name:</span>
              <span>${application.full_name}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Father's Name:</span>
              <span>${application.father_name}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Mother's Name:</span>
              <span>${application.mother_name}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Class Applied:</span>
              <span>${applicationType === 'kg_std' ? 'KG & STD' : '+1 / HSS'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Interview Date:</span>
              <span>${application.interview_date ? new Date(application.interview_date).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>
          </div>

          <h3>Interview Performance</h3>
          
          ${subjectsWithTemplate && subjectsWithTemplate.length > 0 ? `
          <table class="marks-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Subject</th>
                <th>Maximum Marks</th>
                <th>Marks Obtained</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsWithTemplate.map((subject, index) => {
                const marks = subject.marks || 0;
                const maxSubjectMarks = subject.template?.max_marks || 25;
                const percentage = maxSubjectMarks > 0 ? (marks / maxSubjectMarks) * 100 : 0;
                const grade = marks === null ? 'N/A' : 
                  percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : 
                  percentage >= 60 ? 'B+' : percentage >= 50 ? 'B' : 
                  percentage >= 40 ? 'C' : 'F';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${subject.subject_name}</td>
                    <td>${maxSubjectMarks}</td>
                    <td>${marks !== null ? marks : '-'}</td>
                    <td>${grade}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="font-weight: bold; background: #e9ecef;">
                <td colspan="2">TOTAL</td>
                <td>${maxMarks}</td>
                <td>${totalMarks}</td>
                <td>${percentage}%</td>
              </tr>
            </tbody>
          </table>
          ` : `
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6;">
            <p><em>No interview subjects configured for this application type.</em></p>
          </div>
          `}

          <div class="result-section">
            <div class="result-status">${resultStatus}</div>
            ${isAdmitted ? `
              <p style="margin-top: 15px; font-size: 16px;">
                Congratulations! You have been selected for admission.<br>
                Please contact the school office for further procedures.
              </p>
            ` : application.status === 'not_admitted' ? `
              <p style="margin-top: 15px; font-size: 16px;">
                We regret to inform you that you have not been selected for admission.<br>
                Thank you for your interest in our school.
              </p>
            ` : `
              <p style="margin-top: 15px; font-size: 16px;">
                Final admission result will be announced soon.<br>
                Please stay tuned for further updates.
              </p>
            `}
          </div>

          <div class="signature-section">
            <div>
              <br><br>
              <strong>Interview Panel</strong><br>
              Modern Higher Secondary School, Pottur
            </div>
            <div>
              <br><br>
              <strong>Principal</strong><br>
              Modern Higher Secondary School, Pottur
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            <p>This is a computer-generated document issued on ${new Date().toLocaleDateString('en-IN')}</p>
            <p>For any queries regarding this mark list, please contact the school office.</p>
          </div>
        </body>
      </html>
    `;

    console.log('Mark list HTML generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        htmlContent,
        subjects: subjectsWithTemplate || [],
        totalMarks,
        percentage,
        resultStatus,
        filename: `Mark_List_${applicationNumber}.pdf`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-mark-list function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
