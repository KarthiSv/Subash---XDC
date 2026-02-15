import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import HomePage from "./pages/HomePage";
import CostumesGallery from "./pages/CostumesGallery";
import DanceClassesPage from "./pages/DanceClassesPage";
import AllServicesPage from "./pages/AllServicesPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
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
    </div>
  );
}

export default App;
