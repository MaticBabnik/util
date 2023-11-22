const db = require('./ncl/Database.json');

function buildTagMap(database) {
    const obj = {};
    const tags = database.Tags, len = database.Tags.length;
    let i = 0;

    while (i < len) {
        const tag = tags[i];
        obj[tag.idTag] = { name: tag.name, type: tag.type };
        i++; // fastest loop afaik
    }
    return obj;
}

function getRead(database, completed) {
    const allStatus = database.StatusManga;
    return allStatus.filter(x => x.name === completed).map(x => x.gallery);
}

function buildCounts(database) {
    return database.StatusManga.reduce((counts, manga) => {
        if (manga.name in counts)
            counts[manga.name]++;
        else
            counts[manga.name] = 1;
        return counts;
    }, {})
}

function countPages(database, ids) {
    let pages = 0;
    let error = 0;
    ids.forEach(id => {
        const gallery = database.Gallery.find(x => x.idGallery === id);
        if (!gallery) {
            console.log(`${id}'s metadata isn't cached`);
            error++;
            return;
        }

        const pagesCount = parseInt(gallery.pages);
        if (isNaN(pagesCount)) {
            console.log(`${gallery.pages} is not a number`);
            error++;
            return;
        }
        pages += pagesCount;
    });

    return pages;
}

function bucketPages(database, ids, buckets) {
    if (!buckets)
        buckets = [20, 50, 100, 200, 300, 500, 999];

    let total = 0;
    let n = 0;

    let pages = buckets.map(x => 0);
    let error = 0;

    ids.forEach(id => {
        const gallery = database.Gallery.find(x => x.idGallery === id);
        if (!gallery) {
            console.log(`${id}'s metadata isn't cached`);
            error++;
            return;
        }

        const pagesCount = parseInt(gallery.pages);
        if (isNaN(pagesCount)) {
            console.log(`${gallery.pages} is not a number`);
            error++;
            return;
        }

        total += pagesCount;
        n++;
        // for (let index = buckets.length - 1; index >= 0; index--) {
        //     if (pagesCount <= buckets[index]) {
        //         pages[index]++;
        //         break;
        //     }
        // }


        for (let index = 0; index < buckets.length; index++) {
            if (buckets[index] > pagesCount) {
                pages[Math.max(0, index - 1)]++;
                break;
            }
        }

    });

    return [buckets.reduce((p, c, i) => { p[c] = pages[i]; return p }, {}), total, n];
}

function getTagsCount(database, ids) {
    const tagCount = {};

    const gt = database.GalleryTags, len = database.GalleryTags.length;
    let i = 0;

    while (i < len) {
        const t = gt[i];

        if (ids.includes(t.id_gallery)) {
            if (t.id_tag in tagCount) {
                tagCount[t.id_tag]++;
            } else {
                tagCount[t.id_tag] = 1;
            }
        }

        i++;
    }

    return tagCount;
}


const tagMap = buildTagMap(db);
const read = getRead(db, "Completed");
const countedTags = getTagsCount(db, read);
const fn = Object.entries(countedTags).map(([k, v]) => ({ tag: tagMap[k].name, type: tagMap[k].type, n: v }))
const statuses = buildCounts(db);


const parodies = fn.filter(x => x.type == 1);
const characters = fn.filter(x => x.type == 2)
const tags = fn.filter(x => x.type == 3);
const authors = fn.filter(x => x.type == 4);
const groups = fn.filter(x => x.type == 5);
const languages = fn.filter(x => x.type == 6);
const adadsdas = fn.filter(x => x.type == 7)

console.log('Entries per status')
console.table(statuses)

console.log('TOP parodies')
console.table(parodies.sort((a, b) => b.n - a.n).slice(0, 25), ["tag", "n"]);
console.log('TOP characters')
console.table(characters.sort((a, b) => b.n - a.n).slice(0, 25), ["tag", "n"]);
console.log('TOP tags')
console.table(tags.sort((a, b) => b.n - a.n).slice(0, 25), ["tag", "n"]);
console.log('TOP authors')
console.table(authors.sort((a, b) => b.n - a.n).slice(0, 25), ["tag", "n"]);
console.log('TOP groups')
console.table(groups.sort((a, b) => b.n - a.n).slice(0, 25), ["tag", "n"]);
console.log('TOP languages')
console.table(languages.sort((a, b) => b.n - a.n), ["tag", "n"]);
console.log('TOP languages')
console.table(adadsdas.sort((a, b) => b.n - a.n), ["tag", "n"]);

const [buc, total, n] = bucketPages(db, read)

console.table(buc);

console.log(`Total pages read: ${total}`);
console.log(`Total doujinshi read: ${n}`);
console.log(`Average length: ${Math.round(total / n)}`);
// const statuses = db.StatusManga;
// console.log({numberOfDoujins:statuses.length})

// console.log(
//     read.map(x => x - 0).sort((a, b) => a - b).join(' ')
// )

// console.log(Object.keys(db));
