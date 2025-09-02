import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProgressBar from '@/components/ProgressBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Saad Nasir | Blogging app',
  description: 'A simple blog website built with Next.js, Tailwind CSS, and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col bg-black transition-colors text-white`}>
        <ProgressBar />
        <Header />
        <main className='bg-gray-900/95'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
