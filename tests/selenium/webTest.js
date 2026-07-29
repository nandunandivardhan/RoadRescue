import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';

async function runTest() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const results = [];
  try {
    console.log('Starting Selenium tests...');
    
    // Test 1: Load Landing Page
    results.push({ name: 'Load Landing Page', status: 'RUNNING' });
    await driver.get('http://localhost:5173');
    
    // Allow server a brief moment to respond
    await driver.sleep(1000);
    
    const title = await driver.getTitle();
    results[0].status = 'PASS';
    results[0].details = `Loaded page successfully. Title: "${title}"`;

    // Test 2: Check Navigation Elements
    results.push({ name: 'Check Navigation Elements', status: 'RUNNING' });
    const brandElement = await driver.findElement(By.className('navbar-brand'));
    const brandText = await brandElement.getText();
    if (brandText.toLowerCase().includes('roadrescue')) {
      results[1].status = 'PASS';
      results[1].details = `Found navbar brand with correct text: "${brandText}"`;
    } else {
      results[1].status = 'FAIL';
      results[1].details = `Unexpected brand text: "${brandText}"`;
    }

    // Test 3: Check Download Link
    results.push({ name: 'Check APK Download Button', status: 'RUNNING' });
    const downloadBtn = await driver.findElement(By.xpath("//a[contains(@href, 'RoadRescue.apk')]"));
    const href = await downloadBtn.getAttribute('href');
    results[2].status = 'PASS';
    results[2].details = `Found download button pointing to: "${href}"`;

  } catch (error) {
    console.error('Test execution failed:', error);
    const runningTest = results.find(r => r.status === 'RUNNING');
    if (runningTest) {
      runningTest.status = 'FAIL';
      runningTest.details = error.message;
    } else {
      results.push({ name: 'General Execution', status: 'FAIL', details: error.message });
    }
  } finally {
    await driver.quit();
    generateReports(results);
  }
}

function generateReports(results) {
  // 1. Generate Markdown Report
  let md = `# Selenium Test Report\n\n`;
  md += `| Test Case | Status | Details |\n`;
  md += `| --- | --- | --- |\n`;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    md += `| ${r.name} | ${icon} | ${r.details || ''} |\n`;
  }
  fs.writeFileSync('selenium-report.md', md);
  console.log('Generated selenium-report.md');

  // 2. Generate HTML Report
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Selenium Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px; }
    h1 { color: #FFD700; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #1e1e1e; }
    th, td { padding: 12px; border: 1px solid #333; text-align: left; }
    th { background-color: #2c2c2c; color: #FFD700; }
    .pass { color: #4CAF50; font-weight: bold; }
    .fail { color: #F44336; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Selenium E2E Test Report</h1>
  <table>
    <thead>
      <tr>
        <th>Test Case</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>`;
  for (const r of results) {
    const statusClass = r.status === 'PASS' ? 'pass' : 'fail';
    html += `
      <tr>
        <td>${r.name}</td>
        <td class="${statusClass}">${r.status}</td>
        <td>${r.details || ''}</td>
      </tr>`;
  }
  html += `
    </tbody>
  </table>
</body>
</html>`;
  fs.writeFileSync('selenium-report.html', html);
  console.log('Generated selenium-report.html');
}

runTest();
