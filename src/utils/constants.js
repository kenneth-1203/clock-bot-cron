/**
 * Application-wide constants
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const NAVIGATION_TIMEOUT = 30000; // 30 seconds
const VERIFICATION_TIMEOUT = 5000; // 5 seconds

const DEFAULT_VIEWPORT = {
  width: 1280,
  height: 800,
};

const DEFAULT_SCHEDULES = {
  CLOCK_IN: '0 9 * * 1-5',    // 9 AM weekdays
  CLOCK_OUT: '0 18 * * 1-5',  // 6 PM weekdays
  HOURLY_LOG: '0 * * * *',    // Every hour
};

const WAIT_BETWEEN_TESTS = 10000; // 10 seconds

module.exports = {
  DEFAULT_TIMEOUT,
  NAVIGATION_TIMEOUT,
  VERIFICATION_TIMEOUT,
  DEFAULT_VIEWPORT,
  DEFAULT_SCHEDULES,
  WAIT_BETWEEN_TESTS,
};
