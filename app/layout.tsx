import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sora = localFont({
  src: [
    { path: "../public/fonts/Sora-700.woff2", weight: "700" },
    { path: "../public/fonts/Sora-800.woff2", weight: "800" },
  ],
  variable: "--font-sora",
  display: "swap",
});

const publicSans = localFont({
  src: [
    { path: "../public/fonts/PublicSans-400.woff2", weight: "400" },
    { path: "../public/fonts/PublicSans-600.woff2", weight: "600" },
  ],
  variable: "--font-public-sans",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    { path: "../public/fonts/JetBrainsMono-400.woff2", weight: "400" },
    { path: "../public/fonts/JetBrainsMono-600.woff2", weight: "600" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Support Ops — Overview",
  description:
    "One console for three AI support backends: RAG docs, agent trajectories, ticket triage. Live when configured, recorded fixtures otherwise.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-sans text-text">{children}</body>
    </html>
  );
}
