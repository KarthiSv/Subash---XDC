#!/usr/bin/env python3
"""
XDC Dance Academy Backend API Testing
Tests all backend endpoints with proper authentication flow
"""

import requests
import json
import uuid
import io
import os
from datetime import datetime


class XDCAPITester:
    def __init__(self):
        self.base_url = "https://xstatic-dance.preview.emergentagent.com/api"
        self.token = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
        
    def log_result(self, test_name, success, details=""):
        """Log test results"""
        if success:
            self.test_results["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {details}")
            print(f"❌ {test_name}: {details}")
    
    def make_request(self, method, endpoint, **kwargs):
        """Make HTTP request with error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            return None
            
    def auth_headers(self):
        """Get authorization headers"""
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    # ===== AUTH TESTS =====
    def test_admin_login(self):
        """Test admin login endpoint"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test login with correct credentials
        login_data = {
            "email": "admin@xdc.in",
            "password": "xdc2025"
        }
        
        response = self.make_request("POST", "/admin/login", json=login_data)
        if not response:
            self.log_result("Admin Login", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and data["access_token"]:
                self.token = data["access_token"]
                self.log_result("Admin Login", True, f"Token: {data['access_token'][:20]}...")
                return True
            else:
                self.log_result("Admin Login", False, "No token in response")
                return False
        else:
            self.log_result("Admin Login", False, f"Status {response.status_code}: {response.text}")
            return False
    
    def test_admin_me(self):
        """Test admin/me endpoint"""
        if not self.token:
            self.log_result("Admin Me", False, "No token available")
            return False
            
        response = self.make_request("GET", "/admin/me", headers=self.auth_headers())
        if not response:
            self.log_result("Admin Me", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if "email" in data and data["email"] == "admin@xdc.in":
                self.log_result("Admin Me", True)
                return True
            else:
                self.log_result("Admin Me", False, "Invalid user data")
                return False
        else:
            self.log_result("Admin Me", False, f"Status {response.status_code}: {response.text}")
            return False

    # ===== CONTENT CMS TESTS =====
    def test_content_cms(self):
        """Test content CMS endpoints"""
        print("\n📝 Testing Content CMS...")
        
        # Test GET content (public)
        response = self.make_request("GET", "/content")
        if not response:
            self.log_result("Get Content", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_result("Get Content", True, f"Found {len(data)} content blocks")
            else:
                self.log_result("Get Content", False, "No content blocks found")
                return False
        else:
            self.log_result("Get Content", False, f"Status {response.status_code}")
            return False
        
        # Test PUT content (requires auth)
        if not self.token:
            self.log_result("Update Content", False, "No token available")
            return False
            
        update_data = {"value": f"Test update {datetime.now().isoformat()}"}
        response = self.make_request("PUT", "/admin/content/hero_badge", 
                                   json=update_data, headers=self.auth_headers())
        if not response:
            self.log_result("Update Content", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            self.log_result("Update Content", True)
            return True
        else:
            self.log_result("Update Content", False, f"Status {response.status_code}: {response.text}")
            return False

    # ===== DANCE CLASSES TESTS =====
    def test_dance_classes_crud(self):
        """Test dance classes CRUD operations"""
        print("\n💃 Testing Dance Classes CRUD...")
        
        # Test GET dance classes (public)
        response = self.make_request("GET", "/dance-classes")
        if not response:
            self.log_result("Get Dance Classes", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            self.log_result("Get Dance Classes", True)
        else:
            self.log_result("Get Dance Classes", False, f"Status {response.status_code}")
            return False
        
        if not self.token:
            self.log_result("Dance Classes CRUD", False, "No token for admin operations")
            return False
        
        # Test POST create dance class
        class_data = {
            "name": f"Test Class {uuid.uuid4().hex[:8]}",
            "description": "Test dance class for API testing",
            "schedule": "Mon/Wed/Fri 7-8 PM",
            "level": "Beginner"
        }
        
        response = self.make_request("POST", "/admin/dance-classes", 
                                   json=class_data, headers=self.auth_headers())
        if not response:
            self.log_result("Create Dance Class", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            created_data = response.json()
            class_id = created_data.get("id")
            if class_id:
                self.log_result("Create Dance Class", True, f"ID: {class_id}")
                
                # Test PUT update dance class
                update_data = {
                    "name": class_data["name"] + " - Updated",
                    "description": "Updated description",
                    "schedule": class_data["schedule"],
                    "level": "Intermediate"
                }
                
                response = self.make_request("PUT", f"/admin/dance-classes/{class_id}", 
                                           json=update_data, headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Update Dance Class", True)
                else:
                    self.log_result("Update Dance Class", False, f"Status {response.status_code if response else 'Connection failed'}")
                
                # Test DELETE dance class
                response = self.make_request("DELETE", f"/admin/dance-classes/{class_id}", 
                                           headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Delete Dance Class", True)
                else:
                    self.log_result("Delete Dance Class", False, f"Status {response.status_code if response else 'Connection failed'}")
            else:
                self.log_result("Create Dance Class", False, "No ID in response")
        else:
            self.log_result("Create Dance Class", False, f"Status {response.status_code}: {response.text}")

    # ===== DANCE SERVICES TESTS =====
    def test_dance_services_crud(self):
        """Test dance services CRUD operations"""
        print("\n🎭 Testing Dance Services CRUD...")
        
        # Test GET dance services (public)
        response = self.make_request("GET", "/dance-services")
        if not response:
            self.log_result("Get Dance Services", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            self.log_result("Get Dance Services", True)
        else:
            self.log_result("Get Dance Services", False, f"Status {response.status_code}")
            return False
        
        if not self.token:
            self.log_result("Dance Services CRUD", False, "No token for admin operations")
            return False
        
        # Test POST create dance service
        service_data = {
            "title": f"Test Service {uuid.uuid4().hex[:8]}",
            "description": "Test dance service for API testing",
            "for_whom": "Schools & Colleges",
            "icon": "Music"
        }
        
        response = self.make_request("POST", "/admin/dance-services", 
                                   json=service_data, headers=self.auth_headers())
        if not response:
            self.log_result("Create Dance Service", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            created_data = response.json()
            service_id = created_data.get("id")
            if service_id:
                self.log_result("Create Dance Service", True, f"ID: {service_id}")
                
                # Test PUT update dance service
                update_data = {
                    "title": service_data["title"] + " - Updated",
                    "description": "Updated service description",
                    "for_whom": "Events & Competitions",
                    "icon": "Star"
                }
                
                response = self.make_request("PUT", f"/admin/dance-services/{service_id}", 
                                           json=update_data, headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Update Dance Service", True)
                else:
                    self.log_result("Update Dance Service", False, f"Status {response.status_code if response else 'Connection failed'}")
                
                # Test DELETE dance service
                response = self.make_request("DELETE", f"/admin/dance-services/{service_id}", 
                                           headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Delete Dance Service", True)
                else:
                    self.log_result("Delete Dance Service", False, f"Status {response.status_code if response else 'Connection failed'}")
            else:
                self.log_result("Create Dance Service", False, "No ID in response")
        else:
            self.log_result("Create Dance Service", False, f"Status {response.status_code}: {response.text}")

    # ===== COSTUMES TESTS =====
    def test_costumes_crud(self):
        """Test costumes CRUD operations"""
        print("\n👗 Testing Costumes CRUD...")
        
        # Test GET costumes (public)
        response = self.make_request("GET", "/costumes")
        if not response:
            self.log_result("Get Costumes", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            self.log_result("Get Costumes", True)
        else:
            self.log_result("Get Costumes", False, f"Status {response.status_code}")
            return False
        
        if not self.token:
            self.log_result("Costumes CRUD", False, "No token for admin operations")
            return False
        
        # Test POST create costume
        costume_data = {
            "name": f"Test Costume {uuid.uuid4().hex[:8]}",
            "category": "Classical",
            "price": "₹2500",
            "description": "Test costume for API testing"
        }
        
        response = self.make_request("POST", "/admin/costumes", 
                                   json=costume_data, headers=self.auth_headers())
        if not response:
            self.log_result("Create Costume", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            created_data = response.json()
            costume_id = created_data.get("id")
            if costume_id:
                self.log_result("Create Costume", True, f"ID: {costume_id}")
                
                # Test PUT update costume
                update_data = {
                    "name": costume_data["name"] + " - Updated",
                    "category": "Folk",
                    "price": "₹3000",
                    "description": "Updated costume description"
                }
                
                response = self.make_request("PUT", f"/admin/costumes/{costume_id}", 
                                           json=update_data, headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Update Costume", True)
                else:
                    self.log_result("Update Costume", False, f"Status {response.status_code if response else 'Connection failed'}")
                
                # Test DELETE costume
                response = self.make_request("DELETE", f"/admin/costumes/{costume_id}", 
                                           headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Delete Costume", True)
                else:
                    self.log_result("Delete Costume", False, f"Status {response.status_code if response else 'Connection failed'}")
            else:
                self.log_result("Create Costume", False, "No ID in response")
        else:
            self.log_result("Create Costume", False, f"Status {response.status_code}: {response.text}")

    # ===== GALLERY TESTS =====
    def test_gallery_management(self):
        """Test gallery upload and management"""
        print("\n🖼️  Testing Gallery Management...")
        
        # Test GET gallery (public)
        response = self.make_request("GET", "/gallery")
        if not response:
            self.log_result("Get Gallery", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            self.log_result("Get Gallery", True)
        else:
            self.log_result("Get Gallery", False, f"Status {response.status_code}")
            return False
        
        if not self.token:
            self.log_result("Gallery Upload", False, "No token for admin operations")
            return False
        
        # Test POST upload gallery image (create a simple test image)
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test.png', io.BytesIO(test_image_content), 'image/png')
        }
        data = {
            'caption': 'Test API Upload',
            'category': 'Testing'
        }
        
        response = self.make_request("POST", "/admin/gallery/upload", 
                                   files=files, data=data, headers=self.auth_headers())
        if not response:
            self.log_result("Upload Gallery Image", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            created_data = response.json()
            image_id = created_data.get("id")
            if image_id:
                self.log_result("Upload Gallery Image", True, f"ID: {image_id}")
                
                # Test DELETE gallery image
                response = self.make_request("DELETE", f"/admin/gallery/{image_id}", 
                                           headers=self.auth_headers())
                if response and response.status_code == 200:
                    self.log_result("Delete Gallery Image", True)
                else:
                    self.log_result("Delete Gallery Image", False, f"Status {response.status_code if response else 'Connection failed'}")
            else:
                self.log_result("Upload Gallery Image", False, "No ID in response")
        else:
            self.log_result("Upload Gallery Image", False, f"Status {response.status_code}: {response.text}")

    # ===== BOOKINGS TESTS =====
    def test_bookings_management(self):
        """Test bookings management"""
        print("\n📅 Testing Bookings Management...")
        
        # Test POST create booking (public endpoint)
        booking_data = {
            "name": "Arjun Reddy",
            "phone": "9876543210",
            "email": "arjun@example.com",
            "service_type": "Dance Class",
            "message": "Interested in classical dance classes"
        }
        
        response = self.make_request("POST", "/bookings", json=booking_data)
        if not response:
            self.log_result("Create Booking", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            created_data = response.json()
            if created_data.get("success"):
                self.log_result("Create Booking", True, f"ID: {created_data.get('id', 'N/A')}")
            else:
                self.log_result("Create Booking", False, "Success flag not set")
        else:
            self.log_result("Create Booking", False, f"Status {response.status_code}: {response.text}")
        
        if not self.token:
            self.log_result("Get Admin Bookings", False, "No token for admin operations")
            return False
        
        # Test GET admin bookings
        response = self.make_request("GET", "/admin/bookings", headers=self.auth_headers())
        if not response:
            self.log_result("Get Admin Bookings", False, "Connection failed")
            return False
            
        if response.status_code == 200:
            bookings = response.json()
            if isinstance(bookings, list):
                self.log_result("Get Admin Bookings", True, f"Found {len(bookings)} bookings")
                
                # Test status update if we have bookings
                if len(bookings) > 0:
                    booking_id = bookings[0].get("id")
                    if booking_id:
                        response = self.make_request("PUT", f"/admin/bookings/{booking_id}/status", 
                                                   params={"status": "reviewed"}, headers=self.auth_headers())
                        if response and response.status_code == 200:
                            self.log_result("Update Booking Status", True)
                        else:
                            self.log_result("Update Booking Status", False, f"Status {response.status_code if response else 'Connection failed'}")
            else:
                self.log_result("Get Admin Bookings", False, "Response not a list")
        else:
            self.log_result("Get Admin Bookings", False, f"Status {response.status_code}: {response.text}")

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting XDC Dance Academy Backend API Tests")
        print("=" * 60)
        
        # Run tests in logical order
        login_success = self.test_admin_login()
        if login_success:
            self.test_admin_me()
        
        self.test_content_cms()
        self.test_dance_classes_crud()
        self.test_dance_services_crud()
        self.test_costumes_crud()
        self.test_gallery_management()
        self.test_bookings_management()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS:")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print(f"\n🚨 ERRORS:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        success_rate = (self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed'])) * 100 if (self.test_results['passed'] + self.test_results['failed']) > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.test_results


if __name__ == "__main__":
    tester = XDCAPITester()
    results = tester.run_all_tests()