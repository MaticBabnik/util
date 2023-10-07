import axios from "axios";
import fsp from "fs/promises";
import fs, { write } from "fs";
import { JSDOM } from "jsdom";
import { join } from "path";
import { finished } from "stream/promises";

import ins from "inspector";

/**
 * Gets DOM for URL
 * @param {string} url URL to get
 * @returns {JSDOM} dom
 */
async function getDom(url) {
    const res = await axios.get(url);
    if (res.status != 200) throw new Error("Not 200");
    return new JSDOM(res.data);
}

const BASE_URL = "https://kanojo-okarishimasu.com/";
const CHAPTERS_PATH = "./chapters";
const FILENAME_REGEX = /[\w\d]+\.\w+$/;

/**
 * @returns name: string, url: string}[]
 */
async function listChapters() {
    const dom = await getDom(BASE_URL);

    const chapterAnchors = [
        ...dom.window.document.querySelectorAll("main>.chapter_coin table a"),
    ];

    const chapters = chapterAnchors
        .map((x) => ({
            name: x.textContent.replace(/\s/g, " ").match(/[\d\.]+/)[0],
            url: x.href,
        }))
        .reverse();

    chapters.sort((a, b) => a.name - b.name);

    return chapters;
}

async function listDownloadedChapters() {
    const res = await fsp.readdir(CHAPTERS_PATH, { withFileTypes: true });
    const chapters = res.filter((x) => x.isDirectory());

    return chapters.map((x) => x.name);
}

async function saveFile(url, path) {
    const writer = fs.createWriteStream(path);

    const response = await axios.get(url, { responseType: "stream" });
    response.data.pipe(writer);

    await finished(writer);
}

async function downloadChapter({ name, url }) {
    console.log(`Downloading ${name}...`);
    await fsp.mkdir(join(CHAPTERS_PATH, name));
    const dom = await getDom(url);

    const images = [
        ...dom.window.document.querySelectorAll("article .img_container img"),
    ];

    try {
        await Promise.all(
            images.map((x) =>
                saveFile(
                    x.src,
                    join(CHAPTERS_PATH, name, x.src.match(FILENAME_REGEX)[0])
                )
            )
        );
    } catch (e) {
        console.error(`Error downloading ${name}:`, e);
        return;
    }
}

async function downloadMissingChapters() {
    const chapters = await listChapters();
    const downloadedChapters = await listDownloadedChapters();

    const missingChapters = chapters.filter(
        (x) => !downloadedChapters.includes(x.name)
    );

    console.log(missingChapters);

    // for (const chapter of missingChapters) {
    //     await downloadChapter(chapter);
    // }
}

downloadMissingChapters();

if (ins.url()) {
    setInterval(() => {}, 1000);
}
