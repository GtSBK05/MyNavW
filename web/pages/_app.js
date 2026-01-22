// web/pages/_app.js
import { useEffect } from "react";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed", err));
    }
  }, []);

  return <Component {...pageProps} />;
}
