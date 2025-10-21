const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class AnnualLeavesService {
  constructor(filePath) {
    // Use provided path or default to annual-leaves.json in root directory
    this.filePath = filePath || path.join(__dirname, '../../annual-leaves.json');

    // Resolve relative paths from process.cwd()
    if (!path.isAbsolute(this.filePath)) {
      this.filePath = path.resolve(process.cwd(), this.filePath);
    }

    this.leaves = [];
    this.lastLoadTime = null;
    this.cacheValidityMs = 60 * 60 * 1000; // 1 hour cache

    // Load leaves on initialization
    this.loadLeaves();
  }

  /**
   * Load annual leaves from JSON file
   */
  loadLeaves() {
    try {
      if (!fs.existsSync(this.filePath)) {
        logger.warn(`Annual leaves file not found at ${this.filePath}`);
        this.leaves = [];
        return;
      }

      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data.leaves)) {
        throw new Error('Invalid annual-leaves.json format: "leaves" must be an array');
      }

      this.leaves = data.leaves;
      this.lastLoadTime = Date.now();
      logger.info(`Loaded ${this.leaves.length} annual leave(s) from file`);
    } catch (error) {
      logger.error(`Failed to load annual leaves: ${error.message}`);
      this.leaves = [];
    }
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.lastLoadTime) return false;
    return Date.now() - this.lastLoadTime < this.cacheValidityMs;
  }

  /**
   * Get all annual leaves (reload if cache expired)
   */
  getLeaves() {
    if (!this.isCacheValid()) {
      this.loadLeaves();
    }
    return this.leaves;
  }

  /**
   * Check if a specific date is within an annual leave range
   * @param {Date|string} date - Date to check (Date object or YYYY-MM-DD string)
   * @returns {boolean}
   */
  isAnnualLeave(date) {
    const dateStr = this.formatDate(date);
    const checkDate = new Date(dateStr);

    return this.getLeaves().some(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Inclusive date range check
      return checkDate >= startDate && checkDate <= endDate;
    });
  }

  /**
   * Get leave details for a specific date
   * @param {Date|string} date - Date to check
   * @returns {object|null}
   */
  getLeaveDetails(date) {
    const dateStr = this.formatDate(date);
    const checkDate = new Date(dateStr);

    return this.getLeaves().find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Inclusive date range check
      return checkDate >= startDate && checkDate <= endDate;
    }) || null;
  }

  /**
   * Check if task should be skipped due to annual leave
   * @param {Date|string} date - Date to check
   * @returns {object} {shouldSkip, reason, date, leave}
   */
  shouldSkipTask(date) {
    const leave = this.getLeaveDetails(date);

    return {
      shouldSkip: !!leave,
      reason: leave ? `Annual leave (${leave.reason || 'no reason specified'})` : null,
      date: this.formatDate(date),
      leave: leave || null
    };
  }

  /**
   * Format date to YYYY-MM-DD string
   * @param {Date|string} date
   * @returns {string}
   */
  formatDate(date) {
    if (typeof date === 'string') {
      return date;
    }

    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    throw new Error('Date must be a Date object or YYYY-MM-DD string');
  }

  /**
   * Add a new annual leave with date range
   * @param {string} startDate - YYYY-MM-DD format
   * @param {string} endDate - YYYY-MM-DD format
   * @param {string} reason - Leave reason
   * @returns {boolean}
   */
  addLeave(startDate, endDate, reason = '') {
    // Validate date format
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      logger.warn(`Invalid date format. Use YYYY-MM-DD format.`);
      return false;
    }

    // Ensure startDate <= endDate
    if (startDate > endDate) {
      logger.warn(`startDate (${startDate}) must be <= endDate (${endDate})`);
      return false;
    }

    const leave = { startDate, endDate, type: 'annual', reason };

    this.leaves.push(leave);
    this.saveToFile();
    logger.info(`Added annual leave from ${startDate} to ${endDate}: ${reason}`);
    return true;
  }

  /**
   * Remove a leave entry by startDate
   * @param {string} startDate - YYYY-MM-DD format of the leave to remove
   * @returns {boolean}
   */
  removeLeave(startDate) {
    const initialLength = this.leaves.length;
    this.leaves = this.leaves.filter(leave => leave.startDate !== startDate);

    if (this.leaves.length < initialLength) {
      this.saveToFile();
      logger.info(`Removed annual leave starting from ${startDate}`);
      return true;
    }

    logger.warn(`No leave found starting from ${startDate}`);
    return false;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} date - Date string to validate
   * @returns {boolean}
   */
  isValidDate(date) {
    if (typeof date !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;

    const d = new Date(date);
    return d instanceof Date && !isNaN(d) && d.toISOString().split('T')[0] === date;
  }

  /**
   * Save leaves to JSON file
   */
  saveToFile() {
    try {
      const data = { leaves: this.leaves };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.lastLoadTime = Date.now(); // Reset cache on save
    } catch (error) {
      logger.error(`Failed to save annual leaves: ${error.message}`);
    }
  }

  /**
   * Get upcoming leaves in next N days
   * @param {number} days - Number of days to look ahead
   * @returns {array}
   */
  getUpcomingLeaves(days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getLeaves().filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Check if leave period overlaps with the next N days
      return endDate >= today && startDate <= futureDate;
    });
  }
}

module.exports = new AnnualLeavesService();
