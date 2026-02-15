import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AdminProvider } from "./context/AdminContext";
import HomePage from "./pages/HomePage";
import CostumesGallery from "./pages/CostumesGallery";
import DanceClassesPage from "./pages/DanceClassesPage";
import AllServicesPage from "./pages/AllServicesPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardHome from "./pages/admin/AdminDashboardHome";
import ContentManager from "./pages/admin/ContentManager";
import GalleryManager from "./pages/admin/GalleryManager";
import DanceClassesManager from "./pages/admin/DanceClassesManager";
import DanceServicesManager from "./pages/admin/DanceServicesManager";
import CostumesManager from "./pages/admin/CostumesManager";
import BookingsManager from "./pages/admin/BookingsManager";
import "./App.css";

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/costumes" element={<CostumesGallery />} />
        <Route path="/dance-classes" element={<DanceClassesPage />} />
        <Route path="/services" element={<AllServicesPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin routes - no navbar/footer */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminLayout />}>
              <Route index element={<AdminDashboardHome />} />
              <Route path="content" element={<ContentManager />} />
              <Route path="gallery" element={<GalleryManager />} />
              <Route path="classes" element={<DanceClassesManager />} />
              <Route path="services" element={<DanceServicesManager />} />
              <Route path="costumes" element={<CostumesManager />} />
              <Route path="bookings" element={<BookingsManager />} />
            </Route>
            {/* Public routes */}
            <Route path="/*" element={<PublicLayout />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </BrowserRouter>
      </AdminProvider>
    </div>
  );
}

export default App;
