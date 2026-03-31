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
      ? 'border-sky-500 text-gray-900'
      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold tracking-wider text-gray-700 mr-8"
            >
              helper
            </Link>

            {/* Nav links */}
            <div className="flex space-x-4">
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
                  <NavLink
                    href="/employees"
                    active={isActive('/employees')}
                    className="bg-gray-100"
                  >
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
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <UserCircleIcon className="h-7 w-7 text-gray-400" />
              )}
              <span className="hidden md:inline font-medium">
                {user.name} {user.surname}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition"
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

function NavLink({ href, active, icon, children }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 pt-1 border-b-2 text-sm font-medium transition ${active}`}
    >
      {icon}
      {children}
    </Link>
  );
}
