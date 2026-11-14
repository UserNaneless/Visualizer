import type { APIRoute } from "astro";
import ytpl from "@distube/ytpl";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const playlistLink = url.searchParams.get("link");
  const playlistPageLimit = Number(url.searchParams.get("limit")) || 100;

  if (!playlistLink) {
    return Response.json({ error: "Missing link" }, { status: 400 });
  }

  try {
    const id = await ytpl.getPlaylistID(playlistLink);
    const result = await ytpl(id, { limit: playlistPageLimit });

    const items = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
    }));

    return Response.json(items);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Invalid playlist" }, { status: 400 });
  }
};
