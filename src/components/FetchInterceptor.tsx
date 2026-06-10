"use client";

if (typeof window !== "undefined" && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    let url = input;

    // Only prepend /chatbot if the current browser page is served from /chatbot
    const isChatbotPath = window.location.pathname.startsWith("/chatbot");

    if (isChatbotPath) {
      if (typeof url === "string" && url.startsWith("/api/")) {
        url = `/chatbot${url}`;
      } else if (url instanceof URL && url.pathname.startsWith("/api/")) {
        url.pathname = `/chatbot${url.pathname}`;
      }
    }

    return originalFetch(url, init);
  };
}

export default function FetchInterceptor() {
  return null;
}

