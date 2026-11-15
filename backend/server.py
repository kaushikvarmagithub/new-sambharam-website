from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import asyncio
import logging
import shutil
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import resend
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Config ----------
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(hours=8)
UPLOAD_DIR = ROOT_DIR / "uploads"
REEL_UPLOAD_DIR = UPLOAD_DIR / "reels"
REEL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_REEL_BYTES = 60 * 1024 * 1024  # 60 MB
ALLOWED_VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v"}

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

resend.api_key = os.environ.get("RESEND_API_KEY", "")

app = FastAPI(title="Sambhrama API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("sambhrama")


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + ACCESS_TOKEN_TTL,
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Admin not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def send_booking_email(booking: dict) -> None:
    if not resend.api_key:
        logger.info("RESEND_API_KEY not set — skipping email notification")
        return
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@sambhrama.com")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    sender_name = os.environ.get("SENDER_NAME", "Sambhrama")
    from_addr = f"{sender_name} <{sender}>"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#BE123C;">New Inquiry — Sambhrama</h2>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td><b>Name</b></td><td>{booking.get('name','')}</td></tr>
        <tr><td><b>Email</b></td><td>{booking.get('email','')}</td></tr>
        <tr><td><b>Phone</b></td><td>{booking.get('phone','')}</td></tr>
        <tr><td><b>Event Type</b></td><td>{booking.get('event_type','')}</td></tr>
        <tr><td><b>Event Date</b></td><td>{booking.get('event_date','')}</td></tr>
        <tr><td><b>Location</b></td><td>{booking.get('location','')}</td></tr>
        <tr><td><b>Guest Count</b></td><td>{booking.get('guest_count','')}</td></tr>
        <tr><td><b>Budget</b></td><td>{booking.get('budget','')}</td></tr>
        <tr><td><b>Message</b></td><td>{booking.get('message','')}</td></tr>
      </table>
    </div>
    """
    params = {
        "from": from_addr,
        "to": [admin_email],
        "reply_to": booking.get("email") or None,
        "subject": f"New {booking.get('event_type','Event')} Inquiry from {booking.get('name','')}",
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = (result or {}).get("id") if isinstance(result, dict) else None
        logger.info("Booking notification email sent to %s | resend_id=%s", admin_email, email_id)
    except Exception as e:
        logger.error("Failed to send booking email: %s", e)


async def send_client_confirmation_email(booking: dict) -> None:
    if not resend.api_key:
        return
    client_email = booking.get("email")
    if not client_email:
        return
    client_sender = os.environ.get(
        "CLIENT_SENDER_EMAIL", os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    )
    sender_name = os.environ.get("SENDER_NAME", "Sambhrama")
    admin_reply_to = os.environ.get("ADMIN_EMAIL", "contact@sambhrama.co")
    from_addr = f"{sender_name} <{client_sender}>"
    name = (booking.get("name") or "").split(" ")[0] or "there"

    def row(label, value):
        return f'<tr><td style="padding:6px 12px 6px 0;color:#78716c;font-size:13px;">{label}</td><td style="padding:6px 0;color:#1c1917;font-size:14px;">{value or "—"}</td></tr>'

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; color:#1c1917;">
      <div style="padding:32px 0 24px;border-bottom:1px solid #e7e5e4;">
        <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:-0.5px;">Sambhrama</div>
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a8a29e;margin-top:6px;">Celebrate</div>
      </div>
      <div style="padding:32px 0;">
        <h2 style="font-family:Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 16px;font-weight:normal;">
          Thank you, {name}.
        </h2>
        <p style="font-size:15px;line-height:1.65;color:#44403c;margin:0 0 14px;">
          We've received your inquiry and a senior producer will reach out
          within <b>24 hours</b> with availability, initial ideas, and a tailored plan.
        </p>
        <p style="font-size:15px;line-height:1.65;color:#44403c;margin:0 0 24px;">
          In the meantime, here's what you sent us:
        </p>
        <table style="width:100%;border-collapse:collapse;background:#fafaf9;border:1px solid #e7e5e4;border-radius:4px;">
          <tbody>
            {row("Event type", booking.get('event_type'))}
            {row("Event date", booking.get('event_date'))}
            {row("Location", booking.get('location'))}
            {row("Guest count", booking.get('guest_count'))}
            {row("Budget", booking.get('budget'))}
            {row("Phone", booking.get('phone'))}
            {row("Your note", booking.get('message'))}
          </tbody>
        </table>
        <p style="font-size:14px;line-height:1.65;color:#57534e;margin:28px 0 0;">
          If anything above is wrong, just reply to this email — it goes
          straight to our team.
        </p>
      </div>
      <div style="padding:20px 0;border-top:1px solid #e7e5e4;font-size:12px;color:#a8a29e;">
        Sambhrama Events · Bengaluru, India<br>
        <a href="mailto:{admin_reply_to}" style="color:#a8a29e;text-decoration:underline;">{admin_reply_to}</a>
      </div>
    </div>
    """
    params = {
        "from": from_addr,
        "to": [client_email],
        "reply_to": admin_reply_to,
        "subject": "We've received your inquiry — Sambhrama",
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = (result or {}).get("id") if isinstance(result, dict) else None
        logger.info(
            "Client confirmation email sent to %s | resend_id=%s", client_email, email_id
        )
    except Exception as e:
        logger.error("Failed to send client confirmation email: %s", e)


# ---------- Models ----------
class LoginRequest(BaseModel):
    # `email` here is the login identifier; not validated as a real email so
    # admins can use a non-email username like "sambhrama@2026".
    email: str
    password: str


class AdminUser(BaseModel):
    id: str
    email: str
    name: str
    role: str


_EVENT_CATEGORIES = Literal[
    "Wedding",
    "Sangeet",
    "Haldi",
    "Mehendi",
    "Birthday",
    "Corporate Event",
    "Festival",
    "Conference",
    "Pooja",
]


class BookingCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_type: Literal[
        "Wedding",
        "Sangeet",
        "Haldi",
        "Mehendi",
        "Birthday",
        "Corporate Event",
        "Festival",
        "Conference",
        "Pooja",
        "Other",
    ]
    event_date: Optional[str] = None
    location: Optional[str] = None
    guest_count: Optional[int] = None
    budget: Optional[str] = None
    name: str
    email: EmailStr
    phone: str
    message: Optional[str] = ""


class Booking(BookingCreate):
    id: str
    status: str = "new"
    created_at: str


class BookingStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "confirmed", "completed", "cancelled"]


class PortfolioItem(BaseModel):
    id: str
    title: str
    category: _EVENT_CATEGORIES
    image_url: str
    description: str
    date: Optional[str] = None
    location: Optional[str] = ""
    long_description: Optional[str] = ""
    highlights: Optional[List[str]] = []
    gallery: Optional[List[str]] = []
    guest_count: Optional[int] = None
    display_order: int = 0
    created_at: str


class PortfolioCreate(BaseModel):
    title: str
    category: _EVENT_CATEGORIES
    image_url: str
    description: str
    date: Optional[str] = None
    location: Optional[str] = ""
    long_description: Optional[str] = ""
    highlights: Optional[List[str]] = []
    gallery: Optional[List[str]] = []
    guest_count: Optional[int] = None


class PortfolioReorder(BaseModel):
    order: List[str]  # ordered list of portfolio item ids; first id => position 0


class Testimonial(BaseModel):
    id: str
    quote: str
    author: str
    role: str
    rating: int = 5
    created_at: str


class TestimonialCreate(BaseModel):
    quote: str
    author: str
    role: str
    rating: int = 5


class Vendor(BaseModel):
    id: str
    name: str
    category: str
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    service_description: Optional[str] = ""
    created_at: str


class VendorCreate(BaseModel):
    name: str
    category: str
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    service_description: Optional[str] = ""


class NewsletterSignup(BaseModel):
    email: EmailStr


class Reel(BaseModel):
    id: str
    video_url: str
    caption: Optional[str] = ""
    posted_date: Optional[str] = None
    order_index: int = 0
    created_at: str


class ReelUpdate(BaseModel):
    caption: Optional[str] = None
    video_url: Optional[str] = None
    posted_date: Optional[str] = None
    order_index: Optional[int] = None



# ---------- Public routes ----------
@api.get("/")
async def root():
    return {"name": "Sambhrama API", "status": "ok"}


@api.get("/health")
async def health():
    return {"status": "ok", "time": now_iso()}


@api.post("/bookings", response_model=Booking, status_code=201)
async def create_booking(payload: BookingCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "new"
    doc["created_at"] = now_iso()
    await db.bookings.insert_one(doc.copy())
    asyncio.create_task(send_booking_email(doc))
    asyncio.create_task(send_client_confirmation_email(doc))
    return Booking(**{k: v for k, v in doc.items() if k != "_id"})


@api.get("/portfolio", response_model=List[PortfolioItem])
async def list_portfolio(category: Optional[str] = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    items = (
        await db.portfolio.find(query, {"_id": 0})
        .sort([("display_order", 1), ("created_at", -1)])
        .to_list(200)
    )
    # Fill in default display_order for any legacy doc missing the field
    for it in items:
        it.setdefault("display_order", 0)
    return items


@api.get("/portfolio/{item_id}", response_model=PortfolioItem)
async def get_portfolio_item(item_id: str):
    item = await db.portfolio.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Portfolio item not found")
    return item


@api.get("/testimonials", response_model=List[Testimonial])
async def list_testimonials():
    items = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api.get("/vendors", response_model=List[Vendor])
async def list_vendors_public():
    items = await db.vendors.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.post("/newsletter", status_code=201)
async def newsletter_signup(payload: NewsletterSignup):
    existing = await db.newsletter.find_one({"email": payload.email.lower()})
    if existing:
        return {"success": True, "message": "Already subscribed"}
    await db.newsletter.insert_one(
        {"id": str(uuid.uuid4()), "email": payload.email.lower(), "created_at": now_iso()}
    )
    return {"success": True, "message": "Subscribed"}


@api.get("/reels", response_model=List[Reel])
async def list_reels():
    items = await db.reels.find({}, {"_id": 0}).sort([("order_index", 1), ("created_at", -1)]).to_list(100)
    return items


# ---------- Auth ----------
@api.post("/auth/login", response_model=AdminUser)
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    token = create_access_token(user["id"], user["email"])
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=int(ACCESS_TOKEN_TTL.total_seconds()),
        path="/",
    )
    return AdminUser(id=user["id"], email=user["email"], name=user["name"], role=user["role"])


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api.get("/auth/me", response_model=AdminUser)
async def me(user: dict = Depends(get_current_admin)):
    return AdminUser(**user)


# ---------- Admin routes ----------
admin_router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_admin)])


@admin_router.get("/bookings", response_model=List[Booking])
async def admin_list_bookings():
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@admin_router.put("/bookings/{booking_id}", response_model=Booking)
async def admin_update_booking(booking_id: str, payload: BookingStatusUpdate):
    result = await db.bookings.find_one_and_update(
        {"id": booking_id},
        {"$set": {"status": payload.status}},
        projection={"_id": 0},
        return_document=True,
    )
    if not result:
        raise HTTPException(404, "Booking not found")
    return result


@admin_router.delete("/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str):
    res = await db.bookings.delete_one({"id": booking_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Booking not found")
    return {"success": True}


# Portfolio CRUD
@admin_router.post("/portfolio", response_model=PortfolioItem, status_code=201)
async def admin_create_portfolio(payload: PortfolioCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    # New items go to the END of the list by default — find current max
    last = await db.portfolio.find({}, {"display_order": 1}).sort(
        "display_order", -1
    ).limit(1).to_list(1)
    next_order = (last[0].get("display_order", 0) + 10) if last else 0
    doc["display_order"] = next_order
    await db.portfolio.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@admin_router.post("/portfolio/reorder", response_model=List[PortfolioItem])
async def admin_reorder_portfolio(payload: PortfolioReorder):
    # Assign display_order = index*10 in the order received.
    # Items not in the payload keep their existing order (push them to the bottom).
    seen_ids = list(payload.order)
    if not seen_ids:
        raise HTTPException(400, "order must be a non-empty list of portfolio ids")

    # Verify all ids exist
    found = await db.portfolio.count_documents({"id": {"$in": seen_ids}})
    if found != len(seen_ids):
        raise HTTPException(400, "One or more ids do not exist")

    for idx, item_id in enumerate(seen_ids):
        await db.portfolio.update_one(
            {"id": item_id}, {"$set": {"display_order": idx * 10}}
        )

    items = (
        await db.portfolio.find({}, {"_id": 0})
        .sort([("display_order", 1), ("created_at", -1)])
        .to_list(200)
    )
    for it in items:
        it.setdefault("display_order", 0)
    return items


@admin_router.put("/portfolio/{item_id}", response_model=PortfolioItem)
async def admin_update_portfolio(item_id: str, payload: PortfolioCreate):
    res = await db.portfolio.find_one_and_update(
        {"id": item_id},
        {"$set": payload.model_dump()},
        projection={"_id": 0},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "Item not found")
    return res


@admin_router.delete("/portfolio/{item_id}")
async def admin_delete_portfolio(item_id: str):
    res = await db.portfolio.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"success": True}


# Testimonials CRUD
@admin_router.post("/testimonials", response_model=Testimonial, status_code=201)
async def admin_create_testimonial(payload: TestimonialCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.testimonials.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@admin_router.put("/testimonials/{item_id}", response_model=Testimonial)
async def admin_update_testimonial(item_id: str, payload: TestimonialCreate):
    res = await db.testimonials.find_one_and_update(
        {"id": item_id},
        {"$set": payload.model_dump()},
        projection={"_id": 0},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "Testimonial not found")
    return res


@admin_router.delete("/testimonials/{item_id}")
async def admin_delete_testimonial(item_id: str):
    res = await db.testimonials.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"success": True}


# Vendors CRUD
@admin_router.post("/vendors", response_model=Vendor, status_code=201)
async def admin_create_vendor(payload: VendorCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.vendors.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@admin_router.put("/vendors/{item_id}", response_model=Vendor)
async def admin_update_vendor(item_id: str, payload: VendorCreate):
    res = await db.vendors.find_one_and_update(
        {"id": item_id},
        {"$set": payload.model_dump()},
        projection={"_id": 0},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "Vendor not found")
    return res


@admin_router.delete("/vendors/{item_id}")
async def admin_delete_vendor(item_id: str):
    res = await db.vendors.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Vendor not found")
    return {"success": True}


@admin_router.get("/stats")
async def admin_stats():
    total = await db.bookings.count_documents({})
    new_count = await db.bookings.count_documents({"status": "new"})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})
    vendors = await db.vendors.count_documents({})
    portfolio = await db.portfolio.count_documents({})
    subscribers = await db.newsletter.count_documents({})
    reels = await db.reels.count_documents({})
    return {
        "total_bookings": total,
        "new_bookings": new_count,
        "confirmed_bookings": confirmed,
        "vendors": vendors,
        "portfolio": portfolio,
        "subscribers": subscribers,
        "reels": reels,
    }


def _save_reel_file(upload: UploadFile) -> str:
    """Save uploaded file to /uploads/reels/<uuid><ext> and return the public URL path."""
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXT:
        raise HTTPException(400, f"Unsupported video format. Allowed: {sorted(ALLOWED_VIDEO_EXT)}")
    fname = f"{uuid.uuid4().hex}{ext}"
    fpath = REEL_UPLOAD_DIR / fname
    size = 0
    with fpath.open("wb") as out:
        while chunk := upload.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_REEL_BYTES:
                out.close()
                fpath.unlink(missing_ok=True)
                raise HTTPException(413, f"Video exceeds {MAX_REEL_BYTES // (1024*1024)} MB limit")
            out.write(chunk)
    return f"/api/uploads/reels/{fname}"


@admin_router.post("/reels", response_model=Reel, status_code=201)
async def admin_create_reel(
    caption: str = Form(""),
    posted_date: Optional[str] = Form(None),
    order_index: int = Form(0),
    video_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    final_url = None
    if file is not None and file.filename:
        final_url = await asyncio.to_thread(_save_reel_file, file)
    elif video_url:
        final_url = video_url.strip()
    else:
        raise HTTPException(400, "Either a file upload or a video_url is required")
    doc = {
        "id": str(uuid.uuid4()),
        "video_url": final_url,
        "caption": caption or "",
        "posted_date": posted_date,
        "order_index": int(order_index or 0),
        "created_at": now_iso(),
    }
    await db.reels.insert_one(doc.copy())
    return {k: v for k, v in doc.items() if k != "_id"}


@admin_router.put("/reels/{item_id}", response_model=Reel)
async def admin_update_reel(item_id: str, payload: ReelUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.reels.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Reel not found")
        return existing
    res = await db.reels.find_one_and_update(
        {"id": item_id},
        {"$set": updates},
        projection={"_id": 0},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "Reel not found")
    return res


@admin_router.delete("/reels/{item_id}")
async def admin_delete_reel(item_id: str):
    item = await db.reels.find_one({"id": item_id})
    if not item:
        raise HTTPException(404, "Reel not found")
    # Delete the underlying file if it lives in our uploads dir
    url = item.get("video_url") or ""
    if url.startswith("/api/uploads/reels/"):
        fname = url.rsplit("/", 1)[-1]
        (REEL_UPLOAD_DIR / fname).unlink(missing_ok=True)
    await db.reels.delete_one({"id": item_id})
    return {"success": True}


api.include_router(admin_router)
app.include_router(api)

# Serve uploaded videos under /api/uploads/<...> so they go through the
# Kubernetes ingress (which routes /api/* to the backend on :8001).
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seed ----------
# Sample case studies — one per event type. Presented as concept/sample work
# (since Sambhrama is a new studio with no delivered portfolio yet).
# The admin can replace these with real client work via the dashboard.

_IMG_WEDDING = "https://images.unsplash.com/photo-1760461804456-df82b15b07c0"
_IMG_DANCE = "https://images.unsplash.com/photo-1762708547916-ac8d2f3af1fc"
_IMG_MARIGOLD = "https://images.unsplash.com/photo-1771992226340-2054435618e4"
_IMG_CORPORATE = "https://images.unsplash.com/photo-1762968269894-1d7e1ce8894e"
_IMG_FESTIVAL_LIGHTS = "https://images.unsplash.com/photo-1760965824372-9a2c88fc76a1"
_IMG_FESTIVAL_CROWD = "https://images.unsplash.com/photo-1763630055331-f9042cfa43f3"
_IMG_CONFERENCE = "https://images.unsplash.com/photo-1775163560631-6ff15eb2fa1f"

SEED_PORTFOLIO = [
    {
        "title": "Sample · A South Indian Wedding",
        "category": "Wedding",
        "image_url": _IMG_WEDDING,
        "description": "Multi-day ceremony with every ritual orchestrated to the minute.",
        "date": None,
        "location": "Karnataka",
        "guest_count": 300,
        "long_description": (
            "A sample concept for a four-day South Indian wedding. Sambhrama "
            "would co-build a 40+ event runbook with both families and the "
            "chief priest, then train senior stage managers to follow it to "
            "the minute. We handle catering across all four days, multiple "
            "meal services, and parallel dietary streams — guests miss "
            "nothing. End-to-end planning, vendor sourcing, decor, hospitality, "
            "wardrobe support and day-of orchestration."
        ),
        "highlights": [
            "Detailed multi-day runbook for every ritual",
            "Co-ordinated catering with multiple dietary streams",
            "On-site wardrobe and hospitality team for the families",
            "Festival-grade lighting design for the muhurtham",
        ],
        "gallery": [_IMG_WEDDING, _IMG_DANCE, _IMG_MARIGOLD],
    },
    {
        "title": "Sample · A Sangeet Night",
        "category": "Sangeet",
        "image_url": _IMG_DANCE,
        "description": "An evening of music, choreography and unforgettable family memories.",
        "date": None,
        "location": "Bengaluru",
        "guest_count": 200,
        "long_description": (
            "A sangeet evening built around your family's story. Sambhrama "
            "produces the full night — stage and decor design, lighting, "
            "live band or DJ, choreography support for the family dances, "
            "and a discreet floor coordinator. We rehearse with the dancers, "
            "manage the run-of-show, and surprise the couple with a moment "
            "designed only for them."
        ),
        "highlights": [
            "Custom stage and lighting design",
            "Live band or curated DJ sets",
            "Choreography rehearsals with the families",
            "Tight run-of-show — never feels rushed",
        ],
        "gallery": [_IMG_DANCE, _IMG_FESTIVAL_LIGHTS, _IMG_WEDDING],
    },
    {
        "title": "Sample · A Marigold Haldi",
        "category": "Haldi",
        "image_url": _IMG_MARIGOLD,
        "description": "Sun-drenched morning of turmeric, marigolds and laughter.",
        "date": None,
        "location": "Outdoor courtyard",
        "guest_count": 80,
        "long_description": (
            "Haldi is intimate, joyful and unapologetically yellow. Sambhrama "
            "designs the ceremony in fresh marigolds and brass, frames it for "
            "your photographer, and pre-stages the haldi paste, water, towels "
            "and change-area so nothing interrupts the moment. A small floor "
            "team makes sure everyone gets a turn — including the elders who "
            "shouldn't be running around."
        ),
        "highlights": [
            "Fresh marigold and brass-toned styling",
            "Pre-staged haldi stations + clean-up zones",
            "Quiet floor team — never in the photos",
            "Backup wardrobe and refreshments for guests",
        ],
        "gallery": [_IMG_MARIGOLD, _IMG_WEDDING, _IMG_DANCE],
    },
    {
        "title": "Sample · A Mehendi Afternoon",
        "category": "Mehendi",
        "image_url": _IMG_DANCE,
        "description": "An afternoon of henna, music and slow conversation.",
        "date": None,
        "location": "Garden or rooftop",
        "guest_count": 100,
        "long_description": (
            "Mehendi works best when it feels unhurried. Sambhrama curates "
            "a relaxed, lounge-style setting with low seating, soft sound, "
            "and stations for multiple henna artists so no guest waits. We "
            "build a refreshments bar, plan the lighting for the late "
            "afternoon shift, and keep the music tuned to the mood."
        ),
        "highlights": [
            "Lounge-style low seating and soft sound design",
            "Multiple henna stations — no queues",
            "Curated refreshments and snack bar",
            "Lighting designed for the golden-hour shift",
        ],
        "gallery": [_IMG_DANCE, _IMG_MARIGOLD, _IMG_WEDDING],
    },
    {
        "title": "Sample · Annual Product Launch",
        "category": "Corporate Event",
        "image_url": _IMG_CORPORATE,
        "description": "A cinematic reveal for a brand-defining moment.",
        "date": None,
        "location": "Indoor venue or hotel ballroom",
        "guest_count": 500,
        "long_description": (
            "Sambhrama produces corporate reveals end-to-end. We work with "
            "your CMO to script the keynote, rig the LED wall, light the "
            "stage cinematically and rehearse the cast. Coordination with "
            "press, hospitality for executives, and a precision run-of-show "
            "that lets your founders be the story."
        ),
        "highlights": [
            "Cinematic LED wall with custom motion graphics",
            "Scripted product reveal with rehearsed cast",
            "Press hospitality and executive coordination",
            "Pre-show check-list reviewed three times",
        ],
        "gallery": [_IMG_CORPORATE, _IMG_CONFERENCE, _IMG_FESTIVAL_LIGHTS],
    },
    {
        "title": "Sample · A Cultural Festival",
        "category": "Festival",
        "image_url": _IMG_FESTIVAL_CROWD,
        "description": "Music, lights and ten thousand stories under one sky.",
        "date": None,
        "location": "Outdoor grounds",
        "guest_count": 5000,
        "long_description": (
            "Outdoor festivals are choreography at scale. Sambhrama handles "
            "site planning, power and water distribution, staging, sound, "
            "ticketing, food court layout, and the small army of marshals "
            "needed to keep ten thousand guests safe and smiling. We work "
            "with local authorities for permits and emergency planning."
        ),
        "highlights": [
            "Full site plan — power, water, waste, food",
            "Real-time crowd density monitoring",
            "Permits, emergency and authority coordination",
            "Zero-waste site policy with composting partners",
        ],
        "gallery": [_IMG_FESTIVAL_CROWD, _IMG_FESTIVAL_LIGHTS, _IMG_CORPORATE],
    },
    {
        "title": "Sample · An Industry Summit",
        "category": "Conference",
        "image_url": _IMG_CONFERENCE,
        "description": "Hundreds of delegates, multiple tracks, one calm production.",
        "date": None,
        "location": "Convention centre",
        "guest_count": 800,
        "long_description": (
            "Sambhrama produces summits and symposia for 200 to 12,000 "
            "delegates. We handle stage and AV across multiple tracks, "
            "speaker hospitality, registration flow, signage, badges, "
            "lounges, and a green-room operation that lets speakers focus. "
            "End-to-end delivery from concept and venue scouting through "
            "post-event reporting."
        ),
        "highlights": [
            "Multi-track stages running concurrent sessions",
            "Sub-30 second registration check-in",
            "Speaker green-room and hospitality desk",
            "Branded signage and wayfinding throughout",
        ],
        "gallery": [_IMG_CONFERENCE, _IMG_CORPORATE, _IMG_FESTIVAL_LIGHTS],
    },
    {
        "title": "Sample · A Sacred Pooja",
        "category": "Pooja",
        "image_url": _IMG_MARIGOLD,
        "description": "Auspicious, intimate and held with care to every tradition.",
        "date": None,
        "location": "Home, office or temple",
        "guest_count": 50,
        "long_description": (
            "Whether it is a Satyanarayan, Griha Pravesh, Ayudha Pooja or a "
            "company pooja, Sambhrama prepares the ritual space with care. "
            "We work with your priest, source the puja samagri, design the "
            "mandapam and seating, organise prasad distribution and "
            "coordinate timings so the elders never feel rushed."
        ),
        "highlights": [
            "Co-ordination with your priest and traditions",
            "Fresh flowers, brass and traditional puja samagri",
            "Mandapam and seating designed for elders",
            "Prasad packaging and farewell gifts handled",
        ],
        "gallery": [_IMG_MARIGOLD, _IMG_WEDDING, _IMG_DANCE],
    },
]

SEED_TESTIMONIALS = []

SEED_VENDORS = [
    {
        "name": "Elite Caterers",
        "category": "Catering",
        "contact_email": "hello@elitecaterers.in",
        "contact_phone": "+91 80 4112 0001",
        "service_description": "Full-service multi-cuisine catering with custom regional menus.",
    },
    {
        "name": "Lumen Light & Sound",
        "category": "AV & Production",
        "contact_email": "book@lumenav.in",
        "contact_phone": "+91 80 4112 0002",
        "service_description": "Stage, lighting, audio engineering for events 50–10,000 pax.",
    },
    {
        "name": "Marigold Florals",
        "category": "Floral & Décor",
        "contact_email": "studio@marigoldflorals.in",
        "contact_phone": "+91 80 4112 0003",
        "service_description": "Bespoke floral installations, mandaps, and stage décor.",
    },
    {
        "name": "Frame & Reel",
        "category": "Photography & Film",
        "contact_email": "create@frameandreel.in",
        "contact_phone": "+91 80 4112 0004",
        "service_description": "Cinematic wedding films and corporate event coverage.",
    },
]


async def seed_admin():
    # Login identifier — falls back to ADMIN_EMAIL for backward compatibility.
    username = os.environ.get("ADMIN_USERNAME", os.environ.get("ADMIN_EMAIL", "")).lower().strip()
    password = os.environ["ADMIN_PASSWORD"]
    if not username:
        logger.warning("No ADMIN_USERNAME or ADMIN_EMAIL configured; skipping seed")
        return
    existing = await db.users.find_one({"email": username})
    if not existing:
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": username,
                "name": "Sambhrama Admin",
                "role": "admin",
                "password_hash": hash_password(password),
                "created_at": now_iso(),
            }
        )
        logger.info("Seeded admin %s", username)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": username}, {"$set": {"password_hash": hash_password(password)}}
        )
        logger.info("Updated admin password for %s", username)


async def seed_content():
    # Portfolio: re-seed if collection is empty OR if existing items predate the
    # case-study schema OR don't include the new event categories (Sangeet,
    # Haldi, Mehendi, Pooja).
    needs_portfolio_reseed = False
    if await db.portfolio.count_documents({}) == 0:
        needs_portfolio_reseed = True
    else:
        sample = await db.portfolio.find_one({})
        has_sangeet = await db.portfolio.find_one({"category": "Sangeet"})
        if (sample and "long_description" not in sample) or not has_sangeet:
            await db.portfolio.delete_many({})
            needs_portfolio_reseed = True
    if needs_portfolio_reseed:
        docs = []
        for idx, item in enumerate(SEED_PORTFOLIO):
            d = dict(item)
            d["id"] = str(uuid.uuid4())
            d["created_at"] = now_iso()
            d["display_order"] = idx * 10
            docs.append(d)
        await db.portfolio.insert_many(docs)
        logger.info("Seeded %d portfolio items (sample concepts)", len(docs))

    # Backfill display_order for any portfolio doc missing it (idempotent migration)
    missing = await db.portfolio.find(
        {"display_order": {"$exists": False}}, {"id": 1}
    ).sort("created_at", 1).to_list(500)
    if missing:
        # Find current max so backfilled docs go to the END of the visible order
        last = await db.portfolio.find(
            {"display_order": {"$exists": True}}, {"display_order": 1}
        ).sort("display_order", -1).limit(1).to_list(1)
        next_order = (last[0].get("display_order", 0) + 10) if last else 0
        for i, doc in enumerate(missing):
            await db.portfolio.update_one(
                {"id": doc["id"]},
                {"$set": {"display_order": next_order + i * 10}},
            )
        logger.info("Backfilled display_order on %d legacy portfolio items", len(missing))
    if SEED_TESTIMONIALS and await db.testimonials.count_documents({}) == 0:
        docs = []
        for item in SEED_TESTIMONIALS:
            d = dict(item)
            d["id"] = str(uuid.uuid4())
            d["created_at"] = now_iso()
            docs.append(d)
        await db.testimonials.insert_many(docs)
        logger.info("Seeded %d testimonials", len(docs))


# Vertical demo reels (royalty-free, short, vertical 9:16) — Pexels CDN.
# Admin can delete/replace via dashboard once they have their own footage.
SEED_REELS = [
    {
        "video_url": "https://videos.pexels.com/video-files/4434286/4434286-uhd_2160_3840_30fps.mp4",
        "caption": "An evening of marigolds and music — sample sangeet styling.",
    },
    {
        "video_url": "https://videos.pexels.com/video-files/3209828/3209828-uhd_2160_3840_25fps.mp4",
        "caption": "Sample · A celebratory moment on stage.",
    },
    {
        "video_url": "https://videos.pexels.com/video-files/8412333/8412333-uhd_2160_3840_30fps.mp4",
        "caption": "Floral installation for a haldi morning — sample.",
    },
]


async def seed_reels():
    if await db.reels.count_documents({}) == 0:
        docs = []
        for idx, item in enumerate(SEED_REELS):
            d = dict(item)
            d["id"] = str(uuid.uuid4())
            d["order_index"] = idx
            d["posted_date"] = None
            d["created_at"] = now_iso()
            docs.append(d)
        await db.reels.insert_many(docs)
        logger.info("Seeded %d sample reels", len(docs))
    if await db.vendors.count_documents({}) == 0:
        docs = []
        for item in SEED_VENDORS:
            d = dict(item)
            d["id"] = str(uuid.uuid4())
            d["created_at"] = now_iso()
            docs.append(d)
        await db.vendors.insert_many(docs)
        logger.info("Seeded %d vendors", len(docs))


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.bookings.create_index("created_at")
    await db.portfolio.create_index("category")
    await db.reels.create_index("order_index")
    await seed_admin()
    await seed_content()
    await seed_reels()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
