# SMS Provider Setup Guide

## Quick Start: Enable Real SMS for OTP

### Step 1: Choose an SMS Provider (India)

**Option A: MSG91 (Recommended for India)**
- Website: https://msg91.com
- Free credits available
- Supports DLT templates (required for India)

**Option B: Twilio**
- Website: https://www.twilio.com
- International support
- Higher cost

**Option C: AWS SNS**
- Website: https://aws.amazon.com/sns
- Reliable, enterprise-grade

---

## Setup with MSG91 (Recommended)

### Step 1: Create MSG91 Account
1. Go to https://msg91.com/signup
2. Sign up with your business details
3. Verify email & mobile
4. Get free test credits

### Step 2: Get Your API Key
1. Login to MSG91 Dashboard
2. Go to **Settings → API Keys**
3. Copy your **Authkey** (this is your API key)

### Step 3: Register DLT Template (Required for India)
1. Go to **Templates → Add Template**
2. Add this template:
   ```
   Your Vadhiyar Agrotech verification code is {{CODE}}. It expires in {{MINUTES}} minutes.
   ```
3. Wait for approval (usually 2-4 hours)
4. Copy the **Template ID** once approved

### Step 4: Update .env File
Edit `backend/.env` and add:

```env
# SMS Configuration (MSG91)
SMS_PROVIDER=msg91
SMS_MSG91_AUTHKEY=YOUR_AUTHKEY_HERE
SMS_MSG91_TEMPLATE_ID=YOUR_TEMPLATE_ID_HERE
SMS_SENDER_ID=VADHYR
SMS_OTP_EXPIRE_MINUTES=2
```

### Step 5: Test OTP
1. Restart backend: `npm run dev`
2. Open frontend at http://localhost:5173
3. Try registration and send OTP
4. Check your phone for SMS
5. Enter OTP to verify

---

## Alternative: Use Console Logging (Dev Mode)

If you want to test without a real SMS provider:

```env
# Dev mode - OTP codes will print to backend console
SMS_PROVIDER=console
```

Then check backend terminal when you send OTP - the 6-digit code will appear there.

---

## Troubleshooting

**OTP not received?**
- ✅ Check backend logs for error messages
- ✅ Verify API key is correct
- ✅ Check DLT template is approved
- ✅ Verify phone number format (should be 10 digits for India)
- ✅ Check MSG91 credit balance

**Backend restart needed:**
```bash
cd backend
npm run dev
```

**Check OTP logs:**
- Error logs appear in backend console
- All requests saved to database

---

## Example .env (Complete)

```env
PORT=4000
JWT_SECRET=your-secret-key-change-this
DATABASE_URL=file:./dev.db

# SMS Configuration
SMS_PROVIDER=msg91
SMS_MSG91_AUTHKEY=YOUR_AUTHKEY_HERE
SMS_MSG91_TEMPLATE_ID=YOUR_TEMPLATE_ID_HERE
SMS_SENDER_ID=VADHYR
SMS_OTP_EXPIRE_MINUTES=2
```

---

**Need help?** Check backend console for detailed error messages.
