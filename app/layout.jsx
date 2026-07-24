import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/components/shared/query-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Kookaville - Private Chef Booking Platform",
  description:
    "Curated private dining experiences crafted by world-class chefs, delivered to your home.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* AuthProvider wraps the entire tree so useAuth() works in any client component. */}
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
