import { createSharedComposable } from '@vueuse/core';
import { onScopeDispose, ref } from 'vue';

function useImageCacheBase() {
    const cache = ref(new Map<string, HTMLImageElement>());

    const add = (url: string) => {
        if (cache.value.has(url)) {
            return;
        }

        const img = new Image();
        img.src = url;
        cache.value.set(url, img);
    };

    onScopeDispose(() => {
        cache.value.clear();
    });

    return {
        add,
    };
}

export const useImageCache = createSharedComposable(useImageCacheBase);
