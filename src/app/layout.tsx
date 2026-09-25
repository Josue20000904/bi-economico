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

const siteUrl = "https://bi-economico.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BI.ECONÔMICO | Inteligência econômica orientada por dados",
    template: "%s | BI.ECONÔMICO",
  },
  description:
    "Painel interativo que relaciona indicadores empresariais, dados econômicos e análises estatísticas para explorar o desempenho das empresas brasileiras.",
  applicationName: "BI.ECONÔMICO",
  authors: [{ name: "Josue Honório" }],
  creator: "Josue Honório",
  publisher: "BI.ECONÔMICO",
  category: "economia e análise de dados",
  keywords: [
    "BI econômico",
    "business intelligence",
    "análise de dados",
    "economia brasileira",
    "indicadores econômicos",
    "CVM",
    "Banco Central do Brasil",
    "correlação",
    "séries históricas",
    "Next.js",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "BI.ECONÔMICO",
    title: "BI.ECONÔMICO | Inteligência econômica orientada por dados",
    description:
      "Explore empresas brasileiras, indicadores econômicos e relações estatísticas em um painel interativo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BI.ECONÔMICO | Inteligência econômica orientada por dados",
    description:
      "Explore empresas brasileiras, indicadores econômicos e relações estatísticas em um painel interativo.",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
