import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "稿定",
  description: "小红书内容生成与审核",
  appleWebApp: {
    capable: true,
    title: "稿定",
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
