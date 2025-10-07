# Source Code Structure

This directory contains the refactored, modular source code for the Clock Bot application.

## Directory Structure

```
src/
├── config/           # Configuration management
│   └── index.js      # Environment configuration and validation
├── services/         # Business logic services
│   ├── activity.service.js   # Save-activity operations
│   ├── auth.service.js       # Authentication/login service
│   ├── bot.service.js        # Main bot orchestrator
│   ├── browser.service.js    # Browser automation service
│   ├── clock.service.js      # Clock-in/out operations
│   └── scheduler.service.js  # Cron job scheduling
└── utils/            # Utility functions
    ├── constants.js  # Application constants
    └── logger.js     # Logging utilities
```

## Module Descriptions

### Config (`config/index.js`)
- Loads environment variables using dotenv
- Exports centralized configuration object
- Validates required configuration fields
- **Exports**: `config`, `validateConfig()`

### Services

#### `auth.service.js`
Handles user authentication and login operations.
- **Constructor**: `AuthService(browserService, config)`
- **Methods**: `login()`

#### `bot.service.js`
Main orchestrator that coordinates all services to perform bot operations.
- **Constructor**: `BotService(config)`
- **Methods**:
  - `clockIn(withActivity = true)` - Perform clock-in (optionally with save-activity)
  - `clockOut()` - Perform clock-out
  - `executeOperation(operation, actionName, withActivity)` - Execute any operation

#### `browser.service.js`
Manages Puppeteer browser instances and page interactions.
- **Constructor**: `BrowserService(config)`
- **Methods**:
  - `launch()` - Launch browser
  - `goto(url)` - Navigate to URL
  - `waitForSelector(selector, timeout)` - Wait for element
  - `type(selector, text)` - Type text into input
  - `click(selector)` - Click element
  - `clickAndWaitForNavigation(selector)` - Click and wait for navigation
  - `waitForButtonTextChange(selector, expectedText, timeout)` - Verify button text change
  - `close()` - Close browser

#### `clock.service.js`
Handles clock-in and clock-out operations.
- **Constructor**: `ClockService(browserService, config)`
- **Methods**: `clockIn()`, `clockOut()`
- **Exports**: `ClockService`, `ClockAction` enum

#### `activity.service.js`
Handles save-activity operations after clock-in.
- **Constructor**: `ActivityService(browserService, config)`
- **Methods**:
  - `saveActivity()` - Navigate to activity page, select item, and save
  - `isConfigured()` - Check if activity selectors are configured

#### `scheduler.service.js`
Manages cron job scheduling using node-cron.
- **Constructor**: `SchedulerService(config)`
- **Methods**:
  - `scheduleTask(schedule, callback, taskName)` - Schedule a cron task
  - `scheduleHourly(callback, taskName)` - Schedule hourly task
  - `stopAll()` - Stop all scheduled tasks
  - `getTaskCount()` - Get number of active tasks

### Utils

#### `logger.js`
Provides consistent logging with timestamps and formatting.
- **Methods**:
  - `info(message)` - Log info message
  - `error(message, error)` - Log error message
  - `separator(length, char)` - Log separator line
  - `header(title)` - Log header with separators
  - `getTimestamp()` - Get ISO timestamp
  - `getFormattedTime(timezone)` - Get formatted time for timezone
  - `logTimezone(timezone)` - Log current time in timezone

## Usage Examples

### Using Services Directly

```javascript
const { config } = require('./src/config');
const BotService = require('./src/services/bot.service');

// Perform a single clock-in operation
async function clockIn() {
  const botService = new BotService(config);
  await botService.clockIn();
}
```

### Using the Scheduler

```javascript
const { config } = require('./src/config');
const BotService = require('./src/services/bot.service');
const SchedulerService = require('./src/services/scheduler.service');

const botService = new BotService(config);
const scheduler = new SchedulerService(config);

// Schedule clock-in at 9 AM weekdays
scheduler.scheduleTask(
  '0 9 * * 1-5',
  async () => await botService.clockIn(),
  'Clock-In'
);
```

### Adding Custom Logging

```javascript
const logger = require('./src/utils/logger');

logger.header('My Custom Task');
logger.info('Starting operation...');
logger.separator(40, '-');
```

## Save Activity Feature

The save-activity feature automatically saves your daily activity after clocking in. This is an optional feature that can be enabled by configuring the activity selectors.

### How it Works

1. After successfully clocking in, the bot automatically proceeds to save activity
2. It navigates to the activity page by clicking a navigation button
3. Selects an item from the activity list
4. Clicks the save button to save the activity

### Configuration

Add these selectors to your `.env` file:

```env
ACTIVITY_NAVIGATION_BUTTON_SELECTOR="#activity-nav-button"
ACTIVITY_LIST_ITEM_SELECTOR="#activity-list-item"
ACTIVITY_SAVE_BUTTON_SELECTOR="#activity-save-button"
```

If these selectors are not configured, the save-activity step will be skipped automatically.

### Disabling Save Activity

To disable the save-activity feature:

1. **Per execution**: Pass `false` to `clockIn()`:
   ```javascript
   await botService.clockIn(false); // Skip save-activity
   ```

2. **Globally**: Remove the activity selectors from your `.env` file

## Adding New Features

### Adding a New Service

1. Create a new file in `src/services/` (e.g., `notification.service.js`)
2. Export a class with your service logic
3. Import and use in `bot.service.js` or create a new orchestrator

Example:
```javascript
// src/services/notification.service.js
const logger = require('../utils/logger');

class NotificationService {
  constructor(config) {
    this.config = config;
  }

  async sendNotification(message) {
    logger.info(`Sending notification: ${message}`);
    // Implementation here
  }
}

module.exports = NotificationService;
```

### Adding a New Utility

1. Create a new file in `src/utils/` (e.g., `date-helper.js`)
2. Export utility functions
3. Import where needed

Example:
```javascript
// src/utils/date-helper.js
function isWeekday() {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

module.exports = { isWeekday };
```

## Benefits of This Structure

1. **Separation of Concerns**: Each module has a single responsibility
2. **Testability**: Services can be tested independently
3. **Reusability**: Services can be used in different contexts
4. **Maintainability**: Easy to locate and modify specific functionality
5. **Scalability**: Simple to add new features without affecting existing code
6. **Dependency Injection**: Services receive dependencies through constructors
