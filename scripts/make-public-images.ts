import fs from 'node:fs';

import type { WikiImg } from '../src/core/WikiImg';
import { ChunksMeta } from '../src/core/ChunksMeta';
import { join } from 'node:path';

const chunksRoot = 'public/wiki-images';

const allImages: WikiImg[] = JSON.parse(
    await fs.promises.readFile('data/cache/all-quality-images.json', { encoding: 'utf-8' })
);

const imagesByCategory = new Map<string, WikiImg[]>();
for (const img of allImages) {
    let imgs = imagesByCategory.get(img.category);
    if (!imgs) {
        imgs = [];
        imagesByCategory.set(img.category, imgs);
    }
    imgs.push(img);
}

const maxImagesInChunk = 1000;

const chunksMeta = new ChunksMeta();

for (const [category, images] of imagesByCategory.entries()) {
    for (let i = 0; i < images.length; i += maxImagesInChunk) {
        const chunk = images.slice(i, i + maxImagesInChunk);
        if (!chunk.length) {
            break;
        }
        const path = `chunks/${chunksMeta.chunks.length}.json`;
        await fs.promises.writeFile(join(chunksRoot, path), JSON.stringify(chunk));
        chunksMeta.chunks.push({
            category,
            count: chunk.length,
            path,
        });
    }
}

await fs.promises.writeFile(join(chunksRoot, 'chunks-meta.json'), JSON.stringify(chunksMeta, null, 2));
