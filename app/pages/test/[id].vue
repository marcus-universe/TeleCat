<template>
	<div class="aboutSection">
		<h1>Id is {{ id }}</h1>
	</div>
</template>

<script lang="ts" setup>
	const { id } = useRoute().params;
</script>

<style>

</style>
