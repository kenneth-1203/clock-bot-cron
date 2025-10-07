const logger = require('../utils/logger');

/**
 * Service for handling save-activity operations
 */
class ActivityService {
  constructor(browserService, config) {
    this.browserService = browserService;
    this.config = config;
  }

  /**
   * Perform save-activity operation
   * @returns {Promise<void>}
   */
  async saveActivity() {
    logger.activity('Starting save-activity process...');

    // Step 1: Click navigation button to go to activity page
    logger.step('Navigating to activity page...');
    await this.browserService.waitForSelector(
      this.config.selectors.activityNavigationButton
    );
    await this.browserService.click(
      this.config.selectors.activityNavigationButton
    );

    // Wait for activity page to load
    logger.step('Waiting for activity list to load...');
    await this.browserService.waitForSelector(
      this.config.selectors.activityListItem
    );

    // Step 2: Select project item
    logger.step('Selecting project item...');
    await this.browserService.selectOptionBySelector(
      this.config.selectors.activityProjectItem
    );

    // Step 3: Select item from activity list
    logger.step('Selecting activity from list...');
    await this.browserService.selectOptionBySelector(
      this.config.selectors.activityListItem
    );

    // Step 4: Wait a moment for the form to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click save button
    logger.step('Waiting for save button...');
    await this.browserService.waitForSelector(
      this.config.selectors.activitySaveButton
    );

    logger.step('Clicking save button...');
    await this.browserService.click(
      this.config.selectors.activitySaveButton
    );

    // Wait a moment for save to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.success('Activity saved successfully!');
  }

  /**
   * Check if save-activity is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(
      this.config.selectors.activityNavigationButton &&
      this.config.selectors.activityProjectItem &&
      this.config.selectors.activityListItem &&
      this.config.selectors.activitySaveButton
    );
  }
}

module.exports = ActivityService;
