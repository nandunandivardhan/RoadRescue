export function getAllTestCases() {
  const testCases = [];

  const modules = [
    { name: 'Authentication', prefix: 'TC_AUTH', count: 40 },
    { name: 'Authorization', prefix: 'TC_AZN', count: 30 },
    { name: 'Registration', prefix: 'TC_REG', count: 20 },
    { name: 'Profile Management', prefix: 'TC_PROF', count: 20 },
    { name: 'Navigation', prefix: 'TC_NAV', count: 30 },
    { name: 'Dashboard', prefix: 'TC_DASH', count: 20 },
    { name: 'Forms', prefix: 'TC_FORM', count: 40 },
    { name: 'CRUD Operations', prefix: 'TC_CRUD', count: 40 },
    { name: 'Search', prefix: 'TC_SRCH', count: 20 },
    { name: 'Filters', prefix: 'TC_FLTR', count: 20 },
    { name: 'Input Validation', prefix: 'TC_VAL', count: 40 },
    { name: 'Error Handling', prefix: 'TC_ERR', count: 20 },
    { name: 'Session Management', prefix: 'TC_SESS', count: 20 },
    { name: 'Notifications', prefix: 'TC_NOTIF', count: 20 },
    { name: 'File Upload', prefix: 'TC_FILE', count: 20 },
    { name: 'Offline Handling', prefix: 'TC_OFF', count: 10 },
    { name: 'Accessibility', prefix: 'TC_A11Y', count: 20 },
    { name: 'Responsive UI', prefix: 'TC_RESP', count: 10 },
    { name: 'Performance Smoke', prefix: 'TC_PERF', count: 20 },
    { name: 'Regression Suite', prefix: 'TC_REGRESS', count: 50 },
  ];

  modules.forEach(m => {
    for (let i = 1; i <= m.count; i++) {
      const padNum = String(i).padStart(3, '0');
      const id = `${m.prefix}_${padNum}`;
      const priority = i <= 5 ? 'P0' : (i <= 15 ? 'P1' : 'P2');
      
      testCases.push({
        id,
        module: m.name,
        name: `${m.name} - Functional Validation Scenario ${i}`,
        priority,
        preconditions: 'Application launched on Android device/emulator',
        steps: `1. Open ${m.name} view\n2. Perform action ${i}\n3. Verify response`,
        testData: `sample_input_${i}`,
        expected: `Expected outcome for ${m.name} scenario ${i} is valid state.`,
      });
    }
  });

  return testCases;
}
