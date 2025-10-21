# clock-bot-cron

An automated bot that logs into a website and clicks buttons on scheduled times. Supports dual scheduling for clock-in and clock-out operations. Designed to run 24/5 (24 hours a day, 5 days a week - weekdays only).

## Features

- 🤖 Automated website login
- 🖱️ Dual button clicking (clock-in & clock-out)
- ⏰ Separate cron-based schedules for each action
- 🔒 Environment-based configuration
- 📝 Detailed logging with emojis
- 🌐 Headless browser support
- 🏗️ Modular architecture for easy extension
- 📋 Smart activity saving (only when available)
- 🔄 Automatic retry on failure (3 attempts, 5 min apart)
- ✅ Smart status detection (skips if already clocked in/out)
- 🛡️ Anti-detection features (stealth mode)
- ⏱️ Configurable timeouts for slow networks
- 🐛 Debug logging for troubleshooting
- 🎉 Automatic holiday detection (Malaysia public holidays)
- 📅 Smart scheduling (skips weekends and public holidays)
- 🏖️ Annual leaves tracking (easily manage your leave dates)

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Advanced Features](#advanced-features)
- [Architecture](#architecture)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Running 24/7](#running-247)
- [Security](#security)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kenneth-1203/clock-bot-cron.git
cd clock-bot-cron
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your website details (see [Configuration](#configuration) section)

## Configuration

### Feature Flags

Control which features are enabled or disabled:

```env
# Enable/disable holiday detection and skipping
FEATURE_HOLIDAY_DETECTION=true        # Fetch holidays from Google Calendar (default: true)
FEATURE_SKIP_ON_HOLIDAYS=true         # Skip tasks on public holidays (default: true)

# Enable/disable annual leaves
FEATURE_SKIP_ON_ANNUAL_LEAVES=true    # Skip tasks on annual leaves (default: true)

# Enable/disable activity saving after clock-in
FEATURE_SAVE_ACTIVITY=true            # Save activity after clock-in (default: true)

# Enable/disable automatic retry mechanism
FEATURE_RETRY_MECHANISM=true          # Retry failed tasks (default: true)
```

**Benefits:**
- ✅ Toggle features without restarting code
- ✅ Easy A/B testing different configurations
- ✅ Disable problematic features temporarily
- ✅ Performance tuning by disabling unused features

### Required Settings

Edit your `.env` file with your website details:

```env
# Website and Credentials
WEBSITE_URL=https://your-website.com/login
USERNAME=your_username
PASSWORD=your_password

# Login Selectors
LOGIN_USERNAME_SELECTOR="input[name='username']"
LOGIN_PASSWORD_SELECTOR="input[name='password']"
LOGIN_BUTTON_SELECTOR="button[type='submit']"

# Clock Selectors
CLOCK_IN_BUTTON_SELECTOR="#clock-in-button"
CLOCK_OUT_BUTTON_SELECTOR="#clock-out-button"
CLOCK_OUT_CONFIRM_BUTTON_SELECTOR="button.confirm-yes"

# Schedules (cron format)
CLOCK_IN_SCHEDULE=0 9 * * 1-5   # 9 AM, Monday to Friday
CLOCK_OUT_SCHEDULE=0 18 * * 1-5 # 6 PM, Monday to Friday

# Browser
HEADLESS=true
```

### Optional Settings

```env
# Save Activity (leave empty to disable)
ACTIVITY_NAVIGATION_BUTTON_SELECTOR="a[href='#activity']"
ACTIVITY_PROJECT_ITEM_SELECTOR="option[value='21']"
ACTIVITY_LIST_ITEM_SELECTOR="option[value='358']"
ACTIVITY_SAVE_BUTTON_SELECTOR="input[value='Save']"
ACTIVITY_AVAILABILITY_SELECTOR="span"  # Element to check if activity is available

# Retry Configuration
RETRY_MAX_ATTEMPTS=3        # Default: 3
RETRY_DELAY_MINUTES=5       # Default: 5

# Timeout Configuration (in milliseconds)
SELECTOR_TIMEOUT=30000      # Default: 30000 (30 seconds)
NAVIGATION_TIMEOUT=60000    # Default: 60000 (60 seconds)

# Holiday Configuration
HOLIDAY_COUNTRY=malaysia    # Default: malaysia
# Google Calendar API key (required for holiday detection)
GOOGLE_CALENDAR_API_KEY=your_google_api_key_here

# Annual Leaves Configuration
ANNUAL_LEAVES_FILE_PATH=./annual-leaves.json  # Path to annual leaves JSON file (default: ./annual-leaves.json)
```

### Finding CSS Selectors

To find the correct selectors for your website:

1. Open your website in Chrome/Firefox
2. Right-click on the element (username field, password field, or button)
3. Select "Inspect" or "Inspect Element"
4. In the developer tools, right-click on the highlighted HTML element
5. Select "Copy" → "Copy selector"
6. Paste this selector into your `.env` file

**Pro tip:** Test your selectors in the browser console:
```javascript
document.querySelector('#your-selector-here')
```

### Cron Schedule Format

The bot uses standard cron format for scheduling:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, where both 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 9 * * 1-5` - 9:00 AM, Monday to Friday
- `30 8 * * *` - 8:30 AM, every day
- `0 17 * * 1-5` - 5:00 PM, Monday to Friday
- `15 18 * * 1-5` - 6:15 PM, Monday to Friday

### Timezone

By default, the timezone is set to `Asia/Singapore`. To change it, edit `src/config/index.js`:

```javascript
timezone: 'America/New_York', // Change this to your timezone
```

[List of valid timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Usage

### Start the bot
```bash
npm start
```

### Test configuration
```bash
npm test
```

### Test full clock-in/out cycle
```bash
npm run test-run
```

### Stop the bot
Press `Ctrl+C` to gracefully stop the bot.

## Advanced Features

### 🎛️ Feature Flags

Control which features are enabled for your specific use case. All feature flags default to `true` for convenience, but can be disabled if needed.

**Available Feature Flags:**

| Flag | Default | Purpose |
|------|---------|---------|
| `FEATURE_HOLIDAY_DETECTION` | `true` | Enable/disable fetching from Google Calendar API |
| `FEATURE_SKIP_ON_HOLIDAYS` | `true` | Skip tasks on public holidays and weekends |
| `FEATURE_SKIP_ON_ANNUAL_LEAVES` | `true` | Skip tasks on annual leave dates |
| `FEATURE_SAVE_ACTIVITY` | `true` | Save activity after clock-in |
| `FEATURE_RETRY_MECHANISM` | `true` | Automatically retry failed tasks |

**Use Cases:**

1. **Disable holidays during testing:**
   ```env
   FEATURE_SKIP_ON_HOLIDAYS=false
   ```

2. **Disable retries for quick feedback:**
   ```env
   FEATURE_RETRY_MECHANISM=false
   ```

3. **Disable activity saving temporarily:**
   ```env
   FEATURE_SAVE_ACTIVITY=false
   ```

4. **Run on all days (including weekends):**
   ```env
   FEATURE_SKIP_ON_HOLIDAYS=false
   ```

**Example Configuration - Minimal Mode:**
```env
# Disable all features except core clock-in/out
FEATURE_HOLIDAY_DETECTION=false
FEATURE_SKIP_ON_HOLIDAYS=false
FEATURE_SKIP_ON_ANNUAL_LEAVES=false
FEATURE_SAVE_ACTIVITY=false
FEATURE_RETRY_MECHANISM=true
```

**Example Configuration - Full Features:**
```env
# Enable all features for maximum automation
FEATURE_HOLIDAY_DETECTION=true
FEATURE_SKIP_ON_HOLIDAYS=true
FEATURE_SKIP_ON_ANNUAL_LEAVES=true
FEATURE_SAVE_ACTIVITY=true
FEATURE_RETRY_MECHANISM=true
```

### 🎉 Holiday Detection & Smart Scheduling

The bot automatically fetches Malaysian public holidays from Google Calendar and skips scheduled tasks on holidays and weekends.

**How it works:**
1. Fetches public holidays from Google Calendar API using your API key
2. Caches holiday data for 24 hours to minimize API calls
3. Before each scheduled task, checks if today is:
   - A weekend (Saturday or Sunday)
   - A Malaysian public holiday
4. If yes, skips the task with a friendly log message
5. If no, proceeds with the scheduled operation

**Setup:**

1. Get a free Google Calendar API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable the "Google Calendar API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key

2. Add to your `.env` file:
```env
# Enable holiday detection (default: true)
FEATURE_HOLIDAY_DETECTION=true

# Skip tasks on public holidays and weekends (default: true)
FEATURE_SKIP_ON_HOLIDAYS=true

# Country for holiday calendar (currently supports Malaysia)
HOLIDAY_COUNTRY=malaysia

# Google Calendar API key (required for holiday detection)
GOOGLE_CALENDAR_API_KEY=your_api_key_here
```

**Optional: Restrict your API key** (recommended for security):
   - In Google Cloud Console, click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Calendar API" only
   - Save changes

**Example log output:**
```
============================================================
[2025-10-09T10:00:00.000Z] ℹ️  Clock-In task triggered!
============================================================
[2025-10-09T10:00:00.100Z] ⏭️  Skipping Clock-In task - Public Holiday: Maulidur Rasul (2025-10-09)
[2025-10-09T10:00:00.100Z] 🎉 Holiday: Maulidur Rasul
============================================================
```

**Weekend example:**
```
============================================================
[2025-10-11T10:00:00.000Z] ℹ️  Clock-In task triggered!
============================================================
[2025-10-11T10:00:00.100Z] ⏭️  Skipping Clock-In task - Weekend (2025-10-11)
============================================================
```

**Benefits:**
- ✅ No need to manually update holiday schedules
- ✅ Automatically stays current with official Malaysian public holidays
- ✅ Prevents accidental clock-ins on holidays
- ✅ Works offline using 24-hour cache
- ✅ Graceful fallback if holiday check fails (proceeds with task)

**To disable:**
```env
FEATURE_SKIP_ON_HOLIDAYS=false
```

**Note:** The hourly time logging task runs even on holidays to maintain system health monitoring.

### 🏖️ Annual Leaves Management

Easily manage your personal annual leave dates with a simple JSON file. The bot automatically skips scheduled tasks on your leave days.

**How it works:**
1. Maintains a `annual-leaves.json` file with your leave dates
2. Before each scheduled task, checks if today is marked as leave
3. If yes, skips the task with a friendly log message
4. Works alongside holiday detection - skips if EITHER holiday OR leave

**Setup:**

1. Create or edit `annual-leaves.json` in the root directory:
```json
{
  "leaves": [
    {
      "startDate": "2025-01-15",
      "endDate": "2025-01-16",
      "type": "annual",
      "reason": "Personal leave"
    },
    {
      "startDate": "2025-02-10",
      "endDate": "2025-02-14",
      "type": "annual",
      "reason": "Vacation"
    }
  ]
}
```

2. (Optional) Configure the file path in `.env`:
```env
ANNUAL_LEAVES_FILE_PATH=./annual-leaves.json  # Default: ./annual-leaves.json
```

**Date format:** Use `YYYY-MM-DD` format (ISO 8601 standard) for both `startDate` and `endDate`. Dates are inclusive - all days from `startDate` to `endDate` are marked as leave.

**Example log output:**
```
============================================================
[2025-01-15T09:00:00.000Z] ℹ️  Clock-In task triggered!
============================================================
[2025-01-15T09:00:00.100Z] ⏭️  Skipping Clock-In task - Annual leave (Personal leave) (2025-01-15)
[2025-01-15T09:00:00.100Z] 📅 Leave Type: annual
============================================================
```

**Features:**
- ✅ Easy to update - just edit the JSON file
- ✅ Version controlled - track your leave history
- ✅ No API calls needed - works offline
- ✅ Cached for 1 hour - minimal file I/O
- ✅ Supports multiple leave entries
- ✅ Reason field for documentation
- ✅ Works alongside holiday detection

**To disable:**
- Delete or empty the `annual-leaves.json` file, or
- Remove all entries from the `leaves` array, or
- Set feature flag to disable:
  ```env
  FEATURE_SKIP_ON_ANNUAL_LEAVES=false
  ```

**Adding/Removing leaves programmatically:**

You can also manage leaves through the service (for future development):
```javascript
const AnnualLeavesService = require('./src/services/annual-leaves.service');

// Add a leave with date range
AnnualLeavesService.addLeave('2025-03-15', '2025-03-20', 'Conference');

// Remove a leave (by startDate)
AnnualLeavesService.removeLeave('2025-03-15');

// Check if specific date is within a leave
const isLeave = AnnualLeavesService.isAnnualLeave('2025-03-17'); // true if within any leave range

// Get leave details for a specific date
const details = AnnualLeavesService.getLeaveDetails('2025-03-17');

// Get upcoming leaves in next 30 days
const upcoming = AnnualLeavesService.getUpcomingLeaves(30);
```

### 📋 Save Activity (Smart & Automatic)

The bot intelligently saves your daily activity after clocking in, but only if activity is available.

**Configuration:**
```env
ACTIVITY_NAVIGATION_BUTTON_SELECTOR="a[href='#activity']"
ACTIVITY_PROJECT_ITEM_SELECTOR="option[value='21']"
ACTIVITY_LIST_ITEM_SELECTOR="option[value='358']"
ACTIVITY_SAVE_BUTTON_SELECTOR="input[value='Save']"
ACTIVITY_AVAILABILITY_SELECTOR="span"  # Checks if text contains "available"
```

**How it works:**
1. Checks if already clocked in (reads button text)
2. Clocks in if needed (or skips if already clocked in)
3. **Checks if activity is available** by reading the element specified in `ACTIVITY_AVAILABILITY_SELECTOR`
4. If element text contains "available" (case-insensitive):
   - Navigates to activity page
   - Selects project from dropdown
   - Selects activity from list
   - Clicks save button
5. If not available, skips activity saving with message "activity already saved for today"

**To disable:**
- Leave the activity selectors empty in `.env`, or
- Pass `false` to `clockIn()` method:
  ```javascript
  await botService.clockIn(false);
  ```
- Or disable via feature flag:
  ```env
  FEATURE_SAVE_ACTIVITY=false
  ```

**When it runs:**
- After clock-in operation (only if activity is available)
- Skips if activity was already saved for today
- Not after clock-out operations

**Smart detection:**
The bot reads an element on the page (e.g., `span`, `div`, etc.) and checks if it contains the word "available". This prevents saving duplicate activities.

### 🔄 Automatic Retry

If a scheduled task fails, the bot automatically retries with delays.

**Configuration:**
```env
RETRY_MAX_ATTEMPTS=3        # Number of retry attempts (default: 3)
RETRY_DELAY_MINUTES=5       # Minutes between retries (default: 5)
```

**Example Timeline:**
```
9:00 AM - Scheduled clock-in fails (network error)
          ❌ Attempt 1 failed
          ⏰ Scheduling retry in 5 minutes...

9:05 AM - Retry attempt 2 fails
          ❌ Attempt 2 failed
          ⏰ Scheduling retry in 5 minutes...

9:10 AM - Retry attempt 3 succeeds
          ✅ Success on retry attempt 3! ✨

Result: Clocked in at 9:10 AM (10 minutes late, but successful)
```

**When retries are useful:**
- ✅ Temporary network issues
- ✅ Website downtime
- ✅ Rate limiting
- ✅ Browser startup issues
- ✅ Transient errors

**When retries won't help:**
- ❌ Wrong credentials
- ❌ Incorrect selectors
- ❌ Website structure changed
- ❌ Configuration errors

**Disabling retries via config:**
```env
RETRY_MAX_ATTEMPTS=1
```

**Disabling retries via feature flag (recommended):**
```env
FEATURE_RETRY_MECHANISM=false
```

### ✅ Smart Status Detection

The bot checks the current button state before performing actions:

**For Clock-In:**
- Reads button text
- If button shows "Clock Out" → Already clocked in, skips clock-in
- If button shows "Clock In" → Performs clock-in
- Then checks if activity is available before saving

**For Clock-Out:**
- Reads button text
- If button shows "Clock In" → Already clocked out, skips operation
- If button shows "Clock Out" → Performs clock-out

**Benefits:**
- Prevents duplicate clock-in/out
- Handles manual interventions gracefully
- Only saves activity when available
- Idempotent operations

### 🛡️ Anti-Detection Features

The bot includes stealth features to avoid detection by websites:

**Features:**
- `puppeteer-extra-plugin-stealth` - Masks automation signals
- Realistic user agent (Chrome on Windows)
- Disabled automation flags
- Natural browser headers

**Configuration:**
Already enabled by default. All stealth features are automatic.

### ⏱️ Configurable Timeouts

Adjust timeouts for slow networks or VMs:

**Configuration:**
```env
SELECTOR_TIMEOUT=30000      # Wait up to 30 seconds for elements (default)
NAVIGATION_TIMEOUT=60000    # Wait up to 60 seconds for page loads (default)
```

**When to increase:**
- Slow internet connection
- Running in VM with limited resources
- Website takes long to load
- Frequent timeout errors

**Example for very slow connections:**
```env
SELECTOR_TIMEOUT=60000      # 60 seconds
NAVIGATION_TIMEOUT=120000   # 2 minutes
```

## Architecture

The codebase follows a modular, service-oriented architecture:

```
src/
├── config/
│   └── index.js              # Configuration management
├── services/
│   ├── activity.service.js   # Save activity operations
│   ├── annual-leaves.service.js # Annual leaves management
│   ├── auth.service.js       # Authentication/login
│   ├── bot.service.js        # Main orchestrator
│   ├── browser.service.js    # Browser automation
│   ├── clock.service.js      # Clock-in/out operations
│   ├── holiday.service.js    # Holiday detection & checking
│   └── scheduler.service.js  # Cron job management
└── utils/
    ├── constants.js          # Application constants
    └── logger.js             # Logging utilities
```

**Each service is responsible for a specific domain:**
- **Config**: Centralized configuration and validation
- **BotService**: Orchestrates all operations
- **BrowserService**: Manages Puppeteer browser instances
- **AuthService**: Handles login operations
- **ClockService**: Performs clock-in/out actions with status detection
- **ActivityService**: Saves daily activity
- **HolidayService**: Fetches and checks Malaysian public holidays
- **AnnualLeavesService**: Manages annual leave dates from JSON file
- **SchedulerService**: Manages cron scheduling with retry logic and both holiday and leave checking

**Benefits:**
- Easy to test individual components
- Simple to add new features
- Clear separation of concerns
- Maintainable and scalable

## Testing

### Validate Configuration
```bash
npm test
```
Checks if all required environment variables are set.

### Test Full Cycle
```bash
npm run test-run
```
Runs a complete clock-in and clock-out cycle to verify everything works.

**What it does:**
1. Clock in (or verify already clocked in)
2. Save activity
3. Wait 10 seconds
4. Clock out
5. Report success or failure

## Troubleshooting

### Bot can't find elements
**Solution:**
- Verify your CSS selectors are correct
- Test selectors in browser console: `document.querySelector('your-selector')`
- Check if the website loads slowly - selectors might need adjustment
- Try running with `HEADLESS=false` to see what's happening

### Login fails
**Solution:**
- Verify your credentials are correct in `.env`
- Check if the website requires additional steps (CAPTCHA, 2FA)
- Some websites may block automated logins
- Try increasing timeout values if website is slow

### Browser won't launch
**Solution:**
- Ensure you have sufficient permissions
- Try running with `--no-sandbox` flag (already included)
- Install Chrome/Chromium if using puppeteer without bundled browser
- Check available disk space and memory

### Activity saving fails
**Solution:**
- Verify all activity selectors are correct
- Check if selectors point to `<option>` elements in dropdowns
- Verify `ACTIVITY_AVAILABILITY_SELECTOR` points to correct element
- Test with `HEADLESS=false` to see the page
- Ensure activity page loads after clock-in
- Check if element text actually contains "available"

### Selector timeout errors
**Solution:**
- Increase timeout values in `.env`:
  ```env
  SELECTOR_TIMEOUT=60000      # 60 seconds
  NAVIGATION_TIMEOUT=120000   # 2 minutes
  ```
- Check debug logs for URL, page title, and available inputs
- Verify selectors are correct
- Test selectors in browser console first

### Website blocks automated access
**Solution:**
- Anti-detection features are already enabled (stealth mode)
- Try running with `HEADLESS=false` (some sites allow visible browsers)
- Check if website has specific automation policies
- Use VPN if IP is blocked
- Contact website administrator if legitimate use

### Retries not working
**Solution:**
- Check `.env` has `RETRY_MAX_ATTEMPTS > 1`
- Check `.env` has `RETRY_DELAY_MINUTES > 0`
- Look for retry messages in logs
- Verify errors are catchable (not system crashes)

### Clock-in runs twice
**Solution:**
- This should NOT happen with smart status detection
- Check logs for "Already clocked in" message
- Verify `CLOCK_IN_BUTTON_SELECTOR` is correct
- Ensure button text changes after clock-in

## Running 24/7

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start index.js --name clock-bot

# Save the process list
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Monitor
pm2 logs clock-bot
pm2 status
```

**Useful PM2 commands:**
```bash
pm2 restart clock-bot    # Restart the bot
pm2 stop clock-bot       # Stop the bot
pm2 delete clock-bot     # Remove from PM2
pm2 logs clock-bot       # View logs
pm2 monit                # Monitor resources
```

### Using systemd (Linux)
Create a service file at `/etc/systemd/system/clock-bot.service`:

```ini
[Unit]
Description=Clock Bot Cron
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/clock-bot-cron
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable clock-bot
sudo systemctl start clock-bot
sudo systemctl status clock-bot
sudo journalctl -u clock-bot -f  # View logs
```

### Using Docker
```bash
# Build image
docker build -t clock-bot .

# Run container
docker run -d \
  --name clock-bot \
  --env-file .env \
  --restart unless-stopped \
  clock-bot

# View logs
docker logs -f clock-bot
```

### Using Screen (Simple alternative)
```bash
# Start a new screen session
screen -S clock-bot

# Inside screen, start the bot
npm start

# Detach from screen: Press Ctrl+A, then D

# Reattach later
screen -r clock-bot
```

## Security

⚠️ **Important Security Notes:**

### Credentials
- ❌ **NEVER** commit your `.env` file to version control
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Use strong, unique passwords
- ✅ Consider using environment variables in production
- ✅ Use a password manager or secrets management service (e.g., AWS Secrets Manager, HashiCorp Vault)

### Best Practices
```bash
# Set proper file permissions
chmod 600 .env

# Use environment variables in production
export WEBSITE_URL="https://..."
export USERNAME="..."
# etc.
```

### Production Deployment
For GCE or other cloud deployments, see [GCE_DEPLOYMENT.md](GCE_DEPLOYMENT.md).

**Key security measures:**
- Use secret managers (Google Secret Manager, AWS Secrets Manager)
- Enable firewall rules
- Use service accounts with minimal permissions
- Rotate credentials regularly
- Enable audit logging

## Project Structure

```
clock-bot-cron/
├── src/
│   ├── config/              # Configuration
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── .env                     # Configuration (DO NOT COMMIT)
├── .env.example             # Example configuration
├── index.js                 # Main entry point
├── test.js                  # Configuration test
├── test-run.js              # Full cycle test
├── package.json             # Dependencies
├── README.md                # This file
└── GCE_DEPLOYMENT.md        # Google Cloud deployment guide
```

## Scripts

```bash
npm start          # Start the bot
npm test           # Validate configuration
npm run test-run   # Test full clock-in/out cycle
```

## Logs

The bot provides colorful, emoji-based logging:

- ℹ️ **Info**: General information
- ✅ **Success**: Successful operations
- ⚠️ **Warning**: Warnings
- ❌ **Error**: Errors
- 👉 **Step**: Action steps
- 🟢 **Clock-In**: Clock-in operations
- 🔴 **Clock-Out**: Clock-out operations
- 🌐 **Browser**: Browser operations
- 📝 **Activity**: Activity saving
- 🔐 **Login**: Login operations
- 🔄 **Retry**: Retry attempts

**Example log output:**
```
============================================================
[2025-10-07T09:00:00.000Z] ℹ️  Clock-In task triggered!
============================================================
[2025-10-07T09:00:00.100Z] ℹ️  🤖 Starting clock-in bot...
[2025-10-07T09:00:01.000Z] 🌐 Launching browser...
[2025-10-07T09:00:02.000Z] ✅ Browser launched successfully
[2025-10-07T09:00:02.100Z] 🔐 Starting login process...
[2025-10-07T09:00:02.200Z] 👉 Navigating to https://...
[2025-10-07T09:00:03.000Z] 👉 Entering username...
[2025-10-07T09:00:03.100Z] 👉 Entering password...
[2025-10-07T09:00:03.200Z] 👉 Clicking login button...
[2025-10-07T09:00:05.000Z] ✅ Successfully logged in!
[2025-10-07T09:00:05.100Z] 👉 Current button status: Clock Out
[2025-10-07T09:00:05.100Z] 🟢 Already clocked in (button shows "Clock Out")
[2025-10-07T09:00:05.200Z] 📝 Clock action already performed previously, proceeding with save-activity...
[2025-10-07T09:00:05.300Z] 📝 Starting save-activity process...
[2025-10-07T09:00:05.400Z] 👉 Navigating to activity page...
[2025-10-07T09:00:06.000Z] 👉 Selecting project item...
[2025-10-07T09:00:06.100Z] 👉 Selecting activity from list...
[2025-10-07T09:00:07.000Z] 👉 Clicking save button...
[2025-10-07T09:00:09.000Z] ✅ Activity saved successfully!
============================================================
[2025-10-07T09:00:09.100Z] ✅ clock-in operation completed successfully! 🎉
============================================================
[2025-10-07T09:00:09.200Z] 🌐 Browser closed
```

## FAQ

**Q: Can I run multiple instances for different websites?**
A: Yes! Create separate directories with different `.env` files.

**Q: What happens if my computer restarts?**
A: Use PM2 with `pm2 startup` or systemd to auto-start on boot.

**Q: Can I disable activity saving temporarily?**
A: Yes, comment out the activity selectors in `.env` or restart with modified config.

**Q: How do I know if the bot is working?**
A: Check the logs. The bot logs every action with emojis for easy scanning.

**Q: Can I clock in/out at different times each day?**
A: Yes, but you'll need multiple cron schedules or custom logic.

**Q: Does it work with 2FA/CAPTCHA?**
A: No, the bot cannot handle CAPTCHA or 2FA automatically.

**Q: Can I use this for other websites?**
A: Yes! Just update the selectors and URLs in `.env`.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the logs for error messages
3. Open an issue on GitHub with logs and configuration (remove sensitive data!)
