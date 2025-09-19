<script setup lang="ts">
import { useFetch, useWindowSize } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useChunksCache } from '../composables/useChunksCache.ts';
import { useImageCache } from '../composables/useImageCache.ts';
import { useSettings } from '../composables/useSettings.ts';
import { useTerminalOutput } from '../composables/useTerminalOutput.ts';
import { ChunksMeta } from '../core/ChunksMeta.ts';
import type { WikiImgExt } from '../core/WikiImgExt.ts';
import FullScreenImg from './FullScreenImg.vue';

defineExpose({
    next,
});

const output = useTerminalOutput();

const { width, height } = useWindowSize();

const metaFetch = await useFetch(`${import.meta.env.BASE_URL}wiki-images/chunks-meta.json`)
    .get()
    .json();

const chunksCache = useChunksCache();
const imageCache = useImageCache();

const preloadQueueSize = 3;

const meta = computed(() => {
    const result = new ChunksMeta();

    if (metaFetch.data.value) {
        Object.assign(result, metaFetch.data.value);
    }

    return result;
});

const totalImages = computed(() => {
    let result = 0;

    for (const chunk of meta.value.chunks) {
        result += chunk.count;
    }

    return result;
});

const currentImg = ref<WikiImgExt | null>(null);

const queue = ref<WikiImgExt[]>([]);

const loading = ref(false);

watch(
    queue,
    () => {
        for (const wImg of queue.value) {
            imageCache.add(wImg.url);
        }
    },
    { deep: true }
);

const settings = useSettings().settings;

function validateWikiImage(wImg: WikiImgExt) {
    if (settings.value.orientation !== 'media-for-orientation') {
        return true;
    }
    if (!wImg.width || !wImg.height) {
        output.add(
            `Skip ${JSON.stringify(wImg)} because no size and settings.value.orientation === ${
                settings.value.orientation
            }`
        );
        return false;
    }

    const r1 = width.value / height.value;
    const r2 = wImg.width / wImg.height;

    const diff = Math.abs(r1 - r2) / ((r1 + r2) / 2);
    if (diff > 0.7) {
        output.add(`Skip ${JSON.stringify(wImg)} because diff=${diff} > 0.7`);
        return false;
    }

    return true;
}

async function addRandomImageToQueue() {
    let done = false;
    for (let j = 0; j < 100; j++) {
        const i = Math.floor(Math.random() * totalImages.value);
        let a = 0,
            b = 0;

        for (const chunkInfo of meta.value.chunks) {
            a = b;
            b += chunkInfo.count;
            if (a <= i && i < b) {
                const chunk = await chunksCache.load(`${import.meta.env.BASE_URL}wiki-images/${chunkInfo.path}`);
                const wImg = chunk[i - a];
                if (validateWikiImage(wImg)) {
                    queue.value.push(wImg);
                    done = true;
                }
                break;
            }
        }

        if (done) {
            break;
        }
    }
}

async function next() {
    if (loading.value) {
        return;
    }
    try {
        loading.value = true;
        const wImg = queue.value[0];
        currentImg.value = wImg;
        let outputMsg = `The image from category ${JSON.stringify(wImg.category)} starts to show: `;
        outputMsg += `<a href="${'https://commons.wikimedia.org/wiki/' + wImg.file}" target="_blank">${
            wImg.file
        }</a><br/>`;
        outputMsg += `<a href="${wImg.url}" target="_blank">${wImg.url}</a><br/>`;
        outputMsg += `<img src="${wImg.url + '?width=100'}"/>`;
        output.add(outputMsg);
        queue.value.shift();
        await addRandomImageToQueue();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

for (let i = 0; i < preloadQueueSize; i++) {
    await addRandomImageToQueue();
}

next();
</script>

<template>
    <div>
        <FullScreenImg :w-img="currentImg"></FullScreenImg>
    </div>
</template>

<style scoped></style>
