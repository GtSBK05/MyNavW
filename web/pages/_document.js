// web/pages/_document.js
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="id">
        <Head>
          {/* PWA: manifest & theme color */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#38bdf8" />

          {/* App icons */}
          <link rel="icon" href="/icons/icon-192.png" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
