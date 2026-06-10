import type { Metadata } from "next";
import "./globals.css";
import { AppNavigation } from "@/components/app-navigation";

export const metadata: Metadata = {
  title: "Galla",
  description: "Expense tracker backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppNavigation />
        <div className="app-shell">
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
