import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function generateLiveSeleniumExcelReports(testResults, outputDir = 'Test Results/Excel') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const passedTests = testResults.filter(r => r.status === 'PASS');
  const failedTests = testResults.filter(r => r.status === 'FAIL');
  const skippedTests = testResults.filter(r => r.status === 'SKIP');
  const total = testResults.length;
  const passRate = total > 0 ? ((passedTests.length / total) * 100).toFixed(2) : '0.00';

  const styleHeader = (row) => {
    row.font = { bold: true, color: { argb: 'FFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  };

  // 1. Automation_Test_Report.xlsx
  const mainWb = new ExcelJS.Workbook();
  mainWb.creator = 'RoadRescue Live Selenium Engine';

  // Sheet 1: Executed Test Cases
  const s1 = mainWb.addWorksheet('Executed Test Cases');
  s1.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Execution Time (ms)', key: 'duration', width: 20 },
    { header: 'Priority', key: 'priority', width: 12 },
  ];
  styleHeader(s1.getRow(1));
  testResults.forEach(r => s1.addRow(r));

  // Sheet 2: Passed Tests
  const s2 = mainWb.addWorksheet('Passed Tests');
  s2.columns = s1.columns;
  styleHeader(s2.getRow(1));
  passedTests.forEach(r => s2.addRow(r));

  // Sheet 3: Failed Tests
  const s3 = mainWb.addWorksheet('Failed Tests');
  s3.columns = [
    ...s1.columns,
    { header: 'Failure Reason', key: 'reason', width: 45 }
  ];
  styleHeader(s3.getRow(1));
  failedTests.forEach(r => s3.addRow(r));

  // Sheet 4: Skipped Tests
  const s4 = mainWb.addWorksheet('Skipped Tests');
  s4.columns = s1.columns;
  styleHeader(s4.getRow(1));
  skippedTests.forEach(r => s4.addRow(r));

  // Sheet 5: Execution Metrics
  const s5 = mainWb.addWorksheet('Execution Metrics');
  s5.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'val', width: 20 }
  ];
  styleHeader(s5.getRow(1));
  s5.addRow({ metric: 'Total Test Cases', val: total });
  s5.addRow({ metric: 'Passed Tests', val: passedTests.length });
  s5.addRow({ metric: 'Failed Tests', val: failedTests.length });
  s5.addRow({ metric: 'Skipped Tests', val: skippedTests.length });
  s5.addRow({ metric: 'Pass Percentage (%)', val: `${passRate}%` });

  // Sheet 6: Defect Summary
  const s6 = mainWb.addWorksheet('Defect Summary');
  s6.columns = [
    { header: 'Defect ID', key: 'defectId', width: 15 },
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Severity', key: 'severity', width: 15 }
  ];
  styleHeader(s6.getRow(1));
  failedTests.forEach((r, idx) => {
    s6.addRow({
      defectId: `WEB-DEF-${100 + idx}`,
      testId: r.id,
      module: r.module,
      description: r.reason || 'Assertion failure during live Selenium execution',
      severity: r.priority === 'P0' ? 'CRITICAL' : 'HIGH'
    });
  });

  await mainWb.xlsx.writeFile(path.join(outputDir, 'Automation_Test_Report.xlsx'));

  // 2. Passed_Test_Cases.xlsx
  const pWb = new ExcelJS.Workbook();
  const ps = pWb.addWorksheet('Passed');
  ps.columns = s1.columns;
  styleHeader(ps.getRow(1));
  passedTests.forEach(r => ps.addRow(r));
  await pWb.xlsx.writeFile(path.join(outputDir, 'Passed_Test_Cases.xlsx'));

  // 3. Failed_Test_Cases.xlsx
  const fWb = new ExcelJS.Workbook();
  const fsSheet = fWb.addWorksheet('Failed');
  fsSheet.columns = s3.columns;
  styleHeader(fsSheet.getRow(1));
  failedTests.forEach(r => fsSheet.addRow(r));
  await fWb.xlsx.writeFile(path.join(outputDir, 'Failed_Test_Cases.xlsx'));

  // 4. Summary_Report.xlsx
  const sumWb = new ExcelJS.Workbook();
  const ss = sumWb.addWorksheet('Summary');
  ss.columns = s5.columns;
  styleHeader(ss.getRow(1));
  s5.eachRow((row, rowNumber) => {
    if (rowNumber > 1) ss.addRow(row.values.slice(1));
  });
  await sumWb.xlsx.writeFile(path.join(outputDir, 'Summary_Report.xlsx'));

  console.log(`Generated live Selenium Excel reports successfully in ${outputDir}`);
}
