import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";

/**
 *
 * @param {string} directoryPath
 * @param {string[]} blockedDirectories
 * @returns
 */
async function listFilesRecursively(directoryPath, blockedDirectories = []) {
    const encounteredFiles = new Set();

    directoryPath = resolve(directoryPath);
    blockedDirectories = blockedDirectories.map((x) => resolve(x));

    const prefixLength = directoryPath.length;

    async function traverseDirectory(dirPath) {
        const files = await readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = join(dirPath, file.name);

            if (file.isDirectory()) {
                if (!blockedDirectories.includes(fullPath)) {
                    await traverseDirectory(fullPath);
                }
            } else {
                encounteredFiles.add(fullPath.substring(prefixLength));
            }
        }
    }

    await traverseDirectory(directoryPath);

    return encounteredFiles;
}

/**
 *
 * @param {Set} a
 * @param {Set} b
 * @returns
 */
function diff(a, b) {
    // Elements only in Set A
    const onlyInA = new Set([...a].filter((element) => !b.has(element)));

    // Elements only in Set B
    const onlyInB = new Set([...b].filter((element) => !a.has(element)));

    return { onlyInA, onlyInB };
}

const IGNORE_FILES = ["jpg", "jpeg", "png", "txt"];

async function main() {
    const files = await Promise.all([
        listFilesRecursively("/mnt/nanami/media/anime", [
            "/mnt/nanami/media/anime/Anime",
        ]),
        listFilesRecursively("/mnt/nanami/media/anime/Anime", []),
    ]);

    const { onlyInB } = diff(...files);

    console.log(
        [...onlyInB]
            .filter((x) => !IGNORE_FILES.includes(x.split(".").pop()))
            .join("\n")
    );
}

main();
