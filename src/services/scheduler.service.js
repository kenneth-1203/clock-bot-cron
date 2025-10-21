const cron = require('node-cron');
const logger = require('../utils/logger');
const HolidayService = require('./holiday.service');
const AnnualLeavesService = require('./annual-leaves.service');

/**
 * Service for managing cron job scheduling
 */
class SchedulerService {
  constructor(config) {
    this.config = config;
    this.tasks = [];
    this.holidayService = new HolidayService(config);
    // Initialize annual leaves service with config path
    const annualLeavesModule = require('./annual-leaves.service');
    if (!annualLeavesModule.filePath) {
      // Create new instance with configured path if not already initialized
      this.annualLeavesService = new (require('./annual-leaves.service').constructor)(config.annualLeaves?.filePath);
    } else {
      this.annualLeavesService = annualLeavesModule;
    }
  }

  /**
   * Execute a task with retry logic
   * @param {Function} callback - Function to execute
   * @param {string} taskName - Name of the task
   * @param {number} attempt - Current attempt number
   * @returns {Promise<void>}
   * @private
   */
  async executeWithRetry(callback, taskName, attempt = 1) {
    try {
      await callback();
      if (attempt > 1) {
        logger.success(`${taskName} succeeded on retry attempt ${attempt}! ✨`);
      }
    } catch (err) {
      logger.error(`Failed to execute ${taskName} (attempt ${attempt}/${this.config.retry.maxAttempts}):`, err);

      // Check if retry mechanism is enabled and if we should retry
      if (this.config.features.retryMechanism && attempt < this.config.retry.maxAttempts) {
        const delayMs = this.config.retry.delayMinutes * 60 * 1000;
        const nextAttemptTime = new Date(Date.now() + delayMs);

        logger.warn(`Scheduling retry ${attempt + 1} in ${this.config.retry.delayMinutes} minutes (at ${nextAttemptTime.toLocaleTimeString()})...`);

        // Schedule the retry
        setTimeout(() => {
          logger.retry(`Retry attempt ${attempt + 1} for ${taskName}`);
          this.executeWithRetry(callback, taskName, attempt + 1);
        }, delayMs);
      } else if (!this.config.features.retryMechanism) {
        logger.warn(`Retry mechanism is disabled. ${taskName} will not be retried.`);
      } else {
        logger.error(`${taskName} failed after ${this.config.retry.maxAttempts} attempts. Giving up.`);
      }
    }
  }

  /**
   * Schedule a task to run on a cron schedule
   * @param {string} schedule - Cron schedule expression
   * @param {Function} callback - Function to execute on schedule
   * @param {string} [taskName] - Optional name for the task
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.skipOnHoliday=true] - Skip task on public holidays
   * @returns {Object} The scheduled task
   */
  scheduleTask(schedule, callback, taskName = 'Unnamed task', options = {}) {
    const { skipOnHoliday = true } = options;
    let isRunning = false;

    const task = cron.schedule(
      schedule,
      async () => {
        // Prevent overlapping executions
        if (isRunning) {
          logger.warn(`${taskName} is still running from previous execution, skipping this one`);
          return;
        }

        logger.separator();
        logger.info(`${taskName} triggered!`);
        logger.separator();

        // Check if task should be skipped due to holidays/weekends or annual leaves
        if (skipOnHoliday) {
          // Check annual leaves first (if feature is enabled)
          if (this.config.features.skipOnAnnualLeaves) {
            const annualLeaveCheck = this.annualLeavesService.shouldSkipTask(new Date());
            if (annualLeaveCheck.shouldSkip) {
              logger.info(`⏭️  Skipping ${taskName} - ${annualLeaveCheck.reason} (${annualLeaveCheck.date})`);
              if (annualLeaveCheck.leave) {
                logger.info(`📅 Leave Type: ${annualLeaveCheck.leave.type}`);
              }
              logger.separator();
              return;
            }
          }

          // Then check holidays (if feature is enabled)
          if (this.config.features.skipOnHolidays) {
            const holidayCheck = await this.holidayService.shouldSkipTask();
            if (holidayCheck.shouldSkip) {
              logger.info(`⏭️  Skipping ${taskName} - ${holidayCheck.reason} (${holidayCheck.date})`);
              if (holidayCheck.holiday) {
                logger.info(`🎉 Holiday: ${holidayCheck.holiday.summary}`);
              }
              logger.separator();
              return;
            } else {
              logger.info(`✅ ${holidayCheck.reason} - proceeding with task`);
            }
          }
        }

        // Execute asynchronously without blocking the cron scheduler
        isRunning = true;
        Promise.resolve()
          .then(() => this.executeWithRetry(callback, taskName))
          .catch(err => logger.error(`Unhandled error in ${taskName}:`, err))
          .finally(() => { isRunning = false; });
      },
      {
        scheduled: true,
        timezone: this.config.timezone,
      }
    );

    this.tasks.push(task);
    return task;
  }

  /**
   * Schedule an hourly task
   * @param {Function} callback - Function to execute hourly
   * @param {string} [taskName] - Optional name for the task
   * @param {Object} [options] - Additional options
   * @returns {Object} The scheduled task
   */
  scheduleHourly(callback, taskName = 'Hourly task', options = {}) {
    return this.scheduleTask('0 * * * *', callback, taskName, options);
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    logger.info('Stopping all scheduled tasks...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
  }

  /**
   * Get the number of active tasks
   * @returns {number} Number of active tasks
   */
  getTaskCount() {
    return this.tasks.length;
  }

  /**
   * Get the holiday service instance
   * @returns {HolidayService} The holiday service
   */
  getHolidayService() {
    return this.holidayService;
  }
}

module.exports = SchedulerService;
