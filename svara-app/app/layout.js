import "./globals.css";

export const metadata = {
  title: "Svara — same voice, every language",
  description:
    "Translate a song's lyrics into any language while keeping the original singer's exact voice, tone, and meaning.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Tamil:wght@500;600&family=Noto+Sans+KR:wght@500;600&family=Noto+Sans+JP:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
