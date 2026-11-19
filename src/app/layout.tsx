import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "内容工作台 | Rednote Content Studio",
  description: "小红书多平台内容生成、审核与二轮改稿工作台",
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
