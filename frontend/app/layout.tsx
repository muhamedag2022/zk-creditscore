import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {/* هذا هو الجزء الأهم: يجب أن يغلف الـ Providers جميع الأبناء */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}