import { createSharedComposable } from '@vueuse/core';
import { ref, watch } from 'vue';
import { config } from '..';

export type SettingsOrientation = 'any' | 'media-for-orientation' | 'orientation-for-media';

export class Settings {
    version: number = 0;
    orientation: SettingsOrientation = 'any';
}

function useSettingsBase() {
    const settings = ref<Settings>(new Settings());

    const localStorageKey = `${config.localStoragePrefix}settings`;

    try {
        const savedSettings = localStorage.getItem(localStorageKey);
        if (savedSettings) {
            Object.assign(settings.value, JSON.parse(savedSettings));
        }
    } catch (err) {}

    watch(
        settings,
        () => {
            localStorage.setItem(localStorageKey, JSON.stringify(settings.value));
        },
        {
            deep: true,
        }
    );

    function reset() {
        settings.value = new Settings();
    }

    return {
        settings,
        reset,
    };
}

export const useSettings = createSharedComposable(useSettingsBase);
