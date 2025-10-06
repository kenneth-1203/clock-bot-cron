# Google Compute Engine (GCE) Deployment Guide

This guide explains how to deploy the clock-bot-cron application on Google Cloud's free tier e2-micro instance.

## Prerequisites

- Google Cloud account
- `gcloud` CLI installed ([Installation guide](https://cloud.google.com/sdk/docs/install))
- Git installed on your local machine

## Step 1: Set Up GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing one)
gcloud projects create clock-bot-project --name="Clock Bot"

# Set the project as default
gcloud config set project clock-bot-project

# Enable billing (required even for free tier)
# Go to: https://console.cloud.google.com/billing

# Enable Compute Engine API
gcloud services enable compute.googleapis.com
```

## Step 2: Create Free Tier VM Instance

```bash
# Create e2-micro instance in a free tier eligible region
gcloud compute instances create clock-bot-vm \
  --zone=us-west1-b \
  --machine-type=e2-micro \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=clock-bot
```

**Free tier eligible regions:** us-west1, us-central1, us-east1

## Step 3: SSH into the VM

```bash
gcloud compute ssh clock-bot-vm --zone=us-west1-b
```

## Step 4: Install Dependencies on VM

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Git
sudo apt-get install -y git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (optional, for containerized deployment)
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

## Step 5: Deploy the Application

### Option A: Direct Node.js Deployment

```bash
# Clone your repository
git clone <your-repo-url> ~/clock-bot-cron
cd ~/clock-bot-cron

# Install dependencies
npm install

# Create .env file
nano .env
```

Paste your environment variables:
```env
WEBSITE_URL=https://your-website.com
USERNAME=your_username
PASSWORD=your_password
LOGIN_USERNAME_SELECTOR=#username
LOGIN_PASSWORD_SELECTOR=#password
LOGIN_BUTTON_SELECTOR=#login-button
CLOCK_IN_BUTTON_SELECTOR=#clock-in
CLOCK_OUT_BUTTON_SELECTOR=#clock-out
CLOCK_IN_SCHEDULE=0 9 * * 1-5
CLOCK_OUT_SCHEDULE=0 18 * * 1-5
HEADLESS=true
```

Save and exit (Ctrl+X, Y, Enter).

```bash
# Test the application
npm start
```

### Option B: Docker Deployment

```bash
# Clone your repository
git clone <your-repo-url> ~/clock-bot-cron
cd ~/clock-bot-cron

# Create .env file (same as above)
nano .env

# Build Docker image
docker build -t clock-bot .

# Run container
docker run -d \
  --name clock-bot \
  --restart unless-stopped \
  --env-file .env \
  clock-bot

# View logs
docker logs -f clock-bot
```

## Step 6: Set Up as System Service (Node.js Deployment)

Create a systemd service for auto-restart and boot startup:

```bash
sudo nano /etc/systemd/system/clock-bot.service
```

Paste this configuration:
```ini
[Unit]
Description=Clock Bot Cron Service
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/home/<your-username>/clock-bot-cron
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Replace `<your-username>` with your VM username (check with `whoami`).

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable clock-bot
sudo systemctl start clock-bot

# Check status
sudo systemctl status clock-bot

# View logs
sudo journalctl -u clock-bot -f
```

## Step 7: Verify It's Running

```bash
# Check system service status
sudo systemctl status clock-bot

# Or for Docker
docker ps
docker logs -f clock-bot
```

## Maintenance Commands

### Update the application
```bash
cd ~/clock-bot-cron
git pull origin main
npm install
sudo systemctl restart clock-bot

# Or for Docker
docker stop clock-bot
docker rm clock-bot
docker build -t clock-bot .
docker run -d --name clock-bot --restart unless-stopped --env-file .env clock-bot
```

### View logs
```bash
# System service
sudo journalctl -u clock-bot -f

# Docker
docker logs -f clock-bot
```

### Stop the bot
```bash
# System service
sudo systemctl stop clock-bot

# Docker
docker stop clock-bot
```

## Cost Management

The e2-micro instance is **always free** in eligible regions with:
- 1 GB RAM
- 30 GB standard persistent disk
- 1 GB network egress per month (to most regions)

**Important:** Monitor your usage in the [GCP Console](https://console.cloud.google.com) to ensure you stay within free tier limits.

## Security Best Practices

1. **Firewall:** The default firewall blocks all incoming traffic except SSH - keep it this way
2. **SSH Keys:** Use SSH keys instead of passwords
3. **Environment Variables:** Never commit `.env` to version control
4. **Updates:** Regularly update the VM: `sudo apt-get update && sudo apt-get upgrade -y`

## Troubleshooting

### Puppeteer fails to launch
```bash
# Install additional dependencies
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1
```

### Out of memory errors
```bash
# Add swap space
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Check VM memory usage
```bash
free -h
htop  # Install with: sudo apt-get install htop
```

## Cleanup (Delete Everything)

```bash
# Delete the VM instance
gcloud compute instances delete clock-bot-vm --zone=us-west1-b

# Delete the project (optional)
gcloud projects delete clock-bot-project
```
