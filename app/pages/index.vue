<template>
	<div class="teleprommt_wrapper">
		<!-- <textarea v-if="previewState === false" id="teleprompter" v-model="markdownText" class="teleprompter" role="textbox" aria-multiline="true" aria-label="TelePrompter Text" contenteditable @input="autoResize" /> -->

		<!-- <div v-if="previewState === true" class="MarkdownPreview" v-html="renderedMarkdown" /> -->
		<div v-if="previewState === true" class="directionArrow" :class="{ up: direction }">
			<DesignIcons icon="scrollarrow" customclass="scrollarrow" />
		</div>
		<MarkdownEditor />
	</div>
</template>

<script lang="ts" setup>
	import { useStore } from "@/stores/store";
	import { marked } from "marked";

	// Set marked options to enable line breaks
	marked.use({
		gfm: true,
		breaks: true
	});

	const store = useStore();
	const previewState = computed(() => store.previewState);
	const playState = computed(() => store.playState);
	const speed = computed(() => store.speed);
	const direction = computed(() => store.settings.direction);

	const markdownText = ref(store.textContent);
	// const renderedMarkdown = computed(() => marked(markdownText.value));

	function autoResize(_event?: Event) {
		nextTick(() => {
			const textarea = document.getElementById("teleprompter") as HTMLTextAreaElement;
			if (textarea) {
				textarea.style.height = "auto";
				textarea.style.height = `${textarea.scrollHeight}px`;
			}
			store.textContent = markdownText.value;
		});
	}

	let scrollDelay: ReturnType<typeof setTimeout>;
	function startScrolling() {
		nextTick(() => {
			const markdownPreview = document.querySelector(".tiptap") as HTMLElement;
			if (!markdownPreview) return;

			const offset = 1;

			const scroll = () => {
				if (!store.playState || !store.previewState) return;

				clearTimeout(scrollDelay);
				scrollDelay = setTimeout(scroll, Math.floor(100 - speed.value));

				if (direction.value) {
					window.scrollBy(0, offset);
					if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
						stopScrolling();
						store.toggleDirection();
					}
				} else {
					window.scrollBy(0, -offset);
					if (window.scrollY === 0) {
						stopScrolling();
						store.toggleDirection();
					}
				}
			};

			scroll();
		});
	}

	function stopScrolling() {
		store.togglePlayState();
		clearTimeout(scrollDelay);
	}

	function preventSpaceScroll(event: KeyboardEvent) {
		if (event.key === " " && store.previewState) {
			event.preventDefault();
		}
	}

	onMounted(() => {
		autoResize();
		window.addEventListener("keydown", preventSpaceScroll);
	});

	onUnmounted(() => {
		window.removeEventListener("keydown", preventSpaceScroll);
	});
	watch(previewState, () => {
		autoResize();
	});

	watch(playState, (newVal) => {
		if (newVal && previewState.value) {
			startScrolling();
		}
	});

	definePageMeta({
		layout: "home"
	});
	function definePageMeta(meta: { layout: string }) {
		console.log("Page metadata:", meta);
	}
</script>
