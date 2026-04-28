'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const isActive = (path) =>
    pathname.startsWith(path)
      ? 'bg-blue-600/10 text-blue-700 font-semibold'
      : 'text-slate-500 hover:text-slate-700 hover:bg-white/40';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <nav className="glass-nav sticky top-0 z-20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-sm font-extrabold tracking-[0.15em] text-slate-800 mr-8"
            >
              HELPER
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {user.role !== 'superadmin' &&
                user.permissions.includes('tickets') && (
                  <NavLink href="/tickets" active={isActive('/tickets')}>
                    Zlecenia
                  </NavLink>
                )}
              {(user.permissions.includes('clients') ||
                user.role === 'superadmin') && (
                <NavLink href="/clients" active={isActive('/clients')}>
                  Klienci
                </NavLink>
              )}
              {(user.permissions.includes('programs') ||
                user.role === 'superadmin') && (
                <NavLink href="/programs" active={isActive('/programs')}>
                  Programy
                </NavLink>
              )}
              {user.role === 'superadmin' && (
                <>
                  <NavLink href="/employees" active={isActive('/employees')}>
                    Pracownicy
                  </NavLink>
                  <NavLink href="/settings" active={isActive('/settings')}>
                    Ustawienia
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-[5px] transition"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white/80"
                />
              ) : (
                <UserCircleIcon className="h-7 w-7 text-slate-400" />
              )}
              <span className="hidden md:inline font-medium">
                {user.name} {user.surname}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50/60 rounded-[5px] border border-red-200/60 hover:border-red-300/60 transition"
              title="Wyloguj"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 rounded-[5px] text-sm transition ${active}`}
    >
      {children}
    </Link>
  );
}
