import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Viber Hub — Self-Hosted Communication Workspace',
  description: 'Organize contacts, prepare campaigns, manage approvals, and coordinate operator-led Viber messaging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
