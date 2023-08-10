// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import ytdl from "ytdl-core"

import Throttle from "throttle";

export default async function  handler(req, res) {
    let videoLink = req.query.link;

    let info = null;

    if ((ytdl.validateURL(videoLink) || ytdl.validateID(videoLink)) && videoLink) {
        info = await ytdl.getInfo(ytdl.getVideoID(videoLink));

        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if (audioFormats.length > 0) {
            res.writeHead(200, { "Content-type": "video/webm" })

            const format = ytdl.chooseFormat(audioFormats, {
                quality: "highestaudio",
            });

            const audioBitrate = format.bitrate;
            const audioCodec = format.audioCodec;

            const throttle = new Throttle(format.bitrate);


            ytdl.downloadFromInfo(info, {
                filter: "audioonly",
                quality: "highestaudio"
            }).pipe(throttle).pipe(res)
        }

    }
}
