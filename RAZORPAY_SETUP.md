# Razorpay Integration Guide

This guide explains how to integrate your Razorpay account with the CodeIt course payment system.

## Overview

The course system uses Razorpay for secure payment processing when users enroll in courses. The integration includes:

- Order creation on the backend
- Razorpay Checkout UI for payment collection
- Payment verification using HMAC signature
- Automatic enrollment after successful payment

## Required Razorpay Credentials

You need **2 credentials** from your Razorpay account:

### 1. Razorpay Key ID (Public Key)

- **Where to use**: Both backend (.env) and frontend (.env)
- **Visibility**: Safe to expose in frontend JavaScript
- **Purpose**: Identifies your Razorpay account and initializes checkout

### 2. Razorpay Key Secret (Private Key)

- **Where to use**: Backend (.env) ONLY
- **Visibility**: NEVER expose this in frontend or client code
- **Purpose**: Used to verify payment signatures on the server

---

## Step 1: Get Your Razorpay API Keys

### For Test Mode (Development)

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch to **Test Mode** (toggle in top-right corner)
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key** if you don't have one
5. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this secure!)

### For Live Mode (Production)

1. Complete Razorpay KYC verification
2. Switch to **Live Mode** in dashboard
3. Go to **Settings** → **API Keys**
4. Click **Generate Live Key**
5. Copy both:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret** (keep this secure!)

---

## Step 2: Configure Backend (Server)

1. Navigate to `server/` directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your Razorpay credentials:
   ```env
   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
   ```

**Important**:

- Use `rzp_test_` keys for testing
- Use `rzp_live_` keys for production
- Never commit `.env` file to version control (it's already in .gitignore)

---

## Step 3: Configure Frontend (Client)

1. Navigate to `client/` directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your Razorpay Key ID:
   ```env
   # Razorpay Configuration
   REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   ```

**Important**:

- Only add the **Key ID** here, NEVER the Key Secret
- Must be prefixed with `REACT_APP_` for Create React App
- Restart the development server after changing .env

---

## Step 4: Restart Development Servers

After configuring both .env files:

### Backend

```bash
cd server
npm start
```

### Frontend

```bash
cd client
npm start
```

---

## Step 5: Test the Payment Flow

### Test Mode Payment (Development)

1. Create a course as admin at `/admin/courses`
2. Log in as a regular user
3. Browse to `/courses` and select a course
4. Click "Enroll Now" button
5. Razorpay Checkout will open
6. Use test credentials:
   - **Card Number**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits (e.g., `123`)
   - **Expiry**: Any future date (e.g., `12/25`)
   - **Name**: Any name
7. Complete payment
8. You should be redirected to the course player

### Test Cards for Different Scenarios

**Successful Payment**:

- Card: `4111 1111 1111 1111`

**Payment Failure**:

- Card: `4111 1111 1111 1234`

**Authentication Required**:

- Card: `5104 0600 0000 0008`

More test cards: https://razorpay.com/docs/payments/payments/test-card-details/

---

## Step 6: Enable Webhooks (Optional but Recommended)

Webhooks notify your server about payment events automatically.

### Configure Webhook

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter webhook URL: `https://yourdomain.com/api/courses/webhook`
   - For local testing: Use [ngrok](https://ngrok.com/) to create a public URL
4. Select events to listen for:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
5. Copy the **Webhook Secret**
6. Add to `server/.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   ```

### Webhook Handler (Already Implemented)

The webhook endpoint is at `POST /api/courses/webhook` and handles:

- Payment confirmation
- Payment failures
- Automatic enrollment updates

---

## Configuration Summary

### Backend `.env` (server/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/CodeIt
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:3000

# Razorpay - Required
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# Razorpay - Optional (for webhooks)
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### Frontend `.env` (client/.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

---

## Payment Flow Diagram

```
1. User clicks "Enroll Now"
   ↓
2. Frontend calls POST /api/courses/:id/enroll
   ↓
3. Backend creates Razorpay Order
   ↓
4. Backend returns order details (orderId, amount, currency)
   ↓
5. Frontend loads Razorpay Checkout
   ↓
6. User completes payment
   ↓
7. Razorpay returns payment details to frontend
   ↓
8. Frontend calls POST /api/courses/:id/verify-payment
   ↓
9. Backend verifies payment signature using HMAC SHA256
   ↓
10. Backend creates Enrollment record
   ↓
11. User redirected to course player
```

---

## Security Features Implemented

✅ **Payment Signature Verification**: Every payment is verified using HMAC SHA256 signature
✅ **Server-side Order Creation**: Orders are created on the backend to prevent tampering
✅ **Enrollment Validation**: Users can only enroll once per course
✅ **Protected Routes**: Course content is only accessible to enrolled users
✅ **Secure Key Storage**: Key Secret never exposed to frontend

---

## Troubleshooting

### Payment not completing

- Check browser console for JavaScript errors
- Verify `REACT_APP_RAZORPAY_KEY_ID` is set correctly in `client/.env`
- Ensure frontend server was restarted after .env changes
- Check network tab for failed API calls

### "Payment verification failed" error

- Verify `RAZORPAY_KEY_SECRET` is correct in `server/.env`
- Check server logs for signature mismatch errors
- Ensure the same keys are used for order creation and verification

### Razorpay Checkout not loading

- Check if Razorpay is blocked by ad blockers
- Verify internet connection (Checkout loads from Razorpay CDN)
- Check browser console for script loading errors

### Test mode vs Live mode mismatch

- Ensure all keys are from the same mode (test or live)
- Don't mix `rzp_test_` and `rzp_live_` keys

---

## Going Live Checklist

Before switching to production:

- [ ] Complete Razorpay KYC verification
- [ ] Generate Live API keys
- [ ] Update `server/.env` with `rzp_live_` keys
- [ ] Update `client/.env` with `rzp_live_` Key ID
- [ ] Configure webhook with production URL
- [ ] Test with small amount first
- [ ] Set up proper error logging
- [ ] Enable Razorpay payment notifications
- [ ] Review Razorpay settlement schedule
- [ ] Configure GST settings (if applicable)

---

## Support Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhooks Guide**: https://razorpay.com/docs/webhooks/
- **API Reference**: https://razorpay.com/docs/api/

---

## Need Help?

If you encounter issues:

1. Check Razorpay Dashboard → **Events** for payment logs
2. Review server logs for error messages
3. Verify all environment variables are set correctly
4. Test with different browsers/devices
5. Contact Razorpay support for payment gateway issues
