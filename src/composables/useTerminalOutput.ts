import { createSharedComposable } from '@vueuse/core';
import { ref } from 'vue';

function useTerminalOutputBase() {
    const output = ref<string[]>([]);

    try {
        const savedOutput = localStorage.getItem('terminal-output');
        if (savedOutput) {
            output.value = JSON.parse(savedOutput);
        }
    } catch (err) {}

    const add = (html: string) => {
        output.value.push(html);
        localStorage.setItem('terminal-output', JSON.stringify(output.value));
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
