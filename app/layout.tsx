import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Markdown Barron - Free Online Real-time Markdown Editor & Previewer",
    template: "%s | Markdown Barron",
  },
  description:
    "Free, fast, and feature-rich online real-time Markdown editor & live previewer. Supports GitHub Callout Alerts, KaTeX Math formulas, Mermaid diagrams, instant URL sharing, HTML export, and dark mode.",
  keywords: [
    "Markdown Previewer",
    "Markdown Editor Online",
    "Real-time Markdown Preview",
    "GitHub Markdown Viewer",
    "Mermaid Diagram Editor",
    "KaTeX Math Markdown",
    "Free Online Markdown Editor",
    "Markdown to HTML Converter",
    "Markdown Barron",
    "Live Markdown Editor",
  ],
  authors: [{ name: "Markdown Barron Team" }],
  creator: "Markdown Barron",
  publisher: "Markdown Barron",
  metadataBase: new URL("https://markdown-preview-barron.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Markdown Barron - Free Online Real-time Markdown Editor & Previewer",
    description:
      "Modern online Markdown editor & live previewer with GitHub Callouts, KaTeX Math formulas, Mermaid Diagrams, and instant URL sharing.",
    url: "https://markdown-preview-barron.vercel.app",
    siteName: "Markdown Barron",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Markdown Barron Live Previewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markdown Barron - Free Online Real-time Markdown Editor & Previewer",
    description:
      "Modern online Markdown editor & live previewer with GitHub Callouts, KaTeX Math formulas, Mermaid Diagrams, and instant URL sharing.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Markdown Barron",
  url: "https://markdown-preview-barron.vercel.app",
  description:
    "Free online real-time Markdown editor and live previewer supporting GitHub Callouts, KaTeX Math formulas, Mermaid Diagrams, and instant URL sharing.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Real-time Dual Pane Markdown Preview",
    "GitHub Flavored Callout Alerts ([!NOTE], [!TIP], [!CAUTION])",
    "KaTeX Mathematical LaTeX Formulas",
    "Interactive Mermaid.js Diagram Rendering",
    "Instant Compressed URL Hash Sharing",
    "Auto-Save & Version History Snapshots",
    "HTML & Markdown Export Options",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
