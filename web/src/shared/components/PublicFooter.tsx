import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
            <Logo size={15} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">Folio</span>
          <span className="text-sm text-gray-300">·</span>
          <span className="text-sm text-gray-400">© {new Date().getFullYear()}</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link to="/about" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700">
            About
          </Link>
          <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
