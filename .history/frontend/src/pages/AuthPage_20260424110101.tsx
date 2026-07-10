import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { api } from "../services/api";

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
