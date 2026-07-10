import React, { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { DashboardSummary } from "../types";

const DashboardPanel = () => {
  const { token } = useAdminAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<DashboardSummary>("/api/admin/dashboard", token);
      setSummary(data);
    } catch (apiError) {
      setSummary(null);
      setError((apiError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [token]);

  if (loading && !summary) {
    return <p>Loading dashboard…</p>;
  }

  if (error) {
    return (
      <div className="panel">
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <button type="button" className="button-primary" onClick={loadDashboard}>
          Try again
        </button>
      </div>
    );
  }

  if (!summary) {
    return <p>No dashboard data yet.</p>;
  }

  return (
    <div className="panel">
      <h2>Executive summary</h2>
      <div className="panel-grid">
        <div className="stat-card">
          <p>Total customers</p>
          <strong>{summary.totalCustomers}</strong>
        </div>
        <div className="stat-card">
          <p>Total orders</p>
          <strong>{summary.totalOrders}</strong>
        </div>
        <div className="stat-card">
          <p>Total revenue</p>
          <strong>₹{summary.totalRevenue.toFixed(2)}</strong>
        </div>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Recent activity</h3>
        <ul>
          {summary.recentActivity.map((item) => (
            <li key={item.id} style={{ marginBottom: "0.4rem" }}>
              <strong>{item.user.name}</strong> {item.action} • {new Date(item.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DashboardPanel;
