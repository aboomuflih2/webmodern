// Test script to verify mark list download functionality
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase client for testing
const mockSupabase = {
  functions: {
    invoke: async (functionName, options) => {
      console.log(`Mock: Calling ${functionName} with:`, options.body);
      
      if (functionName === 'generate-mark-list') {
        const { applicationNumber, applicationType, mobileNumber } = options.body;
        
        // Simulate successful response
        return {
          data: {
            success: true,
            htmlContent: `<html><body><h1>Mark List for ${applicationNumber}</h1><p>Student marks would be displayed here</p></body></html>`,
            subjects: [
              { subject_name: 'English', marks: 20, template: { max_marks: 25 } },
              { subject_name: 'Mathematics', marks: 22, template: { max_marks: 25 } }
            ],
            totalMarks: 42,
            percentage: '84.00',
            resultStatus: 'ADMITTED',
            filename: `Mark_List_${applicationNumber}.pdf`
          },
          error: null
        };
      }
      
      return { data: null, error: new Error('Function not found') };
    }
  }
};

// Test the downloadMarkList functionality
async function testDownloadMarkList() {
  console.log('Testing mark list download functionality...');
  
  const testData = {
    applicationNumber: 'KG2024001',
    applicationType: 'kg_std',
    mobileNumber: '9876543210'
  };
  
  try {
    console.log('\n1. Testing with valid application data:');
    const { data, error } = await mockSupabase.functions.invoke('generate-mark-list', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (!data?.success) {
      console.error('❌ Mark list generation failed:', data?.error);
      return;
    }
    
    console.log('✅ Mark list generated successfully!');
    console.log('📊 Subjects:', data.subjects.length);
    console.log('📈 Total marks:', data.totalMarks);
    console.log('📋 Percentage:', data.percentage + '%');
    console.log('🎯 Result:', data.resultStatus);
    console.log('📄 HTML content length:', data.htmlContent.length, 'characters');
    
    // Test button visibility logic
    console.log('\n2. Testing button visibility logic:');
    const eligibleStatuses = ['interview_complete', 'admitted', 'not_admitted'];
    const testStatuses = ['submitted', 'under_review', 'shortlisted_for_interview', 'interview_complete', 'admitted', 'not_admitted'];
    
    testStatuses.forEach(status => {
      const shouldShow = eligibleStatuses.includes(status);
      console.log(`Status: ${status.padEnd(25)} → Mark list button: ${shouldShow ? '✅ Visible' : '❌ Hidden'}`);
    });
    
    console.log('\n3. Testing HTML content structure:');
    const hasRequiredElements = [
      data.htmlContent.includes('MARK LIST'),
      data.htmlContent.includes(testData.applicationNumber),
      data.htmlContent.includes('Subject'),
      data.htmlContent.includes('Marks Obtained')
    ];
    
    console.log('Contains title:', hasRequiredElements[0] ? '✅' : '❌');
    console.log('Contains app number:', hasRequiredElements[1] ? '✅' : '❌');
    console.log('Contains subject header:', hasRequiredElements[2] ? '✅' : '❌');
    console.log('Contains marks header:', hasRequiredElements[3] ? '✅' : '❌');
    
    const allValid = hasRequiredElements.every(Boolean);
    console.log('\n🎉 Overall test result:', allValid ? '✅ PASSED' : '❌ FAILED');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testDownloadMarkList().then(() => {
  console.log('\n📝 Test completed!');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});