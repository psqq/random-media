<script setup lang="ts">
import { useScreenOrientation, useWindowSize } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { useSettings } from '../composables/useSettings.ts';
import type { WikiImgExt } from '../core/WikiImgExt.ts';

const props = defineProps<{ wImg: WikiImgExt | null }>();

const emit = defineEmits(['click']);

const windowSize = useWindowSize();

const screenOrientation = useScreenOrientation();

const src = computed(() => props.wImg?.url);

const loading = ref(false);

const settings = useSettings();

const orientationSelected = ref(false);

watch(
    src,
    () => {
        if (src.value) {
            loading.value = true;
        }
    },
    { immediate: true }
);

const handleLoad = () => {
    loading.value = false;
    orientationSelected.value = false;
};

const rImg = computed(() => {
    if (!props.wImg?.width || !props.wImg?.height) {
        return null;
    }

    const r = props.wImg.width / props.wImg.height;

    return r;
});

const rWin = computed(() => {
    const r = windowSize.width.value / windowSize.height.value;

    return r;
});

watchEffect(() => {
    if (!screenOrientation.isSupported) {
        return;
    }

    if (loading.value || orientationSelected.value) {
        return;
    }

    if (settings.settings.value.orientation !== 'orientation-for-media') {
        return;
    }

    const r1 = rImg.value;
    const r2 = rWin.value;

    if (!r1 || !r2) {
        return;
    }

    if (Math.abs(r1 - r2) < 1e-5) {
        return;
    }

    if ((r1 < 1 && r2 < 1) || (r1 > 1 && r2 > 1)) {
        return;
    }

    orientationSelected.value = true;

    if (screenOrientation.orientation.value?.startsWith('portrait')) {
        screenOrientation.lockOrientation('landscape-primary');
    } else if (screenOrientation.orientation.value?.startsWith('landscape')) {
        screenOrientation.lockOrientation('portrait-primary');
    }
});
</script>

<template>
    <div v-if="!src">Waiting image...</div>
    <div v-else-if="loading">Loading image...</div>
    <img
        v-if="src"
        :src="src"
        :width="windowSize.width.value"
        :height="windowSize.height.value"
        @load="handleLoad"
        @click="emit('click')"
    />
</template>

<style scoped>
img {
    top: 0;
    left: 0;
    position: fixed;
    object-fit: contain;
}
</style>
