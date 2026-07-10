import React, { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { AdminOrder, OrderStatus } from "../types";

const statuses: OrderStatus[] = ["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"];

const OrdersPanel = () => {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const loadOrders = () => {
    if (!token) return;
    adminApi
      .get<AdminOrder[]>("/api/admin/orders", token)
      .then(setOrders)
      .catch(console.error);
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
    if (!token) return;
    await adminApi.put(`/api/admin/orders/${orderId}/status`, { status: nextStatus }, token);
    setStatus("Status updated");
    loadOrders();
  };

  return (
    <div className="panel">
      <h2>Order management</h2>
      {status && <p>{status}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>#{order.id}</strong>
                <p className="small-tag">{new Date(order.createdAt).toLocaleDateString()}</p>
              </td>
              <td>
                <p>{order.user.name}</p>
                <p className="small-tag">{order.email}</p>
              </td>
              <td>
                <select
                  value={order.status}
                  onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </td>
              <td>₹{order.total.toFixed(2)}</td>
              <td>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPanel;
