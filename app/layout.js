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
