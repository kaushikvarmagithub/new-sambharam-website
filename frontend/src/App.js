import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import CaseStudy from "@/pages/CaseStudy";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/portfolio/:id" element={<CaseStudy />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1c1917",
                color: "#fafaf9",
                border: "1px solid #292524",
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
