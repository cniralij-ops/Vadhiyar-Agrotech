import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import AuthPage from "./pages/AuthPage";
const App = () => {
    return (_jsxs("div", { className: "app-shell", children: [_jsx(Header, {}), _jsx("main", { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/products", element: _jsx(ProductsPage, {}) }), _jsx(Route, { path: "/products/:slug", element: _jsx(ProductDetailPage, {}) }), _jsx(Route, { path: "/cart", element: _jsx(CartPage, {}) }), _jsx(Route, { path: "/checkout", element: _jsx(CheckoutPage, {}) }), _jsx(Route, { path: "/orders", element: _jsx(OrdersPage, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) })] }) }), _jsx(Footer, {})] }));
};
export default App;
