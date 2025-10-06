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
    clockInButton: process.env.CLOCK_IN_BUTTON_SELECTOR,
    clockOutButton: process.env.CLOCK_OUT_BUTTON_SELECTOR,
    clockOutConfirmButton: process.env.CLOCK_OUT_CONFIRM_BUTTON_SELECTOR,
  },
  schedules: {
    clockIn: process.env.CLOCK_IN_SCHEDULE || '0 9 * * 1-5', // Default: 9 AM weekdays
    clockOut: process.env.CLOCK_OUT_SCHEDULE || '0 18 * * 1-5', // Default: 6 PM weekdays
  },
  headless: process.env.HEADLESS === 'true',
};

/**
 * Main bot function that logs in and clicks a button
 * @param {string} buttonSelector - The CSS selector for the button to click
 * @param {string} action - Description of the action (e.g., 'clock-in', 'clock-out')
 */
async function runBot(buttonSelector, action = 'button click') {
  let browser;
  try {
    console.log(`[${new Date().toISOString()}] Starting bot for ${action}...`);

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
    console.log(`[${new Date().toISOString()}] Waiting for ${action} button...`);
    await page.waitForSelector(buttonSelector, { timeout: 10000 });
    
    console.log(`[${new Date().toISOString()}] Clicking ${action} button...`);
    await page.click(buttonSelector);

    // Handle confirmation modal for clock-out
    if (action === 'clock-out') {
      console.log(`[${new Date().toISOString()}] Waiting for confirmation modal...`);
      await page.waitForSelector(config.selectors.clockOutConfirmButton, { timeout: 5000 });
      console.log(`[${new Date().toISOString()}] Clicking Yes on confirmation modal...`);
      await page.click(config.selectors.clockOutConfirmButton);
    }

    // Wait and verify action is completed by checking button text change
    if (action === 'clock-in') {
      // Wait for button text to change to "Clock Out"
      await page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          return element && element.innerText.includes('Clock Out');
        },
        { timeout: 5000 },
        config.selectors.clockOutButton
      );
      console.log(`[${new Date().toISOString()}] Verified: Button changed to "Clock Out"`);
    } else if (action === 'clock-out') {
      // Wait for button text to change to "Clock In"
      await page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          return element && element.innerText.includes('Clock In');
        },
        { timeout: 5000 },
        config.selectors.clockInButton
      );
      console.log(`[${new Date().toISOString()}] Verified: Button changed to "Clock In"`);
    }

    console.log(`[${new Date().toISOString()}] ${action} completed successfully!`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error occurred during ${action}:`, error.message);
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
    'clockInButton',
    'clockOutButton',
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
    console.log('Clock Bot with Dual Cron Scheduling');
    console.log('='.repeat(60));
    
    validateConfig();

    console.log(`\nClock-In Schedule: ${config.schedules.clockIn}`);
    console.log(`Clock-Out Schedule: ${config.schedules.clockOut}`);
    console.log(`Website: ${config.websiteUrl}`);
    console.log(`Username: ${config.username.substring(0, 3)}***`);
    console.log('\nBot is running and waiting for scheduled times...');
    console.log('Press Ctrl+C to stop.\n');

    const tasks = [];

    // Function to log current date and time in Asia/Singapore timezone
    function logDateTime() {
      const currentTime = new Date().toLocaleString('en-SG', {
        timeZone: 'Asia/Singapore',
        dateStyle: 'full',
        timeStyle: 'long'
      });
      console.log(`[${new Date().toISOString()}] Current time in Singapore: ${currentTime}`);
    }

    // Log immediately on startup
    logDateTime();

    // Schedule hourly date/time logging (at the start of every hour)
    const hourlyLogTask = cron.schedule('0 * * * *', () => {
      logDateTime();
    }, {
      scheduled: true,
      timezone: "Asia/Singapore"
    });
    tasks.push(hourlyLogTask);

    // Schedule clock-in task
    const clockInTask = cron.schedule(config.schedules.clockIn, () => {
      console.log('\n' + '='.repeat(60));
      console.log('Clock-In task triggered!');
      console.log('='.repeat(60));
      runBot(config.selectors.clockInButton, 'clock-in').catch(err => {
        console.error('Failed to execute clock-in task:', err);
      });
    }, {
      scheduled: true,
      timezone: "Asia/Singapore" // Change this to your timezone
    });
    tasks.push(clockInTask);

    // Schedule clock-out task
    const clockOutTask = cron.schedule(config.schedules.clockOut, () => {
      console.log('\n' + '='.repeat(60));
      console.log('Clock-Out task triggered!');
      console.log('='.repeat(60));
      runBot(config.selectors.clockOutButton, 'clock-out').catch(err => {
        console.error('Failed to execute clock-out task:', err);
      });
    }, {
      scheduled: true,
      timezone: "Asia/Singapore" // Change this to your timezone
    });
    tasks.push(clockOutTask);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nStopping bot...');
      tasks.forEach(task => task.stop());
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\nStopping bot...');
      tasks.forEach(task => task.stop());
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
