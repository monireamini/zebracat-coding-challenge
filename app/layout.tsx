import "../styles/global.css";
import { Metadata } from "next";
import localFont from 'next/font/local'

export const metadata: Metadata = {
  title: "Remotion and Next.js",
  description: "Remotion and Next.js",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

const myFont = localFont({ src: './Poppins-Regular.ttf' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`bg-background text-foreground ${myFont.className}`}>{children}</body>
    </html>
  );
}
