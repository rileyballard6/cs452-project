import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut, User } from 'lucide-react';
import { authService } from '../../services/auth.service';

export function Header() {
  const navigate = useNavigate();

  async function handleLogout() {
    await authService.logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="flex items-center justify-center px-6 py-3">
      <nav className="flex items-center gap-1">
        <Link
          to="/applications"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LayoutGrid size={14} />
          Dashboard
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <User size={14} />
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut size={14} />
          Log out
        </button>
      </nav>
    </header>
  );
}
