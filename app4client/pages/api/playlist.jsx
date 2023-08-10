import ytpl from "ytpl";

export default async function  handler(req, res) {
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
}