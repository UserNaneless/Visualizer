import type { APIRoute } from "astro";
import ytpl from "ytpl";

export const GET: APIRoute = async ({ url }) => {
  const playlistLink = url.searchParams.get("link");
  const playlistPageLimit = Number(url.searchParams.get("limit")) || 100;

  if (!playlistLink) {
    return new Response(JSON.stringify({ error: "Missing link" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const id = await ytpl.getPlaylistID(playlistLink);
    const result = await ytpl(id, { limit: playlistPageLimit });

    const items = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnails[0]?.url,
      duration: item.durationSec,
    }));

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid playlist" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
