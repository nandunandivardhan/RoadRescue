import { BasePage } from './BasePage.js';

export class AuthPage extends BasePage {
  selectors = {
    usernameInput: '//android.widget.EditText[contains(@content-desc, "username") or contains(@text, "Email")]',
    passwordInput: '//android.widget.EditText[contains(@content-desc, "password") or contains(@text, "Password")]',
    loginButton: '//android.widget.Button[contains(@text, "Login") or contains(@text, "Sign In")]',
    logoutButton: '//android.widget.Button[contains(@text, "Logout")]',
    phoneInput: '//android.widget.EditText[contains(@text, "Phone")]',
    otpInput: '//android.widget.EditText[contains(@text, "OTP")]',
  };

  async login(email, password) {
    await this.setValue(this.selectors.usernameInput, email);
    await this.setValue(this.selectors.passwordInput, password);
    await this.click(this.selectors.loginButton);
  }
}

export class ProfilePage extends BasePage {
  selectors = {
    editProfileButton: '//android.widget.Button[contains(@text, "Edit Profile")]',
    nameInput: '//android.widget.EditText[contains(@text, "Name")]',
    phoneInput: '//android.widget.EditText[contains(@text, "Phone")]',
    sosContactInput: '//android.widget.EditText[contains(@text, "Emergency")]',
    saveButton: '//android.widget.Button[contains(@text, "Save")]',
    addVehicleButton: '//android.widget.Button[contains(@text, "Add Vehicle")]',
  };
}

export class DashboardPage extends BasePage {
  selectors = {
    sosButton: '//android.widget.Button[contains(@text, "SOS")]',
    savedContactsCount: '//android.widget.TextView[contains(@text, "Contacts")]',
    activeTicketCard: '//android.view.ViewGroup[contains(@content-desc, "active_ticket")]',
    mechanicCard: '//android.view.ViewGroup[contains(@content-desc, "mechanic_item")]',
  };
}

export class NavigationPage extends BasePage {
  selectors = {
    homeTab: '//android.widget.Button[contains(@text, "Home")]',
    activityTab: '//android.widget.Button[contains(@text, "Activity")]',
    profileTab: '//android.widget.Button[contains(@text, "Profile")]',
    adminTab: '//android.widget.Button[contains(@text, "Admin")]',
  };
}

export class FormsPage extends BasePage {
  selectors = {
    requestForm: '//android.view.ViewGroup[contains(@content-desc, "request_form")]',
    issueTypeSelect: '//android.widget.Spinner[contains(@content-desc, "issue_type")]',
    vehicleSelect: '//android.widget.Spinner[contains(@content-desc, "vehicle_select")]',
    submitButton: '//android.widget.Button[contains(@text, "Submit")]',
  };
}
