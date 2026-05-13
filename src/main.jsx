import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import AdminPage from "./AdminPage.jsx";
import AdminLoginPage from "./AdminLoginPage.jsx";
import LiveQueuePage from "./LiveQueuePage.jsx";
import LiveQueueOverlayPage from "./LiveQueueOverlayPage.jsx";
import LiveQuestionOverlayPage from "./LiveQuestionOverlayPage.jsx";
import LiveControlPage from "./LiveControlPage.jsx";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/live-queue" element={<LiveQueuePage />} />
        <Route path="/live-queue-overlay" element={<LiveQueueOverlayPage />} />
        <Route path="/live-question-overlay" element={<LiveQuestionOverlayPage />} />
        <Route path="/admin-live-control" element={<LiveControlPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);