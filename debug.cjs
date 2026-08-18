const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:4173/');
  // Wait for table to load
  await page.waitForSelector('table');
  // Click first lead
  const firstLead = await page.$('tbody tr');
  if (firstLead) {
    console.log('Clicking first lead...');
    await firstLead.click();
    await page.waitForTimeout(2000);
  }
  await browser.close();
})();
