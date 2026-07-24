// web.accessibility — semantic document shell: lang set, one <main> landmark,
// skip link for keyboard users. Fill in <title>/description from the spec.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golden Web Seed",
  description: "Replace with the product description from the spec.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
