<script setup lang="ts">
import { nextTick, ref, toValue, useTemplateRef } from 'vue';
import { useTerminalOutput } from '../composables/useTerminalOutput.ts';

const input = ref('');

const output = useTerminalOutput();

const outputEl = useTemplateRef('outputEl');

function enter() {
    if (!input.value) {
        return;
    }
    input.value = '';
    if (input.value === 'clear') {
        output.clear();
        return;
    }
    output.add(input.value);
    nextTick(() => {
        if (outputEl.value) {
            outputEl.value.scrollTop = outputEl.value.scrollHeight;
        }
    });
}
</script>

<template>
    <div class="container">
        <div
            class="output"
            ref="outputEl"
        >
            <div
                v-for="html of toValue(output.output)"
                v-html="html"
            ></div>
        </div>
        <div class="input">
            <input
                v-model="input"
                type="text"
                @keypress.enter="enter"
            />
            <button
                class="enter"
                @click="enter"
            >
                Enter
            </button>
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100dvw;
    height: 100dvh;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 0fr;
}

.output {
    padding: 10px;
    overflow: auto;
}

.input {
    display: grid;
    grid-template-columns: 1fr 0fr;
    grid-template-rows: 1fr;
    padding: 10px;
}

.enter {
    margin-left: 10px;
}
</style>
