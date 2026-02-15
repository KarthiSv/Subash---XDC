# API Contracts — XDC Website

## Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/content | Get all editable site content |
| GET | /api/dance-classes | Get all dance classes |
| GET | /api/dance-services | Get all dance services |
| GET | /api/costumes | Get all costumes |
| GET | /api/gallery | Get gallery images (filterable by category) |
| POST | /api/bookings | Submit a booking/enquiry form |

## Admin APIs (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login → JWT token |
| GET | /api/admin/me | Get current admin info |
| PUT | /api/admin/content/:key | Update a content block |
| POST | /api/admin/gallery/upload | Upload image to gallery |
| DELETE | /api/admin/gallery/:id | Delete gallery image |
| POST/PUT/DELETE | /api/admin/dance-classes | CRUD dance classes |
| POST/PUT/DELETE | /api/admin/dance-services | CRUD dance services |
| POST/PUT/DELETE | /api/admin/costumes | CRUD costume listings |

## Data Flow
- Frontend loads data from public APIs on mount (replaces mock.js)
- Admin panel uses protected APIs with JWT in Authorization header
- File uploads stored in /app/backend/uploads/ served via /api/uploads/
- Content changes go live instantly after save
