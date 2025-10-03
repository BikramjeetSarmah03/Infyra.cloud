import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/index.css";

import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infyra.cloud – Multi-Cloud Deployments Made Simple",
  description:
    "Deploy anywhere, manage everything. Infyra.cloud is the India-first multi-cloud platform for developers and enterprises. One-click deploys, managed services, simple pricing.",
  keywords: [
    "Infyra",
    "multi-cloud",
    "cloud platform India",
    "serverless hosting",
    "Vercel alternative",
    "Render alternative",
    "AWS GCP Azure Oracle",
    "cloud migration",
    "developer-first hosting",
    "India cloud pricing",
  ],
  openGraph: {
    title: "Infyra.cloud – Multi-Cloud Deployments Made Simple",
    description:
      "Deploy apps across AWS, GCP, Azure, and Oracle from one dashboard. Developer-first, India-priced, enterprise-ready.",
    url: "https://infyra.cloud",
    siteName: "Infyra.cloud",
    images: [
      {
        url: "/opengraph-image.png", // replace with your hosted OG image
        width: 1200,
        height: 630,
        alt: "Infyra.cloud Dashboard Preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infyra.cloud – Multi-Cloud Deployments Made Simple",
    description:
      "India-first multi-cloud platform for developers and enterprises. One-click deployments, managed services, and simple pricing.",
    images: ["/opengraph-image.png"], // same as OG
    creator: "@_bikramjeet", // replace if you have one
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
