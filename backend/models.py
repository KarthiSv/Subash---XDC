from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


# ===== Auth =====
class AdminLogin(BaseModel):
    email: str
    password: str


class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    email: str


# ===== Content =====
class ContentBlock(BaseModel):
    key: str
    value: str
    label: str = ""
    section: str = "general"
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ContentUpdate(BaseModel):
    value: str


# ===== Dance Classes =====
class DanceClassCreate(BaseModel):
    name: str
    description: str
    image: str = ""
    schedule: str = ""
    level: str = "All Levels"


class DanceClassModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image: str = ""
    schedule: str = ""
    level: str = "All Levels"
    is_active: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ===== Dance Services =====
class DanceServiceCreate(BaseModel):
    title: str
    description: str
    for_whom: str = ""
    icon: str = "Music"
    image: str = ""


class DanceServiceModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    for_whom: str = ""
    icon: str = "Music"
    image: str = ""
    is_active: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ===== Costumes =====
class CostumeCreate(BaseModel):
    name: str
    category: str
    price: str
    image: str = ""
    description: str = ""


class CostumeModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: str
    image: str = ""
    description: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ===== Gallery =====
class GalleryImage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    src: str
    caption: str = ""
    category: str = "General"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ===== Bookings =====
class BookingCreate(BaseModel):
    name: str
    phone: str
    email: str = ""
    service_type: str
    message: str = ""


class BookingModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: str = ""
    service_type: str
    message: str = ""
    status: str = "new"
    created_at: datetime = Field(default_factory=datetime.utcnow)
