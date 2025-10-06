# clock-bot-cron

An automated bot that logs into a website and clicks a button on a scheduled time. Designed to run 24/5 (24 hours a day, 5 days a week - weekdays only).

## Features

- 🤖 Automated website login
- 🖱️ Automated button clicking
- ⏰ Cron-based scheduling (configurable)
- 🔒 Environment-based configuration
- 📝 Detailed logging
- 🌐 Headless browser support

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

4. Configure your `.env` file with your website details:
```env
WEBSITE_URL=https://your-website.com/login
USERNAME=your_username
PASSWORD=your_password

# Update these selectors based on your target website
LOGIN_USERNAME_SELECTOR=#username
LOGIN_PASSWORD_SELECTOR=#password
LOGIN_BUTTON_SELECTOR=#login-button
TARGET_BUTTON_SELECTOR=#clock-in-button

# Cron schedule (default: 9 AM, Monday to Friday)
CRON_SCHEDULE=0 9 * * 1-5

HEADLESS=true
```

## Configuration

### Finding CSS Selectors

To find the correct selectors for your website:

1. Open your website in Chrome/Firefox
2. Right-click on the element (username field, password field, or button)
3. Select "Inspect" or "Inspect Element"
4. In the developer tools, right-click on the highlighted HTML element
5. Select "Copy" → "Copy selector"
6. Paste this selector into your `.env` file

### Cron Schedule Format

The `CRON_SCHEDULE` uses the standard cron format:
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
- `0 9 * * 1-5` - 9:00 AM, Monday to Friday (24/5 operation)
- `0 17 * * 1-5` - 5:00 PM, Monday to Friday
- `30 8 * * *` - 8:30 AM, every day
- `0 9,17 * * 1-5` - 9 AM and 5 PM, Monday to Friday

### Timezone

By default, the timezone is set to `Asia/Singapore`. To change it, edit the timezone in `index.js`:

```javascript
const task = cron.schedule(config.cronSchedule, () => {
  // ...
}, {
  scheduled: true,
  timezone: "America/New_York" // Change this to your timezone
});
```

[List of valid timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Usage

### Start the bot:
```bash
npm start
```

The bot will:
1. Validate your configuration
2. Wait for the scheduled time
3. When triggered:
   - Open a browser
   - Navigate to your website
   - Log in with your credentials
   - Click the target button
   - Close the browser
4. Repeat based on the cron schedule

### Stop the bot:
Press `Ctrl+C` to gracefully stop the bot.

## Troubleshooting

### Bot can't find elements
- Verify your CSS selectors are correct
- Check if the website loads slowly - you may need to adjust timeout values
- Try running with `HEADLESS=false` to see what's happening

### Login fails
- Verify your credentials are correct in `.env`
- Check if the website requires additional steps (CAPTCHA, 2FA)
- Some websites may block automated logins

### Browser won't launch
- Ensure you have sufficient permissions
- Try running with `--no-sandbox` flag (already included)
- Install Chrome/Chromium if using puppeteer without bundled browser

## Security Notes

⚠️ **Important:** 
- Never commit your `.env` file to version control
- Keep your credentials secure
- Use environment variables in production
- Consider using a password manager or secrets management service

## Running 24/7

To run the bot continuously:

### Using PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start index.js --name clock-bot
pm2 save
pm2 startup
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

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable clock-bot
sudo systemctl start clock-bot
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.