const logger = require('../utils/logger');

/**
 * Service for handling authentication and login operations
 */
class AuthService {
  constructor(browserService, config) {
    this.browserService = browserService;
    this.config = config;
  }

  /**
   * Perform login operation
   * @returns {Promise<void>}
   */
  async login() {
    logger.login('Starting login process...');

    // Navigate to website
    await this.browserService.goto(this.config.website.url);

    // Fill in username
    logger.step('Entering username...');
    await this.browserService.waitForSelector(this.config.selectors.loginUsername);
    await this.browserService.type(
      this.config.selectors.loginUsername,
      this.config.credentials.username
    );

    // Fill in password
    logger.step('Entering password...');
    await this.browserService.type(
      this.config.selectors.loginPassword,
      this.config.credentials.password
    );

    // Click login button
    logger.step('Clicking login button...');
    await this.browserService.clickAndWaitForNavigation(
      this.config.selectors.loginButton
    );

    logger.success('Successfully logged in!');
  }
}

module.exports = AuthService;
