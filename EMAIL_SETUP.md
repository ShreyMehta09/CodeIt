# Email OTP Verification Setup Guide

## Overview

This project uses Nodemailer with Gmail to send OTP (One-Time Password) verification emails during user registration. Google OAuth users skip email verification.

## Setup Instructions

### 1. Configure Gmail App Password

Since Gmail disabled "Less secure app access", you need to create an **App Password**:

#### Step-by-step:

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "Signing in to Google", click **2-Step Verification** (enable it if not already)
4. Scroll down and click **App passwords**
5. Select app: **Mail**
6. Select device: **Other (Custom name)** → Enter "CodeIt App"
7. Click **Generate**
8. Copy the 16-character password (without spaces)

### 2. Update .env File

Add these variables to your `server/.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Example:**

```env
EMAIL_USER=codeit.noreply@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### 3. Alternative Email Providers

#### Using Outlook/Hotmail:

```javascript
// In server/config/email.js, change:
const transporter = nodemailer.createTransport({
	service: "hotmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});
```

#### Using Custom SMTP:

```javascript
const transporter = nodemailer.createTransport({
	host: "smtp.yourdomain.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});
```

## How It Works

### Registration Flow:

1. **User fills registration form** → Enters name, email, password
2. **Frontend sends OTP request** → POST `/api/otp/send` with email
3. **Backend generates 6-digit OTP** → Saves to database (expires in 10 mins)
4. **Email sent with OTP** → User receives verification code
5. **User enters OTP** → POST `/api/otp/verify` with email + OTP
6. **OTP verified** → Frontend proceeds with registration
7. **Account created** → POST `/api/auth/register` (checks verified OTP)
8. **OTP deleted** → User redirected to dashboard

### Google OAuth Flow:

- **Skips OTP verification** entirely
- Users authenticated via Google don't need email verification
- Direct registration after Google approval

## Testing

### Test the Email Functionality:

```bash
# Start the server
cd server
npm run dev

# In another terminal, test OTP send
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check response
# Should return: {"message":"OTP sent successfully to your email","email":"test@example.com"}
```

### Common Issues:

#### 1. "Invalid login" error

- ✅ Ensure 2-Step Verification is enabled
- ✅ Use App Password, not your regular Gmail password
- ✅ Remove spaces from the app password

#### 2. OTP not received

- ✅ Check spam/junk folder
- ✅ Verify EMAIL_USER is correct
- ✅ Check server logs for email errors

#### 3. "Failed to send OTP email"

- ✅ Check internet connection
- ✅ Verify Gmail allows SMTP access
- ✅ Check if you hit Gmail's sending limit (500/day)

## Database Schema

### OTP Model (`server/models/OTP.js`):

```javascript
{
  email: String,        // User's email (lowercase)
  otp: String,          // 6-digit code
  verified: Boolean,    // false until verified
  createdAt: Date       // Auto-expires after 10 minutes (TTL index)
}
```

### User Model Update:

No changes needed - Google OAuth users have `emailVerified: true` automatically.

## Security Features

1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **OTP Expiry**: Automatically deleted after 10 minutes
3. **One-time Use**: OTP deleted after successful registration
4. **Resend Limit**: 60-second cooldown between resends
5. **Email Validation**: Checks if email already exists before sending OTP

## API Endpoints

### POST `/api/otp/send`

**Request:**

```json
{
	"email": "user@example.com"
}
```

**Response:**

```json
{
	"message": "OTP sent successfully to your email",
	"email": "user@example.com"
}
```

### POST `/api/otp/verify`

**Request:**

```json
{
	"email": "user@example.com",
	"otp": "123456"
}
```

**Response:**

```json
{
	"message": "Email verified successfully",
	"verified": true
}
```

### POST `/api/otp/resend`

**Request:**

```json
{
	"email": "user@example.com"
}
```

**Response:**

```json
{
	"message": "OTP resent successfully"
}
```

## Frontend Components

### New Pages:

- `client/src/pages/Auth/VerifyEmail.js` - OTP input page with 6-digit boxes

### Updated Pages:

- `client/src/pages/Auth/Register.js` - Sends OTP before registration
- `client/src/App.js` - Added `/auth/verify-email` route

### User Experience:

1. Clean, modern OTP input (6 separate boxes)
2. Auto-focus next input on digit entry
3. Support paste (paste entire OTP at once)
4. 60-second resend timer with countdown
5. Visual feedback (success/error states)
6. Keyboard navigation (arrows, backspace)

## Production Recommendations

### 1. Use Professional Email Service:

- **SendGrid** (12,000 free emails/month)
- **Amazon SES** (62,000 free emails/month)
- **Mailgun** (5,000 free emails/month)

### 2. Implement Additional Security:

```javascript
// Add to server/routes/otp.js
const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // max 5 OTP requests per email
	keyGenerator: (req) => req.body.email,
});

router.post("/send", otpLimiter, async (req, res) => {
	// ... existing code
});
```

### 3. Add Logging:

```javascript
const winston = require("winston");

logger.info(`OTP sent to ${email}`);
logger.warn(`Failed OTP attempt for ${email}`);
```

### 4. Email Template Customization:

Edit `server/config/email.js` to customize:

- Company logo
- Brand colors
- Footer links
- Social media icons

## Monitoring

### Track OTP Metrics:

- Total OTPs sent
- Verification success rate
- Average time to verify
- Failed verification attempts

### Example Analytics:

```javascript
// In AdminDashboard, add:
const otpStats = await OTP.aggregate([
	{
		$group: {
			_id: "$verified",
			count: { $sum: 1 },
		},
	},
]);
```

## Support

For issues:

1. Check server logs: `npm run dev` (server console)
2. Check browser console: F12 → Console tab
3. Verify .env configuration
4. Test with different email providers

---

**Created by:** CodeIt Team  
**Last Updated:** November 2024  
**Version:** 1.0.0
