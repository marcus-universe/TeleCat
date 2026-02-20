<template>
	<nav class="flex_c_h">
		<div class="nav-wrapper flex_c_h flex_space" :class="{ 'only-logo': isAbout }">
			<div class="flex_c_h flex_start gap1">
				<NuxtLink :to="logoTarget" class="brand-logo" @click="onLogoClick">
					<DesignIcons icon="logo" customclass="logo_colored" />
				</NuxtLink>
				<FileMenu />
			</div>

			<div class="flex_c_h flex_end gap1">
				<div class="FullscreenIconWrapper" @click="store.toggleFullscreen()">
					<div :class="{ active: !isFullscreen }" class="FullscreenIcon">
						<DesignIcons icon="fullscreen" customclass="fullscreen" />
					</div>
					<div :class="{ active: isFullscreen }" class="FullscreenIcon">
						<DesignIcons icon="minimize" customclass="minimize" />
					</div>
				</div>

				<div class="PlayIconWrapper" @click="playstop()">
					<div :class="{ active: !playState }" class="PlayIcon">
						<DesignIcons icon="play" customclass="play" />
					</div>
					<div :class="{ active: playState }" class="PlayIcon">
						<DesignIcons icon="stop" customclass="stop" />
					</div>
				</div>

				<div class="DirectionIconWrapper" @click="toggleDirection()">
					<div class="DirectionIcon" :class="{ active: !direction }">
						<DesignIcons icon="direction" customclass="direction" />
					</div>
					<div class="DirectionIcon" :class="{ active: direction }">
						<DesignIcons icon="direction" customclass="direction" />
					</div>
				</div>
			</div>

			<div class="flex_c_h gap1">
				<div ref="settingsButton" class="settingsButton" :class="{ 'spinning-open': settingsOpen, 'spinning-close': !settingsOpen }" @click="onClickSettings()">
					<DesignIcons icon="settings" customclass="settings" />
				</div>
				<div class="PreviewIconWrapper" @click="switchPreview()">
					<div class="PreviewIcon" :class="{ active: !previewState }">
						<DesignIcons icon="preview" customclass="preview" />
					</div>
					<div class="PreviewIcon" :class="{ active: previewState }">
						<DesignIcons icon="edit" customclass="edit" />
					</div>
				</div>
			</div>
		</div>
	</nav>
</template>

<script lang="ts" setup>
	import type {} from "vue";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { useMouseInElement } from "@vueuse/core";
	import { useStore } from "@/stores/store";
	import FileMenu from "~/components/Layout/FileMenu.vue";

	defineEmits(["switchPreview"]);

	const route = useRoute();

	const store = useStore();
	const playState = computed(() => store.playState);
	const previewState = computed(() => store.previewState);
	const direction = computed(() => store.settings.direction);
	const settingsOpen = computed(() => store.settings.open);
	const isFullscreen = computed(() => store.fullscreen);
	const isAbout = computed(() => route.path === "/about");
	const settingsButton = ref(null);

	const { isOutside: isSettingsButtonOutside } = useMouseInElement(settingsButton);

	watch(isSettingsButtonOutside, () => {
		store.setMouseSettingsButtonOver(!isSettingsButtonOutside.value);
	});

	function onClickSettings() {
		if (settingsOpen.value === false) {
			store.setSettingsOpen();
		} else {
			store.setSettingsClosed();
		}
	}

	function switchPreview() {
		console.log("Preview State:", store.previewState);
		store.switchPreviewState();
	}

	function playstop() {
		nextTick(() => {
			store.togglePlayState();
			if (previewState.value === false) {
				store.switchPreviewState();
			}
			// if (settingsOpen.value === true) {
			// 	store.setSettingsOpen();
			// }
		});
	}

	// Logo navigation behavior: toggle between / and /about
	const logoTarget = computed(() => (route.path === "/about" ? "/" : "/about"));
	function onLogoClick() {
		// Close settings when navigating to About for visual clarity
		if (logoTarget.value === "/about" && settingsOpen.value === true) {
			store.setSettingsOpen();
		}
	}

	async function setWindowFullscreen(fullscreen: boolean) {
		try {
			await getCurrentWindow().setFullscreen(fullscreen);
		} catch {
			console.log("Not a Tauri Environment: No Fullscreen Mode for Window");
		}
	}

	watch(isFullscreen, () => {
		if (isFullscreen.value === true) {
			document.documentElement.requestFullscreen();
		} else {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			}
		}
		setWindowFullscreen(isFullscreen.value);
	});

	// openAbout removed (replaced by onLogoClick)

	function toggleDirection() {
		store.toggleDirection();
	}

	onUnmounted(() => {
		// no timeouts to clear
	});
</script>
