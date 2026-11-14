import { Ytdl, parseVideoId } from "@distube/ytdl-core";

// Create once and reuse. Ideally put this in a shared module (see below)
const yt = new Ytdl();

export default async function handler(req, res) {
    const videoLink = req.query.link;
    const videoId = videoLink ? parseVideoId(videoLink) : undefined;

    if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube link or ID" });
    }

    try {
        const info = await yt.getInfo(videoId);
        const { id, title, thumbnails, lengthSeconds } = info.videoDetails;

        res.status(200).json({
            id,
            title,
            thumbnail: thumbnails[0]?.url,
            duration: lengthSeconds,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch video info" });
    }
}
