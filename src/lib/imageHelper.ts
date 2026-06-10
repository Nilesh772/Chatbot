export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("<svg") || trimmed.startsWith("data:image/svg+xml")) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) {
    const isProd = process.env.NODE_ENV === "production";
    return isProd ? `/chatbot${url}` : url;
  }
  return url;
}
