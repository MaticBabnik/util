import axios from "axios";
import fsp from "fs/promises";
import fs from "fs";
import { JSDOM } from "jsdom";
import { join, resolve } from "path";
import { finished } from "stream/promises";
import { promisify } from "util";
import imageSizeCB from "image-size";

import ins from "inspector";

const imageSize = promisify(imageSizeCB);

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

const BASE_URL = "https://rentagirlfriend.online/";
const CHAPTERS_PATH = "./chapters";
const SPREADS_PATH = "./spreads";
const FILENAME_REGEX = /[\w\d-_]+\.\w+$/;

/**
 * @returns name: string, url: string}[]
 */
async function listChapters() {
    const res = await axios.post(
        "https://rentagirlfriend.online/wp-admin/admin-ajax.php",
        { action: "manga_get_chapters", manga: "41" },
        {
            headers: {
                "content-type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
            },
        }
    );

    if (res.status != 200) throw new Error("Not 200");

    const dom = new JSDOM(res.data);

    const chapterAnchors = [
        ...dom.window.document.querySelectorAll(
            ".main > .row > .col-6:nth-child(1) > a"
        ),
    ];

    const chapters = chapterAnchors
        .map((x) => ({
            name: x.textContent
                .trim()
                .replace(/\s/g, " ")
                .match(/\d+(?:\.\d+)?$/)[0],
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

    const images = [...dom.window.document.querySelectorAll("[data-src]")];

    try {
        await Promise.all(
            images.map((x, i) =>
                saveFile(
                    x.dataset["src"].trim(),
                    join(
                        CHAPTERS_PATH,
                        name,
                        x.dataset["src"].trim().match(FILENAME_REGEX)[0]
                    )
                )
            )
        );
        console.log(`Downloaded ${name}...`);
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

    for (const chapter of missingChapters) {
        await downloadChapter(chapter);
    }
}

// downloadMissingChapters().catch(console.error);

async function getFiles(path, arr = []) {
    const dir = await fsp.opendir(path);
    const promises = [];

    for await (const dirent of dir) {
        if (dirent.isDirectory()) {
            await getFiles(join(path, dirent.name), arr);
        } else {
            arr.push(`${path}/${dirent.name}`);
        }
    }

    await Promise.all(promises);
    return arr;
}

async function getSizes() {
    const f = await getFiles(CHAPTERS_PATH);

    const sizes = await Promise.all(f.map((x) => imageSize(x)));

    const ratios = sizes.map((x) => x.width / x.height);

    const counts = new Map();
    for (let ratio of ratios) {
        ratio = ratio.toFixed(2);
        counts.set(ratio, (counts.get(ratio) ?? 0) + 1);
    }

    console.log(
        [...counts.entries()]
            .sort((a, b) => a[0] - b[0])
            .map((x) => x.join(";"))
            .join("\n")
    );
}

// getSizes();

async function get2PageSpreads() {
    const f = await getFiles(CHAPTERS_PATH);

    const sizes = await Promise.all(f.map((x) => imageSize(x)));

    const ratios = sizes.map((x) => x.width / x.height);

    const spreads = f.filter((_, i) => ratios[i] > 5 / 7);

    let n = 0;
    for (const spread of spreads) {
        fsp.symlink(
            resolve(spread),
            `${SPREADS_PATH}/${n++}.${spread.split(".").pop()}`
        );
    }
}

// get2PageSpreads();

if (ins.url()) {
    setInterval(() => {}, 1000);
}
