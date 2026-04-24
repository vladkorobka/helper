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
