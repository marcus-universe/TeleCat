<template>
	<h1>Home</h1>
</template>

<script lang="ts" setup>
	definePageMeta({
		layout: "home"
	});
	function definePageMeta(meta: { layout: string }) {
		// Assuming this function sets some metadata for the page
		// Here we can set the metadata to a global or local state
		// For simplicity, let's log the meta to the console
		console.log("Page metadata:", meta);
	}
	</script>
