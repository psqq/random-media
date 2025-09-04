<script setup lang="ts">
import { useFetch, useWindowSize } from '@vueuse/core';
import FullScreenImg from './FullScreenImg.vue';
import { ChunksMeta } from '../core/ChunksMeta.ts';
import { computed, ref, watch } from 'vue';
import { useChunksCache } from '../composables/useChunksCache.ts';
import { useImageCache } from '../composables/useImageCache.ts';
import type { WikiImg } from '../core/WikiImg.ts';
import { useTerminalOutput } from '../composables/useTerminalOutput.ts';

const output = useTerminalOutput();

const { width, height } = useWindowSize();

const metaFetch = await useFetch('/wiki-images/chunks-meta.json').get().json();

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

const currentImg = ref('');

const queue = ref<WikiImg[]>([]);

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

async function addRandomImageToQueue() {
    const i = Math.floor(Math.random() * totalImages.value);
    let a = 0,
        b = 0;

    for (const chunkInfo of meta.value.chunks) {
        a = b;
        b += chunkInfo.count;
        if (a <= i && i < b) {
            const chunk = await chunksCache.load(`/wiki-images/${chunkInfo.path}`);
            const wImg = chunk[i - a];
            queue.value.push(wImg);
            return;
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
        currentImg.value = wImg.url;
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
        <FullScreenImg
            :width="width"
            :height="height"
            :src="currentImg"
            @click="next"
        ></FullScreenImg>
    </div>
</template>

<style scoped></style>
