import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AppShell, ColorSchemeScript, createTheme, MantineProvider } from "@mantine/core";
import { ThirdwebProvider } from "thirdweb/react";
import { CurrencyProvider } from "@/hooks/currency";
import { NftProvider } from "@/hooks/NFTOwned";
import { MarketplaceProvider } from "@/hooks/marketProvider";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "thirdweb SDK + Next starter",
  description:
    "Starter template for using thirdweb SDK with Next.js App router",
};

const theme = createTheme({
  primaryColor: "blue", // Customize primary color
  fontFamily: "Inter, sans-serif", // Set global font family
  headings: { fontFamily: "Poppins, sans-serif" }, // Customize heading fonts
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <MantineProvider
          theme={theme}
          defaultColorScheme="dark" // Default to light theme
          withCssVariables
          cssVariablesSelector=":root"
          deduplicateCssVariables={true}
        >
        <ColorSchemeScript />

        {/* MantineProvider integration */}
        
         <AppShell>
        <ThirdwebProvider>
        <CurrencyProvider>
          <NftProvider>

          <MarketplaceProvider>
          {children}
          </MarketplaceProvider>
          </NftProvider>

          </CurrencyProvider>
          </ThirdwebProvider>
        </AppShell>
        </MantineProvider>
        <Script src="https://telegram.org/js/telegram-web-app.js" />
      </body>
    </html>
  );
}
