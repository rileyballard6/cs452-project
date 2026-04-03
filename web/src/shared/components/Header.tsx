import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut, User } from 'lucide-react';
import { authService } from '../../services/auth.service';

export function Header() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await authService.logout();
    navigate('/', { replace: true });
  }

  return (
    <header className={`sticky top-0 z-10 flex items-center justify-center bg-white px-6 py-3 transition-colors duration-150 ${scrolled ? 'border-b border-gray-100' : 'border-b border-transparent'}`}>
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
