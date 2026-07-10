import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

type SendOtpResponse = {
  token: string;
  isExistingUser: boolean;
  expiresAt: string;
  resendAvailableAt: string;
  serverTime: string;
};

const AuthPage = () => {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // step 1: enter phone; step 2: enter otp (+ name if new user)
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phoneInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!otpExpiresAt && !resendAvailableAt) return;
    const timer = window.setInterval(() => {
      const serverNow = Date.now() + serverOffsetMs;
      if (otpExpiresAt) setExpiryCountdown(Math.max(0, Math.ceil((otpExpiresAt - serverNow) / 1000)));
      if (resendAvailableAt) setResendCountdown(Math.max(0, Math.ceil((resendAvailableAt - serverNow) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresAt, resendAvailableAt, serverOffsetMs]);

  const handleSendOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError("Please enter your mobile number.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<SendOtpResponse>("/api/auth/otp/send", { phone: trimmedPhone });
      const serverNow = new Date(res.serverTime).getTime();
      const offset = serverNow - Date.now();
      const expiresMs = new Date(res.expiresAt).getTime();
      const resendMs = new Date(res.resendAvailableAt).getTime();
      setServerOffsetMs(offset);
      setOtpToken(res.token);
      setIsNewUser(!res.isExistingUser);
      setOtpExpiresAt(expiresMs);
      setResendAvailableAt(resendMs);
      setExpiryCountdown(Math.max(0, Math.ceil((expiresMs - serverNow) / 1000)));
      setResendCountdown(Math.max(0, Math.ceil((resendMs - serverNow) / 1000)));
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!otpToken) return;
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    if (isNewUser && name.trim().length < 2) {
      setError("Please enter your name to create your account.");
      return;
    }
    const serverNow = Date.now() + serverOffsetMs;
    if (otpExpiresAt && otpExpiresAt <= serverNow) {
      setError("OTP expired. Tap Resend to get a new one.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithOtp({
        token: otpToken,
        phone: phone.trim(),
        code: trimmedOtp,
        ...(isNewUser ? { name: name.trim() } : {})
      });
      navigate("/orders");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-card">
      {step === "phone" ? (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>Login / Register</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>Enter your details to get a one-time password.</p>
          <div>
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Raju Patel"
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            />
          </div>
          <div>
            <label htmlFor="phone">Mobile Number</label>
            <input
              id="phone"
              ref={phoneInputRef}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            />
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="button-primary" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>{isNewUser ? "New Account" : "Welcome Back"}</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            OTP sent to <strong>{phone}</strong>.{" "}
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              onClick={() => { setStep("phone"); setError(null); }}
            >
              Change
            </button>
          </p>

          <div>
            <label htmlFor="otp">One-Time Password</label>
            <input
              id="otp"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit OTP"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleComplete()}
            />
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              {expiryCountdown > 0 && (
                <small style={{ color: "var(--muted)" }}>Expires in {expiryCountdown}s</small>
              )}
              {expiryCountdown === 0 && otpExpiresAt && (
                <small style={{ color: "#c55" }}>OTP expired</small>
              )}
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: resendCountdown > 0 ? "default" : "pointer", padding: 0, textDecoration: resendCountdown > 0 ? "none" : "underline", opacity: resendCountdown > 0 ? 0.5 : 1 }}
                onClick={resendCountdown === 0 ? handleSendOtp : undefined}
                disabled={resendCountdown > 0}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
              </button>
            </div>
          </div>

          {error && <div className="alert">{error}</div>}

          <button className="button-primary" onClick={handleComplete} disabled={loading}>
            {loading ? "Verifying…" : isNewUser ? "Create Account" : "Login"}
          </button>
        </div>
      )}
    </section>
  );
};

export default AuthPage;

