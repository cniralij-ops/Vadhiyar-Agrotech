import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(AdminAuthProvider, { children: _jsx(App, {}) }) }));
