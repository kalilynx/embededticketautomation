# Embedded Ticket Automation - Render Deployment Guide

This guide walks you through deploying the ticket automation system to Render.com.

## Prerequisites

- GitHub account with this repository
- Render.com account (free tier works)
- Stripe account (test or live mode)
- Microsoft 365 / Outlook email account

## Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to GitHub
2. Make sure `.env` is in `.gitignore` (already configured)
3. Verify `package.json` has correct start script

## Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select this repository: `kalilynx/embededticketautomation`
5. Configure the service:
   - **Name**: `ticket-automation` (or your preferred name)
   - **Region**: Choose closest to your location
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid plan for production)

## Step 3: Configure Environment Variables

In Render dashboard → Environment tab, add these variables:

### Required Variables

```
STRIPE_SECRET=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
EMAIL_USER=tickets@yourdomain.com
EMAIL_PASS=YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD
BASE_URL=https://your-app-name.onrender.com
PORT=3000
```

### Optional Variables (with defaults)

```
TICKET_PRICE=4500
CURRENCY=aud
EVENT_NAME=Saturday Night Greek Live Music
VENUE_NAME=Ramsgate Live
```

### Getting the Values

**STRIPE_SECRET**: 
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Navigate to Developers → API Keys
- Copy the Secret Key (starts with `sk_live_` or `sk_test_`)

**STRIPE_WEBHOOK_SECRET**: 
- You'll set this up after deployment (see Step 5)

**EMAIL_USER & EMAIL_PASS**:
- Use your Microsoft 365/Outlook email
- For GoDaddy email, you may need to create an App Password:
  - Go to Microsoft 365 Admin → Security
  - Enable MFA (required)
  - Generate App Password
  - Use that instead of your regular password

**BASE_URL**:
- After deployment, Render gives you a URL like `https://your-app-name.onrender.com`
- Update this variable with your actual URL

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start your server with `npm start`
3. Wait for deployment to complete (usually 2-5 minutes)
4. Check the logs for "🚀 Server running on port 3000"

## Step 5: Configure Stripe Webhook

Now that your app is deployed, set up the Stripe webhook:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → Webhooks
3. Click **Add endpoint**
4. Configure:
   - **Endpoint URL**: `https://your-app-name.onrender.com/webhook`
   - **Events to send**: Select `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Go back to Render → Environment
8. Update `STRIPE_WEBHOOK_SECRET` with the signing secret
9. Click **Save Changes** (this will redeploy)

## Step 6: Test the Deployment

### Test Main Page
Visit: `https://your-app-name.onrender.com`
- Should show the ticket purchase page

### Test Admin Dashboard
Visit: `https://your-app-name.onrender.com/admin.html`
- Should show stats (all zeros initially)

### Test Check-in Scanner
Visit: `https://your-app-name.onrender.com/checkin.html`
- Should show the scanner interface

### Test Email (Important!)
Visit: `https://your-app-name.onrender.com/test-email`
- Should send a test email
- Check your inbox (and spam folder)
- If it fails, check email credentials

### Test Payment Flow
1. Go to main page
2. Enter email and quantity
3. Click "Buy Tickets"
4. Should redirect to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Check if tickets arrive via email

## Step 7: Embed on Your GoDaddy Site

Once everything is working, embed on your website:

### Option 1: iFrame Embed
```html
<iframe 
  src="https://your-app-name.onrender.com" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 20px; max-width: 420px; margin: 0 auto; display: block;">
</iframe>
```

### Option 2: Direct Link
Simply link to: `https://your-app-name.onrender.com`

## Troubleshooting

### Emails Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Check Render logs for email errors
- Try the `/test-email` endpoint
- For Microsoft 365, ensure App Password is used (not regular password)

### Webhooks Not Working
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook URL is exactly: `https://your-app-name.onrender.com/webhook`
- Check Render logs during a test payment
- Verify webhook event is `checkout.session.completed`

### Database Issues (SQLite)
- SQLite works fine for testing
- For production, consider upgrading to PostgreSQL:
  1. Add PostgreSQL database on Render
  2. Update connection in `server.js`
  3. Note: Render's filesystem resets on deploy, so SQLite data is lost

### App Sleeps After 15 Minutes (Free Plan)
- Free Render plans sleep after inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid plan for always-on service

## Updating Your App

To update after making changes:

1. Commit changes locally:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. Render auto-deploys on every push to main branch

## Security Best Practices

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Use Stripe test keys** during development
3. **Switch to live keys** only when ready for production
4. **Rotate webhook secrets** periodically
5. **Monitor Stripe dashboard** for unusual activity
6. **Keep dependencies updated** (`npm audit`)

## Going Live Checklist

- [ ] Switch Stripe from test to live mode
- [ ] Update `STRIPE_SECRET` to live key
- [ ] Update `STRIPE_WEBHOOK_SECRET` to live webhook
- [ ] Verify email sends to multiple providers (Gmail, Yahoo, etc.)
- [ ] Test full purchase flow with real card
- [ ] Test door scanner on mobile device
- [ ] Set up custom domain (optional, Render supports this)
- [ ] Consider upgrading to PostgreSQL
- [ ] Consider paid Render plan for better performance

## Support

For issues:
1. Check Render logs (Dashboard → Logs tab)
2. Check Stripe webhook logs
3. Test each endpoint individually
4. Review this guide step by step

## Next Steps

Once deployed and tested:
- Share the ticket page URL with customers
- Set up the door scanner on a tablet/phone
- Monitor sales via `/admin.html`
- Check-in guests via `/checkin.html`

---

**You're ready to sell tickets!** 🎉
