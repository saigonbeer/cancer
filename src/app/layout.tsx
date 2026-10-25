import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onco EMR",
  description: "Hệ thống quản lý điều trị bệnh nhân ung thư",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
