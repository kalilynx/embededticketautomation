import express from "express";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import sqlite3 from "sqlite3";
import QRCode from "qrcode";
import crypto from "crypto";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET || "");

// Database setup
const db = new sqlite3.Database("./tickets.db");

// Initialize database tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      stripe_session_id TEXT,
      total_amount INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      ticket_code TEXT UNIQUE,
      event_date TEXT,
      checked_in INTEGER DEFAULT 0,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      event_date TEXT,
      ticket_price INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: "SSLv3"
  }
});

// Middleware - webhook must come first with raw body parser
app.use("/webhook", bodyParser.raw({ type: "application/json" }));
app.use(bodyParser.json());
app.use(express.static("public"));

// CORS middleware for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Helper function to generate ticket code
function generateTicketCode() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

// Helper function to get next Saturday
function nextSaturday() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day) + (day === 6 ? 7 : 0));
  return d.toISOString().split("T")[0];
}

// Helper function to get current Saturday
function currentSaturday() {
  const today = new Date();
  const day = today.getDay();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (6 - day));
  return saturday.toISOString().split("T")[0];
}

// Generate QR code
async function generateQR(ticketCode) {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return await QRCode.toDataURL(`${baseUrl}/verify/${ticketCode}`);
}

// Send tickets via email
async function sendTickets(email, tickets) {
  let ticketBlocks = "";

  for (const t of tickets) {
    const qr = await generateQR(t.ticket_code);

    ticketBlocks += `
      <div style="margin-bottom:30px; padding: 20px; border: 2px solid #0A1A33; border-radius: 10px;">
        <h3 style="color: #0A1A33;">🎟️ Ticket Code: ${t.ticket_code}</h3>
        <p style="color: #666;">Event Date: ${t.event_date}</p>
        <img src="${qr}" width="200" height="200" alt="QR Code" style="margin: 10px 0;"/>
        <p style="font-size: 12px; color: #999;">Present this QR code at the door for entry</p>
      </div>
    `;
  }

  const eventName = process.env.EVENT_NAME || "Saturday Night Greek Live Music";
  const venueName = process.env.VENUE_NAME || "Ramsgate Live";

  try {
    await transporter.sendMail({
      from: `"${venueName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your ${eventName} Tickets 🎶`,
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0A1A33;">🎶 ${eventName}</h2>
          <p style="font-size: 16px;">Thank you for your purchase!</p>
          <p style="font-size: 14px; color: #666;">Doors open at 7:00 PM at ${venueName}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          ${ticketBlocks}
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            Save this email or take a screenshot. You'll need to show the QR code at the door.
          </p>
        </div>
      `
    });
    console.log("✅ Tickets sent to:", email);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
}

// Fulfill order after successful payment
async function fulfillOrder(session) {
  const ticketPrice = parseInt(process.env.TICKET_PRICE) || 4500;
  const quantity = Math.floor(session.amount_total / ticketPrice);
  const eventDate = currentSaturday();

  db.run(
    `INSERT INTO orders (email, stripe_session_id, total_amount)
     VALUES (?, ?, ?)`,
    [session.customer_email, session.id, session.amount_total],
    function (err) {
      if (err) {
        console.error("❌ Database error:", err);
        return;
      }

      const orderId = this.lastID;
      let tickets = [];

      for (let i = 0; i < quantity; i++) {
        const code = generateTicketCode();
        tickets.push({
          ticket_code: code,
          event_date: eventDate
        });

        db.run(
          `INSERT INTO tickets (order_id, ticket_code, event_date) VALUES (?, ?, ?)`,
          [orderId, code, eventDate],
          (err) => {
            if (err) console.error("❌ Ticket insert error:", err);
          }
        );
      }

      // Send tickets after a short delay to ensure DB writes complete
      setTimeout(() => {
        sendTickets(session.customer_email, tickets);
      }, 500);
    }
  );
}

// Routes

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Embedded Ticket Automation API",
    version: "1.0.0"
  });
});

// Get current event
app.get("/current-event", (req, res) => {
  const eventName = process.env.EVENT_NAME || "Saturday Night Greek Live Music";
  const eventDate = currentSaturday();
  
  res.json({
    name: eventName,
    event_date: eventDate,
    venue: process.env.VENUE_NAME || "Ramsgate Live",
    price: parseInt(process.env.TICKET_PRICE) || 4500
  });
});

// Create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { quantity, email } = req.body;

    if (!email || !quantity) {
      return res.status(400).json({ error: "Email and quantity required" });
    }

    const ticketPrice = parseInt(process.env.TICKET_PRICE) || 4500;
    const currency = process.env.CURRENCY || "aud";
    const eventName = process.env.EVENT_NAME || "Saturday Night Greek Live Music";
    const eventDate = currentSaturday();
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: `${eventName} – ${eventDate}`
          },
          unit_amount: ticketPrice,
        },
        quantity: parseInt(quantity)
      }],
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/cancel.html`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Payment successful for:", session.customer_email);
    fulfillOrder(session);
  }

  res.json({ received: true });
});

// Check-in endpoint
app.post("/checkin", (req, res) => {
  const { ticketCode, eventDate } = req.body;

  if (!ticketCode) {
    return res.json({ status: "invalid", message: "Ticket code required" });
  }

  db.get(
    `SELECT * FROM tickets WHERE ticket_code = ? AND event_date = ?`,
    [ticketCode.toUpperCase(), eventDate],
    (err, ticket) => {
      if (err) {
        console.error("❌ Check-in error:", err);
        return res.status(500).json({ status: "error", message: "Database error" });
      }

      if (!ticket) {
        return res.json({ status: "invalid", message: "Invalid ticket" });
      }

      if (ticket.checked_in) {
        return res.json({ status: "used", message: "Already checked in" });
      }

      db.run(
        `UPDATE tickets SET checked_in = 1 WHERE id = ?`,
        [ticket.id],
        (err) => {
          if (err) {
            console.error("❌ Check-in update error:", err);
            return res.status(500).json({ status: "error" });
          }

          res.json({ status: "valid", message: "Entry allowed" });
        }
      );
    }
  );
});

// Verify ticket (for QR code scanning)
app.get("/verify/:ticketCode", (req, res) => {
  const { ticketCode } = req.params;
  const eventDate = currentSaturday();

  db.get(
    `SELECT * FROM tickets WHERE ticket_code = ? AND event_date = ?`,
    [ticketCode.toUpperCase(), eventDate],
    (err, ticket) => {
      if (err || !ticket) {
        return res.send(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: red;">❌ Invalid Ticket</h1>
              <p>This ticket code is not valid.</p>
            </body>
          </html>
        `);
      }

      if (ticket.checked_in) {
        return res.send(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: orange;">⚠️ Already Used</h1>
              <p>This ticket has already been checked in.</p>
            </body>
          </html>
        `);
      }

      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">✅ Valid Ticket</h1>
            <p>Ticket Code: ${ticketCode}</p>
            <p>Event Date: ${ticket.event_date}</p>
          </body>
        </html>
      `);
    }
  );
});

// Offline tickets sync
app.get("/offline-tickets", (req, res) => {
  const date = req.query.date || currentSaturday();

  db.all(
    `SELECT ticket_code FROM tickets WHERE event_date = ?`,
    [date],
    (err, rows) => {
      if (err) {
        console.error("❌ Offline tickets error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// Admin stats
app.get("/admin/stats", (req, res) => {
  const date = req.query.date || currentSaturday();

  db.get(`
    SELECT
      COUNT(*) AS sold,
      SUM(checked_in) AS scanned,
      COUNT(*) - SUM(checked_in) AS remaining
    FROM tickets
    WHERE event_date = ?
  `, [date], (err, row) => {
    if (err) {
      console.error("❌ Stats error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(row || { sold: 0, scanned: 0, remaining: 0 });
  });
});

// Test email endpoint
app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.VENUE_NAME || 'Test Venue'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email ✅",
      text: "If you got this, email configuration is working correctly."
    });

    res.send("✅ Test email sent successfully! Check your inbox.");
  } catch (err) {
    console.error("❌ Test email error:", err);
    res.status(500).send(`❌ Email error: ${err.message}`);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Database connection closed.");
    process.exit(0);
  });
});
