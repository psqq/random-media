<script setup lang="ts">
import { ref } from 'vue';
import Main from './components/Main.vue';
import Terminal from './components/Terminal.vue';

const tilde = ref(false);

document.addEventListener('keypress', (e) => {
    if (e.code === 'Backquote') {
        tilde.value = !tilde.value;
    }
});
</script>

<template>
    <button
        class="tilde"
        @click="tilde = !tilde"
    >
        ~
    </button>
    <div v-show="!tilde">
        <Suspense>
            <template #default>
                <Main />
            </template>
            <template #fallback>
                <div>Loading...</div>
            </template>
        </Suspense>
    </div>
    <Terminal v-show="tilde"></Terminal>
</template>

<style scoped>
.tilde {
    position: fixed;
    right: 10px;
    top: 10px;
    font-size: large;
    font-weight: bold;
    z-index: 999;
}
</style>
