<template>
	<nav class="flex_c_h p1">
		<div class="nav-wrapper flex_c_h flex_space">
			<div class="flex_c_h flex_start gap1">
				<NuxtLink to="/" class="brand-logo">
					<img class="logo icon" src="../../assets/logo.svg" alt="">
				</NuxtLink>

				<div class="settingsButton" @click="store.setSettingsOpen()">
					<DesignIcons icon="settings" customclass="settings" />
				</div>

				<NuxtLink to="/about">
					<DesignIcons icon="about" customclass="about" />
				</NuxtLink>
			</div>

			<div class="flex_c_h flex_end gap1">
				<div @click="playstop()">
					<DesignIcons icon="play" customclass="play" />
				</div>

				<div @click="direction()">
					<DesignIcons icon="direction" customclass="direction" />
				</div>
			</div>

			<div>
				<div @click="switchPreview()">
					<DesignIcons icon="preview" customclass="preview" />
				</div>
			</div>
		</div>
	</nav>
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";

	defineEmits(["switchPreview"]);

	const store = useStore();
	console.log("Preview State:", store.previewState);

	function switchPreview() {
		console.log("Preview State:", store.previewState);
		store.switchPreviewState();
	}

	function playstop() {
		store.togglePlayState();
	}

	function direction() {
		store.toggleDirection();
	}
</script>
