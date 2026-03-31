export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
