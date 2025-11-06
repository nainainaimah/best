import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PostMuse.ai - AI-Powered Social Content Assistant',
  description: 'Create engaging social media content with AI-generated captions, smart scheduling, and visual planning tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
