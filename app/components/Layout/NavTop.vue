<template>
	<nav class="nav-top flex_c_h">
		<div class="nav-wrapper flex_c_h flex_space" :class="{ 'only-logo': isAbout || isDashboard }">
			<div class="flex_c_h flex_start gap1">
				<a
					v-if="logoUsesDashboardNav"
					href="/"
					class="brand-logo"
					@click.prevent="onLogoNavigate"
				>
					<DesignIcons icon="logo" customclass="logo_colored" />
				</a>
				<NuxtLink v-else :to="logoTarget" class="brand-logo" @click="onLogoClick">
					<DesignIcons icon="logo" customclass="logo_colored" />
				</NuxtLink>
				<FileMenu v-if="showFileMenu" />
				<NuxtLink v-if="showControlLink" to="/control" class="controlButton fileMenuButton" :title="t('nav.control')">
					<DesignIcons icon="joystick" customclass="joystick" />
				</NuxtLink>
			</div>

			<div v-if="showEditorControls" class="flex_c_h flex_end gap1">
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

			<div v-if="showEditorControls" class="flex_c_h gap1">
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
		<LayoutLanguageDropdown v-if="isDashboard || isAbout" class="nav-lang" />
	</nav>
</template>

<script lang="ts" setup>
	import type {} from "vue";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { useMouseInElement } from "@vueuse/core";
	import { useStore } from "@/stores/store";
	import FileMenu from "~/components/Layout/FileMenu.vue";

	defineEmits(["switchPreview"]);

	const { t } = useI18n();
	const route = useRoute();
	const { goToDashboard } = useTelecatServer();

	const store = useStore();
	const playState = computed(() => store.playState);
	const previewState = computed(() => store.previewState);
	const direction = computed(() => store.settings.direction);
	const settingsOpen = computed(() => store.settings.open);
	const isFullscreen = computed(() => store.fullscreen);
	const isAbout = computed(() => route.path === "/about");
	const isDashboard = computed(() => route.path === "/");
	const isClientMode = computed(() => store.isClientMode);
	const isProjectHost = computed(() => route.path.startsWith("/project") && !isClientMode.value);
	const showFileMenu = computed(() => isDashboard.value || isProjectHost.value);
	const showControlLink = computed(() => isDashboard.value || isProjectHost.value);
	const showEditorControls = computed(() => isProjectHost.value);
	const logoUsesDashboardNav = computed(() =>
		route.path.startsWith("/project") || route.path === "/control"
	);
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
		store.switchPreviewState();
	}

	function playstop() {
		nextTick(() => {
			store.togglePlayState();
			if (previewState.value === false) {
				store.switchPreviewState();
			}
		});
	}

	const logoTarget = computed(() => {
		if (route.path === "/about") return "/";
		return "/about";
	});

	function onLogoNavigate() {
		goToDashboard();
	}

	function onLogoClick() {
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

	function toggleDirection() {
		store.toggleDirection();
	}

	onUnmounted(() => {
		// no timeouts to clear
	});
</script>
