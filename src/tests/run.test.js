/**
 * Test script to run both clock-in and clock-out operations
 * This helps verify that the bot works correctly before deploying
 * Run with: npm run test-run
 */

const { runBot } = require('../../index');
const logger = require('../utils/logger');

require('dotenv').config();

async function testRun() {
  logger.separator(60, '=');
  logger.info('🧪 Testing Clock Bot - Running Clock-In and Clock-Out');
  logger.separator(60, '=');
  console.log('');

  try {
    // Test clock-in
    logger.clockIn('>>> Testing CLOCK-IN operation...\n');
    await runBot('clock-in');

    console.log('');
    logger.separator(60, '-');
    logger.step('⏳ Waiting 10 seconds before clock-out...');
    logger.separator(60, '-');
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test clock-out
    logger.clockOut('>>> Testing CLOCK-OUT operation...\n');
    await runBot('clock-out');

    console.log('');
    logger.separator(60, '=');
    logger.success('✓ Test completed successfully!');
    logger.info('Both clock-in and clock-out operations worked correctly.');
    logger.separator(60, '=');

  } catch (error) {
    console.log('');
    logger.separator(60, '=');
    logger.error('✗ Test failed!');
    logger.error('Error:', error);
    logger.separator(60, '=');
    process.exit(1);
  }
}

// Run the test
testRun();
