import type { APIRoute } from "astro";
import { Readable } from "node:stream";
import { Ytdl, Quality, chooseFormat, parseVideoId } from "@distube/ytdl-core";

export const prerender = false;

// Create ONCE and reuse; the instance holds the YouTube session
const yt = new Ytdl();

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Paces chunks so the average rate stays near bytesPerSec
function throttleStream(bytesPerSec: number) {
  return new TransformStream<Uint8Array, Uint8Array>({
    async transform(chunk, controller) {
      controller.enqueue(chunk);
      await new Promise((r) =>
        setTimeout(r, (chunk.length / bytesPerSec) * 1000)
      );
    },
  });
}

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

    // bitrate is bits/sec, we need bytes/sec
    const bytesPerSec = Math.ceil((format.bitrate ?? 128000) / 8);
    const stream = yt.download(info, { format });

    stream.on("error", (err: Error) => console.error(err));

    // stop downloading if client leaves
    request.signal.addEventListener("abort", () => stream.destroy());

    return new Response(
      (Readable.toWeb(stream) as ReadableStream<Uint8Array>).pipeThrough(
        throttleStream(bytesPerSec)
      ),
      { status: 200, headers: { "Content-Type": "video/webm" } }
    );
  } catch (err) {
    console.error(err);
    return json({ error: "Failed to fetch audio" }, 500);
  }
};
