import React, { useState } from "react";
import { useAdminAuth } from "../contexts/AdminAuthContext";

const LoginPage = () => {
  const { login } = useAdminAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email: form.email, password: form.password });
    } catch (apiError) {
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell" style={{ justifyContent: "center" }}>
      <div className="admin-content" style={{ maxWidth: 420, width: "100%" }}>
        <div className="panel">
          <h2>Admin Access</h2>
          <p>Secure login for Vadhiyar Agrotech administrators.</p>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                className="input"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                required
              />
            </div>
            {error && <div className="alert">{error}</div>}
            <button className="button-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Access dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
