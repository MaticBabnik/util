import { promisify } from "util";
import imageSizeCB from "image-size";
import { opendir, symlink } from "fs/promises";
import { join, basename } from "path";

const imageSize = promisify(imageSizeCB);

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

// returns all files in a directory
async function getFiles(path, arr = []) {
    const dir = await opendir(path);
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

async function getWallpapers(
    path,
    minWidth = 1920,
    minHeight = 1080,
    minAspectRatio = 1
) {
    // find all files
    const files = await getFiles(path);

    // filter out non-images
    let images = files.filter((file) =>
        IMAGE_EXTENSIONS.includes(file.split(".").pop())
    );

    //wrap this in a block because sizes will no longer align with the filtered array
    let sizes = await Promise.all(images.map((img) => imageSize(img)));
    images = images.filter(
        (_, i) => sizes[i].width >= minWidth && sizes[i].height >= minHeight
    );
    sizes = sizes.filter((s) => s.width >= minWidth && s.height >= minHeight);

    const aspectRatios = sizes.map((size) => size.width / size.height);
    images = images.filter((_, i) => aspectRatios[i] >= minAspectRatio);

    return images;
}

async function makeLinks(files, targetDirectory) {
    const promises = files.map((src) => {
        const filename = basename(src);
        const dest = join(targetDirectory, filename);
        console.log(`link ${dest} -> ${src}`);
        return symlink(src, dest);
    });

    await Promise.all(promises);
    return true;
}

getWallpapers(
    "/home/babnik/Downloads/Wallpapers/phys/cropme/Done",
    3440,
    1440,
    17 / 9
).then((x) => makeLinks(x, "/home/babnik/Downloads/Wallpapers/favs"));
