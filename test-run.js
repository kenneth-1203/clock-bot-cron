require('dotenv').config();
const { runBot } = require('./index');

/**
 * Test script to run both clock-in and clock-out operations
 * This helps verify that the bot works correctly before deploying
 */
async function testRun() {
  console.log('='.repeat(60));
  console.log('Testing Clock Bot - Running Clock-In and Clock-Out');
  console.log('='.repeat(60));
  console.log('');

  const config = {
    selectors: {
      clockInButton: process.env.CLOCK_IN_BUTTON_SELECTOR,
      clockOutButton: process.env.CLOCK_OUT_BUTTON_SELECTOR,
    }
  };

  try {
    // Test clock-in
    console.log('>>> Testing CLOCK-IN operation...\n');
    await runBot(config.selectors.clockInButton, 'clock-in');

    console.log('\n' + '-'.repeat(60));
    console.log('Waiting 10 seconds before clock-out...');
    console.log('-'.repeat(60) + '\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test clock-out
    console.log('>>> Testing CLOCK-OUT operation...\n');
    await runBot(config.selectors.clockOutButton, 'clock-out');

    console.log('\n' + '='.repeat(60));
    console.log('✓ Test completed successfully!');
    console.log('Both clock-in and clock-out operations worked correctly.');
    console.log('='.repeat(60));

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
