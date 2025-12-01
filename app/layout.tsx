import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostMuse.ai - AI-Powered Social Content Assistant',
  description: 'Create engaging social media content with AI-generated captions, smart scheduling, and visual planning tools.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
