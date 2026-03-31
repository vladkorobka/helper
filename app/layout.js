import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/Providers.jsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Helper',
  description: 'System zarządzania',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
