import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import Invitation from "./pages/Invitation";
import AdminLogin from "./pages/AdminLogin";
import AdminList from "./pages/AdminList";
import AdminEdit from "./pages/AdminEdit";
import { auth } from "./lib/api";

function Protected({ children }) {
  return auth.get() ? children : <Navigate to="/admin/login" replace />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Static segments are ranked above the dynamic :slug by the router, so
            /admin never gets read as an invitation slug. */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Protected><AdminList /></Protected>} />
        <Route path="/admin/:id" element={<Protected><AdminEdit /></Protected>} />
        <Route path="/:slug" element={<Invitation />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
