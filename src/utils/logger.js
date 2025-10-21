/**
 * Logging utility for consistent timestamp and formatting across the application
 */

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Log an info message with timestamp
 * @param {string} message - The message to log
 */
function log(message) {
  console.log(`[${getTimestamp()}] ${message}`);
}

/**
 * Log an info message with timestamp
 * @param {string} message - The message to log
 */
function info(message) {
  console.log(`[${getTimestamp()}] ℹ️  ${message}`);
}

/**
 * Log a success message with timestamp
 * @param {string} message - The success message to log
 */
function success(message) {
  console.log(`[${getTimestamp()}] ✅ ${message}`);
}

/**
 * Log a warning message with timestamp
 * @param {string} message - The warning message to log
 */
function warn(message) {
  console.warn(`[${getTimestamp()}] ⚠️  ${message}`);
}

/**
 * Log an error message with timestamp
 * @param {string} message - The error message to log
 * @param {Error} [error] - Optional error object
 */
function error(message, err) {
  if (err) {
    console.error(`[${getTimestamp()}] ❌ ${message}`, err.message);
  } else {
    console.error(`[${getTimestamp()}] ❌ ${message}`);
  }
}

/**
 * Log a step or action message
 * @param {string} message - The step message to log
 */
function step(message) {
  console.log(`[${getTimestamp()}] 👉 ${message}`);
}

/**
 * Log a clock-in related message
 * @param {string} message - The message to log
 */
function clockIn(message) {
  console.log(`[${getTimestamp()}] 🟢 ${message}`);
}

/**
 * Log a clock-out related message
 * @param {string} message - The message to log
 */
function clockOut(message) {
  console.log(`[${getTimestamp()}] 🔴 ${message}`);
}

/**
 * Log a browser-related message
 * @param {string} message - The message to log
 */
function browser(message) {
  console.log(`[${getTimestamp()}] 🌐 ${message}`);
}

/**
 * Log an activity-related message
 * @param {string} message - The message to log
 */
function activity(message) {
  console.log(`[${getTimestamp()}] 📝 ${message}`);
}

/**
 * Log a login-related message
 * @param {string} message - The message to log
 */
function login(message) {
  console.log(`[${getTimestamp()}] 🔐 ${message}`);
}

/**
 * Log a retry-related message
 * @param {string} message - The message to log
 */
function retry(message) {
  console.log(`[${getTimestamp()}] 🔄 ${message}`);
}

/**
 * Log a debug message (only if DEBUG env var is set)
 * @param {string} message - The debug message to log
 */
function debug(message) {
  if (process.env.DEBUG === 'true') {
    console.log(`[${getTimestamp()}] 🐛 ${message}`);
  }
}

/**
 * Log a separator line
 * @param {number} [length=60] - Length of the separator
 * @param {string} [char='='] - Character to use for separator
 */
function separator(length = 60, char = '=') {
  console.log(char.repeat(length));
}

/**
 * Log a header with separators
 * @param {string} title - The header title
 */
function header(title) {
  separator();
  console.log(title);
  separator();
}

/**
 * Get formatted date/time in a specific timezone
 * @param {string} timezone - IANA timezone (e.g., 'Asia/Singapore')
 * @returns {string} Formatted date/time string
 */
function getFormattedTime(timezone) {
  return new Date().toLocaleString('en-SG', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  });
}

/**
 * Log current time in a specific timezone
 * @param {string} timezone - IANA timezone
 */
function logTimezone(timezone) {
  const currentTime = getFormattedTime(timezone);
  info(`Current time in ${timezone}: ${currentTime}`);
}

module.exports = {
  log,
  info,
  success,
  warn,
  error,
  step,
  clockIn,
  clockOut,
  browser,
  activity,
  login,
  retry,
  debug,
  separator,
  header,
  getTimestamp,
  getFormattedTime,
  logTimezone,
};
