import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MonPad - Smart Account Wallet",
  description: "MonPad - The ultimate Smart Account platform for Monad ecosystem. Deploy tokens, mint NFTs, and execute gasless transactions with ease.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@1,900,700,500,301,701,300,501,401,901,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col text-white" style={{ backgroundColor: 'var(--primary-background)' }} suppressHydrationWarning={true}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow py-12">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
