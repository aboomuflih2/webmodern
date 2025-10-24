import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationNumber, applicationType, mobileNumber } = await req.json();

    if (!applicationNumber || !applicationType || !mobileNumber) {
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
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
            :root {
              --primary: #0b3f8a;
              --accent: #f59e0b;
              --text: #0f172a;
              --muted: #6b7280;
              --bg: #f5f7fb;
            }
            body { 
              font-family: 'Montserrat', Arial, sans-serif; 
              margin: 0; 
              padding: 24px; 
              background-color: var(--bg); 
              color: var(--text);
            }
            .letterhead {
              background: #f3f4f6;
              padding: 24px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              border-bottom: 3px solid var(--accent);
            }
            .letterhead-logo { 
              display: flex;
              justify-content: center;
              margin-bottom: 16px;
            }
            .logo { max-width: 120px; height: auto; }
            .letterhead-content { 
              text-align: center;
            }
            .school-name { 
              font-size: 24px; 
              font-weight: 700; 
              color: var(--primary); 
              margin: 0 0 12px 0;
              letter-spacing: 0.5px;
            }
            .contact-info { 
              font-size: 13px; 
              color: var(--muted); 
              line-height: 1.6;
              max-width: 600px;
              margin: 0 auto;
            }
            .accent-line { height: 4px; background: var(--accent); border-radius: 0 0 8px 8px; margin-bottom: 16px; }

            .content { position: relative; background: white; padding: 28px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
            .watermark { position: absolute; inset: 0; background: url('/lovable-uploads/d6a40436-db2a-426b-8cac-f4b879c3f89a.png') center/50% no-repeat; opacity: 0.05; pointer-events: none; }

            .title { text-align: center; font-size: 22px; font-weight: 700; color: var(--primary); margin: 0 0 18px 0; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 22px; }
            .item { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .label { font-size: 12px; color: var(--muted); font-weight: 600; margin-bottom: 4px; }
            .value { font-size: 14px; color: var(--text); font-weight: 600; }

            .section { margin-top: 18px; }
            .section-title { font-size: 14px; font-weight: 700; color: var(--primary); margin: 0 0 10px 0; border-left: 3px solid var(--accent); padding-left: 10px; }
            .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }

            .footer { margin-top: 22px; text-align: center; font-size: 12px; color: var(--muted); }
          </style>
        </head>
          <div class="letterhead">
            <div class="letterhead-logo">
              <img src="/lovable-uploads/d526aeda-08eb-46c2-a4d1-d0a41f2fe9de.png" alt="School Logo" class="logo">
            </div>
            <div class="letterhead-content">
              <div class="school-name">MODERN HIGHER SECONDARY SCHOOL, POTTUR</div>
              <div class="contact-info">
                Mudur P.O., Vattamkulam Via, Edappal, Malappuram, Kerala - 679578<br>
                Email: modernpotur@gmail.com | Phone: 0494-2699645, 96454 99921<br>
                DHSE Code: 11181
              </div>
            </div>
          </div>
          
          <div class="content">
            <div class="watermark"></div>
            <h1 class="title">Application Summary</h1>
            <div class="details-grid">
              <div class="item">
                <div class="label">Application Number</div>
                <div class="value">${application.application_number || 'N/A'}</div>
              </div>
              <div class="item">
                <div class="label">Student Name</div>
                <div class="value">${application.full_name || 'N/A'}</div>
              </div>
              <div class="item">
                <div class="label">Date of Birth</div>
                <div class="value">${application.date_of_birth || 'N/A'}</div>
              </div>
              <div class="item">
                <div class="label">Gender</div>
                <div class="value">${application.gender || 'N/A'}</div>
              </div>
              <div class="item">
                <div class="label">Mobile</div>
                <div class="value">${application.mobile_number || 'N/A'}</div>
              </div>
              ${application.email ? `
              <div class="item">
                <div class="label">Email</div>
                <div class="value">${application.email}</div>
              </div>
              ` : ''}
            </div>

          <div class="section">
            <div class="section-title">Parent Information</div>
            <div class="box">
              <div class="details-grid">
                <div class="item">
                  <div class="label">Father's Name</div>
                  <div class="value">${application.father_name || 'N/A'}</div>
                </div>
                <div class="item">
                  <div class="label">Mother's Name</div>
                  <div class="value">${application.mother_name || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Address Information</div>
            <div class="box">
              <div class="details-grid">
                <div class="item">
                  <div class="label">House Name</div>
                  <div class="value">${application.house_name || 'N/A'}</div>
                </div>
                <div class="item">
                  <div class="label">Panchayath</div>
                  <div class="value">${application.village || 'N/A'}</div>
                </div>
                <div class="item">
                  <div class="label">Post Office</div>
                  <div class="value">${application.post_office || 'N/A'}</div>
                </div>
                <div class="item">
                  <div class="label">District</div>
                  <div class="value">${application.district || 'N/A'}</div>
                </div>
                <div class="item">
                  <div class="label">Pincode</div>
                  <div class="value">${application.pincode || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          ${applicationType === 'kg_std' ? `
          <div class="section">
            <div class="section-title">Educational Information</div>
            <div class="field-group">
              <div class="field-label">Stage:</div>
              <div class="field-value">${application.stage}</div>
            </div>
            ${application.previous_school ? `
            <div class="field-group">
              <div class="field-label">Previous School:</div>
              <div class="field-value">${application.previous_school}</div>
            </div>
            ` : ''}
            ${application.need_madrassa ? `
            <div class="field-group">
              <div class="field-label">Need Madrassa:</div>
              <div class="field-value">Yes</div>
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="section">
            <div class="section-title">Educational Information</div>
            <div class="field-group">
              <div class="field-label">Stream:</div>
              <div class="field-value">${application.stream}</div>
            </div>
            <div class="field-group">
              <div class="field-label">10th School:</div>
              <div class="field-value">${application.tenth_school}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Board:</div>
              <div class="field-value">${application.board}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Exam Year:</div>
              <div class="field-value">${application.exam_year}</div>
            </div>
            <div class="field-group">
              <div class="field-label">Roll Number:</div>
              <div class="field-value">${application.exam_roll_number}</div>
            </div>
          </div>
          `}

          <div class="footer">
            <p>Application submitted on: ${new Date(application.created_at).toLocaleDateString()}</p>
            <p>This is a computer-generated document from Modern Higher Secondary School, Pottur and does not require a signature.</p>
          </div>
        </body>
      </html>
    `;

    // For now, return the HTML content that can be used to generate PDF on frontend
    // In a production environment, you would use a service like Puppeteer to generate actual PDF
    return new Response(
      JSON.stringify({ 
        success: true, 
        htmlContent,
        }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-application-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
