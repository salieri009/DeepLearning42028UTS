import { Route, Routes } from "react-router-dom";
import { AnalyticsPage } from "@/pages/analytics";
import { ArchivePage } from "@/pages/archive";
import { DashboardPage } from "@/pages/dashboard";
import { LiveMapPage } from "@/pages/live-map";
import { SettingsPage } from "@/pages/settings";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/live-map" element={<LiveMapPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
