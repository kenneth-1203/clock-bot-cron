const logger = require('../utils/logger');

/**
 * Service for checking Malaysian public holidays using Google Calendar API
 * Uses the public Malaysian holidays calendar (no API key required)
 */
class HolidayService {
  constructor(config) {
    this.config = config;
    this.cache = {
      holidays: [],
      lastFetched: null,
      cacheValidHours: 24, // Cache holidays for 24 hours
    };
    // Malaysia public holidays calendar ID
    this.calendarId = 'en.malaysia%23holiday%40group.v.calendar.google.com';

    // Log API key status on initialization
    const apiKey = this.config.holiday?.googleApiKey || process.env.GOOGLE_CALENDAR_API_KEY;
    if (apiKey) {
      logger.debug(`Google Calendar API key is configured (${apiKey.substring(0, 8)}...)`);
    } else {
      logger.warn('Google Calendar API key is not set. Holiday detection may not work.');
      logger.warn('Please set GOOGLE_CALENDAR_API_KEY in your .env file.');
    }
  }

  /**
   * Fetch holidays from Google Calendar API
   * @param {Date} startDate - Start date for fetching holidays
   * @param {Date} endDate - End date for fetching holidays
   * @returns {Promise<Array>} Array of holiday events
   * @private
   */
  async fetchHolidays(startDate, endDate) {
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    // Use API key from config if available, otherwise try without (may be restricted)
    const apiKey = this.config.holiday?.googleApiKey || process.env.GOOGLE_CALENDAR_API_KEY;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?` +
      `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime` +
      (apiKey ? `&key=${apiKey}` : '');

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Google Calendar API error: ${response.status} ${response.statusText}`;

        if (response.status === 403) {
          errorMessage += '\n\nTroubleshooting:';
          errorMessage += '\n1. Make sure the Google Calendar API is enabled in your project';
          errorMessage += '\n   Visit: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com';
          errorMessage += '\n2. Verify your API key is correct';
          errorMessage += '\n3. Check if your API key has restrictions that might block the request';
          errorMessage += '\n4. Ensure billing is enabled (required for some Google APIs)';
        } else if (response.status === 400) {
          errorMessage += '\n\nThe calendar ID or request parameters might be invalid';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      return (data.items || []).map(event => ({
        summary: event.summary,
        date: event.start.date || event.start.dateTime.split('T')[0],
        description: event.description || '',
      }));
    } catch (error) {
      logger.error('Error fetching holidays from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Check if cache is still valid
   * @returns {boolean} True if cache is valid
   * @private
   */
  isCacheValid() {
    if (!this.cache.lastFetched || this.cache.holidays.length === 0) {
      return false;
    }

    const hoursSinceLastFetch = (Date.now() - this.cache.lastFetched) / (1000 * 60 * 60);
    return hoursSinceLastFetch < this.cache.cacheValidHours;
  }

  /**
   * Get holidays for the current month (with caching)
   * @returns {Promise<Array>} Array of holiday objects
   */
  async getHolidays() {
    // Return cached holidays if still valid
    if (this.isCacheValid()) {
      logger.debug('Using cached holiday data');
      return this.cache.holidays;
    }

    // Fetch holidays for current month and next month to ensure coverage
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month

    logger.info('Fetching Malaysian public holidays from Google Calendar...');
    const holidays = await this.fetchHolidays(startDate, endDate);

    // Update cache
    this.cache.holidays = holidays;
    this.cache.lastFetched = Date.now();

    logger.success(`Fetched ${holidays.length} holidays`);
    return holidays;
  }

  /**
   * Check if a given date is a public holiday
   * @param {Date} date - Date to check
   * @returns {Promise<Object|null>} Holiday object if it's a holiday, null otherwise
   */
  async isHoliday(date) {
    const holidays = await this.getHolidays();
    const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const holiday = holidays.find(h => h.date === dateStr);
    return holiday || null;
  }

  /**
   * Check if today is a weekday (Monday-Friday)
   * @param {Date} date - Date to check
   * @returns {boolean} True if weekday
   */
  isWeekday(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  }

  /**
   * Check if a task should be skipped based on holidays and weekends
   * @param {Date} date - Date to check (defaults to now)
   * @returns {Promise<Object>} Object with shouldSkip flag and reason
   */
  async shouldSkipTask(date = new Date()) {
    // Check if it's a weekend
    if (!this.isWeekday(date)) {
      return {
        shouldSkip: true,
        reason: 'Weekend',
        date: date.toISOString().split('T')[0],
      };
    }

    // Check if it's a public holiday
    try {
      const holiday = await this.isHoliday(date);
      if (holiday) {
        return {
          shouldSkip: true,
          reason: `Public Holiday: ${holiday.summary}`,
          date: date.toISOString().split('T')[0],
          holiday: holiday,
        };
      }
    } catch (error) {
      logger.warn('Failed to check holiday status, proceeding with task execution');
      // If holiday check fails, don't skip the task
      return {
        shouldSkip: false,
        reason: 'Holiday check failed, proceeding with caution',
        date: date.toISOString().split('T')[0],
      };
    }

    return {
      shouldSkip: false,
      reason: 'Regular working day',
      date: date.toISOString().split('T')[0],
    };
  }

  /**
   * Get list of upcoming holidays
   * @param {number} days - Number of days to look ahead (default: 30)
   * @returns {Promise<Array>} Array of upcoming holidays
   */
  async getUpcomingHolidays(days = 30) {
    const holidays = await this.getHolidays();
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return holidays.filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate >= now && holidayDate <= futureDate;
    });
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.holidays = [];
    this.cache.lastFetched = null;
    logger.info('Holiday cache cleared');
  }
}

module.exports = HolidayService;
