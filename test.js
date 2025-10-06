/**
 * Simple test script to validate configuration
 * Run with: node test.js
 */

require('dotenv').config();

function testConfiguration() {
  console.log('Testing Clock Bot Configuration...\n');

  const requiredEnvVars = [
    'WEBSITE_URL',
    'USERNAME',
    'PASSWORD',
    'LOGIN_USERNAME_SELECTOR',
    'LOGIN_PASSWORD_SELECTOR',
    'LOGIN_BUTTON_SELECTOR',
    'CLOCK_IN_BUTTON_SELECTOR',
    'CLOCK_OUT_BUTTON_SELECTOR',
  ];

  let allPassed = true;

  // Test environment variables
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✓' : '✗';
    const displayValue = varName.includes('PASSWORD') 
      ? (value ? '***' : 'missing')
      : (value || 'missing');
    
    console.log(`${status} ${varName}: ${displayValue}`);
    
    if (!value) {
      allPassed = false;
    }
  });

  // Test cron schedule formats
  const clockInSchedule = process.env.CLOCK_IN_SCHEDULE || '0 9 * * 1-5';
  const clockOutSchedule = process.env.CLOCK_OUT_SCHEDULE || '0 17 * * 1-5';
  console.log(`\n✓ CLOCK_IN_SCHEDULE: ${clockInSchedule}`);
  console.log(`✓ CLOCK_OUT_SCHEDULE: ${clockOutSchedule}`);
  
  const cronRegex = /^(\*|([0-9]|[1-5][0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|[1-2][0-9]|3[0-1]))\s+(\*|([1-9]|1[0-2]))\s+(\*|([0-6]|[0-6]-[0-6]))$/;
  
  if (!cronRegex.test(clockInSchedule)) {
    console.log('⚠ Warning: CLOCK_IN_SCHEDULE format may be invalid');
  }
  
  if (!cronRegex.test(clockOutSchedule)) {
    console.log('⚠ Warning: CLOCK_OUT_SCHEDULE format may be invalid');
  }

  // Test headless setting
  const headless = process.env.HEADLESS === 'true';
  console.log(`✓ HEADLESS: ${headless}`);

  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('✓ All required configuration is present!');
    console.log('\nYou can now run the bot with: npm start');
  } else {
    console.log('✗ Configuration incomplete!');
    console.log('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  console.log('='.repeat(60));
}

testConfiguration();
