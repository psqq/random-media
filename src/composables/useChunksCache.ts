import { createSharedComposable } from '@vueuse/core';
import axios from 'axios';
import { onScopeDispose, ref } from 'vue';
import { WikiImgExt } from '../core/WikiImgExt';

function useChunksCacheBase() {
    const cache = ref(new Map<string, WikiImgExt[]>());

    const load = async (url: string) => {
        let data = cache.value.get(url);
        if (data) {
            return data;
        }
        const response = await axios.get(url);
        data = response.data as WikiImgExt[];
        if (!data) {
            throw new Error('no data for chunk');
        }
        data = data.map((obj) => Object.assign(new WikiImgExt(), obj));
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
