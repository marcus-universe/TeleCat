<template>
	<div class="teleprommt_wrapper">
		<textarea v-if="previewState === false" id="teleprompter" v-model="markdownText" class="teleprompter" role="textbox" aria-multiline="true" aria-label="TelePrompter Text" contenteditable @input="autoResize" />

		<div v-if="previewState === true" class="MarkdownPreview" v-html="renderedMarkdown" />
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
	const renderedMarkdown = computed(() => marked(markdownText.value));

	function autoResize(_event?: Event) {
		nextTick(() => {
			const textarea = document.getElementById("teleprompter") as HTMLTextAreaElement;
			if (textarea) {
				textarea.style.height = "auto";
				textarea.style.height = `${textarea.scrollHeight}px`;
			}
			console.log("Auto Resize");
			store.textContent = markdownText.value;
		});
	}


	let scrollDelay: ReturnType<typeof setTimeout>;
	function startScrolling() {
		const markdownPreview = document.querySelector('.MarkdownPreview') as HTMLElement;
		if (!markdownPreview) return;

		const offset = 1;
		const animate = 0;

		const scroll = () => {
			if (store.playState && store.previewState) {
				clearTimeout(scrollDelay);
				scrollDelay = setTimeout(scroll, Math.floor(100 - speed.value));

				if (direction.value) {
					window.scrollBy(0, offset);
					if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
						stopScrolling();
					}
				} else {
					window.scrollBy(0, -offset);
					if (window.scrollY === 0) {
						stopScrolling();
						setTimeout(() => {
							window.scrollTo(0, document.documentElement.scrollHeight);
						}, 500);
					}
				}
			}
		};

		scroll();
	}

	function stopScrolling() {
		store.togglePlayState();
		clearTimeout(scrollDelay);
	}

	onMounted(() => {
		autoResize();
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
