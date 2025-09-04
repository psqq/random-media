import { createSharedComposable } from '@vueuse/core';
import { ref } from 'vue';

function useTerminalOutputBase() {
    const output = ref<string[]>([]);
    const maxOutputStringsToSave = 100;

    try {
        const savedOutput = localStorage.getItem('terminal-output');
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
        localStorage.setItem('terminal-output', JSON.stringify(getOutputForSave()));
    };

    function clear() {
        output.value = [];
        localStorage.setItem('terminal-output', '[]');
    }

    return {
        output,
        add,
        clear,
    };
}

export const useTerminalOutput = createSharedComposable(useTerminalOutputBase);
