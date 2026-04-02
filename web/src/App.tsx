import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './features/auth/pages/HomePage';
import { DashboardPage } from './features/applications/pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/applications" element={<DashboardPage />} />
        {/* Profile route will be added here */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
