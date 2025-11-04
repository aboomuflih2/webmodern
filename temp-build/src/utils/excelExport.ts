import * as XLSX from 'xlsx';

// Interface for the application data that will be exported
interface ExportApplication {
  id: string;
  application_number: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  father_name: string;
  mother_name: string;
  house_name: string;
  post_office: string;
  village: string;
  pincode: string;
  district: string;
  email?: string;
  mobile_number: string;
  status: string;
  created_at: string;
  interview_date?: string;
  interview_time?: string;
  // KG/Std specific fields
  stage?: string;
  need_madrassa?: boolean;
  previous_madrassa?: string;
  previous_school?: string;
  has_siblings?: boolean;
  siblings_names?: string;
  // Plus One specific fields
  landmark?: string;
  tenth_school?: string;
  board?: string;
  exam_roll_number?: string;
  exam_year?: string;
  stream?: string;
  tenth_total_marks?: number;
  tenth_obtained_marks?: number;
  tenth_percentage?: number;
  tenth_grade?: string;
  tenth_result?: string;
  mathematics_marks?: number;
  science_marks?: number;
  english_marks?: number;
  social_science_marks?: number;
  language_marks?: number;
  additional_subject_1?: string;
  additional_subject_1_marks?: number;
  additional_subject_2?: string;
  additional_subject_2_marks?: number;
}

// Function to format application data for Excel export
const formatApplicationForExport = (app: ExportApplication) => {
  const baseData = {
    'Application Number': app.application_number,
    'Full Name': app.full_name,
    'Gender': app.gender,
    'Date of Birth': new Date(app.date_of_birth).toLocaleDateString(),
    'Father Name': app.father_name,
    'Mother Name': app.mother_name,
    'House Name': app.house_name,
    'Post Office': app.post_office,
    'Village': app.village,
    'Pincode': app.pincode,
    'District': app.district,
    'Email': app.email || '',
    'Mobile Number': app.mobile_number,
    'Status': app.status,
    'Application Date': new Date(app.created_at).toLocaleDateString(),
    'Interview Date': app.interview_date ? new Date(app.interview_date).toLocaleDateString() : '',
    'Interview Time': app.interview_time || '',
  };

  // Add KG/Std specific fields if they exist
  if (app.stage) {
    return {
      ...baseData,
      'Stage': app.stage,
      'Need Madrassa': app.need_madrassa ? 'Yes' : 'No',
      'Previous Madrassa': app.previous_madrassa || '',
      'Previous School': app.previous_school || '',
      'Has Siblings': app.has_siblings ? 'Yes' : 'No',
      'Siblings Names': app.siblings_names || '',
    };
  }

  // Add Plus One specific fields if they exist
  if (app.stream) {
    return {
      ...baseData,
      'Landmark': app.landmark || '',
      '10th School': app.tenth_school || '',
      'Board': app.board || '',
      'Exam Roll Number': app.exam_roll_number || '',
      'Exam Year': app.exam_year || '',
      'Stream': app.stream,
      '10th Total Marks': app.tenth_total_marks || '',
      '10th Obtained Marks': app.tenth_obtained_marks || '',
      '10th Percentage': app.tenth_percentage || '',
      '10th Grade': app.tenth_grade || '',
      '10th Result': app.tenth_result || '',
      'Mathematics Marks': app.mathematics_marks || '',
      'Science Marks': app.science_marks || '',
      'English Marks': app.english_marks || '',
      'Social Science Marks': app.social_science_marks || '',
      'Language Marks': app.language_marks || '',
      'Additional Subject 1': app.additional_subject_1 || '',
      'Additional Subject 1 Marks': app.additional_subject_1_marks || '',
      'Additional Subject 2': app.additional_subject_2 || '',
      'Additional Subject 2 Marks': app.additional_subject_2_marks || '',
      'Has Siblings': app.has_siblings ? 'Yes' : 'No',
      'Siblings Names': app.siblings_names || '',
    };
  }

  return baseData;
};

// Main export function
export const exportApplicationsToExcel = (
  applications: ExportApplication[],
  filename?: string
): void => {
  try {
    if (!applications || applications.length === 0) {
      throw new Error('No applications to export');
    }

    // Format the data for Excel
    const formattedData = applications.map(formatApplicationForExport);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert the data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto-size columns
    const columnWidths = Object.keys(formattedData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...formattedData.map(row => String(row[key as keyof typeof row] || '').length)
      )
    }));
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Admission Applications');

    // Generate filename with timestamp if not provided
    const defaultFilename = `admission_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Write the file
    XLSX.writeFile(workbook, finalFilename);

    console.log(`Excel file exported successfully: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

// Function to export with additional metadata
export const exportApplicationsToExcelWithMetadata = (
  applications: ExportApplication[],
  metadata: {
    totalApplications: number;
    filteredApplications: number;
    exportDate: string;
    filters?: {
      search?: string;
      status?: string;
      type?: string;
    };
  },
  filename?: string
): void => {
  try {
    if (!applications || applications.length === 0) {
      throw new Error('No applications to export');
    }

    // Format the data for Excel
    const formattedData = applications.map(formatApplicationForExport);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create metadata sheet
    const metadataData = [
      ['Export Information', ''],
      ['Export Date', metadata.exportDate],
      ['Total Applications in System', metadata.totalApplications],
      ['Filtered Applications Exported', metadata.filteredApplications],
      ['', ''],
      ['Applied Filters', ''],
      ['Search Term', metadata.filters?.search || 'None'],
      ['Status Filter', metadata.filters?.status || 'All'],
      ['Type Filter', metadata.filters?.type || 'All'],
    ];

    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info');

    // Convert the applications data to a worksheet
    const applicationsSheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto-size columns for applications sheet
    const columnWidths = Object.keys(formattedData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...formattedData.map(row => String(row[key as keyof typeof row] || '').length)
      )
    }));
    applicationsSheet['!cols'] = columnWidths;

    // Add the applications worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, applicationsSheet, 'Applications');

    // Generate filename with timestamp if not provided
    const defaultFilename = `admission_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Write the file
    XLSX.writeFile(workbook, finalFilename);

    console.log(`Excel file with metadata exported successfully: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to Excel with metadata:', error);
    throw error;
  }
};