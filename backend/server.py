from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from auth import get_password_hash
from routes.admin import create_admin_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'xdc_db')]

# Create the main app
app = FastAPI()

# Create base router
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "XDC API - Dance Academy & Costume House"}

# Include admin routes
admin_router = create_admin_routes(db)
app.include_router(admin_router)

# Include base router
app.include_router(api_router)

# Serve uploaded files
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def seed_admin():
    """Seed default admin user if none exists."""
    existing = await db.admin_users.find_one({"email": "admin@xdc.in"})
    if not existing:
        admin = {
            "id": "admin-default",
            "email": "admin@xdc.in",
            "name": "XDC Admin",
            "password_hash": get_password_hash("xdc2025"),
            "role": "admin"
        }
        await db.admin_users.insert_one(admin)
        logger.info("Default admin user created: admin@xdc.in / xdc2025")
    else:
        logger.info("Admin user already exists")


async def seed_content():
    """Seed default editable content blocks."""
    content_blocks = [
        {"key": "hero_badge", "value": "Dance Academy & Costume House — Bangalore", "label": "Hero Badge Text", "section": "homepage"},
        {"key": "hero_title_1", "value": "Dress the", "label": "Hero Title Line 1", "section": "homepage"},
        {"key": "hero_title_2", "value": "Performance.", "label": "Hero Title Line 2 (Gold)", "section": "homepage"},
        {"key": "hero_title_3", "value": "Own the Stage.", "label": "Hero Title Line 3", "section": "homepage"},
        {"key": "hero_description", "value": "Premium dance academy & costume rentals. 3,000+ costumes, 10+ dance styles, professional choreography — serving schools, colleges & events pan-India.", "label": "Hero Description", "section": "homepage"},
        {"key": "contact_email", "value": "company.xdc@gmail.com", "label": "Contact Email", "section": "contact"},
        {"key": "contact_phone", "value": "9074345925", "label": "Contact Phone", "section": "contact"},
        {"key": "contact_whatsapp", "value": "9074345925", "label": "WhatsApp Number", "section": "contact"},
        {"key": "contact_address", "value": "Koramangala, Bangalore, Karnataka 560034, India", "label": "Address", "section": "contact"},
        {"key": "about_text", "value": "What started as a small collection of classical dance costumes has grown into India's most comprehensive dance costume rental service and dance academy.", "label": "About Text", "section": "about"},
        {"key": "announcement", "value": "", "label": "Announcement Banner (leave empty to hide)", "section": "general"},
    ]
    for block in content_blocks:
        existing = await db.content.find_one({"key": block["key"]})
        if not existing:
            await db.content.insert_one(block)
    logger.info("Content blocks seeded")


@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_content()
    logger.info("XDC Backend started successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
