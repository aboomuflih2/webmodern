const puppeteer = require('puppeteer');

async function testAdminJobApplicationsView() {
  console.log('🚀 Starting admin job applications view test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to admin job applications page
    console.log('📄 Navigating to admin job applications page...');
    await page.goto('http://localhost:8080/admin/job-applications', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check if the page title is correct
    const pageTitle = await page.$eval('h1', el => el.textContent);
    if (pageTitle.includes('Job Applications')) {
      console.log('✅ Admin job applications page loaded successfully');
    } else {
      throw new Error('Admin page title not found');
    }
    
    // Wait for applications table or loading state
    await page.waitForSelector('table, .animate-spin', { timeout: 10000 });
    
    // Check if applications are loading or displayed
    const hasTable = await page.$('table');
    const isLoading = await page.$('.animate-spin');
    
    if (isLoading) {
      console