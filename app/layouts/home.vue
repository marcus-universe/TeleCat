<template>
	<div :class="{ 'is-control-page': isControlPage }">
		<LayoutNavTop v-if="!isControlPage" />
		<LayoutSettings v-if="!isClientMode && !isControlPage" :class="{ show: settingsOpen }" />
		<LayoutNavBottom v-if="!isDashboard" />
		<slot />
	</div>
</template>

<script setup lang="ts">
	import { useStore } from "@/stores/store";

	const route = useRoute();
	const store = useStore();

	const settingsOpen = computed(() => store.settings.open);
	const isClientMode = computed(() => store.isClientMode);
	const isDashboard = computed(() => route.path === "/");
	const isControlPage = computed(() => route.path === "/control");
</script>
