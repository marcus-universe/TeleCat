<template>
	<nav class="flex_c_h">
		<div class="nav-wrapper flex_c_h flex_space">
			<div class="flex_c_h flex_start gap1">
				<NuxtLink to="/" class="brand-logo">
					<img class="logo icon" src="/SVG/logo_alpha.svg" alt="">
				</NuxtLink>

				<div ref="settingsButton" class="settingsButton" @click="store.setSettingsOpen()">
					<DesignIcons icon="settings" customclass="settings" />
				</div>

				<NuxtLink to="/about" @click="openAbout()">
					<DesignIcons icon="about" customclass="about" />
				</NuxtLink>
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

			<div>
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
	import { useStore } from "@/stores/store";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { useMouseInElement } from "@vueuse/core";

	defineEmits(["switchPreview"]);

	const store = useStore();
	const playState = computed(() => store.playState);
	const previewState = computed(() => store.previewState);
	const direction = computed(() => store.settings.direction);
	const settingsOpen = computed(() => store.settings.open);
	const isFullscreen = computed(() => store.fullscreen);
	const settingsButton = ref(null);

	const { isOutside: isSettingsButtonOutside } = useMouseInElement(settingsButton);

	watch(isSettingsButtonOutside, () => {
		store.setMouseSettingsButtonOver(!isSettingsButtonOutside.value);
	});

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
			//  store.setSettingsOpen();
			// }
		});
	}

	async function setWindowFullscreen(fullscreen: boolean) {
		try {
			await getCurrentWindow().setFullscreen(fullscreen);
		} catch {
			console.log("Not a Tauri Environment: No Fullscreen Mode for Window");
		}
	}

	watch(isFullscreen, () => {
		if (isFullscreen.value === false) {
			document.documentElement.requestFullscreen();
		} else {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			}
		}
		setWindowFullscreen(isFullscreen.value);
	});

	function openAbout() {
		if (settingsOpen.value === true) {
			store.setSettingsOpen();
		}
	}

	function toggleDirection() {
		store.toggleDirection();
	}
</script>
