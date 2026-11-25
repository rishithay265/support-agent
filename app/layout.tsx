import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Amplitude Academy | Learning workspace', description: 'Your personal learning workspace.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
