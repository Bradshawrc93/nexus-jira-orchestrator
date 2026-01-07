import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const displayFont = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Manrope({ 
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Jira Ceremony Orchestrator",
  description: "Agentic Agile Cockpit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body>
        {/* Background Grid - Global Source of Truth */}
        <div className="fixed inset-0 tech-grid-bg -z-10 pointer-events-none" />

        <Navbar />

        <main className="min-h-screen">
          <div className="nexus-container py-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

