from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Umroh Hemat API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PackageItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: int  # in rupiah
    duration: str  # e.g., "10 Hari 9 Malam"
    package_type: str  # "umrah" or "tour"
    departure_city: str
    departure_date: str
    airline: str
    hotel: str
    hotel_rating: int
    facilities: List[str]
    itinerary: List[str]
    image_url: str
    availability: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PackageCreate(BaseModel):
    name: str
    description: str
    price: int
    duration: str
    package_type: str
    departure_city: str
    departure_date: str
    airline: str
    hotel: str
    hotel_rating: int
    facilities: List[str]
    itinerary: List[str]
    image_url: str
    availability: int

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    package_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    num_passengers: int
    total_price: int
    payment_status: str  # "pending", "completed", "failed"
    booking_status: str  # "confirmed", "cancelled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    package_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    num_passengers: int

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    user_id: str
    amount: int
    payment_method: str  # "bank_transfer", "credit_card", "e_wallet"
    payment_status: str  # "pending", "completed", "failed"
    transaction_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class PaymentCreate(BaseModel):
    booking_id: str
    payment_method: str

class Wishlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    package_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

async def get_current_user(authorization: Optional[str] = None, session_token: Optional[str] = None) -> Optional[User]:
    """Get current user from session token"""
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    
    if not token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one({
        "session_token": token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not session:
        return None
    
    # Find user
    user_doc = await db.users.find_one({"_id": session["user_id"]})
    if not user_doc:
        return None
    
    user_doc["id"] = user_doc.pop("_id")
    return User(**user_doc)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def process_session(request: Request, x_session_id: str = Header(None)):
    """Process Emergent Auth session ID"""
    try:
        if not x_session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Call Emergent Auth to get session data
        emergent_auth_url = os.environ.get('EMERGENT_AUTH_URL', 'https://demobackend.emergentagent.com')
        response = requests.get(
            f"{emergent_auth_url}/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session_data = response.json()
        
        # Check if user exists
        user_doc = await db.users.find_one({"_id": session_data["email"]})
        
        if not user_doc:
            # Create new user
            new_user = {
                "_id": session_data["email"],
                "email": session_data["email"],
                "name": session_data["name"],
                "picture": session_data.get("picture"),
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
        
        # Create session
        session_token = session_data["session_token"]
        user_session = {
            "user_id": session_data["email"],
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(user_session)
        
        return {
            "user": {
                "id": session_data["email"],
                "email": session_data["email"],
                "name": session_data["name"],
                "picture": session_data.get("picture")
            },
            "session_token": session_token
        }
        
    except Exception as e:
        logger.error(f"Session processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """Get current user info"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user"""
    if authorization:
        token = authorization.replace("Bearer ", "")
        await db.user_sessions.delete_one({"session_token": token})
    return {"message": "Logged out successfully"}

# ==================== PACKAGE ENDPOINTS ====================

@api_router.get("/packages", response_model=List[PackageItem])
async def get_packages(
    package_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    departure_city: Optional[str] = None
):
    """Get all packages with optional filters"""
    query = {}
    if package_type:
        query["package_type"] = package_type
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if departure_city:
        query["departure_city"] = departure_city
    
    packages = await db.packages.find(query).to_list(100)
    return [PackageItem(**pkg) for pkg in packages]

@api_router.get("/packages/{package_id}", response_model=PackageItem)
async def get_package(package_id: str):
    """Get single package by ID"""
    package = await db.packages.find_one({"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return PackageItem(**package)

@api_router.post("/packages", response_model=PackageItem)
async def create_package(package: PackageCreate):
    """Create new package (admin only)"""
    package_dict = package.dict()
    package_obj = PackageItem(**package_dict)
    await db.packages.insert_one(package_obj.dict())
    return package_obj

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate, authorization: Optional[str] = Header(None)):
    """Create new booking"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get package
    package = await db.packages.find_one({"id": booking.package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Calculate total price
    total_price = package["price"] * booking.num_passengers
    
    # Create booking
    booking_dict = booking.dict()
    booking_dict["user_id"] = user.id
    booking_dict["total_price"] = total_price
    booking_dict["payment_status"] = "pending"
    booking_dict["booking_status"] = "confirmed"
    
    booking_obj = Booking(**booking_dict)
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_user_bookings(authorization: Optional[str] = Header(None)):
    """Get user's bookings"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    bookings = await db.bookings.find({"user_id": user.id}).to_list(100)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, authorization: Optional[str] = Header(None)):
    """Get single booking"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user.id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

# ==================== PAYMENT ENDPOINTS (MOCK) ====================

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate, authorization: Optional[str] = Header(None)):
    """Create payment (mock)"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get booking
    booking = await db.bookings.find_one({"id": payment.booking_id, "user_id": user.id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create payment
    payment_obj = Payment(
        booking_id=payment.booking_id,
        user_id=user.id,
        amount=booking["total_price"],
        payment_method=payment.payment_method,
        payment_status="pending",
        transaction_id=f"TRX-{uuid.uuid4().hex[:12].upper()}"
    )
    
    await db.payments.insert_one(payment_obj.dict())
    return payment_obj

@api_router.post("/payments/{payment_id}/complete")
async def complete_payment(payment_id: str, authorization: Optional[str] = Header(None)):
    """Complete payment (mock - simulate successful payment)"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get payment
    payment = await db.payments.find_one({"id": payment_id, "user_id": user.id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment status
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "payment_status": "completed",
            "completed_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update booking payment status
    await db.bookings.update_one(
        {"id": payment["booking_id"]},
        {"$set": {"payment_status": "completed"}}
    )
    
    return {"message": "Payment completed successfully"}

@api_router.get("/payments/{payment_id}")
async def get_payment(payment_id: str, authorization: Optional[str] = Header(None)):
    """Get payment details"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payment = await db.payments.find_one({"id": payment_id, "user_id": user.id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return Payment(**payment)

# ==================== WISHLIST ENDPOINTS ====================

@api_router.post("/wishlist")
async def add_to_wishlist(package_id: str, authorization: Optional[str] = Header(None)):
    """Add package to wishlist"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if already in wishlist
    existing = await db.wishlist.find_one({"user_id": user.id, "package_id": package_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in wishlist")
    
    wishlist_item = Wishlist(user_id=user.id, package_id=package_id)
    await db.wishlist.insert_one(wishlist_item.dict())
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{package_id}")
async def remove_from_wishlist(package_id: str, authorization: Optional[str] = Header(None)):
    """Remove package from wishlist"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.wishlist.delete_one({"user_id": user.id, "package_id": package_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found in wishlist")
    return {"message": "Removed from wishlist"}

@api_router.get("/wishlist", response_model=List[str])
async def get_wishlist(authorization: Optional[str] = Header(None)):
    """Get user's wishlist"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    wishlist = await db.wishlist.find({"user_id": user.id}).to_list(100)
    return [item["package_id"] for item in wishlist]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial package data"""
    # Check if already seeded
    existing = await db.packages.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    # Umrah packages
    umrah_packages = [
        {
            "id": str(uuid.uuid4()),
            "name": "Umrah Spesial Liburan Akhir Tahun",
            "description": "Paket Umrah 11 hari dengan fasilitas lengkap termasuk city tour Hainan",
            "price": 27500000,
            "duration": "11 Hari",
            "package_type": "umrah",
            "departure_city": "Jakarta",
            "departure_date": "Desember 2025",
            "airline": "Garuda Indonesia",
            "hotel": "Zowr Al Baith & Grand Zowr",
            "hotel_rating": 4,
            "facilities": ["Tiket Pesawat", "Visa", "Transportasi", "City Tour", "Makan", "Hotel Bintang 4", "Pembimbing Ustadz"],
            "itinerary": [
                "Hari 1-2: Penerbangan Jakarta - Mekkah",
                "Hari 3-7: Ibadah Umrah di Mekkah",
                "Hari 8-10: Ziarah di Madinah",
                "Hari 11: Kepulangan"
            ],
            "image_url": "https://customer-assets.emergentagent.com/job_79e30beb-e67a-407d-a760-de0870f79c88/artifacts/q16s8grd_WhatsApp%20Image%202025-11-11%20at%2009.18.26.jpeg",
            "availability": 20,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Umrah Awal Ramadhan",
            "description": "Paket Umrah 11 hari khusus awal Ramadhan dengan pembimbing berpengalaman",
            "price": 25900000,
            "duration": "11 Hari",
            "package_type": "umrah",
            "departure_city": "Jakarta",
            "departure_date": "Maret 2026",
            "airline": "Saudia Airlines",
            "hotel": "Zowr Al Baith & Grand Zowr",
            "hotel_rating": 4,
            "facilities": ["Tiket Pesawat", "Visa", "Transportasi", "City Tour", "Makan", "Hotel Bintang 4", "Pembimbing Ustadz Abu Nabilah"],
            "itinerary": [
                "Hari 1-2: Penerbangan Jakarta - Mekkah",
                "Hari 3-7: Ibadah Umrah di Mekkah (Quad Room)",
                "Hari 8-10: Ziarah di Madinah",
                "Hari 11: Kepulangan"
            ],
            "image_url": "https://customer-assets.emergentagent.com/job_79e30beb-e67a-407d-a760-de0870f79c88/artifacts/brglhk86_WhatsApp%20Image%202025-11-11%20at%2009.18.28%20%281%29.jpeg",
            "availability": 25,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Umrah Hemat Plus Turki",
            "description": "Paket Umrah 14 hari dengan bonus city tour Istanbul, Turki",
            "price": 35000000,
            "duration": "14 Hari",
            "package_type": "umrah",
            "departure_city": "Jakarta",
            "departure_date": "April 2026",
            "airline": "Turkish Airlines",
            "hotel": "Hotel Bintang 5",
            "hotel_rating": 5,
            "facilities": ["Tiket Pesawat", "Visa", "Transportasi", "City Tour Istanbul", "Makan", "Hotel Bintang 5"],
            "itinerary": [
                "Hari 1-2: Jakarta - Istanbul (Transit)",
                "Hari 3-4: City Tour Istanbul",
                "Hari 5-9: Ibadah Umrah di Mekkah",
                "Hari 10-13: Ziarah di Madinah",
                "Hari 14: Kepulangan"
            ],
            "image_url": "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800",
            "availability": 15,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # General tour packages
    tour_packages = [
        {
            "id": str(uuid.uuid4()),
            "name": "Tour Dieng",
            "description": "Paket tour Dieng 3 hari 2 malam dengan pemandangan indah",
            "price": 1500000,
            "duration": "3 Hari 2 Malam",
            "package_type": "tour",
            "departure_city": "Semarang",
            "departure_date": "Setiap Weekend",
            "airline": "Bus Pariwisata",
            "hotel": "Hotel Dieng",
            "hotel_rating": 3,
            "facilities": ["Transportasi", "Hotel", "Makan", "Guide", "Tiket Wisata"],
            "itinerary": [
                "Hari 1: Penjemputan - Perjalanan ke Dieng",
                "Hari 2: Kawah Sikidang - Telaga Warna - Candi Arjuna",
                "Hari 3: Sunrise Sikunir - Kepulangan"
            ],
            "image_url": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800",
            "availability": 30,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bali Paradise Tour",
            "description": "Paket tour Bali 4 hari 3 malam mengunjungi tempat wisata terbaik",
            "price": 3500000,
            "duration": "4 Hari 3 Malam",
            "package_type": "tour",
            "departure_city": "Jakarta",
            "departure_date": "Setiap Hari",
            "airline": "Garuda Indonesia",
            "hotel": "Hotel Bintang 4",
            "hotel_rating": 4,
            "facilities": ["Tiket Pesawat", "Hotel", "Transportasi", "Makan", "Guide", "Tiket Wisata"],
            "itinerary": [
                "Hari 1: Jakarta - Bali, Check-in Hotel",
                "Hari 2: Tanah Lot - Uluwatu - Jimbaran",
                "Hari 3: Ubud - Tegalalang - Kintamani",
                "Hari 4: Free Time - Kepulangan"
            ],
            "image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
            "availability": 25,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Thailand Bangkok-Pattaya",
            "description": "Tour Bangkok-Pattaya 5 hari 4 malam dengan fasilitas lengkap",
            "price": 6500000,
            "duration": "5 Hari 4 Malam",
            "package_type": "tour",
            "departure_city": "Jakarta",
            "departure_date": "Setiap Minggu",
            "airline": "Thai Airways",
            "hotel": "Hotel Bintang 4",
            "hotel_rating": 4,
            "facilities": ["Tiket Pesawat", "Visa", "Hotel", "Transportasi", "Makan", "Guide"],
            "itinerary": [
                "Hari 1: Jakarta - Bangkok, City Tour",
                "Hari 2: Grand Palace - Wat Arun - Floating Market",
                "Hari 3: Bangkok - Pattaya, Alcazar Show",
                "Hari 4: Coral Island - Pattaya Beach",
                "Hari 5: Shopping - Kepulangan"
            ],
            "image_url": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
            "availability": 20,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    all_packages = umrah_packages + tour_packages
    await db.packages.insert_many(all_packages)
    
    return {"message": f"Seeded {len(all_packages)} packages"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://umroh-hemat.stage-preview.emergentagent.com",
        "*"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
