import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import FetchInterceptor from "@/components/FetchInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChetBot | Visual Drag & Drop Chatbot Flow Builder SaaS",
  description: "Build, design, and install custom conversational chatbots on any website without coding. Engage visitors, capture leads, and automate support visually.",
  keywords: "chatbot builder, visual flow editor, lead generation, customer support widget, react flow, no-code chatbot, chat widget embed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FetchInterceptor />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

