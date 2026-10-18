import "@/styles/globals.css";

import {
  fontBricolageGrotesque as fontBricolage,
  fontSourceSans,
  fontSourceSerif,
  fontWorkSans,
} from "@/assets/fonts";
import { auth } from "@/auth";
import { Analytics } from "@/components/analytics/analytics";
import { JsonLd } from "@/components/seo/json-ld";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { type Locale, localePath, routing } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { notFound } from "next/navigation";

// NOTE: no generateStaticParams / setRequestLocale here — this app renders
// dynamically on purpose (root layout calls auth(), pages fetch live CMS
// data). Mixing the static-locale optimization with dynamic rendering
// crashes React in production ("Expected a suspended thenable").

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  return constructMetadata({ locale: locale as Locale });
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = params;
  // https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#not-found-pages
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  const validLocale = locale as Locale;

  // https://youtu.be/1MTyCvS05V4?t=21464
  const session = await auth();
  const messages = await getMessages();

  const sameAs = Object.values(siteConfig.links).filter(Boolean);
  const siteUrl = siteConfig.url.replace(/\/$/, "");
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteConfig.name,
      url: siteUrl,
      logo: `${siteUrl}${siteConfig.logo}`,
      ...(sameAs.length > 0 && { sameAs }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: validLocale,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}${localePath(validLocale, "/search")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang={validLocale} suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          fontBricolage.className,
          // fontSourceSans.className,
          // fontSourceSerif.className,
          // fontWorkSans.className,
          fontSourceSerif.variable,
          fontSourceSans.variable,
          fontWorkSans.variable,
          fontBricolage.variable,
        )}
      >
        <JsonLd data={structuredData} />
        <NextIntlClientProvider locale={validLocale} messages={messages}>
          <SessionProvider session={session}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}

              {/* https://sonner.emilkowal.ski/toaster */}
              <Toaster richColors position="top-right" offset={64} />

              <TailwindIndicator />

              <Analytics />
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
