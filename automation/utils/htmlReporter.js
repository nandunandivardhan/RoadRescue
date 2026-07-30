import fs from 'fs';
import path from 'path';

export function generateHtmlReports(testResults, outputDir = 'Test Results') {
  const htmlDir = path.join(outputDir, 'HTML');
  const jsonDir = path.join(outputDir, 'JSON');
  const summaryDir = path.join(outputDir, 'Summary');

  [htmlDir, jsonDir, summaryDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const skipped = testResults.filter(r => r.status === 'SKIP').length;
  const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

  const reportData = {
    metadata: {
      appName: 'RoadRescue Android',
      appVersion: '1.0.0',
      androidVersion: 'Android 13.0',
      deviceName: 'Android Emulator (UiAutomator2)',
      executionDate: new Date().toISOString(),
      durationMs: totalDuration,
    },
    metrics: {
      total,
      passed,
      failed,
      skipped,
      passPercentage: `${passPercentage}%`,
    },
    results: testResults
  };

  // 1. JSON Report
  fs.writeFileSync(path.join(jsonDir, 'execution-results.json'), JSON.stringify(reportData, null, 2));

  // 2. HTML execution-report.html
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RoadRescue Android Appium E2E Execution Report</title>
  <style>
    :root { --bg: #121212; --card: #1e1e1e; --text: #ffffff; --accent: #FFD700; --pass: #4CAF50; --fail: #F44336; --skip: #FF9800; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; }
    h1, h2 { color: var(--accent); }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 20px 0; }
    .card { background: var(--card); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #333; }
    .card .value { font-size: 2.2rem; font-weight: bold; margin-top: 8px; }
    .pass-val { color: var(--pass); }
    .fail-val { color: var(--fail); }
    .skip-val { color: var(--skip); }
    table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 8px; overflow: hidden; margin-top: 24px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #333; }
    th { background: #2a2a2a; color: var(--accent); font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.85rem; display: inline-block; }
    .badge-PASS { background: rgba(76, 175, 80, 0.2); color: var(--pass); border: 1px solid var(--pass); }
    .badge-FAIL { background: rgba(244, 67, 54, 0.2); color: var(--fail); border: 1px solid var(--fail); }
    .badge-SKIP { background: rgba(255, 152, 0, 0.2); color: var(--skip); border: 1px solid var(--skip); }
    .search-box { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #444; background: #222; color: #fff; margin-bottom: 16px; font-size: 1rem; }
  </style>
</head>
<body>
  <h1>RoadRescue Android Appium E2E Automation Report</h1>
  <p>App Version: <strong>1.0.0</strong> | Platform: <strong>Android 13 (UiAutomator2)</strong> | Execution Date: <strong>${new Date().toLocaleString()}</strong></p>

  <div class="metrics-grid">
    <div class="card"><div>Total Tests</div><div class="value">${total}</div></div>
    <div class="card"><div>Passed</div><div class="value pass-val">${passed}</div></div>
    <div class="card"><div>Failed</div><div class="value fail-val">${failed}</div></div>
    <div class="card"><div>Skipped</div><div class="value skip-val">${skipped}</div></div>
    <div class="card"><div>Pass Percentage</div><div class="value pass-val">${passPercentage}%</div></div>
  </div>

  <h2>Execution Details</h2>
  <input type="text" id="searchInput" class="search-box" placeholder="Filter test cases by ID, module, status or name..." onkeyup="filterTable()">

  <table id="resultsTable">
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Module</th>
        <th>Test Name</th>
        <th>Priority</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>`;

  testResults.forEach(r => {
    html += `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.module}</td>
        <td>${r.name}</td>
        <td>${r.priority}</td>
        <td><span class="status-badge badge-${r.status}">${r.status}</span></td>
        <td>${r.duration || 0} ms</td>
        <td>${r.reason || (r.status === 'PASS' ? 'Executed successfully' : 'Skipped')}</td>
      </tr>`;
  });

  html += `
    </tbody>
  </table>

  <script>
    function filterTable() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#resultsTable tbody tr');
      rows.forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(htmlDir, 'execution-report.html'), html);
  fs.writeFileSync(path.join(htmlDir, 'dashboard.html'), html);
  fs.writeFileSync(path.join(htmlDir, 'trends.html'), html);

  // 3. Markdown Summary (summary.md)
  let md = `# Android Appium E2E Execution Summary\n\n`;
  md += `**Execution Date**: ${new Date().toUTCString()}\n`;
  md += `**App Version**: 1.0.0 | **Android Version**: 13.0 | **Device**: Android Emulator\n\n`;
  md += `## Execution Metrics\n\n`;
  md += `| Metric | Count |\n`;
  md += `| --- | --- |\n`;
  md += `| **Total Test Cases** | **${total}** |\n`;
  md += `| **Passed** | **${passed}** |\n`;
  md += `| **Failed** | **${failed}** |\n`;
  md += `| **Skipped** | **${skipped}** |\n`;
  md += `| **Pass Percentage** | **${passPercentage}%** |\n\n`;

  md += `## Test Cases Breakdown\n\n`;
  md += `| Test ID | Module | Test Name | Status | Details |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  testResults.forEach(r => {
    const icon = r.status === 'PASS' ? '✅ PASS' : (r.status === 'FAIL' ? '❌ FAIL' : '⚠️ SKIP');
    md += `| ${r.id} | ${r.module} | ${r.name} | ${icon} | ${r.reason || ''} |\n`;
  });

  fs.writeFileSync(path.join(summaryDir, 'summary.md'), md);
  console.log(`Generated HTML, JSON, and Markdown reports successfully in ${outputDir}`);
}
