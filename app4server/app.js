const express = require("express");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl")
const cors = require("cors");
const fs = require("fs");
const Throttle = require("throttle");


const ffmpeg = require("fluent-ffmpeg");


const app = express();

app.use(cors({
    origin: "*"
}))

const port = 8000;

app.get("/video", async (req, res) => {
    let videoLink = req.query.link;

    let info = null;

    if((ytdl.validateURL(videoLink) || ytdl.validateID(videoLink)) && videoLink){
        info = await ytdl.getInfo(ytdl.getVideoID(videoLink));

        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if(audioFormats.length > 0){
            res.writeHead(200, {"Content-type": "video/webm"})

            const format = ytdl.chooseFormat(audioFormats, {
                quality: "highestaudio",
            });

            const audioBitrate = format.bitrate;
            const audioCodec = format.audioCodec;

            const throttle = new Throttle(format.bitrate);    


            ytdl.downloadFromInfo(info,{
                filter: "audioonly",
                quality: "highestaudio"
            }).pipe(throttle).pipe(res)
            

        }

    }

})

const nextPage = async (lastPage) => {
    return ytpl.continueReq(lastPage);
}

app.get("/playlist", (req, res) => {
    let playlistLink = req.query.link;
    let playlistPageLimit = req.query.limit;

    ytpl.getPlaylistID(playlistLink).then(id => {
        res.setHeader("Content-Type", "application/json");

        ytpl(id, {limit: playlistPageLimit}).then((result) => {
            res.json(result.items.map(item => {
                return {
                    id: item.id,
                    title: item.title,
                    thumbnail: item.thumbnails[0].url,
                    duration: item.durationSec
                };
            }));
        });
    }, error => {
        res.sendStatus(400);
    })

})

app.get("/videoInfo", async (req, res) => {
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
})

app.listen(port, () => {
    console.log("Hello world1");
})