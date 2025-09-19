import { createSharedComposable } from '@vueuse/core';
import { ref } from 'vue';
import { config } from '..';

function useTerminalOutputBase() {
    const output = ref<string[]>([]);
    const maxOutputStringsToSave = 100;

    const localStorageKey = `${config.localStoragePrefix}terminal-output`;

    try {
        const savedOutput = localStorage.getItem(localStorageKey);
        if (savedOutput) {
            output.value = JSON.parse(savedOutput);
        }
    } catch (err) {}

    function getOutputForSave() {
        const saveFrom = Math.max(0, output.value.length - maxOutputStringsToSave);

        return output.value.slice(saveFrom);
    }

    const add = (html: string) => {
        output.value.push(html);
        localStorage.setItem(localStorageKey, JSON.stringify(getOutputForSave()));
    };

    function clear() {
        output.value = [];
        localStorage.setItem(localStorageKey, '[]');
    }

    return {
        output,
        add,
        clear,
    };
}

export const useTerminalOutput = createSharedComposable(useTerminalOutputBase);
