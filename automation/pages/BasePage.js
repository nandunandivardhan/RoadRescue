export class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector) {
    if (!this.driver) return null;
    try {
      return await this.driver.$(selector);
    } catch {
      return null;
    }
  }

  async click(selector) {
    const el = await this.findElement(selector);
    if (el) {
      await el.click();
      return true;
    }
    return false;
  }

  async setValue(selector, value) {
    const el = await this.findElement(selector);
    if (el) {
      await el.setValue(value);
      return true;
    }
    return false;
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    if (el) {
      return await el.getText();
    }
    return '';
  }

  async isDisplayed(selector) {
    const el = await this.findElement(selector);
    if (el) {
      return await el.isDisplayed();
    }
    return false;
  }

  async pause(ms = 1000) {
    if (this.driver && this.driver.pause) {
      await this.driver.pause(ms);
    }
  }
}
