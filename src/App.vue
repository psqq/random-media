<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import AppMain from './components/AppMain.vue';
import Terminal from './components/Terminal.vue';
import { useSettings, type SettingsOrientation } from './composables/useSettings.ts';

const main = useTemplateRef('main');

function next() {
    main.value?.next();
}

const tilde = ref(false);

const showButtons = ref(true);

document.addEventListener('keypress', (e) => {
    if (e.code === 'Backquote') {
        tilde.value = !tilde.value;
    } else if (e.code === 'KeyN') {
        next();
    }
});

const fullscreen = useFullscreen();

const settings = useSettings();

const orientationButtonText = computed(() => {
    const text: Record<SettingsOrientation, string> = {
        any: 'A',
        'media-for-orientation': 'M',
        'orientation-for-media': 'O',
    };

    return text[settings.settings.value.orientation];
});

function nextOrientationSettings() {
    const next: Record<SettingsOrientation, SettingsOrientation> = {
        any: 'media-for-orientation',
        'media-for-orientation': 'orientation-for-media',
        'orientation-for-media': 'any',
    };

    settings.settings.value.orientation = next[settings.settings.value.orientation];
}
</script>

<template>
    <div
        v-if="showButtons"
        class="buttons"
    >
        <button @click="tilde = !tilde">~</button>
        <button
            v-if="fullscreen.isSupported"
            @click="fullscreen.toggle()"
        >
            [ ]
        </button>
        <button
            :title="settings.settings.value.orientation"
            @click="nextOrientationSettings"
        >
            |{{ orientationButtonText }}|
        </button>
        <button @click="next">{{ '>' }}</button>
        <button @click="showButtons = false">{{ 'H' }}</button>
    </div>
    <div
        v-else-if="!tilde"
        class="no-buttons"
        @click="showButtons = true"
    ></div>
    <div
        v-if="!tilde"
        class="next"
        @click="next"
    ></div>
    <div v-show="!tilde">
        <Suspense>
            <template #default>
                <AppMain ref="main" />
            </template>
            <template #fallback>
                <div>Loading...</div>
            </template>
        </Suspense>
    </div>
    <Terminal v-show="tilde"></Terminal>
</template>

<style scoped>
.buttons {
    position: fixed;
    right: 10px;
    top: 10px;
    z-index: 999;
    display: flex;
    flex-direction: column;
}

.buttons button {
    font-family: monospace;
    font-size: large;
    font-weight: bold;
    margin-bottom: 10px;
}

.no-buttons {
    position: fixed;
    z-index: 999;
    width: 30dvw;
    height: 50dvh;
    right: 0;
    top: 0;
}

.next {
    position: fixed;
    z-index: 888;
    width: 45dvw;
    height: 100dvh;
    right: 0;
    top: 0;
}
</style>
