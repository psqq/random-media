<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ width: number; height: number; src: string }>();

const emit = defineEmits(['click']);

const loading = ref(false);

watch(
    () => props.src,
    () => {
        if (props.src) {
            loading.value = true;
        }
    },
    { immediate: true }
);

const handleLoad = () => {
    loading.value = false;
};
</script>

<template>
    <div v-if="!src">Waiting image...</div>
    <div v-else-if="loading">Loading image...</div>
    <img
        v-if="src"
        :src="src"
        :width="width"
        :height="height"
        @load="handleLoad"
        @click="emit('click')"
    />
</template>

<style scoped>
img {
    top: 0;
    left: 0;
    position: fixed;
    object-fit: contain;
}
</style>
