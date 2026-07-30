import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function generateExcelReports(testResults, outputDir = 'Test Results/Excel') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const passedTests = testResults.filter(r => r.status === 'PASS');
  const failedTests = testResults.filter(r => r.status === 'FAIL');
  const skippedTests = testResults.filter(r => r.status === 'SKIP');
  const total = testResults.length;
  const passRate = total > 0 ? ((passedTests.length / total) * 100).toFixed(2) : '0.00';

  // 1. Automation_Test_Report.xlsx
  const mainWorkbook = new ExcelJS.Workbook();
  mainWorkbook.creator = 'RoadRescue E2E Engine';
  mainWorkbook.created = new Date();

  // Helper function to format header row
  const styleHeader = (row) => {
    row.font = { bold: true, color: { argb: 'FFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  };

  // Sheet 1: Executed Test Cases
  const sheet1 = mainWorkbook.addWorksheet('Executed Test Cases');
  sheet1.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 40 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Execution Time (ms)', key: 'duration', width: 20 },
  ];
  styleHeader(sheet1.getRow(1));
  testResults.forEach(r => sheet1.addRow(r));

  // Sheet 2: Passed Tests
  const sheet2 = mainWorkbook.addWorksheet('Passed Tests');
  sheet2.columns = sheet1.columns;
  styleHeader(sheet2.getRow(1));
  passedTests.forEach(r => sheet2.addRow(r));

  // Sheet 3: Failed Tests
  const sheet3 = mainWorkbook.addWorksheet('Failed Tests');
  sheet3.columns = [
    ...sheet1.columns,
    { header: 'Failure Reason', key: 'reason', width: 45 }
  ];
  styleHeader(sheet3.getRow(1));
  failedTests.forEach(r => sheet3.addRow(r));

  // Sheet 4: Skipped Tests
  const sheet4 = mainWorkbook.addWorksheet('Skipped Tests');
  sheet4.columns = sheet1.columns;
  styleHeader(sheet4.getRow(1));
  skippedTests.forEach(r => sheet4.addRow(r));

  // Sheet 5: Execution Metrics
  const sheet5 = mainWorkbook.addWorksheet('Execution Metrics');
  sheet5.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  styleHeader(sheet5.getRow(1));
  sheet5.addRow({ metric: 'Total Test Cases', value: total });
  sheet5.addRow({ metric: 'Passed', value: passedTests.length });
  sheet5.addRow({ metric: 'Failed', value: failedTests.length });
  sheet5.addRow({ metric: 'Skipped', value: skippedTests.length });
  sheet5.addRow({ metric: 'Pass Rate (%)', value: `${passRate}%` });

  // Sheet 6: Defect Summary
  const sheet6 = mainWorkbook.addWorksheet('Defect Summary');
  sheet6.columns = [
    { header: 'Defect ID', key: 'defectId', width: 15 },
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Severity', key: 'severity', width: 15 }
  ];
  styleHeader(sheet6.getRow(1));
  failedTests.forEach((r, idx) => {
    sheet6.addRow({
      defectId: `DEF-${100 + idx}`,
      testId: r.id,
      module: r.module,
      description: r.reason || 'Assertion failure during mobile execution',
      severity: r.priority === 'P0' ? 'CRITICAL' : 'HIGH'
    });
  });

  // Sheet 7: Pass Rate Summary
  const sheet7 = mainWorkbook.addWorksheet('Pass Rate Summary');
  sheet7.columns = [
    { header: 'Module Name', key: 'module', width: 25 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Pass Rate (%)', key: 'rate', width: 18 }
  ];
  styleHeader(sheet7.getRow(1));

  // Module aggregation
  const moduleMap = {};
  testResults.forEach(r => {
    if (!moduleMap[r.module]) {
      moduleMap[r.module] = { total: 0, passed: 0, failed: 0 };
    }
    moduleMap[r.module].total++;
    if (r.status === 'PASS') moduleMap[r.module].passed++;
    if (r.status === 'FAIL') moduleMap[r.module].failed++;
  });

  Object.keys(moduleMap).forEach(mod => {
    const m = moduleMap[mod];
    const rate = m.total > 0 ? ((m.passed / m.total) * 100).toFixed(1) : '0.0';
    sheet7.addRow({ module: mod, total: m.total, passed: m.passed, failed: m.failed, rate: `${rate}%` });
  });

  await mainWorkbook.xlsx.writeFile(path.join(outputDir, 'Automation_Test_Report.xlsx'));

  // 2. Passed_Test_Cases.xlsx
  const passedWb = new ExcelJS.Workbook();
  const pSheet = passedWb.addWorksheet('Passed');
  pSheet.columns = sheet1.columns;
  styleHeader(pSheet.getRow(1));
  passedTests.forEach(r => pSheet.addRow(r));
  await passedWb.xlsx.writeFile(path.join(outputDir, 'Passed_Test_Cases.xlsx'));

  // 3. Failed_Test_Cases.xlsx
  const failedWb = new ExcelJS.Workbook();
  const fSheet = failedWb.addWorksheet('Failed');
  fSheet.columns = sheet3.columns;
  styleHeader(fSheet.getRow(1));
  failedTests.forEach(r => fSheet.addRow(r));
  await failedWb.xlsx.writeFile(path.join(outputDir, 'Failed_Test_Cases.xlsx'));

  // 4. Execution_Summary.xlsx
  const summaryWb = new ExcelJS.Workbook();
  const sSheet = summaryWb.addWorksheet('Summary');
  sSheet.columns = sheet5.columns;
  styleHeader(sSheet.getRow(1));
  sheet5.eachRow((row, rowNumber) => {
    if (rowNumber > 1) sSheet.addRow(row.values.slice(1));
  });
  await summaryWb.xlsx.writeFile(path.join(outputDir, 'Execution_Summary.xlsx'));

  console.log(`Generated Excel reports successfully in ${outputDir}`);
}
