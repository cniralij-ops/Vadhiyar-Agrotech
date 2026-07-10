# 🚨 URGENT: Fix OTP Not Received Issue

## Problem
Frontend shows "OTP sent" but phone doesn't receive SMS.

## Root Cause
**SMS provider is not configured.** The backend needs credentials for an SMS service.

---

## ✅ Quick Setup (Choose ONE Provider)

### Option 1: MSG91 (RECOMMENDED for India) ⭐

**Step 1: Create Account**
- Go to https://msg91.com/signup
- Register with business details
- Get free credits

**Step 2: Get API Key**
1. Login → Dashboard
2. Go to **Settings → API Keys**
3. Copy your **Authkey**

**Step 3: Register OTP Template** (REQUIRED for India)
1. Go to **Templates → Add Template**
2. Add message:
   ```
   Your Vadhiyar Agrotech verification code is {{CODE}}. It expires in {{MINUTES}} minutes.
   ```
3. Wait for approval (2-4 hours usually)
4. Copy **Template ID** once approved

**Step 4: Update `.env` file**
Edit `backend/.env`:
```env
SMS_PROVIDER=msg91
MSG91_API_KEY=your_authkey_from_msg91
MSG91_SENDER_ID=VADHYR
MSG91_ROUTE=4
```

---

### Option 2: Twilio (For Testing/Global)

**Step 1: Sign Up**
- Go to https://www.twilio.com/console
- Create account
- Get test numbers

**Step 2: Get Credentials**
- Copy: Account SID, Auth Token, Phone Number

**Step 3: Update `.env`**
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🔧 After Setting Up

**Restart Backend:**
```bash
cd backend
npm run dev
```

Backend should start without errors. You should see log like:
```
Backend listening on http://localhost:4000
```

---

## 📱 Test OTP

1. Open frontend: http://localhost:5173
2. Go to Register
3. Enter name & phone number
4. Click "Send OTP"
5. **Check your phone for SMS**

**Expected SMS:**
```
Your Vadhiyar Agrotech verification code is 123456. It expires in 2 minutes.
```

---

## 🐛 Troubleshooting

### "OTP sent" but SMS not received?

**Check backend logs:**
```bash
# In backend terminal, look for lines like:
✅ [MSG91 OTP] Sent to 9429480002
```

**If you see error:**
```
❌ [SMS Error] MSG91 credentials not configured
```
→ API Key not set in `.env`

**If MSG91 API error:**
- Check API key is copied correctly (no extra spaces)
- Check MSG91 account has credit balance
- Check template is approved

**If number format error:**
- Phone should be 10 digits (India) or include country code
- MSG91 will auto-convert to +91

### Check SMS Configuration Endpoint

Curl in terminal:
```bash
curl http://localhost:4000/api/auth/debug/sms-logs
```

Response shows:
- Current provider
- Which credentials are set
- Recent SMS attempts
- Any errors

---

## 📋 Checklist Before Going Live

- [ ] SMS provider account created
- [ ] API key obtained and added to `.env`
- [ ] (For MSG91) DLT template registered & approved
- [ ] Backend restarted with updated `.env`
- [ ] Test OTP sent successfully to phone
- [ ] Verified SMS received within 5 seconds
- [ ] Phone number format working (+91 or 10 digits)
- [ ] Error messages show real SMS provider errors (not generic "OTP sent")

---

## 💡 Pro Tips

**For Development:**
- Use Twilio for quick testing (instant, no approvals)
- Use MSG91 for production (India-specific, cheaper)

**For Production:**
- Set `SMS_PROVIDER=msg91` (primary for India)
- Have fallback provider (Twilio) as backup
- Monitor SMS logs for failures
- Set up alerts for failed SMS attempts

**Cost:**
- MSG91: ₹0.50-₹1 per SMS
- Twilio: $0.01-$0.05 per SMS (more expensive but reliable)

---

## 📞 Need Help?

1. Check backend terminal logs
2. Visit `http://localhost:4000/api/auth/debug/sms-logs`
3. Verify `.env` file has correct values
4. Check SMS provider account has active credits
5. For MSG91: Ensure template is approved (status check in dashboard)

