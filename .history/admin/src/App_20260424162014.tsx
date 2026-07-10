import React, { useState } from "react";
import logo from "./assets/logo.svg";
import { useAdminAuth } from "./contexts/AdminAuthContext";
import DashboardPanel from "./pages/DashboardPanel";
import ProductsPanel from "./pages/ProductsPanel";
import OrdersPanel from "./pages/OrdersPanel";
import CustomersPanel from "./pages/CustomersPanel";
import LoginPage from "./pages/LoginPage";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" }
];

type TabKey = (typeof tabs)[number]["key"];

const App = () => {
  const { user, logout, isInitializing } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  if (isInitializing) {
    return <p style={{ padding: "2rem" }}>Checking session...</p>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPanel = () => {
    switch (activeTab) {
      case "products":
        return <ProductsPanel />;
      case "orders":
        return <OrdersPanel />;
      case "customers":
        return <CustomersPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <img src={logo} alt="Vadhiyar Agrotech" width={48} height={48} />
          <div>
            <strong>Vadhiyar Agrotech Admin</strong>
            <div className="small-tag">{user.name}</div>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : undefined}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: "transparent",
                border: "none",
                color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="button-primary" onClick={logout}>
          Logout
        </button>
      </header>
      <main className="admin-content">{renderPanel()}</main>
    </div>
  );
};

export default App;
