import os
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
import bcrypt

# ── DATABASE SETUP ─────────────────────────────────────────────────────
DATABASE_URL = "sqlite:///./tiffinflow.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# ── PASSWORD HASHING ───────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# ── SQLALCHEMY MODELS ──────────────────────────────────────────────────
class DBUser(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # "user" | "admin"
    office_id = Column(String, nullable=False)
    default_meal_preference = Column(String, default="flexible")
    is_active = Column(Boolean, default=True)
    weekly_total = Column(Integer, default=0)
    monthly_total = Column(Integer, default=0)
    fcm_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DBOfficeSettings(Base):
    __tablename__ = "office_settings"
    id = Column(String, primary_key=True, index=True) # office_id
    office_name = Column(String, nullable=False)
    admin_id = Column(String, nullable=False)
    veg_price = Column(Integer, default=80)
    non_veg_price = Column(Integer, default=100)
    cutoff_time = Column(String, default="19:00")
    week_start_day = Column(Integer, default=1) # 0=Sun, 1=Mon
    daily_reminder_time = Column(String, default="07:00")
    auto_default_enabled = Column(Boolean, default=True)
    max_users = Column(Integer, default=100)
    office_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DBMeal(Base):
    __tablename__ = "meals"
    id = Column(String, primary_key=True, index=True) # userId_date
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    office_id = Column(String, nullable=False)
    date = Column(String, index=True, nullable=False) # YYYY-MM-DD
    meal_type = Column(String, nullable=False) # "veg" | "non-veg" | "skip"
    status = Column(String, nullable=False) # "confirmed" | "skipped" | "auto-defaulted"
    price = Column(Integer, default=0)
    confirmed_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_auto_defaulted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class DBPayment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    office_id = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    week_start = Column(String, nullable=False)
    payment_status = Column(String, default="pending") # "paid" | "pending" | "overdue"
    marked_paid_by_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ── FASTAPI INIT ──────────────────────────────────────────────────────
app = FastAPI(title="TiffinFlow API Backend", version="1.0.0")

# Enable CORS for React Native Local Dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── PYDANTIC SCHEMAS ───────────────────────────────────────────────────
class UserSignUpSchema(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str # "user" | "admin"
    office_code_or_name: str
    default_meal_preference: Optional[str] = "flexible"

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserProfileSchema(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    role: str
    office_id: str
    default_meal_preference: str
    is_active: bool
    weekly_total: int
    monthly_total: int

class OfficeSettingsSchema(BaseModel):
    id: str
    office_name: str
    admin_id: str
    veg_price: int
    non_veg_price: int
    cutoff_time: str
    week_start_day: int
    daily_reminder_time: str
    auto_default_enabled: bool
    max_users: int
    office_code: str

class MealConfirmSchema(BaseModel):
    user_id: str
    user_name: str
    office_id: str
    meal_type: str
    price: int

class PaymentCreateSchema(BaseModel):
    user_id: str
    user_name: str
    office_id: str
    amount: int
    week_start: str

# ── API ENDPOINTS ──────────────────────────────────────────────────────

# ── Auth Endpoints ─────────────────────────────────────────────────────

@app.post("/api/auth/signup")
def signup(data: UserSignUpSchema, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(DBUser).filter(DBUser.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already in use.")

    uid = str(uuid.uuid4())
    office_id = data.office_code_or_name.strip().lower()

    if data.role == "user":
        code = data.office_code_or_name.strip()
        # Find the office by code or default to the first available office in DB
        office = None
        if code and code.lower() != "default":
            office = db.query(DBOfficeSettings).filter(DBOfficeSettings.office_code == code).first()
        
        if not office:
            office = db.query(DBOfficeSettings).first()
            
        if not office:
            # Seed a default office if none exists
            office = DBOfficeSettings(
                id="default",
                office_name="Default Office",
                admin_id="system",
                veg_price=80,
                non_veg_price=100,
                cutoff_time="19:00",
                week_start_day=1,
                daily_reminder_time="07:00",
                auto_default_enabled=True,
                max_users=100,
                office_code="DEFAULT",
            )
            db.add(office)
            db.commit()
            db.refresh(office)
            
        office_id = office.id
    else:
        # Register new Office
        generated_code = str(uuid.uuid4())[:6].upper()
        office_id = generated_code.lower()
        office = DBOfficeSettings(
            id=office_id,
            office_name=data.office_code_or_name.strip(),
            admin_id=uid,
            veg_price=80,
            non_veg_price=100,
            cutoff_time="19:00",
            week_start_day=1,
            daily_reminder_time="07:00",
            auto_default_enabled=True,
            max_users=100,
            office_code=generated_code,
        )
        db.add(office)

    # Create new User
    hashed_pwd = hash_password(data.password)
    user = DBUser(
        id=uid,
        name=data.name.strip(),
        phone=data.phone.strip(),
        email=data.email.lower().strip(),
        password_hash=hashed_pwd,
        role=data.role,
        office_id=office_id,
        default_meal_preference=data.default_meal_preference,
    )
    db.add(user)
    db.commit()

    return {"user": {"uid": user.id, "email": user.email, "displayName": user.name, "phoneNumber": user.phone}}

@app.post("/api/auth/login")
def login(data: UserLoginSchema, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    return {"user": {"uid": user.id, "email": user.email, "displayName": user.name, "phoneNumber": user.phone}}

@app.get("/api/auth/profile/{uid}")
def get_profile(uid: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "officeId": user.office_id,
        "defaultMealPreference": user.default_meal_preference,
        "isActive": user.is_active,
        "weeklyTotal": user.weekly_total,
        "monthlyTotal": user.monthly_total,
    }

@app.post("/api/auth/profile/{uid}/update")
def update_profile(uid: str, data: dict, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    for key, val in data.items():
        if hasattr(user, key):
            setattr(user, key, val)
    db.commit()
    return {"status": "success"}

# ── Office Settings Endpoints ──────────────────────────────────────────

@app.get("/api/office/{office_id}/settings")
def get_office_settings(office_id: str, db: Session = Depends(get_db)):
    office = db.query(DBOfficeSettings).filter(DBOfficeSettings.id == office_id).first()
    if not office:
        # Pre-seed a default office if loaded
        office = DBOfficeSettings(
            id=office_id,
            office_name="Default Office",
            admin_id="system",
            veg_price=80,
            non_veg_price=100,
            cutoff_time="19:00",
            week_start_day=1,
            daily_reminder_time="07:00",
            auto_default_enabled=True,
            max_users=50,
            office_code=office_id.upper(),
        )
        db.add(office)
        db.commit()
    
    return {
        "id": office.id,
        "officeName": office.office_name,
        "adminId": office.admin_id,
        "vegPrice": office.veg_price,
        "nonVegPrice": office.non_veg_price,
        "cutoffTime": office.cutoff_time,
        "weekStartDay": office.week_start_day,
        "dailyReminderTime": office.daily_reminder_time,
        "autoDefaultEnabled": office.auto_default_enabled,
        "maxUsers": office.max_users,
        "officeCode": office.office_code,
    }

@app.post("/api/office/{office_id}/settings/update")
def update_office_settings(office_id: str, data: dict, db: Session = Depends(get_db)):
    office = db.query(DBOfficeSettings).filter(DBOfficeSettings.id == office_id).first()
    if not office:
        raise HTTPException(status_code=404, detail="Office settings not found")
    
    # Map React Native camelCase back to snake_case properties
    mapping = {
        "officeName": "office_name",
        "vegPrice": "veg_price",
        "nonVegPrice": "non_veg_price",
        "cutoffTime": "cutoff_time",
        "autoDefaultEnabled": "auto_default_enabled",
    }
    
    for key, val in data.items():
        mapped_key = mapping.get(key, key)
        if hasattr(office, mapped_key):
            setattr(office, mapped_key, val)
    db.commit()
    return {"status": "success"}

# ── Meals Endpoints ────────────────────────────────────────────────────

@app.post("/api/meals/confirm")
def confirm_meal(data: MealConfirmSchema, db: Session = Depends(get_db)):
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    meal_id = f"{data.user_id}_{date_str}"
    
    # Check if meal already logged today
    meal = db.query(DBMeal).filter(DBMeal.id == meal_id).first()
    status_str = "skipped" if data.meal_type == "skip" else "confirmed"
    meal_price = 0 if data.meal_type == "skip" else data.price

    if meal:
        meal.meal_type = data.meal_type
        meal.status = status_str
        meal.price = meal_price
        meal.confirmed_at = datetime.datetime.utcnow()
    else:
        meal = DBMeal(
            id=meal_id,
            user_id=data.user_id,
            user_name=data.user_name,
            office_id=data.office_id,
            date=date_str,
            meal_type=data.meal_type,
            status=status_str,
            price=meal_price,
        )
        db.add(meal)
    db.commit()
    return {"status": "success", "mealId": meal_id}

@app.get("/api/meals/today/{user_id}")
def get_today_meal(user_id: str, db: Session = Depends(get_db)):
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    meal = db.query(DBMeal).filter(DBMeal.user_id == user_id, DBMeal.date == date_str).first()
    if not meal:
        return None
    return {
        "id": meal.id,
        "userId": meal.user_id,
        "userName": meal.user_name,
        "officeId": meal.office_id,
        "date": meal.date,
        "mealType": meal.meal_type,
        "status": meal.status,
        "price": meal.price,
        "confirmedAt": meal.confirmed_at,
        "isAutoDefaulted": meal.is_auto_defaulted,
    }

@app.get("/api/meals/history/{user_id}")
def get_user_meals(user_id: str, startDate: str, endDate: str, db: Session = Depends(get_db)):
    meals = db.query(DBMeal).filter(
        DBMeal.user_id == user_id, 
        DBMeal.date >= startDate, 
        DBMeal.date <= endDate
    ).order_by(DBMeal.date.desc()).all()
    
    return [{
        "id": m.id,
        "userId": m.user_id,
        "userName": m.user_name,
        "officeId": m.office_id,
        "date": m.date,
        "mealType": m.meal_type,
        "status": m.status,
        "price": m.price,
        "confirmedAt": m.confirmed_at,
        "isAutoDefaulted": m.is_auto_defaulted,
    } for m in meals]

@app.get("/api/meals/office/{office_id}/today-orders")
def get_today_orders(office_id: str, db: Session = Depends(get_db)):
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    meals = db.query(DBMeal).filter(DBMeal.office_id == office_id, DBMeal.date == date_str).order_by(DBMeal.confirmed_at.desc()).all()
    
    return [{
        "id": m.id,
        "userId": m.user_id,
        "userName": m.user_name,
        "officeId": m.office_id,
        "date": m.date,
        "mealType": m.meal_type,
        "status": m.status,
        "price": m.price,
        "confirmedAt": m.confirmed_at,
        "isAutoDefaulted": m.is_auto_defaulted,
    } for m in meals]

# ── Payments Endpoints ─────────────────────────────────────────────────

@app.post("/api/payments/create")
def create_payment(data: PaymentCreateSchema, db: Session = Depends(get_db)):
    pid = str(uuid.uuid4())
    payment = DBPayment(
        id=pid,
        user_id=data.user_id,
        user_name=data.user_name,
        office_id=data.office_id,
        amount=data.amount,
        week_start=data.week_start,
    )
    db.add(payment)
    db.commit()
    return {"status": "success", "paymentId": pid}

@app.post("/api/payments/{payment_id}/verify")
def verify_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(DBPayment).filter(DBPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    payment.payment_status = "paid"
    payment.marked_paid_by_admin = True
    db.commit()
    return {"status": "success"}

@app.get("/api/payments/user/{user_id}")
def get_user_payments(user_id: str, db: Session = Depends(get_db)):
    payments = db.query(DBPayment).filter(DBPayment.user_id == user_id).order_by(DBPayment.created_at.desc()).all()
    return [{
        "id": p.id,
        "userId": p.user_id,
        "userName": p.user_name,
        "officeId": p.office_id,
        "amount": p.amount,
        "weekStart": p.week_start,
        "paymentStatus": p.payment_status,
        "markedPaidByAdmin": p.marked_paid_by_admin,
        "createdAt": p.created_at,
    } for p in payments]

@app.get("/api/payments/office/{office_id}")
def get_office_payments(office_id: str, db: Session = Depends(get_db)):
    payments = db.query(DBPayment).filter(DBPayment.office_id == office_id).order_by(DBPayment.created_at.desc()).all()
    return [{
        "id": p.id,
        "userId": p.user_id,
        "userName": p.user_name,
        "officeId": p.office_id,
        "amount": p.amount,
        "weekStart": p.week_start,
        "paymentStatus": p.payment_status,
        "markedPaidByAdmin": p.marked_paid_by_admin,
        "createdAt": p.created_at,
    } for p in payments]

# ── Admin Panel Endpoints ──────────────────────────────────────────────

@app.get("/api/admin/{office_id}/dashboard-stats")
def get_dashboard_stats(office_id: str, totalUsers: int, db: Session = Depends(get_db)):
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    meals = db.query(DBMeal).filter(DBMeal.office_id == office_id, DBMeal.date == date_str).all()
    
    veg_count = len([m for m in meals if m.meal_type == "veg"])
    non_veg_count = len([m for m in meals if m.meal_type == "non-veg"])
    skipped_count = len([m for m in meals if m.meal_type == "skip"])
    total_orders = veg_count + non_veg_count
    responded_count = len(meals)
    pending_count = max(0, totalUsers - responded_count)
    today_revenue = sum([m.price for m in meals])
    response_rate = int((responded_count / totalUsers) * 100) if totalUsers > 0 else 0
    
    return {
        "totalOrders": total_orders,
        "vegCount": veg_count,
        "nonVegCount": non_veg_count,
        "skippedCount": skipped_count,
        "pendingCount": pending_count,
        "todayRevenue": today_revenue,
        "responseRate": response_rate,
    }

@app.get("/api/admin/{office_id}/users")
def get_active_users(office_id: str, db: Session = Depends(get_db)):
    users = db.query(DBUser).filter(DBUser.office_id == office_id, DBUser.is_active == True).order_by(DBUser.name).all()
    return [{
        "id": u.id,
        "name": u.name,
        "phone": u.phone,
        "email": u.email,
        "role": u.role,
        "officeId": u.office_id,
        "defaultMealPreference": u.default_meal_preference,
        "isActive": u.is_active,
    } for u in users]

# ── RUN SERVER ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # Start web server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
