import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEO Villa | Sanitary Asset Register",
  description: "Interactive sanitary fixture and accessory schedule for the CEO Villa handover.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
