<script setup lang="ts">
import { useScreenOrientation, useWindowSize } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { useSettings } from '../composables/useSettings.ts';
import type { WikiImgExt } from '../core/WikiImgExt.ts';
import { useTerminalOutput } from '../composables/useTerminalOutput.ts';

const props = defineProps<{ wImg: WikiImgExt | null }>();

const emit = defineEmits(['click', 'error']);

const windowSize = useWindowSize();

const screenOrientation = useScreenOrientation();

const src = computed(() => props.wImg?.url);

const loading = ref(false);

const settings = useSettings();

const orientationSelected = ref(false);

const errorMessage = ref('');

const terminalOutput = useTerminalOutput();

watch(
    src,
    () => {
        if (src.value) {
            errorMessage.value = '';
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

function onError() {
    errorMessage.value = 'Error!';
    terminalOutput.add(`<span style="color: red">Error loading image (${props.wImg?.file}): ${props.wImg?.url}</span>`);
    emit('error');
}
</script>

<template>
    <div
        v-if="errorMessage"
        style="color: red; margin: 20px"
    >
        {{ errorMessage }}
    </div>
    <template v-else>
        <div v-if="!src">Waiting image...</div>
        <div v-else-if="loading">Loading image...</div>
        <img
            v-if="src"
            :src="src"
            :width="windowSize.width.value"
            :height="windowSize.height.value"
            @load="handleLoad"
            @error="onError"
            @click="emit('click')"
        />
    </template>
</template>

<style scoped>
img {
    top: 0;
    left: 0;
    position: fixed;
    object-fit: contain;
}
</style>
