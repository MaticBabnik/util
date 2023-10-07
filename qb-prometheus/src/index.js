const Qbc = require("./qb");
const statuses = require("./status");

const app = require("express")();
const prom = require("prom-client");
const { register } = prom;

const settings = {
    qbBaseUrl: process.env.QB_BASE ?? "http://localhost:8088",
    //TODO: Auth?
};

const tLabels = ["category", "torrent", "name"];
const uploaded = new prom.Gauge({
    name: "qb_uploaded",
    help: "Upload in bytes",
    labelNames: tLabels,
    registers: [register],
});

const downloaded = new prom.Gauge({
    name: "qb_downloaded",
    help: "Download in bytes",
    labelNames: tLabels,
    registers: [register],
});

const seeds = new prom.Gauge({
    name: "qb_seeds",
    help: "Number of seeds",
    labelNames: tLabels,
    registers: [register],
});

const leeches = new prom.Gauge({
    name: "qb_leeches",
    help: "Number of leeches",
    labelNames: tLabels,
    registers: [register],
});

const size = new prom.Gauge({
    name: "qb_size",
    help: "Size on disk",
    labelNames: tLabels,
    registers: [register],
});

const progress = new prom.Gauge({
    name: "qb_progress",
    help: "Is torrent done? [0,1]",
    labelNames: tLabels,
    registers: [register],
});

const responseTime = new prom.Gauge({
    name: "qb_response_time",
    help: "How long did the API request take",
});

const up = new prom.Gauge({
    name: "qb_up",
    help: "Is qb up?",
    registers: [register],
});

const active = new prom.Gauge({
    name: "qb_active",
    help: "Is torrent active",
    labelNames: tLabels,
    registers: [register],
});

const errored = new prom.Gauge({
    name: "qb_errored",
    help: "Has torrent errored out",
    labelNames: tLabels,
    registers: [register],
});

const q = new Qbc(settings.qbBaseUrl, {});

async function stats() {
    console.log("Fetching data");
    await q.refetchData();
    responseTime.set(q.lastResponseTime);
    console.log({ up: q.up, took: q.lastResponseTime });
    if (!q.up) return up.set(0);
    up.set(1);

    [
        uploaded,
        downloaded,
        size,
        seeds,
        leeches,
        progress,
        active,
        errored,
    ].forEach((x) => x.reset());

    for (let torrent of Object.values(q.state.torrents)) {
        uploaded
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(torrent.uploaded ?? 0);
        downloaded
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(torrent.downloaded ?? 0);
        size.labels(torrent.category, torrent.infohash_v1, torrent.name).set(
            torrent.size ?? 0
        );
        seeds
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(torrent.num_seeds ?? 0);
        leeches
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(torrent.num_leechs ?? 0);
        progress
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(torrent.progress ?? 0);

        const st = statuses[torrent.state] ?? statuses["unknown"];
        active
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(st.active * 1);
        errored
            .labels(torrent.category, torrent.infohash_v1, torrent.name)
            .set(st.error * 1);
    }
}

setInterval(stats, 14000);
stats();

app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

app.listen(9080);
