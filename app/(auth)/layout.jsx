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
