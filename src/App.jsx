import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import TimelinePage from "./pages/TimelinePage.jsx";
import ChatbotPage from "./pages/ChatbotPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import IngestPage from "./pages/IngestPage.jsx";
import AIInvestigationPage from "./pages/AIInvestigationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/investigation" element={<AIInvestigationPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ingest" element={<IngestPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

