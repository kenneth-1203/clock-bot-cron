const cron = require('node-cron');
const logger = require('../utils/logger');
const HolidayService = require('./holiday.service');

/**
 * Service for managing cron job scheduling
 */
class SchedulerService {
  constructor(config) {
    this.config = config;
    this.tasks = [];
    this.holidayService = new HolidayService(config);
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

      // Check if we should retry
      if (attempt < this.config.retry.maxAttempts) {
        const delayMs = this.config.retry.delayMinutes * 60 * 1000;
        const nextAttemptTime = new Date(Date.now() + delayMs);

        logger.warn(`Scheduling retry ${attempt + 1} in ${this.config.retry.delayMinutes} minutes (at ${nextAttemptTime.toLocaleTimeString()})...`);

        // Schedule the retry
        setTimeout(() => {
          logger.retry(`Retry attempt ${attempt + 1} for ${taskName}`);
          this.executeWithRetry(callback, taskName, attempt + 1);
        }, delayMs);
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

        // Check if task should be skipped due to holidays/weekends
        if (skipOnHoliday) {
          const skipCheck = await this.holidayService.shouldSkipTask();

          if (skipCheck.shouldSkip) {
            logger.info(`⏭️  Skipping ${taskName} - ${skipCheck.reason} (${skipCheck.date})`);
            if (skipCheck.holiday) {
              logger.info(`🎉 Holiday: ${skipCheck.holiday.summary}`);
            }
            logger.separator();
            return;
          } else {
            logger.info(`✅ ${skipCheck.reason} - proceeding with task`);
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
