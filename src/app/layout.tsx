import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={`${inter.variable} dark style-nova h-full`}>
      <body className="h-full overflow-hidden bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
