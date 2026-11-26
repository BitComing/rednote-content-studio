import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "移动工作台 | Rednote Content Studio",
  description: "小红书内容生成、审核与改稿的手机端工作台",
  appleWebApp: {
    capable: true,
    title: "内容工作台",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen min-h-dvh">{children}</div>;
}
