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
  deliveryMode?: "sms" | "console";
  devOtp?: string;
};

const AuthPage = () => {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // step 1: phone; step 2: otp; step 3: address (for new users)
  const [step, setStep] = useState<"phone" | "otp" | "address">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
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
    setHelperMessage(null);
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
      const nextOtp = res.deliveryMode === "console" && res.devOtp ? res.devOtp : "";
      setOtp(nextOtp);
      setHelperMessage(
        res.deliveryMode === "console" && res.devOtp
          ? `SMS provider is not configured in local development. Use OTP ${res.devOtp}.`
          : "OTP sent to your mobile number."
      );
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
    if (isNewUser) {
      setStep("address");
    } else {
      await proceedWithLogin();
    }
  };

  const proceedWithLogin = async () => {
    setLoading(true);
    try {
      await loginWithOtp({
        token: otpToken!,
        phone: phone.trim(),
        code: otp.trim(),
        ...(isNewUser ? { name: name.trim(), addressLine: addressLine.trim(), city: city.trim(), state: state.trim() } : {})
      });
      navigate("/orders");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async () => {
    const trimmedAddress = addressLine.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();

    if (trimmedAddress.length < 5) {
      setError("Please enter a valid address.");
      return;
    }
    if (trimmedCity.length < 2) {
      setError("Please enter your city.");
      return;
    }
    if (trimmedState.length < 2) {
      setError("Please enter your state.");
      return;
    }
    setError(null);
    await proceedWithLogin();
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
          <h2 style={{ margin: 0 }}>{step === "address" ? "Delivery Address" : isNewUser ? "New Account" : "Welcome Back"}</h2>
          
          {step !== "address" && (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {helperMessage ?? `OTP sent to ${phone}.`} {helperMessage?.includes("Use OTP") ? null : <strong>{phone}</strong>}.{" "}
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                onClick={() => { setStep("phone"); setError(null); setHelperMessage(null); }}
              >
                Change
              </button>
            </p>
          )}

          {step === "address" ? (
            <>
              <p style={{ color: "var(--muted)", margin: 0 }}>Enter your delivery address for new account.</p>
              <div>
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. 123 Main Street"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Radhanpur"
                  />
                </div>
                <div>
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. GJ"
                  />
                </div>
              </div>
              {error && <div className="alert">{error}</div>}
              <button className="button-primary" onClick={handleAddressSubmit} disabled={loading}>
                {loading ? "Creating Account…" : "Complete Registration"}
              </button>
            </>
          ) : (
            <>
              {helperMessage && <div className="alert">{helperMessage}</div>}
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
                {loading ? "Verifying…" : isNewUser ? "Continue to Address" : "Login"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default AuthPage;

