import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";
import { Appbar } from "./components/Appbar";
import { ToastProvider } from "./components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TenantCare",
  description: "Rental Solutions",
  icons: {
    icon: "/public/tenantcare.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <Appbar />
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
