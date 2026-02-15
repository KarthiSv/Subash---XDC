from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import uuid
import os
import aiofiles
from datetime import datetime

from auth import get_current_admin, verify_password, get_password_hash, create_access_token
from models import (
    AdminLogin, TokenResponse, ContentBlock, ContentUpdate,
    DanceClassCreate, DanceClassModel, DanceServiceCreate, DanceServiceModel,
    CostumeCreate, CostumeModel, GalleryImage, BookingCreate, BookingModel
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def create_admin_routes(db):
    router = APIRouter(prefix="/api")

    # ===== AUTH =====
    @router.post("/admin/login", response_model=TokenResponse)
    async def admin_login(data: AdminLogin):
        user = await db.admin_users.find_one({"email": data.email})
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_access_token({"sub": user["email"], "role": user.get("role", "admin")})
        return TokenResponse(access_token=token, name=user["name"], email=user["email"])

    @router.get("/admin/me")
    async def get_me(admin=Depends(get_current_admin)):
        user = await db.admin_users.find_one({"email": admin["email"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"email": user["email"], "name": user["name"], "role": user.get("role", "admin")}

    # ===== CONTENT CMS =====
    @router.get("/content")
    async def get_all_content():
        items = await db.content.find().to_list(100)
        return [{"key": c["key"], "value": c["value"], "label": c.get("label", ""), "section": c.get("section", "general")} for c in items]

    @router.put("/admin/content/{key}")
    async def update_content(key: str, data: ContentUpdate, admin=Depends(get_current_admin)):
        result = await db.content.update_one(
            {"key": key},
            {"$set": {"value": data.value, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"success": True, "key": key}

    # ===== DANCE CLASSES =====
    @router.get("/dance-classes")
    async def get_dance_classes():
        items = await db.dance_classes.find({"is_active": True}).sort("order", 1).to_list(100)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.get("/admin/dance-classes/all")
    async def get_all_dance_classes(admin=Depends(get_current_admin)):
        items = await db.dance_classes.find().sort("order", 1).to_list(100)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.post("/admin/dance-classes")
    async def create_dance_class(data: DanceClassCreate, admin=Depends(get_current_admin)):
        count = await db.dance_classes.count_documents({})
        item = DanceClassModel(**data.dict(), order=count)
        await db.dance_classes.insert_one(item.dict())
        return {**item.dict()}

    @router.put("/admin/dance-classes/{item_id}")
    async def update_dance_class(item_id: str, data: DanceClassCreate, admin=Depends(get_current_admin)):
        result = await db.dance_classes.update_one({"id": item_id}, {"$set": data.dict()})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        return {"success": True}

    @router.delete("/admin/dance-classes/{item_id}")
    async def delete_dance_class(item_id: str, admin=Depends(get_current_admin)):
        await db.dance_classes.delete_one({"id": item_id})
        return {"success": True}

    # ===== DANCE SERVICES =====
    @router.get("/dance-services")
    async def get_dance_services():
        items = await db.dance_services.find({"is_active": True}).sort("order", 1).to_list(100)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.post("/admin/dance-services")
    async def create_dance_service(data: DanceServiceCreate, admin=Depends(get_current_admin)):
        count = await db.dance_services.count_documents({})
        item = DanceServiceModel(**data.dict(), order=count)
        await db.dance_services.insert_one(item.dict())
        return {**item.dict()}

    @router.put("/admin/dance-services/{item_id}")
    async def update_dance_service(item_id: str, data: DanceServiceCreate, admin=Depends(get_current_admin)):
        await db.dance_services.update_one({"id": item_id}, {"$set": data.dict()})
        return {"success": True}

    @router.delete("/admin/dance-services/{item_id}")
    async def delete_dance_service(item_id: str, admin=Depends(get_current_admin)):
        await db.dance_services.delete_one({"id": item_id})
        return {"success": True}

    # ===== COSTUMES =====
    @router.get("/costumes")
    async def get_costumes(category: Optional[str] = None):
        query = {"is_active": True}
        if category and category != "All":
            query["category"] = category
        items = await db.costumes.find(query).to_list(200)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.post("/admin/costumes")
    async def create_costume(data: CostumeCreate, admin=Depends(get_current_admin)):
        item = CostumeModel(**data.dict())
        await db.costumes.insert_one(item.dict())
        return {**item.dict()}

    @router.put("/admin/costumes/{item_id}")
    async def update_costume(item_id: str, data: CostumeCreate, admin=Depends(get_current_admin)):
        await db.costumes.update_one({"id": item_id}, {"$set": data.dict()})
        return {"success": True}

    @router.delete("/admin/costumes/{item_id}")
    async def delete_costume(item_id: str, admin=Depends(get_current_admin)):
        await db.costumes.delete_one({"id": item_id})
        return {"success": True}

    # ===== GALLERY =====
    @router.get("/gallery")
    async def get_gallery(category: Optional[str] = None):
        query = {}
        if category and category != "All":
            query["category"] = category
        items = await db.gallery.find(query).sort("created_at", -1).to_list(200)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.post("/admin/gallery/upload")
    async def upload_gallery_image(
        file: UploadFile = File(...),
        caption: str = Form(""),
        category: str = Form("General"),
        admin=Depends(get_current_admin)
    ):
        ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            await f.write(content)

        backend_url = os.environ.get("BACKEND_URL", "")
        src = f"/api/uploads/{filename}"

        image = GalleryImage(src=src, caption=caption, category=category)
        await db.gallery.insert_one(image.dict())
        return {**image.dict()}

    @router.delete("/admin/gallery/{item_id}")
    async def delete_gallery_image(item_id: str, admin=Depends(get_current_admin)):
        img = await db.gallery.find_one({"id": item_id})
        if img and img.get("src", "").startswith("/api/uploads/"):
            filename = img["src"].replace("/api/uploads/", "")
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        await db.gallery.delete_one({"id": item_id})
        return {"success": True}

    # ===== BOOKINGS =====
    @router.post("/bookings")
    async def create_booking(data: BookingCreate):
        booking = BookingModel(**data.dict())
        await db.bookings.insert_one(booking.dict())
        return {"success": True, "message": "Booking submitted successfully", "id": booking.id}

    @router.get("/admin/bookings")
    async def get_bookings(admin=Depends(get_current_admin)):
        items = await db.bookings.find().sort("created_at", -1).to_list(200)
        return [{**{k: v for k, v in c.items() if k != "_id"}} for c in items]

    @router.put("/admin/bookings/{item_id}/status")
    async def update_booking_status(item_id: str, status: str = "reviewed", admin=Depends(get_current_admin)):
        await db.bookings.update_one({"id": item_id}, {"$set": {"status": status}})
        return {"success": True}

    return router
