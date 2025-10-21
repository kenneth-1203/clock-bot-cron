const { config } = require('./src/config');
const HolidayService = require('./src/services/holiday.service');
const logger = require('./src/utils/logger');

/**
 * Test the holiday service
 */
async function testHolidayService() {
  try {
    logger.header('Holiday Service Test');

    // Check API key status
    const apiKey = config.holiday.googleApiKey;
    if (apiKey) {
      logger.success(`Google Calendar API key is set: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      logger.warn('⚠️  Google Calendar API key is NOT set!');
      logger.warn('Please add GOOGLE_CALENDAR_API_KEY to your .env file');
      logger.warn('Get your API key from: https://console.cloud.google.com/apis/credentials');
      logger.separator();
    }

    const holidayService = new HolidayService(config);

    // Test 1: Fetch holidays
    logger.info('Test 1: Fetching Malaysian public holidays...');
    const holidays = await holidayService.getHolidays();
    logger.success(`Found ${holidays.length} holidays for current and next month`);

    // Display holidays
    if (holidays.length > 0) {
      logger.separator();
      logger.info('Upcoming holidays:');
      holidays.forEach(holiday => {
        logger.info(`  📅 ${holiday.date} - ${holiday.summary}`);
      });
    }

    // Test 2: Check if today is a holiday
    logger.separator();
    logger.info('Test 2: Checking if today is a holiday...');
    const today = new Date();
    const skipCheck = await holidayService.shouldSkipTask(today);

    if (skipCheck.shouldSkip) {
      logger.warn(`Today is ${skipCheck.reason}`);
      if (skipCheck.holiday) {
        logger.info(`🎉 Holiday: ${skipCheck.holiday.summary}`);
      }
    } else {
      logger.success(`Today is a ${skipCheck.reason} - tasks will run`);
    }

    // Test 3: Get upcoming holidays (next 30 days)
    logger.separator();
    logger.info('Test 3: Getting upcoming holidays (next 30 days)...');
    const upcoming = await holidayService.getUpcomingHolidays(30);
    logger.success(`Found ${upcoming.length} upcoming holidays`);

    if (upcoming.length > 0) {
      upcoming.forEach(holiday => {
        const date = new Date(holiday.date);
        const daysFromNow = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        logger.info(`  🎉 ${holiday.date} (in ${daysFromNow} days) - ${holiday.summary}`);
      });
    }

    // Test 4: Test specific dates
    logger.separator();
    logger.info('Test 4: Testing specific dates...');

    // Test a weekend (Saturday)
    const saturday = new Date('2025-10-11'); // A Saturday
    const saturdayCheck = await holidayService.shouldSkipTask(saturday);
    logger.info(`Saturday (2025-10-11): ${saturdayCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${saturdayCheck.reason}`);

    // Test a weekday
    const monday = new Date('2025-10-06'); // A Monday
    const mondayCheck = await holidayService.shouldSkipTask(monday);
    logger.info(`Monday (2025-10-06): ${mondayCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${mondayCheck.reason}`);

    // Test 5: Cache test
    logger.separator();
    logger.info('Test 5: Testing cache...');
    const start = Date.now();
    await holidayService.getHolidays(); // Should use cache
    const duration = Date.now() - start;
    logger.success(`Cache retrieved in ${duration}ms (should be very fast)`);

    logger.separator();
    logger.success('All tests completed successfully! ✨');

  } catch (error) {
    logger.separator();
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testHolidayService();
