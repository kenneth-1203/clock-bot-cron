const BrowserService = require('./browser.service');
const AuthService = require('./auth.service');
const { ClockService } = require('./clock.service');
const ActivityService = require('./activity.service');
const logger = require('../utils/logger');

/**
 * Bot orchestrator service that coordinates all operations
 */
class BotService {
  constructor(config) {
    this.config = config;
    this.browserService = null;
    this.authService = null;
    this.clockService = null;
    this.activityService = null;
  }

  /**
   * Execute a bot operation (clock-in or clock-out)
   * @param {Function} clockOperation - The clock operation to perform
   * @param {string} actionName - Name of the action for logging
   * @param {boolean} withActivity - Whether to save activity after the operation
   * @returns {Promise<void>}
   */
  async executeOperation(clockOperation, actionName, withActivity = false) {
    try {
      logger.separator(60, '=');
      logger.info(`🤖 Starting ${actionName} bot...`);
      logger.separator(60, '=');

      // Initialize services
      this.browserService = new BrowserService(this.config);
      this.authService = new AuthService(this.browserService, this.config);
      this.clockService = new ClockService(this.browserService, this.config);
      this.activityService = new ActivityService(this.browserService, this.config);

      // Launch browser and perform operation
      await this.browserService.launch();
      await this.authService.login();
      const result = await clockOperation(this.clockService);

      // Handle both old boolean return and new object return for backward compatibility
      const shouldSaveActivity = typeof result === 'object' ? result.shouldSaveActivity : result;
      const actionPerformed = typeof result === 'object' ? result.performed : result;

      // Check if we should save activity based on availability
      if (withActivity && this.activityService.isConfigured()) {
        // Check if activity is available on the page
        const isAvailable = await this.activityService.isAvailable();

        if (isAvailable && shouldSaveActivity) {
          if (!actionPerformed) {
            logger.activity('Clock action already performed previously, but activity is available. Proceeding with save-activity...');
          } else {
            logger.activity('Activity is available. Proceeding with save-activity...');
          }
          await this.activityService.saveActivity();
        } else if (!isAvailable) {
          logger.info('Save-activity skipped: activity already saved for today');
        } else if (!shouldSaveActivity) {
          logger.info('Save-activity skipped: not applicable for this action');
        }
      } else if (withActivity && !this.activityService.isConfigured()) {
        logger.warn('Save-activity skipped: not configured');
      }

      logger.separator(60, '=');
      logger.success(`${actionName} operation completed successfully! 🎉`);
      logger.separator(60, '=');
    } catch (error) {
      logger.separator(60, '=');
      logger.error(`Error occurred during ${actionName}:`, error);
      logger.separator(60, '=');
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Perform clock-in operation with optional activity saving
   * @param {boolean} withActivity - Whether to save activity after clock-in
   * @returns {Promise<void>}
   */
  async clockIn(withActivity = true) {
    await this.executeOperation(
      (service) => service.clockIn(),
      'clock-in',
      withActivity
    );
  }

  /**
   * Perform clock-out operation
   * @returns {Promise<void>}
   */
  async clockOut() {
    await this.executeOperation(
      (service) => service.clockOut(),
      'clock-out'
    );
  }

  /**
   * Clean up resources
   * @private
   */
  async cleanup() {
    if (this.browserService) {
      await this.browserService.close();
    }
  }
}

module.exports = BotService;
