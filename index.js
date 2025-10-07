const { config, validateConfig } = require('./src/config');
const BotService = require('./src/services/bot.service');
const SchedulerService = require('./src/services/scheduler.service');
const logger = require('./src/utils/logger');

/**
 * Initialize and start the clock bot with cron scheduling
 */
function init() {
  try {
    logger.header('Clock Bot with Dual Cron Scheduling');

    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully.');

    // Display configuration
    logger.info(`Clock-In Schedule: ${config.schedules.clockIn}`);
    logger.info(`Clock-Out Schedule: ${config.schedules.clockOut}`);
    logger.info(`Website: ${config.website.url}`);
    logger.info(`Username: ${config.credentials.username.substring(0, 3)}***`);
    logger.info('\nBot is running and waiting for scheduled times...');
    logger.info('Press Ctrl+C to stop.\n');

    // Initialize services
    const botService = new BotService(config);
    const schedulerService = new SchedulerService(config);

    // Log current time on startup
    logger.logTimezone(config.timezone);

    // Schedule hourly date/time logging
    schedulerService.scheduleHourly(
      async () => {
        logger.logTimezone(config.timezone);
      },
      'Hourly time log'
    );

    // Schedule clock-in task
    schedulerService.scheduleTask(
      config.schedules.clockIn,
      async () => {
        await botService.clockIn();
      },
      'Clock-In task'
    );

    // Schedule clock-out task
    schedulerService.scheduleTask(
      config.schedules.clockOut,
      async () => {
        await botService.clockOut();
      },
      'Clock-Out task'
    );

    // Handle graceful shutdown
    const shutdown = () => {
      logger.info('\n\nStopping bot...');
      schedulerService.stopAll();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Initialization error:', error);
    process.exit(1);
  }
}

/**
 * Run a single bot operation (for testing/manual execution)
 * @param {string} action - The action to perform ('clock-in' or 'clock-out')
 * @returns {Promise<void>}
 */
async function runBot(action = 'clock-in') {
  const botService = new BotService(config);

  if (action === 'clock-in') {
    await botService.clockIn();
  } else if (action === 'clock-out') {
    await botService.clockOut();
  } else {
    throw new Error(`Unknown action: ${action}. Use 'clock-in' or 'clock-out'`);
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  init();
}

module.exports = { runBot, init };
