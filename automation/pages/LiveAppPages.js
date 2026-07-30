import { Builder, By, until } from 'selenium-webdriver';

export class LiveBasePage {
  constructor(driver, baseUrl = 'https://nandunandivardhan.github.io/RoadRescue/') {
    this.driver = driver;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  async navigateTo(path = '') {
    const targetUrl = `${this.baseUrl}${path}`;
    await this.driver.get(targetUrl);
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async findElement(locator, timeoutMs = 5000) {
    try {
      return await this.driver.wait(until.elementLocated(locator), timeoutMs);
    } catch {
      return null;
    }
  }

  async click(locator) {
    const el = await this.findElement(locator);
    if (el) {
      await el.click();
      return true;
    }
    return false;
  }

  async type(locator, text) {
    const el = await this.findElement(locator);
    if (el) {
      await el.clear();
      await el.sendKeys(text);
      return true;
    }
    return false;
  }

  async getText(locator) {
    const el = await this.findElement(locator);
    return el ? await el.getText() : '';
  }
}

export class LiveLandingPage extends LiveBasePage {
  locators = {
    brandLogo: By.className('navbar-brand'),
    loginButton: By.xpath("//button[contains(text(),'Login') or contains(text(),'Sign In')]"),
    downloadApkButton: By.xpath("//a[contains(@href,'RoadRescue.apk')]"),
    serviceCards: By.className('service-card'),
  };
}

export class LiveAuthPage extends LiveBasePage {
  locators = {
    emailInput: By.css('input[type="email"]'),
    passwordInput: By.css('input[type="password"]'),
    submitButton: By.css('button[type="submit"]'),
  };
}
