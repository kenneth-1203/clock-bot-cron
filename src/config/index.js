require('dotenv').config();

/**
 * Application configuration loaded from environment variables
 */
const config = {
  website: {
    url: process.env.WEBSITE_URL,
  },
  credentials: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
  selectors: {
    loginUsername: process.env.LOGIN_USERNAME_SELECTOR,
    loginPassword: process.env.LOGIN_PASSWORD_SELECTOR,
    loginButton: process.env.LOGIN_BUTTON_SELECTOR,
    clockInButton: process.env.CLOCK_IN_BUTTON_SELECTOR,
    clockOutButton: process.env.CLOCK_OUT_BUTTON_SELECTOR,
    clockOutConfirmButton: process.env.CLOCK_OUT_CONFIRM_BUTTON_SELECTOR,
    // Save Activity selectors
    activityNavigationButton: process.env.ACTIVITY_NAVIGATION_BUTTON_SELECTOR,
    activityProjectItem: process.env.ACTIVITY_PROJECT_ITEM_SELECTOR,
    activityListItem: process.env.ACTIVITY_LIST_ITEM_SELECTOR,
    activitySaveButton: process.env.ACTIVITY_SAVE_BUTTON_SELECTOR,
  },
  schedules: {
    clockIn: process.env.CLOCK_IN_SCHEDULE || '0 9 * * 1-5', // Default: 9 AM weekdays
    clockOut: process.env.CLOCK_OUT_SCHEDULE || '0 18 * * 1-5', // Default: 6 PM weekdays
  },
  browser: {
    headless: process.env.HEADLESS === 'true',
    viewport: {
      width: 1280,
      height: 800,
    },
  },
  timezone: 'Asia/Singapore',
};

/**
 * Validate that all required configuration is present
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
  const requiredFields = [
    { path: 'website.url', value: config.website.url },
    { path: 'credentials.username', value: config.credentials.username },
    { path: 'credentials.password', value: config.credentials.password },
  ];

  const missingFields = requiredFields
    .filter(field => !field.value)
    .map(field => field.path);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration: ${missingFields.join(', ')}. Please check your .env file.`
    );
  }

  const requiredSelectors = [
    { path: 'selectors.loginUsername', value: config.selectors.loginUsername },
    { path: 'selectors.loginPassword', value: config.selectors.loginPassword },
    { path: 'selectors.loginButton', value: config.selectors.loginButton },
    { path: 'selectors.clockInButton', value: config.selectors.clockInButton },
    { path: 'selectors.clockOutButton', value: config.selectors.clockOutButton },
  ];

  const missingSelectors = requiredSelectors
    .filter(selector => !selector.value)
    .map(selector => selector.path);

  if (missingSelectors.length > 0) {
    throw new Error(
      `Missing required selectors: ${missingSelectors.join(', ')}. Please check your .env file.`
    );
  }

  return true;
}

module.exports = {
  config,
  validateConfig,
};
