
import React, { useState, useEffect } from "react";
import axios from "axios";

function Inventory() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "PVC",
    price: "",
    quantity: ""
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Unable to load products:", error);
        alert("Unable to connect to the database. Please check the backend.");
      });
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      brand: "",
      category: "PVC",
      price: "",
      quantity: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const productData = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity)
    };

    try {
      if (editingId !== null) {
        await axios.put(
          `http://127.0.0.1:8000/products/${editingId}`,
          productData
        );

        alert("Product updated successfully!");
      } else {
        await axios.post(
          "http://127.0.0.1:8000/products",
          productData
        );

        alert("Product added successfully!");
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/products"
      );

      setProducts(response.data);
      resetForm();

    } catch (error) {
      console.error("Unable to save product:", error);
      alert("Unable to save product. Please try again.");
    }
  };

  const handleEditProduct = (product) => {
    setForm({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      quantity: product.quantity
    });

    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (confirmDelete) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/products/${id}`
        );

        setProducts((currentProducts) =>
          currentProducts.filter((product) => product.id !== id)
        );

        alert("Product deleted successfully!");

      } catch (error) {
        console.error("Unable to delete product:", error);
        alert("Unable to delete product. Please try again.");
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.brand} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter(
    (product) => Number(product.quantity) < 10
  );

  // Get the correct stock status
  const getStockStatus = (quantity) => {
    const stock = Number(quantity);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        className: "out-of-stock"
      };
    }

    if (stock < 10) {
      return {
        label: "Low Stock",
        className: "low-stock"
      };
    }

    return {
      label: "In Stock",
      className: "in-stock"
    };
  };

  // Get category badge styling
  const getCategoryClass = (category) => {
    const categoryClasses = {
      PVC: "category-pvc",
      UPVC: "category-upvc",
      HDPE: "category-hdpe",
      Fittings: "category-fittings"
    };

    return categoryClasses[category] || "category-default";
  };

  return (
    <div className="inventory-page">

      <h1>Inventory Management</h1>
      <p>Manage your products easily at Sri Sakthi Enterprises.</p>

      <div className="inventory-actions">

        <button onClick={() => {
          resetForm();
          setShowForm(true);
        }}>
          + Add New Product
        </button>

        <input
          type="text"
          placeholder="Search products or brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Add or Edit Product Form */}

      {showForm && (
        <form onSubmit={handleAddProduct}>

          <h2>
            {editingId !== null ? "Edit Product" : "Add New Product"}
          </h2>

          <input
            name="name"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="brand"
            placeholder="Brand Name"
            value={form.brand}
            onChange={handleChange}
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="PVC">PVC</option>
            <option value="UPVC">UPVC</option>
            <option value="HDPE">HDPE</option>
            <option value="Fittings">Fittings</option>
          </select>

          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price (₹)"
            value={form.price}
            onChange={handleChange}
            required
          />

          <input
            name="quantity"
            type="number"
            min="0"
            placeholder="Available Quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />

          <button type="submit">
            {editingId !== null ? "Update Product" : "Save Product"}
          </button>

          <button type="button" onClick={resetForm}>
            Cancel
          </button>

        </form>
      )}

      {/* Smart Inventory Alerts */}

      {lowStockProducts.length > 0 && (

        <div className="smart-stock-alert">

          <h3>⚠️ Smart Stock Alerts</h3>

          <p>
            {lowStockProducts.length} product(s) need restocking.
          </p>

          {lowStockProducts.map((product) => (

            <div className="stock-alert-item" key={product.id}>

              <strong>{product.name}</strong>
              {" ("}{product.brand}{")"}
              {" — "}

              Only <strong>{product.quantity} units</strong> remaining.

            </div>

          ))}

        </div>
      )}

      {/* Product List */}

      <h2>Your Products ({filteredProducts.length})</h2>

      {filteredProducts.length === 0 ? (

        <p>
          {products.length === 0
            ? "No products added yet. Click Add New Product to get started."
            : "No matching products found."}
        </p>

      ) : (

        <table>

          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity);

              return (
                <tr key={product.id}>

                  <td><strong>{product.name}</strong></td>

                  <td>{product.brand}</td>

                  <td>
                    <span className={`category-badge ${getCategoryClass(product.category)}`}>
                      {product.category}
                    </span>
                  </td>

                  <td>₹{product.price}</td>

                  <td>{product.quantity}</td>

                  <td>
                    <span className={`stock-status ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      )}

    </div>
  );
}

export default Inventory;
