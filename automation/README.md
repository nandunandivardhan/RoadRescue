# RoadRescue Enterprise Android Appium E2E Automation Framework

This directory contains the production-ready Android Mobile E2E Automation framework, Page Object Model suite (510+ test cases across 20 modules), Excel & HTML reporting engine, and CI/CD pipelines.

---

## Framework Architecture

```
automation/
│
├── config/
│   └── appium.config.js          # Appium server & desired capabilities config
├── pages/
│   ├── BasePage.js               # Reusable mobile interactions & wait helpers
│   └── AppPages.js               # Page Object Models for all functional views
├── tests/
│   └── testRegistry.js           # 500+ Executable Test Cases across 20 modules
├── utils/
│   ├── excelReporter.js          # Multi-sheet Excel workbook generator (exceljs)
│   └── htmlReporter.js           # Interactive HTML, JSON & Markdown summary generators
├── runners/
│   └── run-e2e.js                # Master E2E test runner
└── package.json                  # Framework dependencies
```

---

## Local Execution Guide

### Prerequisites
- Node.js v18+ or v22+
- Appium (`npm install -g appium && appium driver install uiautomator2`)
- Android SDK / Emulator (optional, mock fallback supported)

### Steps
1. Navigate to the automation directory:
   ```bash
   cd automation
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Execute the master test suite:
   ```bash
   npm test
   ```
4. Output files will be generated under `Test Results/`:
   - `Test Results/Excel/Automation_Test_Report.xlsx`
   - `Test Results/Excel/Passed_Test_Cases.xlsx`
   - `Test Results/Excel/Failed_Test_Cases.xlsx`
   - `Test Results/Excel/Execution_Summary.xlsx`
   - `Test Results/HTML/execution-report.html`
   - `Test Results/HTML/dashboard.html`
   - `Test Results/HTML/trends.html`
   - `Test Results/JSON/execution-results.json`
   - `Test Results/Summary/summary.md`

---

## CI/CD Pipeline & GitHub Pages Configuration

### 21-Stage Pipeline (`.github/workflows/android-e2e.yml`)
The workflow automatically executes on `push`, `pull_request`, `schedule` (daily), or `workflow_dispatch`.

1. **Stage 1**: Checkout Repository
2. **Stage 2**: Setup Java 17
3. **Stage 3**: Setup Android SDK
4. **Stage 4**: Install Dependencies
5. **Stage 5**: Build / Verify APK
6. **Stage 6**: Start Android Emulator
7. **Stage 7**: Verify Emulator Readiness
8. **Stage 8**: Install APK
9. **Stage 9**: Start Appium Server
10. **Stage 10**: Verify Appium Health
11. **Stages 11-17**: Execute 500+ Appium Test Cases & Generate Excel/HTML/JSON/Markdown Reports
12. **Stage 18**: Upload Artifacts (30-day retention)
13. **Stage 19 & 20**: Deploy to GitHub Pages (`gh-pages`) & Archive Build History (`reports/history/build-${BUILD_NUMBER}/`)
14. **Stage 21**: Publish GitHub Action Job Summary

### Enabling GitHub Pages
To view live hosted reports:
1. In your GitHub repository, navigate to **Settings $\rightarrow$ Pages**.
2. Under **Build and deployment $\rightarrow$ Source**, select **Deploy from a branch**.
3. Select **`gh-pages`** branch and **`/ (root)`** folder.
4. Click **Save**.
5. Live Report URL:
   `https://<github-username>.github.io/RoadRescue/reports/latest/execution-report.html`

---

## Troubleshooting Guide

| Issue | Solution |
| --- | --- |
| Appium Server connection refused | Ensure Appium is running on `127.0.0.1:4723`. Run `appium --address 127.0.0.1 --port 4723`. |
| GitHub Pages build missing | Ensure `gh-pages` branch deployment is enabled in repository settings. |
| Missing Excel dependencies | Run `npm install exceljs` inside `automation/`. |
