# Embedded Ticket Automation System

A complete, production-ready ticket sales and validation system for live music events. Features automated ticket generation, QR code validation, door scanning, and real-time analytics.

## 🎯 Features

- **Stripe Payment Integration** - Secure card payments with instant checkout
- **Automated Ticket Delivery** - Tickets emailed immediately after purchase
- **QR Code Validation** - Secure QR codes for door entry
- **Door Scanner** - Camera-based and manual ticket check-in
- **Admin Dashboard** - Real-time stats on sales and check-ins
- **Offline Mode** - Door scanner works without internet
- **Weekly Auto-Rollover** - Automatic Saturday event creation
- **Email Integration** - Works with Microsoft 365/Outlook (GoDaddy)

## 📦 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Payments**: Stripe Checkout + Webhooks
- **Email**: Nodemailer (Microsoft 365/Outlook compatible)
- **QR Codes**: qrcode + html5-qrcode libraries
- **Deployment**: Optimized for Render.com

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Stripe account (test or live mode)
- Email account (Microsoft 365/Outlook recommended)
- GoDaddy website (for embedding)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kalilynx/embededticketautomation.git
   cd embededticketautomation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   STRIPE_SECRET=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   EMAIL_USER=tickets@yourdomain.com
   EMAIL_PASS=your_email_password
   BASE_URL=http://localhost:3000
   PORT=3000
   TICKET_PRICE=4500
   CURRENCY=aud
   EVENT_NAME=Saturday Night Greek Live Music
   VENUE_NAME=Ramsgate Live
   ```

4. **Run the development server**
   ```bash
   npm start
   ```
   
   Or use VS Code debugger (F5) with the included launch configuration.

5. **Test the system**
   - Visit `http://localhost:3000` for ticket purchase page
   - Visit `http://localhost:3000/checkin.html` for door scanner
   - Visit `http://localhost:3000/admin.html` for dashboard
   - Visit `http://localhost:3000/test-email` to test email configuration

## 🔧 Configuration

### Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from Developers → API keys
3. Set up webhook endpoint:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/webhook`
   - Select event: `checkout.session.completed`
   - Copy webhook signing secret

### Email Configuration (Microsoft 365/Outlook)

For GoDaddy Business Email:

1. Use these settings:
   - Host: `smtp.office365.com`
   - Port: `587`
   - Secure: `false`

2. If using MFA, create an App Password:
   - Go to GoDaddy Admin → Email & Office
   - Open Microsoft 365 Admin
   - Security → Advanced security
   - Generate App Password
   - Use that password in `EMAIL_PASS`

## 🌐 Deployment to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add Environment Variables**
   In Render dashboard, add all variables from `.env`:
   - `STRIPE_SECRET`
   - `STRIPE_WEBHOOK_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `BASE_URL` (your Render URL)
   - `TICKET_PRICE`
   - `CURRENCY`
   - `EVENT_NAME`
   - `VENUE_NAME`

4. **Update Stripe Webhook**
   - Change webhook URL to: `https://your-app.onrender.com/webhook`

5. **Deploy**
   - Render will automatically deploy on every push to main

## 🎨 GoDaddy Embed Code

Copy this code into your GoDaddy HTML embed block:

```html
<iframe 
  src="https://your-app.onrender.com" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 20px; max-width: 420px; margin: 0 auto; display: block;">
</iframe>
```

Or use a direct link/redirect to your Render URL.

## 📱 Using the Door Scanner

### Camera Mode
1. Open `/checkin.html` on a smartphone
2. Click "QR Scanner" mode
3. Allow camera access
4. Point at customer's QR code
5. System validates automatically

### Manual Mode
1. Open `/checkin.html`
2. Type or scan ticket code
3. Press "Check Ticket"
4. See validation result

### Offline Backup
Before doors open:
1. Load `/checkin.html`
2. Page auto-downloads valid ticket codes
3. Scanner works offline
4. Syncs when internet returns

## 📊 Admin Dashboard

Access at `/admin.html`:
- Real-time ticket sales
- Check-in count
- Remaining capacity
- Auto-refreshes every 30 seconds

## 🔐 Security

- Stripe handles all card data (PCI compliant)
- Webhook signature verification
- Unique ticket codes (crypto-secure)
- QR codes link to validation endpoint
- No sensitive data in QR codes
- Email sent via TLS

## 🛠️ Development

### VS Code Debug Configuration

Press `F5` to start debugging with the included launch configuration:
- **Launch Server**: Run with automatic restart
- **Debug Server**: Full debugging with breakpoints
- **Attach to Process**: Attach to running Node process

### Project Structure

```
embededticketautomation/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env.example           # Environment template
├── public/                # Frontend files
│   ├── index.html         # Ticket purchase page
│   ├── checkin.html       # Door scanner
│   ├── admin.html         # Dashboard
│   ├── success.html       # Payment success
│   └── cancel.html        # Payment cancelled
├── .vscode/
│   └── launch.json        # VS Code debug config
└── tickets.db             # SQLite database (auto-created)
```

## 🔄 Weekly Rollover (Optional)

To automatically create next Saturday's event:

1. Create `rollover.js`:
   ```javascript
   import sqlite3 from "sqlite3";
   
   const db = new sqlite3.Database("./tickets.db");
   
   function nextSaturday() {
     const d = new Date();
     const day = d.getDay();
     d.setDate(d.getDate() + (6 - day) + 7);
     return d.toISOString().split("T")[0];
   }
   
   db.run(
     `INSERT INTO events (name, event_date, ticket_price)
      VALUES (?, ?, ?)`,
     [process.env.EVENT_NAME, nextSaturday(), process.env.TICKET_PRICE],
     () => console.log("✅ New Saturday event created")
   );
   ```

2. Add cron job on Render or use a scheduler service

## 🆙 Upgrading to PostgreSQL

For production, upgrade from SQLite to PostgreSQL:

1. Add PostgreSQL database on Render
2. Install pg: `npm install pg`
3. Update database connection in `server.js`
4. Database schema remains the same

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions, please open an issue on GitHub.

---

**Built for live music venues, by people who understand Saturday nights.**
