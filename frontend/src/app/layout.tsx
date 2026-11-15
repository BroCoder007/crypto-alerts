import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Crypto Alerts — A clearer market view",
  description:
    "Track BTC, ETH, SOL and DOGE, explore price history and understand RSI observations in one dashboard.",
  icons: { icon: "/mark.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
