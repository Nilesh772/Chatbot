"use client";

import { useEffect } from "react";

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
      (window as any).__fetchIntercepted = true;
      const originalFetch = window.fetch;

      window.fetch = async function (input, init) {
        let url = input;

        // Only prepend /chetbot if the current browser page is served from /chetbot
        const isChetbotPath = typeof window !== "undefined" && window.location.pathname.startsWith("/chetbot");

        if (isChetbotPath) {
          if (typeof url === "string" && url.startsWith("/api/")) {
            url = `/chetbot${url}`;
          } else if (url instanceof URL && url.pathname.startsWith("/api/")) {
            url.pathname = `/chetbot${url.pathname}`;
          }
        }

        return originalFetch(url, init);
      };
    }
  }, []);

  return null;
}
