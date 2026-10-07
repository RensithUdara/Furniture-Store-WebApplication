// A product video is either a YouTube link or a direct link to a video file.
// Returns how to show it, or null when the link is neither.
export function videoSource(
  url: string,
): { kind: "youtube"; embed: string; poster: string } | { kind: "file"; src: string } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");
  const id =
    host === "youtu.be"
      ? u.pathname.slice(1)
      : host === "youtube.com" || host === "youtube-nocookie.com"
        ? u.pathname === "/watch"
          ? u.searchParams.get("v") || ""
          : (u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ?? "")
        : "";
  if (/^[\w-]{11}$/.test(id))
    return {
      kind: "youtube",
      // The no-cookie player sets nothing on the visitor until they press play.
      embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}
