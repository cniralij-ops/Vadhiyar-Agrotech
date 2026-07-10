import React, { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { AdminCustomer } from "../types";

const CustomersPanel = () => {
  const { token } = useAdminAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [loginHistory, setLoginHistory] = useState<Array<{ action: string; createdAt: string }>>([]);

  useEffect(() => {
    if (!token) return;
    adminApi
      .get<AdminCustomer[]>("/api/customers", token)
      .then(setCustomers)
      .catch(console.error);
  }, [token]);

  const loadDetails = (id: number) => {
    if (!token) return;
    adminApi
      .get<AdminCustomer>(`/api/customers/${id}`, token)
      .then((data) => {
        setSelected(data);
        setLoginHistory(data.loginHistory ?? []);
      })
      .catch(console.error);
  };

  return (
    <div className="panel">
      <h2>Customer management</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="button-primary" type="button" onClick={() => loadDetails(customer.id)}>
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>{selected.name} — {selected.email}</h3>
          <p>Phone: {selected.phone}</p>
          <div>
            <h4>Login history</h4>
            <ul>
              {loginHistory.map((entry, index) => (
                <li key={index}>
                  {entry.action} • {new Date(entry.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPanel;
