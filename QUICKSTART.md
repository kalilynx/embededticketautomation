# Quick Start Guide

Get your ticket automation system running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- A code editor (VS Code recommended)

## Installation

### 1. Clone and Install (2 minutes)
```bash
# Clone the repository
git clone https://github.com/kalilynx/embededticketautomation.git
cd embededticketautomation

# Install dependencies
npm install
```

### 2. Basic Configuration (1 minute)
```bash
# Create environment file
cp .env.example .env
```

The system will run with default settings. For testing, you can use the placeholder values.

### 3. Run the Application (1 minute)

#### Option A: Using npm
```bash
npm start
```

#### Option B: Using VS Code Debugger (Recommended)
1. Open the project in VS Code
2. Press `F5` (or go to Run → Start Debugging)
3. Select "Launch Server" from the dropdown
4. Server starts with debugging enabled

### 4. Access the Application
Open your browser and visit:

- **Main Ticket Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin.html
- **Door Scanner**: http://localhost:3000/checkin.html

## What You'll See

### Main Ticket Page
A beautiful ticket purchase interface with:
- Event information
- Email input
- Ticket quantity selector
- "Buy Tickets" button

### Admin Dashboard
Real-time statistics showing:
- Tickets sold: 0
- Checked in: 0
- Remaining: 0

### Door Scanner
Two modes available:
- Manual entry (type ticket codes)
- QR Scanner (use camera)

## Testing the System

### Test Without Stripe (Quick)
1. Go to http://localhost:3000/admin.html
2. Verify the page loads with stats
3. Go to http://localhost:3000/checkin.html
4. Try entering a fake ticket code
5. Should see "Invalid Ticket" message

### Test Email Configuration
Visit: http://localhost:3000/test-email

This will attempt to send a test email. If it fails, you'll need to configure your email settings in `.env`.

## Next Steps

### For Testing Only
You can use the system as-is for local testing and development.

### For Production Use
You'll need to configure:

1. **Stripe Account** (for payments)
   - Sign up at stripe.com
   - Get API keys
   - Add to `.env`

2. **Email Account** (for ticket delivery)
   - Use Microsoft 365/Outlook (recommended)
   - Add credentials to `.env`

3. **Deploy to Render** (for hosting)
   - Follow [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

## Common Issues

### "Port 3000 already in use"
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change the port in .env
PORT=3001
```

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Server won't start
Check that:
- Node.js 18+ is installed: `node --version`
- All dependencies installed: `npm install`
- Port 3000 is available

## Development Mode

For development with auto-restart:
```bash
npm run dev
```

Changes to `server.js` will automatically restart the server.

## Debugging in VS Code

1. Set breakpoints by clicking left of line numbers
2. Press F5 to start debugging
3. Server pauses at breakpoints
4. Use Debug Console to inspect variables

## File Structure

```
embededticketautomation/
├── server.js           # Main application
├── package.json        # Dependencies
├── .env               # Your configuration
├── public/            # Frontend files
│   ├── index.html     # Ticket purchase
│   ├── admin.html     # Dashboard
│   └── checkin.html   # Scanner
└── tickets.db         # Database (auto-created)
```

## Help & Documentation

- **Full Setup**: [README.md](./README.md)
- **Deployment**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **Development**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Security**: [SECURITY.md](./SECURITY.md)

## Support

Having issues? Check:
1. Server logs in terminal
2. Browser console (F12)
3. Database file exists: `ls tickets.db`
4. Environment variables: `cat .env`

---

**You're ready to go! Press F5 to start debugging.** 🚀
