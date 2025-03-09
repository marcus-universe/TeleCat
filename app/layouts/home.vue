<template>
	<div>
		<LayoutNavTop />
		<LayoutSettings :class="{ show: settingsOpen }" />
		<slot />
	</div>
</template>

<script setup lang="ts">
	import { useStore } from "@/stores/store";

	const store = useStore();

	const settingsOpen = computed(() => store.settings.open);
</script>
