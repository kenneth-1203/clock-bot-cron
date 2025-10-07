const logger = require('../utils/logger');

/**
 * Actions for clock operations
 */
const ClockAction = {
  CLOCK_IN: 'clock-in',
  CLOCK_OUT: 'clock-out',
};

/**
 * Service for handling clock-in and clock-out operations
 */
class ClockService {
  constructor(browserService, config) {
    this.browserService = browserService;
    this.config = config;
  }

  /**
   * Check current clock status by reading button text
   * @returns {Promise<string>} 'Clock In' or 'Clock Out'
   */
  async getCurrentStatus() {
    // Wait for the button to be available
    await this.browserService.waitForSelector(this.config.selectors.clockInButton);

    // Get the button text
    const buttonText = await this.browserService.getInnerText(this.config.selectors.clockInButton);
    logger.step(`Current button status: ${buttonText}`);

    return buttonText.trim();
  }

  /**
   * Perform clock-in operation
   * @returns {Promise<{performed: boolean, shouldSaveActivity: boolean}>}
   */
  async clockIn() {
    const currentStatus = await this.getCurrentStatus();

    if (currentStatus.includes('Clock Out')) {
      logger.clockIn('Already clocked in (button shows "Clock Out")');
      // Already clocked in, skip both clock-in and activity actions
      return { performed: false, shouldSaveActivity: false };
    }

    await this.performClockAction(
      ClockAction.CLOCK_IN,
      this.config.selectors.clockInButton,
      this.config.selectors.clockOutButton,
      'Clock Out'
    );

    // Just clocked in, so we should save activity
    return { performed: true, shouldSaveActivity: true };
  }

  /**
   * Perform clock-out operation
   * @returns {Promise<{performed: boolean, shouldSaveActivity: boolean}>}
   */
  async clockOut() {
    const currentStatus = await this.getCurrentStatus();

    if (currentStatus.includes('Clock In')) {
      logger.clockOut('Already clocked out (button shows "Clock In")');
      // Already clocked out, no need to save activity
      return { performed: false, shouldSaveActivity: false };
    }

    await this.performClockAction(
      ClockAction.CLOCK_OUT,
      this.config.selectors.clockOutButton,
      this.config.selectors.clockInButton,
      'Clock In'
    );

    // Just clocked out, no need to save activity
    return { performed: true, shouldSaveActivity: false };
  }

  /**
   * Perform a clock action (clock-in or clock-out)
   * @param {string} action - The action being performed
   * @param {string} buttonSelector - The button to click
   * @param {string} verificationSelector - The button selector to verify state change
   * @param {string} expectedText - Expected text after action completes
   * @returns {Promise<void>}
   * @private
   */
  async performClockAction(action, buttonSelector, verificationSelector, expectedText) {
    const isClockIn = action === ClockAction.CLOCK_IN;
    const logFn = isClockIn ? logger.clockIn : logger.clockOut;

    logFn(`Waiting for ${action} button...`);
    await this.browserService.waitForSelector(buttonSelector);

    logFn(`Clicking ${action} button...`);
    await this.browserService.click(buttonSelector);

    // Handle confirmation modal for clock-out
    if (action === ClockAction.CLOCK_OUT && this.config.selectors.clockOutConfirmButton) {
      logger.step('Waiting for confirmation modal...');
      await this.browserService.waitForSelector(this.config.selectors.clockOutConfirmButton);
      logger.step('Clicking Yes on confirmation modal...');
      await this.browserService.click(this.config.selectors.clockOutConfirmButton);
    }

    // Verify action completed by checking button text change
    logger.step(`Verifying ${action} completed...`);
    await this.browserService.waitForButtonTextChange(verificationSelector, expectedText);
    logger.success(`Verified: Button changed to "${expectedText}"`);

    logFn(`${action} completed successfully!`);
  }
}

module.exports = {
  ClockService,
  ClockAction,
};
