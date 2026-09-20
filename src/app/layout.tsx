import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { themeBootScript } from "@/lib/store/theme";

// ReUI sets their components in Inter; matching it is most of why a screen
// reads as theirs before you look at a single component.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tickets · UNI",
  description: "Ticketing for the UNI workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * `dark` selects ReUI's dark token block, `style-nova` scopes their
     * stylesheet - both are the class names their own theme expects, so the
     * vendored CSS is used unmodified.
     */
    <html
      lang="en"
      className={`${inter.variable} dark style-nova h-full`}
      /* The boot script rewrites this class before React sees it; that is the
       * whole point of the script, so the mismatch is expected. */
      suppressHydrationWarning
    >
      <head>
        {/*
         * Applies the saved theme before first paint. Without it a light-theme
         * user gets a full frame of the dark app on every navigation, which is
         * the one flash no amount of React can catch.
         */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="h-full overflow-hidden bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
