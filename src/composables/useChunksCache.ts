import { createSharedComposable } from '@vueuse/core';
import { onScopeDispose, ref } from 'vue';
import type { WikiImg } from '../core/WikiImg';
import axios from 'axios';

function useChunksCacheBase() {
    const cache = ref(new Map<string, WikiImg[]>());

    const load = async (url: string) => {
        let data = cache.value.get(url);
        if (data) {
            return data;
        }
        const response = await axios.get(url);
        data = response.data as WikiImg[];
        if (!data) {
            throw new Error('no data for chunk');
        }
        cache.value.set(url, data);
        return data;
    };

    onScopeDispose(() => {
        cache.value.clear();
    });

    return {
        load,
    };
}

export const useChunksCache = createSharedComposable(useChunksCacheBase);
