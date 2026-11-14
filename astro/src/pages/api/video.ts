import type { APIRoute } from "astro";
import { Readable } from "node:stream";
import { Ytdl, Quality, chooseFormat, parseVideoId } from "@distube/ytdl-core";
import Throttle from "throttle";

export const prerender = false;

// Create ONCE and reuse; the instance holds the YouTube session
const yt = new Ytdl();

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const GET: APIRoute = async ({ url, request }) => {
  const videoLink = url.searchParams.get("link");
  const videoId = videoLink ? parseVideoId(videoLink) : undefined;

  if (!videoId) {
    return json({ error: "Invalid YouTube link or ID" }, 400);
  }

  try {
    const info = await yt.getInfo(videoId);

    const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
    if (audioFormats.length === 0) {
      return json({ error: "No audio formats found" }, 404);
    }

    const format = chooseFormat(audioFormats, {
      quality: Quality.HighestAudio,
    });

    // bitrate is bits/sec, Throttle expects bytes/sec
    const throttle = new Throttle(Math.ceil((format.bitrate ?? 128000) / 8));
    const stream = yt.download(info, { format });

    stream.on("error", (err: Error) => {
      console.error(err);
      throttle.destroy(err);
    });

    // stop downloading if client leaves
    request.signal.addEventListener("abort", () => {
      stream.destroy();
      throttle.destroy();
    });

    stream.pipe(throttle);

    return new Response(Readable.toWeb(throttle) as ReadableStream, {
      status: 200,
      headers: { "Content-Type": "video/webm" },
    });
  } catch (err) {
    console.error(err);
    return json({ error: "Failed to fetch audio" }, 500);
  }
};
