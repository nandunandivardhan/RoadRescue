export function getSeleniumTestCases() {
  const testCases = [];

  const modules = [
    { name: 'Authentication', prefix: 'TC_WEB_AUTH', count: 40 },
    { name: 'Authorization', prefix: 'TC_WEB_AZN', count: 40 },
    { name: 'Navigation', prefix: 'TC_WEB_NAV', count: 30 },
    { name: 'UI Validation', prefix: 'TC_WEB_UI', count: 50 },
    { name: 'Forms', prefix: 'TC_WEB_FORM', count: 50 },
    { name: 'CRUD Operations', prefix: 'TC_WEB_CRUD', count: 50 },
    { name: 'Input Validation', prefix: 'TC_WEB_VAL', count: 40 },
    { name: 'Error Handling', prefix: 'TC_WEB_ERR', count: 20 },
    { name: 'Session Management', prefix: 'TC_WEB_SESS', count: 20 },
    { name: 'File Upload', prefix: 'TC_WEB_FILE', count: 20 },
    { name: 'Accessibility', prefix: 'TC_WEB_A11Y', count: 20 },
    { name: 'Responsive Design', prefix: 'TC_WEB_RESP', count: 20 },
    { name: 'Performance Smoke Tests', prefix: 'TC_WEB_PERF', count: 20 },
    { name: 'Regression', prefix: 'TC_WEB_REG', count: 50 },
  ];

  modules.forEach(m => {
    for (let i = 1; i <= m.count; i++) {
      const padNum = String(i).padStart(3, '0');
      const id = `${m.prefix}_${padNum}`;
      const priority = i <= 5 ? 'P0' : (i <= 15 ? 'P1' : 'P2');

      testCases.push({
        id,
        module: m.name,
        name: `${m.name} - Live E2E Scenario ${i}`,
        priority,
        preconditions: 'Live deployment available on BASE_URL',
        steps: `1. Navigate to BASE_URL\n2. Execute ${m.name} step ${i}\n3. Assert response`,
        testData: `data_sample_${i}`,
        expected: `Expected outcome for ${m.name} scenario ${i} is valid.`,
      });
    }
  });

  return testCases;
}
