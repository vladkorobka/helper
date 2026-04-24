# Glassmorphism Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Apple Liquid Glass visual style to the existing app — frosted glass panels, Blue-Purple-Green gradient background, Inter font, 8px border radius — without changing any layout, JSX structure, or business logic.

**Architecture:** All glass tokens live as plain CSS classes in `globals.css`. Components only swap className strings — no new abstractions. Background blobs are `position: fixed` divs injected once in each layout wrapper.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, CSS `backdrop-filter`, `next/font/google` (Inter)

**Spec:** `docs/superpowers/specs/2026-04-24-glassmorphism-redesign.md`

---

## File Map

| File | Action |
|---|---|
| `app/layout.js` | Inter variable mode, remove body bg classes |
| `app/globals.css` | Font var, body gradient, blob styles, glass utilities, update `.card` / `.input` / `.btn-*` |
| `components/layout/Layout.jsx` | Remove `bg-gray-50`, inject 3 blob divs, add `relative z-10` to `<main>` |
| `components/layout/Navigation.jsx` | Glass nav panel, pill active link (no border-b) |
| `app/(auth)/layout.jsx` | Remove gradient, inject 3 blob divs |
| `app/(auth)/login/page.jsx` | `bg-white rounded-2xl shadow-xl` → glass card |
| `app/(auth)/forgot-password/page.jsx` | Same card swap |
| `app/(auth)/reset-password/page.jsx` | Same card swap |
| `app/(auth)/accept-invite/page.jsx` | Same card swap (2 instances) |

---

## Task 1: Inter font — variable mode

**Files:**
- Modify: `app/layout.js`
- Modify: `app/globals.css`

- [ ] **Step 1: Update Inter import to variable mode with all weights**

Replace the entire `app/layout.js` with:

```js
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/Providers.jsx';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'Helper',
  description: 'System zarządzania',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={inter.variable}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Wire `--font-inter` into Tailwind's font-sans token**

In `app/globals.css`, find the line in `@theme inline`:
```css
  --font-sans: var(--font-sans);
```
Replace with:
```css
  --font-sans: var(--font-inter);
```

- [ ] **Step 3: Verify font loads**

Run: `npm run dev`

Open http://localhost:3000/login — the text should render in Inter (geometric, modern). In DevTools → Elements, `<html>` should have a class like `__variable_...`. `font-family` on body should resolve to `Inter`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.js app/globals.css
git commit -m "style: switch Inter to variable mode for glassmorphism redesign"
```

---

## Task 2: Body gradient + blob CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace body background in `@layer base`**

In `app/globals.css`, find:
```css
  body {
    @apply bg-background text-foreground;
  }
```
Replace with:
```css
  body {
    @apply text-foreground;
    background: linear-gradient(145deg, #dbeafe 0%, #ede9fe 45%, #d1fae5 100%);
    background-attachment: fixed;
  }
```

- [ ] **Step 2: Add blob + glass utility classes to `@layer components`**

At the end of the `@layer components { }` block in `app/globals.css`, add:

```css
  /* === GLASSMORPHISM TOKENS === */

  .bg-blob {
    position: fixed;
    border-radius: 9999px;
    pointer-events: none;
    z-index: 0;
  }
  .bg-blob-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(147, 197, 253, 0.65), transparent);
    top: -150px;
    left: -120px;
    filter: blur(55px);
  }
  .bg-blob-2 {
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(196, 181, 253, 0.60), transparent);
    top: -80px;
    right: -80px;
    filter: blur(50px);
  }
  .bg-blob-3 {
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(110, 231, 183, 0.50), transparent);
    bottom: -100px;
    left: 40%;
    filter: blur(45px);
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.52);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.07);
  }

  .glass-auth-card {
    background: rgba(255, 255, 255, 0.60);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255, 255, 255, 0.88);
    border-radius: 8px;
    box-shadow: 0 8px 36px rgba(59, 130, 246, 0.09);
  }
```

- [ ] **Step 3: Verify gradient renders**

Run: `npm run dev` — open any page, background should be blue-purple-green gradient. The blobs CSS is defined but not yet injected into DOM (next tasks do that).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: add body gradient and glass CSS tokens"
```

---

## Task 3: Inject blobs into layout wrappers

**Files:**
- Modify: `components/layout/Layout.jsx`
- Modify: `app/(auth)/layout.jsx`

- [ ] **Step 1: Update `components/layout/Layout.jsx`**

Replace the entire file:

```jsx
'use client';
import Navigation from './Navigation.jsx';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <Navigation />
      <main className="relative z-10 flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/(auth)/layout.jsx`**

Replace the entire file:

```jsx
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify blobs appear**

Open http://localhost:3000/login — soft blue (top-left), purple (top-right), green (bottom-center) blobs should be visible through the gradient background. Open http://localhost:3000/tickets — same blobs behind the nav and content.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Layout.jsx app/(auth)/layout.jsx
git commit -m "style: inject background blobs into app and auth layouts"
```

---

## Task 4: Glass Navigation

**Files:**
- Modify: `components/layout/Navigation.jsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add `.glass-nav` CSS class to globals.css**

In `app/globals.css`, inside `@layer components`, after the `.glass-auth-card` block add:

```css
  .glass-nav {
    background: rgba(255, 255, 255, 0.58);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.84);
    box-shadow:
      0 2px 12px rgba(59, 130, 246, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.90);
  }
```

- [ ] **Step 2: Rewrite `components/layout/Navigation.jsx`**

Replace the entire file:

```jsx
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
    <nav className="glass-nav sticky top-0 z-20">
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
```

- [ ] **Step 3: Verify nav appearance**

Open http://localhost:3000/tickets — nav should be a frosted glass bar (white translucent with blur), active link has blue fill pill instead of bottom border. Logo is `HELPER` in Inter 800 with wide tracking.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Navigation.jsx app/globals.css
git commit -m "style: apply glass nav panel and pill active link"
```

---

## Task 5: Glass cards + table styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `.card` class**

In `app/globals.css` inside `@layer components`, find:
```css
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-gray-100;
  }
```
Replace with:
```css
  .card {
    background: rgba(255, 255, 255, 0.52);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.07);
  }
```

- [ ] **Step 2: Update `.table-header` and `.table-cell`**

Find:
```css
  .table-header {
    @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide;
  }

  .table-cell {
    @apply px-4 py-3 text-sm;
  }
```
Replace with:
```css
  .table-header {
    @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide;
    color: #94a3b8;
    background: rgba(241, 245, 249, 0.62);
  }

  .table-cell {
    @apply px-4 py-3 text-sm;
  }
```

- [ ] **Step 3: Verify cards across pages**

Open:
- `/tickets` — ticket table card should have glass effect (blur + white translucency)
- `/tickets/new` — form card should also be glass
- `/clients` — clients table glass

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: glass card and table header tokens"
```

---

## Task 6: Glass inputs + buttons

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `.input` class**

Find:
```css
  .input {
    @apply w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
      text-gray-900 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent
      transition;
  }
```
Replace with:
```css
  .input {
    @apply w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition;
    background: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(203, 213, 225, 0.65);
    border-radius: 6px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
    outline: none;
  }
  .input:focus {
    border-color: rgba(59, 130, 246, 0.48);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.10), inset 0 1px 3px rgba(0, 0, 0, 0.03);
  }
```

- [ ] **Step 2: Replace `.btn` base and all variants**

Find and replace the entire `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-ghost` block:

```css
  .btn {
    @apply inline-flex items-center gap-1.5 px-4 py-2 text-sm
      font-medium transition disabled:opacity-50 disabled:cursor-not-allowed;
    border-radius: 6px;
  }

  .btn-primary {
    @apply inline-flex items-center gap-1.5 px-4 py-2 text-sm
      font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
      text-white;
    border-radius: 6px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.28);
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
  }

  .btn-success {
    @apply inline-flex items-center gap-1.5 px-4 py-2 text-sm
      font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
      text-white;
    border-radius: 6px;
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.28);
  }
  .btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #047857);
  }

  .btn-danger {
    @apply inline-flex items-center gap-1.5 px-4 py-2 text-sm
      font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
      text-white;
    border-radius: 6px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.22);
  }
  .btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
  }

  .btn-ghost {
    @apply inline-flex items-center gap-1.5 px-4 py-2 text-sm
      font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
      text-gray-600;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.50);
    border: 1px solid rgba(203, 213, 225, 0.50);
  }
  .btn-ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.75);
  }
```

- [ ] **Step 3: Verify inputs + buttons across forms**

Open `/tickets/new` — inputs should have translucent glass background, focus state shows blue ring. "Zapisz" button is blue gradient, "Nowe zlecenie" is green gradient. "Anuluj" is ghost glass.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: glass inputs and gradient buttons"
```

---

## Task 7: Auth page cards

**Files:**
- Modify: `app/(auth)/login/page.jsx`
- Modify: `app/(auth)/forgot-password/page.jsx`
- Modify: `app/(auth)/reset-password/page.jsx`
- Modify: `app/(auth)/accept-invite/page.jsx`

- [ ] **Step 1: Update login card**

In `app/(auth)/login/page.jsx`, find:
```jsx
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
```
Replace with:
```jsx
    <div className="glass-auth-card p-8 w-full max-w-sm">
```

- [ ] **Step 2: Update forgot-password card**

In `app/(auth)/forgot-password/page.jsx`, find:
```jsx
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
```
Replace with:
```jsx
    <div className="glass-auth-card p-8 w-full max-w-sm">
```

- [ ] **Step 3: Update reset-password card**

In `app/(auth)/reset-password/page.jsx`, find:
```jsx
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
```
Replace with:
```jsx
    <div className="glass-auth-card p-8 w-full max-w-sm">
```

- [ ] **Step 4: Update accept-invite cards (2 instances)**

In `app/(auth)/accept-invite/page.jsx`, find the error state card:
```jsx
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
```
Replace with:
```jsx
      <div className="glass-auth-card p-8 max-w-sm text-center">
```

Then find the main form card:
```jsx
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
```
Replace with:
```jsx
    <div className="glass-auth-card p-8 w-full max-w-md">
```

- [ ] **Step 5: Verify all auth pages**

Open each in browser:
- http://localhost:3000/login — glass card floating on gradient+blob background
- http://localhost:3000/forgot-password — glass card
- http://localhost:3000/reset-password?token=test — glass card
- http://localhost:3000/accept-invite?token=test — glass card (error state visible)

- [ ] **Step 6: Commit**

```bash
git add app/(auth)/login/page.jsx app/(auth)/forgot-password/page.jsx \
        app/(auth)/reset-password/page.jsx app/(auth)/accept-invite/page.jsx
git commit -m "style: glass auth cards on all auth pages"
```

---

## Task 8: Final visual check + scrollbar polish

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update `.custom-scrollbar` to match glass theme**

Find:
```css
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }
```
Replace with:
```css
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(203, 213, 225, 0.5) transparent;
  }
```

- [ ] **Step 2: Check every page at http://localhost:3000**

Visit each route and confirm no white boxes remain (all should be glass):
- `/login` ✓
- `/tickets` ✓
- `/tickets/new` ✓
- `/tickets/:id` ✓
- `/clients` ✓
- `/clients/new` ✓
- `/employees` ✓
- `/programs` ✓
- `/profile` ✓
- `/settings` ✓

- [ ] **Step 3: Final commit**

```bash
git add app/globals.css
git commit -m "style: scrollbar polish and final glassmorphism cleanup"
```
