/**
 * Test script to run both clock-in and clock-out operations
 * This helps verify that the bot works correctly before deploying
 * Run with: npm run test-run
 */

const { runBot } = require('./index');
const logger = require('./src/utils/logger');

require('dotenv').config();

async function testRun() {
  logger.separator();
  console.log('Testing Clock Bot - Running Clock-In and Clock-Out');
  logger.separator();
  console.log('');

  try {
    // Test clock-in
    console.log('>>> Testing CLOCK-IN operation...\n');
    await runBot('clock-in');

    console.log('\n' + '-'.repeat(60));
    console.log('Waiting 10 seconds before clock-out...');
    console.log('-'.repeat(60) + '\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test clock-out
    console.log('>>> Testing CLOCK-OUT operation...\n');
    await runBot('clock-out');

    logger.separator();
    console.log('✓ Test completed successfully!');
    console.log('Both clock-in and clock-out operations worked correctly.');
    logger.separator();

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Test failed!');
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testRun();
