const cron = require('node-cron');
const logger = require('../utils/logger');

/**
 * Service for managing cron job scheduling
 */
class SchedulerService {
  constructor(config) {
    this.config = config;
    this.tasks = [];
  }

  /**
   * Schedule a task to run on a cron schedule
   * @param {string} schedule - Cron schedule expression
   * @param {Function} callback - Function to execute on schedule
   * @param {string} [taskName] - Optional name for the task
   * @returns {Object} The scheduled task
   */
  scheduleTask(schedule, callback, taskName = 'Unnamed task') {
    const task = cron.schedule(
      schedule,
      () => {
        logger.separator();
        logger.info(`${taskName} triggered!`);
        logger.separator();
        callback().catch(err => {
          logger.error(`Failed to execute ${taskName}:`, err);
        });
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
   * @returns {Object} The scheduled task
   */
  scheduleHourly(callback, taskName = 'Hourly task') {
    return this.scheduleTask('0 * * * *', callback, taskName);
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
}

module.exports = SchedulerService;
