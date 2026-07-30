export const appiumConfig = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': process.env.APK_PATH || './RoadRescue.apk',
    'appium:noReset': true,
    'appium:newCommandTimeout': 300,
    'appium:autoGrantPermissions': true
  },
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  },
  retryOptions: {
    maxRetries: 2,
    retryDelayMs: 1000
  }
};
