# Development Guide

## Local Development Setup

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- SQLite3
- VS Code (recommended)

### Getting Started

1. **Clone and Install**
   ```bash
   git clone https://github.com/kalilynx/embededticketautomation.git
   cd embededticketautomation
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials

3. **Start Development Server**
   ```bash
   npm start
   ```
   
   Or use VS Code debugger (F5)

4. **Access the Application**
   - Main page: http://localhost:3000
   - Admin: http://localhost:3000/admin.html
   - Scanner: http://localhost:3000/checkin.html
   - Test email: http://localhost:3000/test-email

## Project Structure

```
embededticketautomation/
├── server.js              # Main Express application
├── package.json           # Dependencies and scripts
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── public/               # Static frontend files
│   ├── index.html        # Ticket purchase page
│   ├── checkin.html      # Door scanner
│   ├── admin.html        # Admin dashboard
│   ├── success.html      # Payment success
│   └── cancel.html       # Payment cancelled
├── .vscode/
│   └── launch.json       # VS Code debug config
└── tickets.db            # SQLite database (auto-created)
```

## API Endpoints

### Public Endpoints

- `GET /` - Main ticket purchase page
- `GET /current-event` - Get current event details
- `POST /create-checkout-session` - Create Stripe checkout
- `POST /webhook` - Stripe webhook handler
- `POST /checkin` - Check-in a ticket
- `GET /verify/:ticketCode` - Verify ticket via QR code

### Admin Endpoints

- `GET /admin/stats` - Get ticket statistics
- `GET /offline-tickets` - Get tickets for offline mode
- `GET /test-email` - Test email configuration

## Database Schema

### orders
- `id` - Primary key
- `email` - Customer email
- `stripe_session_id` - Stripe session ID
- `total_amount` - Total in cents
- `created_at` - Timestamp

### tickets
- `id` - Primary key
- `order_id` - Foreign key to orders
- `ticket_code` - Unique ticket code
- `event_date` - Event date (YYYY-MM-DD)
- `checked_in` - Boolean (0 or 1)

### events
- `id` - Primary key
- `name` - Event name
- `event_date` - Event date
- `ticket_price` - Price in cents
- `active` - Boolean
- `created_at` - Timestamp

## Testing

### Manual Testing Checklist

1. **Server Startup**
   ```bash
   npm start
   ```
   Should see "🚀 Server running on port 3000"

2. **Email Test**
   - Visit `/test-email`
   - Check inbox for test email
   - Verify from address and content

3. **Purchase Flow** (Stripe Test Mode)
   - Go to main page
   - Enter email and quantity
   - Should redirect to Stripe
   - Use test card: 4242 4242 4242 4242
   - Complete payment
   - Verify email received with QR codes

4. **Check-in Flow**
   - Go to `/checkin.html`
   - Enter a valid ticket code
   - Should show "Entry Allowed"
   - Try same code again
   - Should show "Already Checked In"

5. **Admin Dashboard**
   - Go to `/admin.html`
   - Should show current stats
   - Stats should update after purchases/check-ins

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC.

## Debugging

### VS Code Debugging

1. Press F5 or go to Run & Debug
2. Select "Launch Server" or "Debug Server"
3. Set breakpoints in `server.js`
4. Step through code execution

### Common Issues

**Port Already in Use**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database Locked**
- Stop all server instances
- Delete `tickets.db`
- Restart server (DB recreates automatically)

**Email Not Sending**
- Check `EMAIL_USER` and `EMAIL_PASS`
- Verify SMTP settings in server.js
- Check Render/console logs for errors

**Webhook Not Working**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook URL matches exactly
- Look for signature verification errors in logs

## Code Style

- Use ES6 modules (import/export)
- 2 spaces for indentation
- Semicolons required
- Async/await preferred over promises
- Clear error handling with try/catch
- Meaningful variable names

## Security Considerations

1. **Never commit secrets**
   - .env is in .gitignore
   - Use environment variables

2. **Validate all inputs**
   - Check email format
   - Validate quantity range
   - Sanitize ticket codes

3. **Webhook security**
   - Always verify Stripe signatures
   - Use raw body for webhook endpoint

4. **Database security**
   - Use parameterized queries (already implemented)
   - Never trust user input

## Adding New Features

### Adding a New Endpoint

```javascript
app.get("/new-endpoint", async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### Adding a New Database Table

```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field1 TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Adding New Email Template

Update the `sendTickets` function in `server.js`.

## Performance Tips

1. **Database Indexes**
   - Add indexes for frequently queried fields
   - Ticket code already has UNIQUE constraint

2. **Caching**
   - Cache event details
   - Use Redis for production

3. **Connection Pooling**
   - For PostgreSQL, use connection pool
   - Limit concurrent connections

## Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed deployment instructions.

## Getting Help

- Check existing issues on GitHub
- Review Render logs for errors
- Test each component individually
- Verify environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Happy coding! 🚀
