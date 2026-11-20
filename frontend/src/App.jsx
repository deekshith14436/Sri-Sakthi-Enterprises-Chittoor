
import { useState, useEffect } from "react";
import axios from "axios";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bot,
  Settings,
  Bell,
  Search,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Boxes
} from "lucide-react";

import "./App.css";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import AIAssistant from "./AIAssistant";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format sale date and time in Indian Standard Time
  const formatDateTimeIST = (dateTime) => {
    if (!dateTime) {
      return "Date unavailable";
    }

    const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/.test(dateTime)
      ? dateTime
      : `${dateTime}Z`;

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  // Fetch inventory and sales data
  const fetchDashboardData = async () => {
    try {
      const [productResponse, salesResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/products"),
        axios.get("http://127.0.0.1:8000/sales")
      ]);

      setProducts(productResponse.data);
      setSales(salesResponse.data);

    } catch (error) {
      console.error("Dashboard data loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh dashboard data whenever the page changes
  useEffect(() => {
    fetchDashboardData();

    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [activePage]);

  // Inventory calculations
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.quantity),
    0
  );

  const lowStockItems = products.filter(
    (product) => Number(product.quantity) < 10
  ).length;

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price) * Number(product.quantity),
    0
  );

  // Sales calculations
  const totalSales = sales.length;

  const totalRevenue = sales.reduce(
    (total, sale) => total + Number(sale.total_amount),
    0
  );

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Inventory", icon: Package },
    { name: "Sales", icon: ShoppingCart },
    { name: "AI Assistant", icon: Bot }
  ];

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SRI SAKTHI</h2>
            <p>ENTERPRISES - CHITTOOR</p>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={19} />
              {item.name}
            </button>
          );
        })}

        <div className="sidebar-bottom">
          <button className="menu-item">
            <Settings size={19} /> Settings
          </button>

          <p>Powered by Sri Sakthi Enterprises</p>
        </div>

      </aside>

      {activePage === "Inventory" ? (

        <main className="main">
          <Inventory />
        </main>

      ) : activePage === "Sales" ? (

        <main className="main">
          <Sales />
        </main>

      ) : activePage === "AI Assistant" ? (

        <main className="main">
          <AIAssistant />
        </main>

      ) : (

        <main className="main">

          <header className="topbar">

            <div>
              <h1>{activePage}</h1>
              <p>Welcome back! Here's your business overview.</p>
            </div>

            <div className="top-actions">
              <button className="icon-button">
                <Search />
              </button>

              <button className="icon-button">
                <Bell />
              </button>

              <div className="avatar">SS</div>
            </div>

          </header>

          {activePage === "Dashboard" && (

            <>

              <section className="welcome">

                <div>
                  <span className="welcome-tag">
                    BUSINESS OVERVIEW
                  </span>

                  <h2>SRI SAKTHI ENTERPRISES - CHITTOOR</h2>

                  <p>
                    Your trusted destination for quality PVC, UPVC
                    and HDPE pipes and fittings.
                  </p>
                </div>

                <div className="welcome-icon">
                  <Boxes size={55} />
                </div>

              </section>

              <section className="stats">

                <div className="stat-card">
                  <div className="stat-icon green">
                    <Package />
                  </div>

                  <p>Total Products</p>

                  <h2>{loading ? "..." : totalProducts}</h2>

                  <span>Products in your inventory</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <IndianRupee />
                  </div>

                  <p>Inventory Value</p>

                  <h2>
                    {loading
                      ? "..."
                      : `₹${inventoryValue.toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}`}
                  </h2>

                  <span>Current stock value</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <AlertTriangle />
                  </div>

                  <p>Low Stock Items</p>

                  <h2>{loading ? "..." : lowStockItems}</h2>

                  <span>Products below 10 units</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <TrendingUp />
                  </div>

                  <p>Total Stock Quantity</p>

                  <h2>{loading ? "..." : totalStock}</h2>

                  <span>Total available units</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <ShoppingCart />
                  </div>

                  <p>Total Sales</p>

                  <h2>{loading ? "..." : totalSales}</h2>

                  <span>Recorded transactions</span>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <IndianRupee />
                  </div>

                  <p>Total Revenue</p>

                  <h2>
                    {loading
                      ? "..."
                      : `₹${totalRevenue.toLocaleString("en-IN", {
                          maximumFractionDigits: 2
                        })}`}
                  </h2>

                  <span>Total recorded sales revenue</span>
                </div>

              </section>

              <section className="content-grid">

                <div className="panel">

                  <div className="panel-heading">
                    <h3>Business Activity</h3>
                    <span>Inventory Overview</span>
                  </div>

                  <div className="empty-state">

                    <ShoppingCart size={38} />

                    <h3>Your Inventory Summary</h3>

                    <p>
                      You currently have {totalProducts} products
                      and {totalStock} total units in stock.
                    </p>

                    {lowStockItems > 0 && (
                      <p style={{ color: "#d97706" }}>
                        ⚠️ {lowStockItems} products need restocking.
                      </p>
                    )}

                    <button
                      className="ai-button"
                      onClick={() => setActivePage("Inventory")}
                    >
                      Manage Inventory →
                    </button>

                  </div>

                </div>

                <div className="panel ai-panel">

                  <div className="ai-heading">

                    <div className="ai-logo">
                      <Bot />
                    </div>

                    <div>
                      <h3>Sri Sakthi Business Assistant</h3>
                      <p>Your business intelligence partner</p>
                    </div>

                  </div>

                  <div className="ai-message">
                    Hello! Welcome to Sri Sakthi Enterprises.
                    I can help you understand inventory,
                    sales and restocking.
                  </div>

                  <button
                    className="ai-button"
                    onClick={() => setActivePage("AI Assistant")}
                  >
                    Explore AI Assistant →
                  </button>

                </div>

              </section>

              {/* Recent Transactions */}

              <section className="panel" style={{ marginTop: "25px" }}>

                <div className="panel-heading">
                  <h3>Recent Transactions</h3>
                  <span>Latest customer purchases</span>
                </div>

                {loading ? (
                  <p>Loading transactions...</p>
                ) : sales.length === 0 ? (
                  <p>No transactions recorded yet.</p>
                ) : (

                  <div style={{ overflowX: "auto" }}>

                    <table>
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Total Amount</th>
                          <th>Date and Time (IST)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sales.slice(0, 5).map((sale) => (
                          <tr key={sale.id}>
                            <td>{sale.customer_name}</td>
                            <td>{sale.product_name}</td>
                            <td>{sale.quantity}</td>
                            <td>
                              ₹{Number(sale.total_amount).toLocaleString("en-IN")}
                            </td>
                            <td>
                              {formatDateTimeIST(sale.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>

                )}

              </section>

            </>

          )}

          <footer>
            © 2026 Sri Sakthi Enterprises - Chittoor
          </footer>

        </main>

      )}

    </div>
  );
}

export default App;
