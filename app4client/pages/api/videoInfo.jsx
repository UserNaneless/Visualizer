import ytdl from "ytdl-core";

export default async function  handler(req, res) {
    let videoLink = req.query.link;

    if((ytdl.validateURL(videoLink) || ytdl.validateID(videoLink)) && videoLink){
        ytdl.getInfo(ytdl.getVideoID(videoLink)).then(info => {
            res.setHeader("Content-Type", "application/json");
            res.json({
                id: info.videoDetails.videoId,
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url,
                duration: info.formats[0].approxDurationMs / 1000
            })

        });
    }
}