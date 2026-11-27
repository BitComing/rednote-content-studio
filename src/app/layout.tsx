import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "稿定",
  description: "小红书内容生成与审核",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body>{children}</body>
    </html>
  );
}
