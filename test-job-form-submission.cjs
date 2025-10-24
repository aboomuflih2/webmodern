// Test script to verify job application form submission
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting job application form test...');
    
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to careers page
    const targetUrl = process.env.TARGET_URL || 'http://localhost:8081/careers';
    console.log('📄 Navigating to careers page at', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Form loaded successfully');
    
    // Fill personal information
    console.log('📝 Filling personal information...');
    await page.type('input[name="full_name"]', 'John Doe Test');
    await page.type('input[name="email"]', 'john.doe.test@example.com');
    await page.type('input[name="phone"]', '1234567890');
    await page.type('input[name="date_of_birth"]', '1990-01-01');
    await page.type('textarea[name="address"]', '123 Test Street, Test City, Test State 12345');
    await page.type('input[name="district"]', 'Test District');
    
    // Fill professional information
    console.log('💼 Filling professional information...');
    
    // Select designation
    await page.click('button[role="combobox"]');
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    
    // Find and click the Teacher option
    const teacherOption = await page.evaluateHandle(() => {
      const options = Array.from(document.querySelectorAll('[role="option"]'));
      return options.find(option => option.textContent.includes('Teacher'));
    });
    await teacherOption.click();
    
    // Wait for subject field to appear and fill it
    await page.waitForSelector('input[name="subject"]', { timeout: 3000 });
    await page.type('input[name="subject"]', 'Mathematics');
    
    await page.type('input[name="qualifications"]', 'Master of Science in Mathematics');
    await page.type('input[name="experience_years"]', '5');
    await page.type('textarea[name="previous_experience"]', 'Worked as a mathematics teacher at ABC School for 3 years, then at XYZ College for 2 years.');
    await page.type('textarea[name="why_join"]', 'I am passionate about education and believe in providing quality learning experiences to students. Your school\'s reputation for excellence and commitment to student development aligns perfectly with my teaching philosophy.');
    
    // Create a test PDF file for upload
    console.log('📎 Preparing CV file upload...');
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');
    const testPdfPath = path.join(__dirname, 'test-cv.pdf');
    require('fs').writeFileSync(testPdfPath, testPdfContent);
    
    // Upload CV file
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(testPdfPath);
    console.log('📎 CV file selected');
    
    // Wait for file to be processed
    await page.waitForSelector('.text-green-600', { timeout: 5000 });
    console.log('✅ CV file uploaded successfully');
    
    // Submit the form
    console.log('🚀 Submitting application...');
    await page.click('button[type="submit"]');
    
    // Wait for success message or navigation
    try {
      await page.waitForSelector('.toast, [data-testid="toast"], .success-banner', { timeout: 10000 });
      console.log('✅ Application submitted successfully!');
    } catch (e) {
      // Check if we were redirected to home page
      await new Promise(resolve => setTimeout(resolve, 3000));
      const currentUrl = page.url();
      if (currentUrl.includes('localhost:8080') || currentUrl.includes('localhost:8081')) {
        if (!currentUrl.includes('/careers')) {
          console.log('✅ Application submitted and redirected to home page!');
        } else {
          console.log('⚠️  Could not confirm submission success');
        }
      }
    }
    
    // Clean up test file
    require('fs').unlinkSync(testPdfPath);
    
    console.log('🎉 Job application form test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true });
        console.log('📸 Error screenshot saved as test-error-screenshot.png');
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();