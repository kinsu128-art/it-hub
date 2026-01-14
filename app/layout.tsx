import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT-Hub - IT 자산 관리 시스템",
  description: "전산실 통합 IT 인프라 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
