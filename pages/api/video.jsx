import { Ytdl, Quality, chooseFormat, parseVideoId } from "@distube/ytdl-core";
import Throttle from "throttle";

// Create ONCE and reuse; the instance holds the YouTube session
const yt = new Ytdl();

export default async function handler(req, res) {
    const videoLink = req.query.link;
    const videoId = videoLink ? parseVideoId(videoLink) : undefined;

    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube link or ID" });
    }

    try {
        const info = await yt.getInfo(videoId);

        const audioFormats = info.formats.filter(
            (f) => f.hasAudio && !f.hasVideo
        );
        if (audioFormats.length === 0) {
            return res.status(404).json({ error: "No audio formats found" });
        }

        const format = chooseFormat(audioFormats, {
            quality: Quality.HighestAudio,
        });

        res.writeHead(200, { "Content-Type": "video/webm" });

        // bitrate is bits/sec, Throttle expects bytes/sec
        const throttle = new Throttle(Math.ceil(format.bitrate / 8));

        const stream = yt.download(info, { format });

        stream.on("error", (err) => {
            console.error(err);
            res.destroy(err);
        });
        res.on("close", () => stream.destroy()); // stop downloading if client leaves

        stream.pipe(throttle).pipe(res);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to fetch audio" });
        } else {
            res.end();
        }
    }
}
