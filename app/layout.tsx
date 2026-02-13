import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { getCurrentLocale, getI18n } from "@/src/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const messages = await getI18n(locale);
  const brand = messages.header.brandName;
  const titleByLocale: Record<typeof locale, string> = {
    fr: `${brand} | Trouver un partenaire fiable`,
    en: `${brand} | Find a reliable partner`,
    cg: `${brand} | Mona molongani ya bondimi`,
  };
  const descriptionByLocale: Record<typeof locale, string> = {
    fr: "La plateforme pour structurer des partenariats entrepreneuriaux au Congo-Brazzaville.",
    en: "A platform to structure entrepreneurial partnerships in Congo-Brazzaville.",
    cg: "Plateforme mpo na kobongisa boyokani ya entrepreneuriat na Congo-Brazzaville.",
  };

  return {
    title: titleByLocale[locale],
    description: descriptionByLocale[locale],
    icons: {
      icon: [
        { url: "/branding/favicon-mon-partenaire-pro.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: ["/favicon.ico"],
      apple: [{ url: "/branding/favicon-mon-partenaire-pro.svg" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
