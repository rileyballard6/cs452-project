import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 py-6">
      <Logo size={16} />
      <span className="text-xs text-gray-300">Folio · 2026</span>
    </footer>
  );
}
