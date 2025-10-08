const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

/**
 * Service for managing browser instances and page interactions
 */
class BrowserService {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
  }

  /**
   * Launch a new browser instance
   * @returns {Promise<void>}
   */
  async launch() {
    logger.browser('Launching browser...');
    this.browser = await puppeteer.launch({
      headless: this.config.browser.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(this.config.browser.viewport);
    logger.success('Browser launched successfully');
  }

  /**
   * Navigate to a URL
   * @param {string} url - The URL to navigate to
   * @returns {Promise<void>}
   */
  async goto(url) {
    logger.step(`Navigating to ${url}...`);
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: this.config.timeout.navigation
    });
  }

  /**
   * Wait for a selector to appear on the page
   * @param {string} selector - CSS selector to wait for
   * @param {number} [timeout] - Timeout in milliseconds (defaults to config value)
   * @returns {Promise<void>}
   */
  async waitForSelector(selector, timeout) {
    await this.page.waitForSelector(selector, { timeout: timeout || this.config.timeout.selector });
  }

  /**
   * Type text into an input field
   * @param {string} selector - CSS selector of the input field
   * @param {string} text - Text to type
   * @returns {Promise<void>}
   */
  async type(selector, text) {
    await this.page.type(selector, text);
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector of the element to click
   * @returns {Promise<void>}
   */
  async click(selector) {
    await this.page.click(selector);
  }

  /**
   * Select an option from a dropdown by value
   * @param {string} selectSelector - CSS selector of the select element
   * @param {string} optionValue - Value of the option to select
   * @returns {Promise<void>}
   */
  async selectOption(selectSelector, optionValue) {
    await this.page.select(selectSelector, optionValue);
  }

  /**
   * Select an option from a dropdown using option selector
   * Extracts the select element and value from an option selector
   * @param {string} optionSelector - CSS selector of the option (e.g., "option[value='21']")
   * @returns {Promise<void>}
   */
  async selectOptionBySelector(optionSelector) {
    // Extract value from selector like "option[value='21']"
    const valueMatch = optionSelector.match(/value='([^']+)'/);
    if (!valueMatch) {
      throw new Error(`Cannot extract value from selector: ${optionSelector}`);
    }
    const value = valueMatch[1];

    // Find the parent select element
    const selectElement = await this.page.evaluateHandle((optSelector) => {
      const option = document.querySelector(optSelector);
      return option ? option.closest('select') : null;
    }, optionSelector);

    if (!selectElement) {
      throw new Error(`Cannot find select element for option: ${optionSelector}`);
    }

    // Get the select element's selector or use it directly
    const selectId = await this.page.evaluate(el => el.id || el.name, selectElement);
    if (selectId) {
      await this.page.select(`#${selectId}`, value);
    } else {
      // Use evaluate to set the value directly
      await this.page.evaluate((optSelector, val) => {
        const option = document.querySelector(optSelector);
        if (option && option.closest('select')) {
          option.closest('select').value = val;
          option.closest('select').dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, optionSelector, value);
    }
  }

  /**
   * Click and wait for navigation
   * @param {string} selector - CSS selector of the element to click
   * @returns {Promise<void>}
   */
  async clickAndWaitForNavigation(selector) {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      this.page.click(selector),
    ]);
  }

  /**
   * Wait for button text to change (used for verification)
   * @param {string} selector - CSS selector of the button
   * @param {string} expectedText - Expected text content
   * @param {number} [timeout] - Timeout in milliseconds (defaults to config value)
   * @returns {Promise<void>}
   */
  async waitForButtonTextChange(selector, expectedText, timeout) {
    await this.page.waitForFunction(
      (sel, text) => {
        const element = document.querySelector(sel);
        return element && element.innerText.includes(text);
      },
      { timeout: timeout || this.config.timeout.selector },
      selector,
      expectedText
    );
  }

  /**
   * Close the browser
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.browser('Browser closed');
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Get the current page instance
   * @returns {Page|null}
   */
  getPage() {
    return this.page;
  }

  /**
   * Get the inner text of an element
   * @param {string} selector - CSS selector of the element
   * @returns {Promise<string>} The inner text of the element
   */
  async getInnerText(selector) {
    return await this.page.$eval(selector, el => el.innerText);
  }
}

module.exports = BrowserService;
