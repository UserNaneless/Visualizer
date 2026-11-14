import type { APIRoute } from "astro";
import { Ytdl, parseVideoId } from "@distube/ytdl-core";

export const prerender = false;

// Create once and reuse (see the shared module note below)
const yt = new Ytdl();

export const GET: APIRoute = async ({ url }) => {
  const videoLink = url.searchParams.get("link");
  const videoId = videoLink ? parseVideoId(videoLink) : undefined;

  if (!videoId) {
    return Response.json({ error: "Invalid YouTube link or ID" }, { status: 400 });
  }

  try {
    const info = await yt.getInfo(videoId);
    const { id, title, thumbnails, lengthSeconds } = info.videoDetails;

    return Response.json({
      id,
      title,
      thumbnail: thumbnails[0]?.url,
      duration: lengthSeconds,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch video info" }, { status: 500 });
  }
};
