const AnnualLeavesService = require('../services/annual-leaves.service');
const logger = require('../utils/logger');

/**
 * Test the annual leaves service
 */
function testAnnualLeavesService() {
  try {
    logger.header('Annual Leaves Service Test');

    // Test 1: Load leaves from file
    logger.info('Test 1: Loading annual leaves from file...');
    const leaves = AnnualLeavesService.getLeaves();
    logger.success(`Loaded ${leaves.length} leave entries`);

    // Display leaves
    if (leaves.length > 0) {
      logger.separator();
      logger.info('Current annual leaves:');
      leaves.forEach(leave => {
        logger.info(`  📅 ${leave.startDate} to ${leave.endDate} - ${leave.reason}`);
      });
    } else {
      logger.warn('No annual leaves configured');
    }

    // Test 2: Check if today is a leave
    logger.separator();
    logger.info('Test 2: Checking if today is an annual leave...');
    const today = new Date();
    const todayCheck = AnnualLeavesService.shouldSkipTask(today);

    if (todayCheck.shouldSkip) {
      logger.warn(`Today is an annual leave: ${todayCheck.reason}`);
      if (todayCheck.leave) {
        logger.info(`📅 Leave period: ${todayCheck.leave.startDate} to ${todayCheck.leave.endDate}`);
      }
    } else {
      logger.success('Today is NOT an annual leave - tasks will run');
    }

    // Test 3: Get upcoming leaves (next 30 days)
    logger.separator();
    logger.info('Test 3: Getting upcoming leaves (next 30 days)...');
    const upcoming = AnnualLeavesService.getUpcomingLeaves(30);
    logger.success(`Found ${upcoming.length} upcoming leave entries`);

    if (upcoming.length > 0) {
      upcoming.forEach(leave => {
        const startDate = new Date(leave.startDate);
        const daysFromNow = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
        const durationDays = Math.ceil((new Date(leave.endDate) - startDate) / (1000 * 60 * 60 * 24)) + 1;
        logger.info(`  📅 ${leave.startDate} to ${leave.endDate} (in ${daysFromNow} days, ${durationDays} day(s)) - ${leave.reason}`);
      });
    }

    // Test 4: Test specific dates
    logger.separator();
    logger.info('Test 4: Testing specific dates...');

    leaves.forEach((leave, index) => {
      // Test start date
      const startCheck = AnnualLeavesService.shouldSkipTask(leave.startDate);
      logger.info(`  Entry ${index + 1} - Start date (${leave.startDate}): ${startCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${startCheck.reason || 'Not a leave'}`);

      // Test end date
      const endCheck = AnnualLeavesService.shouldSkipTask(leave.endDate);
      logger.info(`  Entry ${index + 1} - End date (${leave.endDate}): ${endCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${endCheck.reason || 'Not a leave'}`);

      // Test day before start
      const beforeDate = new Date(leave.startDate);
      beforeDate.setDate(beforeDate.getDate() - 1);
      const beforeStr = beforeDate.toISOString().split('T')[0];
      const beforeCheck = AnnualLeavesService.shouldSkipTask(beforeStr);
      logger.info(`  Entry ${index + 1} - Day before (${beforeStr}): ${beforeCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${beforeCheck.reason || 'Not a leave'}`);

      // Test day after end
      const afterDate = new Date(leave.endDate);
      afterDate.setDate(afterDate.getDate() + 1);
      const afterStr = afterDate.toISOString().split('T')[0];
      const afterCheck = AnnualLeavesService.shouldSkipTask(afterStr);
      logger.info(`  Entry ${index + 1} - Day after (${afterStr}): ${afterCheck.shouldSkip ? '⏭️ SKIP' : '✅ RUN'} - ${afterCheck.reason || 'Not a leave'}`);
    });

    // Test 5: Validate date format
    logger.separator();
    logger.info('Test 5: Testing date validation...');

    const validDates = [
      '2025-12-25',
      '2026-01-01',
      '2025-10-24',
    ];

    validDates.forEach(date => {
      const isValid = AnnualLeavesService.isValidDate(date);
      logger.info(`  ${date}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    const invalidDates = [
      '25-12-2025',
      '2025/12/25',
      '12/25/2025',
      'invalid',
      '2025-13-01', // Invalid month
      '2025-02-30', // Invalid day
    ];

    logger.info('Invalid dates:');
    invalidDates.forEach(date => {
      const isValid = AnnualLeavesService.isValidDate(date);
      logger.info(`  ${date}: ${isValid ? '✅ Valid (unexpected!)' : '❌ Invalid (as expected)'}`);
    });

    // Test 6: Get leave details
    logger.separator();
    logger.info('Test 6: Getting leave details for specific dates...');

    if (leaves.length > 0) {
      const firstLeave = leaves[0];
      const details = AnnualLeavesService.getLeaveDetails(firstLeave.startDate);
      if (details) {
        logger.success(`Found leave details for ${firstLeave.startDate}:`);
        logger.info(`  Start: ${details.startDate}`);
        logger.info(`  End: ${details.endDate}`);
        logger.info(`  Reason: ${details.reason}`);
        logger.info(`  Type: ${details.type}`);
      }

      // Test day without leave
      const noLeaveDate = '2099-12-31';
      const noLeaveDetails = AnnualLeavesService.getLeaveDetails(noLeaveDate);
      logger.info(`Details for non-leave date (${noLeaveDate}): ${noLeaveDetails ? 'Found (unexpected!)' : 'Not found (as expected)'}`);
    }

    // Test 7: Cache test
    logger.separator();
    logger.info('Test 7: Testing cache...');
    const start = Date.now();
    AnnualLeavesService.getLeaves(); // Should use cache
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
testAnnualLeavesService();
