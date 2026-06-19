import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Personal Organizer - Evidence & Activity Timeline",
  description: "Document everything with precision. Track phone calls, photos, files, writings, meetings, and more on a detailed timeline.",
  icons: {
    icon: "/cps-organizer/icon-192.png",
  },
  manifest: "/cps-organizer/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/cps-organizer/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/cps-organizer/sw.js').catch(function(){});
                });
              }
              window.addEventListener('error', function(e) {
                var div = document.getElementById('__error_overlay');
                if (!div) {
                  div = document.createElement('div');
                  div.id = '__error_overlay';
                  div.style = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:#991b1b;padding:16px;font-size:13px;z-index:99999;white-space:pre-wrap;word-break:break-all;max-height:50vh;overflow:auto;';
                  document.body.appendChild(div);
                }
                div.textContent += 'ERROR: ' + e.message + '\\n  at ' + e.filename + ':' + e.lineno + '\\n\\n';
              });
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground" style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
