
import React, { useEffect, useState } from "react";
import axios from "axios";

function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    customer_name: ""
  });

  const loadData = async () => {
    try {
      const [productResponse, salesResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/products"),
        axios.get("http://127.0.0.1:8000/sales")
      ]);

      setProducts(productResponse.data);
      setSales(salesResponse.data);
    } catch (error) {
      console.error("Unable to load sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(form.product_id)
  );

  const quantity = Number(form.quantity);
  const availableStock = Number(selectedProduct?.quantity || 0);
  const estimatedTotal = selectedProduct
    ? Number(selectedProduct.price) * quantity
    : 0;

  const validSale =
    selectedProduct &&
    availableStock > 0 &&
    form.customer_name.trim() !== "" &&
    form.quantity !== "" &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= availableStock;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSale = async (e) => {
    e.preventDefault();

    if (!validSale) return;

    try {
      await axios.post("http://127.0.0.1:8000/sales", {
        product_id: Number(form.product_id),
        quantity,
        customer_name: form.customer_name.trim()
      });

      alert("Sale recorded successfully!");

      setForm({
        product_id: "",
        quantity: "",
        customer_name: ""
      });

      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        "Unable to record sale. Please check your stock and try again."
      );
    }
  };

  const totalRevenue = sales.reduce(
    (total, sale) => total + Number(sale.total_amount),
    0
  );

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div className="inventory-page sales-page">
      <div className="sales-heading">
        <div>
          <h1>Sales Management</h1>
          <p>Record customer purchases and track your business sales.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <p>Total Sales</p>
          <h2>{loading ? "..." : sales.length}</h2>
          <span>Recorded transactions</span>
        </div>

        <div className="stat-card">
          <p>Sales Revenue</p>
          <h2>{loading ? "..." : formatPrice(totalRevenue)}</h2>
          <span>Total recorded revenue</span>
        </div>
      </div>

      <div className="sales-form-section">
        <h2>Record a New Sale</h2>
        <p className="sales-section-description">
          Enter the customer and product details below.
        </p>

        <form className="sale-form" onSubmit={handleAddSale}>
          <div className="sale-field">
            <label htmlFor="customer_name">Customer Name</label>
            <input
              id="customer_name"
              name="customer_name"
              placeholder="Enter customer name"
              value={form.customer_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sale-field">
            <label htmlFor="product_id">Select Product</label>
            <select
              id="product_id"
              name="product_id"
              value={form.product_id}
              onChange={(e) => {
                setForm({
                  ...form,
                  product_id: e.target.value,
                  quantity: ""
                });
              }}
              required
            >
              <option value="">Choose a product</option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={Number(product.quantity) <= 0}
                >
                  {product.name} — Stock: {product.quantity}
                  {Number(product.quantity) <= 0 ? " (Out of stock)" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="sale-product-info">
              <div>
                <span>Selected Product</span>
                <strong>{selectedProduct.name}</strong>
              </div>

              <div>
                <span>Brand</span>
                <strong>{selectedProduct.brand || "Not specified"}</strong>
              </div>

              <div>
                <span>Available Stock</span>
                <strong>{availableStock} units</strong>
              </div>

              <div>
                <span>Price Per Unit</span>
                <strong>{formatPrice(selectedProduct.price)}</strong>
              </div>
            </div>
          )}

          <div className="sale-field">
            <label htmlFor="quantity">Quantity to Sell</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max={availableStock}
              step="1"
              placeholder="Enter quantity"
              value={form.quantity}
              onChange={handleChange}
              disabled={!selectedProduct || availableStock <= 0}
              required
            />

            {selectedProduct && (
              <small>
                Maximum available quantity: {availableStock}
              </small>
            )}
          </div>

          {form.quantity !== "" &&
            selectedProduct &&
            quantity > availableStock && (
              <p className="sale-validation-message">
                Not enough stock. Only {availableStock} units are available.
              </p>
            )}

          <div className="sale-estimated-total">
            <div>
              <span>Estimated Sale Amount</span>
              <small>Based on selected product and quantity</small>
            </div>

            <strong>{formatPrice(estimatedTotal)}</strong>
          </div>

          <button
            type="submit"
            className="sale-submit-button"
            disabled={!validSale}
          >
            Record Sale
          </button>
        </form>
      </div>

      <div className="sales-history-section">
        <h2>Recent Sales</h2>
        <p className="sales-section-description">
          View the purchases recorded in your business.
        </p>

        {loading ? (
          <p>Loading sales...</p>
        ) : sales.length === 0 ? (
          <p>No sales recorded yet.</p>
        ) : (
          <div className="sales-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.customer_name}</td>
                    <td>{sale.product_name}</td>
                    <td>{sale.quantity}</td>
                    <td>{formatPrice(sale.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;
