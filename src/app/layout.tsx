import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VANN SITHA - ប្រព័ន្ធ AI គ្រប់គ្រងការលក់",
  description: "ប្រព័ន្ធ AI ឆ្លាតវៃគ្រប់គ្រងការលក់ Facebook Comments, Messenger & CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#f8fafc] text-slate-800">
        {children}
      </body>
    </html>
  );
}
