require('dotenv').config();
const puppeteer = require('puppeteer');
const cron = require('node-cron');

// Configuration from environment variables
const config = {
  websiteUrl: process.env.WEBSITE_URL,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  selectors: {
    loginUsername: process.env.LOGIN_USERNAME_SELECTOR,
    loginPassword: process.env.LOGIN_PASSWORD_SELECTOR,
    loginButton: process.env.LOGIN_BUTTON_SELECTOR,
    targetButton: process.env.TARGET_BUTTON_SELECTOR,
  },
  cronSchedule: process.env.CRON_SCHEDULE || '0 9 * * 1-5', // Default: 9 AM weekdays
  headless: process.env.HEADLESS === 'true',
};

/**
 * Main bot function that logs in and clicks the target button
 */
async function runBot() {
  let browser;
  try {
    console.log(`[${new Date().toISOString()}] Starting bot...`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to website
    console.log(`[${new Date().toISOString()}] Navigating to ${config.websiteUrl}...`);
    await page.goto(config.websiteUrl, { waitUntil: 'networkidle2' });

    // Fill in username
    console.log(`[${new Date().toISOString()}] Entering username...`);
    await page.waitForSelector(config.selectors.loginUsername, { timeout: 10000 });
    await page.type(config.selectors.loginUsername, config.username);

    // Fill in password
    console.log(`[${new Date().toISOString()}] Entering password...`);
    await page.type(config.selectors.loginPassword, config.password);

    // Click login button
    console.log(`[${new Date().toISOString()}] Clicking login button...`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click(config.selectors.loginButton),
    ]);

    console.log(`[${new Date().toISOString()}] Successfully logged in!`);

    // Wait for and click the target button
    console.log(`[${new Date().toISOString()}] Waiting for target button...`);
    await page.waitForSelector(config.selectors.targetButton, { timeout: 10000 });
    
    console.log(`[${new Date().toISOString()}] Clicking target button...`);
    await page.click(config.selectors.targetButton);

    // Wait a moment to ensure action is completed
    await page.waitForTimeout(2000);

    console.log(`[${new Date().toISOString()}] Bot task completed successfully!`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error occurred:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[${new Date().toISOString()}] Browser closed.`);
    }
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  const requiredFields = [
    'websiteUrl',
    'username',
    'password',
  ];

  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}. Please check your .env file.`);
  }

  const requiredSelectors = [
    'loginUsername',
    'loginPassword',
    'loginButton',
    'targetButton',
  ];

  const missingSelectors = requiredSelectors.filter(
    selector => !config.selectors[selector]
  );

  if (missingSelectors.length > 0) {
    throw new Error(`Missing required selectors: ${missingSelectors.join(', ')}. Please check your .env file.`);
  }

  console.log('Configuration validated successfully.');
}

/**
 * Initialize and start the bot with cron scheduling
 */
function init() {
  try {
    console.log('='.repeat(60));
    console.log('Clock Bot with Cron Scheduling');
    console.log('='.repeat(60));
    
    validateConfig();

    console.log(`\nSchedule: ${config.cronSchedule}`);
    console.log(`Website: ${config.websiteUrl}`);
    console.log(`Username: ${config.username.substring(0, 3)}***`);
    console.log('\nBot is running and waiting for scheduled time...');
    console.log('Press Ctrl+C to stop.\n');

    // Schedule the bot to run based on cron expression
    const task = cron.schedule(config.cronSchedule, () => {
      console.log('\n' + '='.repeat(60));
      console.log('Scheduled task triggered!');
      console.log('='.repeat(60));
      runBot().catch(err => {
        console.error('Failed to execute bot task:', err);
      });
    }, {
      scheduled: true,
      timezone: "Asia/Singapore" // Change this to your timezone
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nStopping bot...');
      task.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\nStopping bot...');
      task.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Initialization error:', error.message);
    process.exit(1);
  }
}

// Start the bot
if (require.main === module) {
  init();
}

module.exports = { runBot, validateConfig };
