import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './features/auth/pages/HomePage';
import { DashboardPage } from './features/applications/pages/DashboardPage';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { ApplicationPage } from './features/applications/pages/ApplicationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/applications" element={<DashboardPage />} />
        <Route path="/applications/:id" element={<ApplicationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
