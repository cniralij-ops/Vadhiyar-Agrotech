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
      setError("Please enter your name.");
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
          <p style={{ color: "var(--muted)", margin: 0 }}>Enter your mobile number to get a one-time password.</p>
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

          {isNewUser && (
            <div>
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Raju Patel"
                autoFocus
              />
            </div>
          )}

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
              autoFocus={!isNewUser}
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


type SendOtpResponse = {
  token: string;
  expiresAt: string;
  resendAvailableAt: string;
  serverTime: string;
};

const AuthPage = () => {
  const t = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    otp: ""
  });
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState<number | null>(null);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0);
  const [otpExpiryCountdown, setOtpExpiryCountdown] = useState(0);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);

  useEffect(() => {
    if (!otpExpiresAt && !otpResendAvailableAt) {
      setOtpExpiryCountdown(0);
      setOtpResendCountdown(0);
      return;
    }
    const timer = window.setInterval(() => {
      const serverNow = Date.now() + serverTimeOffsetMs;
      if (otpExpiresAt) {
        setOtpExpiryCountdown(Math.max(0, Math.ceil((otpExpiresAt - serverNow) / 1000)));
      }
      if (otpResendAvailableAt) {
        setOtpResendCountdown(Math.max(0, Math.ceil((otpResendAvailableAt - serverNow) / 1000)));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiresAt, otpResendAvailableAt, serverTimeOffsetMs]);

  useEffect(() => {
    if (!otpVerified || !otpExpiresAt) {
      return;
    }
    const serverNow = Date.now() + serverTimeOffsetMs;
    if (otpExpiresAt <= serverNow) {
      setOtpVerified(false);
    }
  }, [otpVerified, otpExpiresAt, serverTimeOffsetMs]);

  const handleSendOtp = async () => {
    try {
      setOtpError(null);
      setError(null);
      const mobile = form.phone.trim();
      if (!mobile) {
        setOtpError("Please enter your mobile number first.");
        return;
      }
      const response = await api.post<SendOtpResponse>("/api/auth/otp/send", { phone: mobile });
      const serverTimeMs = new Date(response.serverTime).getTime();
      const expiresAtMs = new Date(response.expiresAt).getTime();
      const resendAvailableAtMs = new Date(response.resendAvailableAt).getTime();
      const offset = serverTimeMs - Date.now();
      const serverNow = Date.now() + offset;
      setServerTimeOffsetMs(offset);
      setOtpToken(response.token);
      setOtpExpiresAt(expiresAtMs);
      setOtpResendAvailableAt(resendAvailableAtMs);
      setOtpExpiryCountdown(Math.max(0, Math.ceil((expiresAtMs - serverNow) / 1000)));
      setOtpResendCountdown(Math.max(0, Math.ceil((resendAvailableAtMs - serverNow) / 1000)));
      setOtpVerified(false);
      setForm((previous) => ({ ...previous, otp: "" }));
    } catch (apiError) {
      setOtpToken(null);
      setOtpExpiresAt(null);
      setOtpResendAvailableAt(null);
      setOtpExpiryCountdown(0);
      setOtpResendCountdown(0);
      setOtpError((apiError as Error).message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpError(null);
      const mobile = form.phone.trim();
      if (!otpToken) {
        setOtpError("Please request an OTP first.");
        return;
      }
      if (!mobile) {
        setOtpError("Mobile number is required.");
        return;
      }
      const code = form.otp.trim();
      if (code.length !== 6) {
        setOtpError("Enter the 6-digit OTP.");
        return;
      }
      const serverNow = Date.now() + serverTimeOffsetMs;
      if (otpExpiresAt && otpExpiresAt <= serverNow) {
        setOtpVerified(false);
        setOtpError("OTP expired. Please request a new code.");
        return;
      }
      await api.post("/api/auth/otp/verify", { token: otpToken, phone: mobile, code });
      setOtpVerified(true);
    } catch (apiError) {
      setOtpVerified(false);
      setOtpError((apiError as Error).message);
    }
  };

  const handleLoginMethodChange = (method: "email" | "phone") => {
    setLoginMethod(method);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      setOtpError(null);
      if (!form.name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (mode === "login") {
        const identifier = loginMethod === "email" ? form.email.trim() : form.phone.trim();
        if (!identifier) {
          setError(`Please enter your ${loginMethod === "email" ? "email address" : "mobile number"}.`);
          return;
        }
        const payload =
          loginMethod === "email"
            ? { name: form.name.trim(), email: identifier }
            : { name: form.name.trim(), phone: identifier };
        await login(payload);
      } else {
        if (!otpVerified || !otpToken) {
          setError("Please verify the OTP sent to your mobile number.");
          return;
        }
        if (!form.phone.trim()) {
          setError("Mobile number is required to register.");
          return;
        }
        if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
          setError("Please complete your address, city, and state.");
          return;
        }
        const payload: Parameters<typeof register>[0] = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          otpToken
        };
        if (form.email.trim()) {
          payload.email = form.email.trim();
        }
        await register(payload);
        setOtpToken(null);
        setOtpVerified(false);
        setOtpExpiresAt(null);
        setOtpResendAvailableAt(null);
        setOtpExpiryCountdown(0);
        setOtpResendCountdown(0);
        setServerTimeOffsetMs(0);
      }
      navigate("/orders");
    } catch (apiError) {
      setError((apiError as Error).message);
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <section className="form-card">
      <div style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>
          {t("login")}
        </button>
        <button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>
          {t("register")}
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            required
          />
        </div>
        {mode === "login" && (
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Login with</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="login-method"
                  value="email"
                  checked={loginMethod === "email"}
                  onChange={() => handleLoginMethodChange("email")}
                />
                Email
              </label>
              <label style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <input
                  type="radio"
                  name="login-method"
                  value="phone"
                  checked={loginMethod === "phone"}
                  onChange={() => handleLoginMethodChange("phone")}
                />
                Mobile
              </label>
            </div>
          </div>
        )}
        {(mode === "register" || loginMethod === "email") && (
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              required={mode === "login" && loginMethod === "email"}
              placeholder={mode === "register" ? "Optional" : undefined}
            />
          </div>
        )}
        {(mode === "register" || loginMethod === "phone") && (
          <div>
            <label htmlFor="phone">Mobile</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              required={mode === "register" || loginMethod === "phone"}
            />
          </div>
        )}
        {mode === "register" && (
          <>
            <div>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                value={form.addressLine}
                onChange={(event) => handleChange("addressLine", event.target.value)}
                required
              />
            </div>
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <div>
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  value={form.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label>Verify mobile number</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={handleSendOtp} disabled={otpToken !== null && otpResendCountdown > 0}>
                  {otpToken ? "Resend OTP" : "Send OTP"}
                </button>
                {otpExpiryCountdown > 0 && <small>OTP expires in {otpExpiryCountdown}s</small>}
                {otpToken && otpResendCountdown > 0 && <small>Resend available in {otpResendCountdown}s</small>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  id="otp"
                  value={form.otp}
                  onChange={(event) => handleChange("otp", event.target.value)}
                  placeholder="Enter OTP"
                />
                <button type="button" onClick={handleVerifyOtp} disabled={otpVerified}>
                  {otpVerified ? "Verified" : "Verify"}
                </button>
              </div>
              {otpVerified && <small style={{ color: "#0a7" }}>Mobile number verified.</small>}
              {!otpVerified && otpExpiresAt && otpExpiryCountdown === 0 && (
                <small style={{ color: "#a15c02" }}>OTP expired. Please request a new code.</small>
              )}
              {otpError && <div className="alert" style={{ marginTop: "0.5rem" }}>{otpError}</div>}
            </div>
          </>
        )}
        {error && <div className="alert">{error}</div>}
        <button
          className="button-primary"
          type="submit"
          disabled={mode === "register" && (!otpVerified || (otpExpiresAt !== null && otpExpiryCountdown === 0))}
        >
          {mode === "login" ? t("login") : t("register")}
        </button>
      </form>
    </section>
  );
};

export default AuthPage;
