import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import TimelinePage from "./pages/TimelinePage.jsx";
import ChatbotPage from "./pages/ChatbotPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

