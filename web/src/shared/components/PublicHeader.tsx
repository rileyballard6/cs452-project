import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-3 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-70">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
          <Logo size={18} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-gray-900">Folio</span>
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          to="/about"
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          About
        </Link>
        <Link
          to="/login"
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
