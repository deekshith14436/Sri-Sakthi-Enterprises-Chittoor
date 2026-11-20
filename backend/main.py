
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import engine, SessionLocal


# ==========================================
# DATABASE AND ENVIRONMENT
# ==========================================

ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)

models.Base.metadata.create_all(bind=engine)

LOW_STOCK_THRESHOLD = 5


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Sri Sakthi Enterprises API",
    description="Business inventory and AI assistant for Sri Sakthi Enterprises",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# REQUEST MODELS
# ==========================================

class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    price: float
    quantity: int


class SaleCreate(BaseModel):
    product_id: int
    quantity: int
    customer_name: str


# ==========================================
# HOME AND HEALTH
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to Sri Sakthi Enterprises!",
        "business": "Sri Sakthi Enterprises - Chittoor",
        "status": "Backend is running successfully"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ==========================================
# PRODUCT ROUTES
# ==========================================

@app.post("/products")
def add_product(product: ProductCreate, db: Session = Depends(get_db)):

    new_product = models.Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    existing_product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    for key, value in product.model_dump().items():
        setattr(existing_product, key, value)

    db.commit()
    db.refresh(existing_product)

    return existing_product


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):

    existing_product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(existing_product)
    db.commit()

    return {"message": "Product deleted successfully"}


# ==========================================
# SALES ROUTES
# ==========================================

@app.post("/sales")
def add_sale(sale: SaleCreate, db: Session = Depends(get_db)):

    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Sale quantity must be greater than zero"
        )

    product = db.query(models.Product).filter(
        models.Product.id == sale.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.quantity < sale.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available quantity: {product.quantity}"
        )

    total_amount = product.price * sale.quantity

    new_sale = models.Sale(
        product_id=product.id,
        product_name=product.name,
        customer_name=sale.customer_name,
        quantity=sale.quantity,
        total_amount=total_amount
    )

    product.quantity -= sale.quantity

    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)

    return new_sale


@app.get("/sales")
def get_sales(db: Session = Depends(get_db)):

    return db.query(models.Sale).order_by(
        models.Sale.id.desc()
    ).all()


# ==========================================
# SMART BUSINESS ASSISTANT
# ==========================================

def generate_fallback_answer(question, products, sales):

    q = question.lower().strip()

    total_products = len(products)

    total_stock = sum(
        p.quantity for p in products
    )

    total_sales = len(sales)

    total_revenue = sum(
        float(s.total_amount) for s in sales
    )

    low_stock_products = [
        p for p in products
        if p.quantity <= LOW_STOCK_THRESHOLD
    ]

    inventory_value = sum(
        float(p.price) * p.quantity
        for p in products
    )

    # --------------------------------------
    # 1. LOW STOCK AND RESTOCK QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "low stock",
        "restock",
        "reorder",
        "shortage",
        "running out",
        "stock alert",
        "need to order"
    ]):

        answer = [
            "LOW STOCK REPORT",
            "Sri Sakthi Enterprises - Chittoor",
            f"Restock threshold: {LOW_STOCK_THRESHOLD} units",
            ""
        ]

        if low_stock_products:

            answer.append("Products requiring attention:")

            for p in low_stock_products:

                answer.append(
                    f"- {p.name} ({p.brand}): "
                    f"{p.quantity} units remaining"
                )

            answer.append("")
            answer.append(
                "Recommendation: Check supplier availability "
                "and consider restocking these products."
            )

        else:

            answer.append(
                "Good news! No products are currently "
                f"at or below {LOW_STOCK_THRESHOLD} units."
            )

        return "\n".join(answer)

    # --------------------------------------
    # 2. REVENUE QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "revenue",
        "earning",
        "earnings",
        "income",
        "money earned",
        "total amount"
    ]):

        return "\n".join([
            "REVENUE REPORT",
            "",
            f"Total revenue: Rs. {total_revenue:,.2f}",
            f"Total recorded sales: {total_sales}",
            "",
            "Note: Revenue is not the same as profit."
        ])

    # --------------------------------------
    # 3. CUSTOMER QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "customer",
        "customers",
        "buyer",
        "buyers"
    ]):

        answer = [
            "CUSTOMER SALES REPORT",
            ""
        ]

        if sales:

            customers = sorted(set(
                s.customer_name for s in sales
            ))

            answer.append(
                f"Total unique customers: {len(customers)}"
            )

            answer.append("")

            for customer in customers:

                customer_sales = [
                    s for s in sales
                    if s.customer_name == customer
                ]

                customer_total = sum(
                    float(s.total_amount)
                    for s in customer_sales
                )

                answer.append(
                    f"- {customer}: "
                    f"{len(customer_sales)} purchase(s), "
                    f"Rs. {customer_total:,.2f}"
                )

        else:

            answer.append("No customer sales recorded yet.")

        return "\n".join(answer)

    # --------------------------------------
    # 4. SALES QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "sale",
        "sales",
        "sold",
        "selling",
        "purchase",
        "transaction"
    ]):

        answer = [
            "SALES REPORT",
            "",
            f"Total completed sales: {total_sales}",
            f"Total revenue: Rs. {total_revenue:,.2f}",
            ""
        ]

        if sales:

            answer.append("Recent sales:")

            for s in sales[:10]:

                answer.append(
                    f"- {s.product_name}: {s.quantity} units "
                    f"to {s.customer_name}, "
                    f"Rs. {float(s.total_amount):,.2f}"
                )

        else:

            answer.append("No sales have been recorded yet.")

        return "\n".join(answer)

    # --------------------------------------
    # 5. INVENTORY QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "inventory",
        "available products",
        "product details",
        "list products",
        "show products",
        "all products",
        "stock quantity",
        "total stock",
        "how many products",
        "catalogue",
        "catalog",
        "inventory value"
    ]):

        answer = [
            "INVENTORY REPORT",
            "",
            f"Total registered products: {total_products}",
            f"Total stock remaining: {total_stock} units",
            f"Inventory value: Rs. {inventory_value:,.2f}",
            ""
        ]

        if products:

            answer.append("Product details:")

            for p in products:

                answer.append(
                    f"- {p.name} ({p.brand}): "
                    f"{p.quantity} units available, "
                    f"Price: Rs. {float(p.price):,.2f}"
                )

        else:

            answer.append("No products registered yet.")

        return "\n".join(answer)

    # --------------------------------------
    # 6. BUSINESS SUMMARY QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "summary",
        "overall",
        "business performance",
        "business overview",
        "business report",
        "how is my business",
        "complete report"
    ]):

        return "\n".join([
            "SRI SAKTHI ENTERPRISES - BUSINESS SUMMARY",
            "",
            "INVENTORY",
            f"Total products: {total_products}",
            f"Total stock: {total_stock} units",
            f"Low-stock products: {len(low_stock_products)}",
            "",
            "SALES",
            f"Total sales: {total_sales}",
            f"Total revenue: Rs. {total_revenue:,.2f}",
            "",
            "BUSINESS RECOMMENDATION",
            (
                "Review low-stock products and plan restocking."
                if low_stock_products
                else "Current stock levels are above the restock threshold."
            )
        ])

    # --------------------------------------
    # 7. HELP AND UNSUPPORTED QUESTIONS
    # --------------------------------------

    if any(word in q for word in [
        "help",
        "what can you do",
        "your features",
        "capabilities"
    ]):

        return "\n".join([
            "SRI SAKTHI BUSINESS ASSISTANT",
            "",
            "I can help you with:",
            "1. Inventory and product information",
            "2. Low-stock alerts and restocking",
            "3. Sales reports",
            "4. Revenue analysis",
            "5. Customer purchase details",
            "6. Overall business summaries"
        ])

    return (
        "I can help you with Sri Sakthi Enterprises business data.\n\n"
        "Please try asking:\n"
        "- Show my inventory\n"
        "- Which products are low in stock?\n"
        "- What is my total revenue?\n"
        "- Show my sales details\n"
        "- Who are my customers?\n"
        "- Give me a business summary"
    )


# ==========================================
# AI ASSISTANT API
# ==========================================

@app.get("/ai/assistant")
def ai_assistant(
    question: str,
    db: Session = Depends(get_db)
):

    if not question.strip():

        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    products = db.query(models.Product).all()

    sales = db.query(models.Sale).order_by(
        models.Sale.id.desc()
    ).all()

    answer = generate_fallback_answer(
        question,
        products,
        sales
    )

    return {
        "answer": answer,
        "source": "database_fallback"
    }
