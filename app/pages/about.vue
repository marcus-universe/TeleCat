<template>
	<section class="aboutSection flex_h_center">
		<img src="/wide.svg" alt="Telecat Logo">
		<p>Current Version: <b>v{{ appVersion }}</b></p>
		<p>created by <a href="https://github.com/marcus-universe" target="_blank">Marcus Universe</a>.</p>
		<br>
		<p> <a href="https://github.com/marcus-universe/TeleCat" target="_blank">Github Repo</a></p>
		<br>
		<p class="lighttext">
			MIT License © 2025-PRESENT MarcusUniverse
		</p>
	</section>
</template>

<script lang="ts" setup>
	const config = useRuntimeConfig();
	const appVersion = config.public.appVersion;

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

<style>

</style>
