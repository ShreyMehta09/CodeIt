# Quick Start - Email OTP Verification

## 🚀 Get Started in 3 Minutes

### Step 1: Get Gmail App Password (2 minutes)

1. Open https://myaccount.google.com/security
2. Click **2-Step Verification** → Enable it
3. Scroll down → Click **App passwords**
4. Select **Mail** → **Other (Custom name)** → Type "CodeIt"
5. Click **Generate**
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Email (30 seconds)

Create or edit `server/.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=paste-the-16-char-password-here
```

**Example:**

```env
EMAIL_USER=codeit.noreply@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 3: Test It! (30 seconds)

```bash
# Start server (if not running)
cd server
npm run dev

# Start client (in new terminal)
cd client
npm start
```

**Visit:** http://localhost:3000/auth/register

1. Fill registration form
2. Click "Create Account"
3. **Check your email** for 6-digit OTP
4. Enter the code
5. ✅ Account created!

---

## 🎯 Important Notes

### ✅ Google OAuth Users

- **NO email verification needed**
- They can register instantly via Google
- Skip OTP process entirely

### ✅ Email/Password Users

- **MUST verify email** with OTP
- OTP expires in 10 minutes
- Can resend after 60 seconds

---

## 🔧 Troubleshooting

### Email not received?

1. ✅ Check **spam/junk folder**
2. ✅ Wait 1-2 minutes (Gmail can be slow)
3. ✅ Click "Resend Code" after timer ends

### "Invalid login" error?

1. ✅ Use **App Password**, NOT your Gmail password
2. ✅ Remove spaces from the app password
3. ✅ Enable 2-Step Verification first

### Server error?

1. ✅ Check `server/.env` file exists
2. ✅ Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set
3. ✅ Check server console for error messages

---

## 📧 Test Email Endpoint

Quick test without frontend:

```bash
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

**Expected:** OTP sent to your email! ✅

---

## 📚 Need More Help?

- **Full setup guide:** [EMAIL_SETUP.md](./EMAIL_SETUP.md)
- **Implementation details:** [OTP_IMPLEMENTATION.md](./OTP_IMPLEMENTATION.md)
- **Project README:** [README.md](./README.md)

---

**That's it!** You're ready to go! 🎉
