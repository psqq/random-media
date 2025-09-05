import axios from 'axios';
import fs from 'node:fs';
import { join } from 'node:path';
import { ChunksMeta } from '../src/core/ChunksMeta';
import { WikiImg } from '../src/core/WikiImg';
import { WikiImgExt } from '../src/core/WikiImgExt';

let countWithSize = 0;
let countWithoutSize = 0;

let countErrors = 0;
function incCountErrors() {
    countErrors++;
    if (countErrors > 5) {
        console.error({ countErrors });
        process.exit(1);
    }
}

async function getImageSize(filename: string) {
    try {
        let url = `https://commons.wikimedia.org/w/api.php?action=query&titles=`;
        url += encodeURIComponent(filename);
        url += `&prop=imageinfo&iiprop=size&format=json&origin=*`;
        const response = await axios.get(url);

        const data: any = response.data;
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId !== '-1') {
            const imageInfo = pages[pageId].imageinfo[0];
            const width = Number(imageInfo.width);
            const height = Number(imageInfo.height);
            if (Number.isInteger(width) && Number.isInteger(height)) {
                countErrors = 0;
                return {
                    width,
                    height,
                };
            }
        }
    } catch (error) {
        console.error('Error fetching image size:', error);
        incCountErrors();
    }

    return null;
}

const chunksRoot = 'public/wiki-images';

const chunksMeta = new ChunksMeta();

const chunksMetaJsonStr = await fs.promises.readFile(join(chunksRoot, 'chunks-meta.json'), { encoding: 'utf-8' });

Object.assign(chunksMeta, JSON.parse(chunksMetaJsonStr));

async function processImage(chunk: (WikiImgExt | WikiImg)[], index: number) {
    const wImg = chunk[index];
    if (wImg instanceof WikiImgExt) {
        return;
    }
    const wImgExt = new WikiImgExt();
    Object.assign(wImgExt, wImg);
    const size = await getImageSize(wImg.file);
    wImgExt.width = size?.width ?? 0;
    wImgExt.height = size?.height ?? 0;
    chunk[index] = wImgExt;
}

async function processImages(chunk: (WikiImgExt | WikiImg)[], a: number, b: number) {
    const promises = [];
    for (let i = a; i < b; i++) {
        promises.push(
            processImage(chunk, i).catch((err) => {
                console.error(err);
                incCountErrors();
            })
        );
    }
    await Promise.all(promises);
}

for (const chunkInfo of chunksMeta.chunks) {
    console.log('start processing chunk...', chunkInfo);
    const chunkFilepath = join(chunksRoot, chunkInfo.path);
    const chunkStr = await fs.promises.readFile(chunkFilepath, { encoding: 'utf-8' });
    const chunkData: any[] = JSON.parse(chunkStr);
    const chunk: (WikiImgExt | WikiImg)[] = chunkData.map((obj) => {
        if ('width' in obj) {
            return Object.assign(new WikiImgExt(), obj);
        }
        return Object.assign(new WikiImg(), obj);
    });
    const fetchBy = 10;
    for (let i = 0; i < chunk.length; i += fetchBy) {
        const a = i;
        const b = Math.min(chunk.length, a + fetchBy);
        await processImages(chunk, a, b);
    }
    for (const wImgExt of chunk) {
        if ('width' in wImgExt && wImgExt.width > 0 && wImgExt.height) {
            countWithSize++;
        } else {
            countWithoutSize++;
        }
    }
    await fs.promises.writeFile(chunkFilepath, JSON.stringify(chunk), { encoding: 'utf-8' });
    console.log('...done', chunkInfo);
}

console.log({ countWithSize, countWithoutSize });
