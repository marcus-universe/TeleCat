import { useStore } from "@/stores/store";

export function useScrollEngine() {
	const store = useStore();
	let scrollDelay: ReturnType<typeof setTimeout> | null = null;

	function clearScroll() {
		if (scrollDelay) {
			clearTimeout(scrollDelay);
			scrollDelay = null;
		}
	}

	function scrollStep(direction: "up" | "down", amount = 50) {
		window.scrollBy(0, direction === "down" ? amount : -amount);
	}

	function jumpToStart() {
		clearScroll();
		store.playState = false;
		window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
	}

	function jumpToEnd() {
		clearScroll();
		store.playState = false;
		window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" as ScrollBehavior });
	}

	function setPlayState(playing: boolean) {
		store.playState = playing;
	}

	function startScrolling() {
		nextTick(() => {
			const markdownPreview = document.querySelector(".tiptap") as HTMLElement;
			if (!markdownPreview) return;

			const offset = 1;

			const scroll = () => {
				if (!store.playState || !store.previewState) return;

				clearScroll();
				scrollDelay = setTimeout(scroll, Math.floor(100 - store.speed));

				if (store.settings.direction) {
					window.scrollBy(0, offset);
					if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
						setPlayState(false);
						store.toggleDirection();
					}
				} else {
					window.scrollBy(0, -offset);
					if (window.scrollY === 0) {
						setPlayState(false);
						store.toggleDirection();
					}
				}
			};

			scroll();
		});
	}

	function handleControlCommand(command: string) {
		switch (command) {
			case "play":
				if (!store.previewState) store.switchPreviewState();
				setPlayState(true);
				break;
			case "stop":
				setPlayState(false);
				clearScroll();
				break;
			case "scrollUp":
				scrollStep("up");
				break;
			case "scrollDown":
				scrollStep("down");
				break;
			case "jumpStart":
				jumpToStart();
				break;
			case "jumpEnd":
				jumpToEnd();
				break;
			case "toggleDirection":
				store.toggleDirection();
				break;
		}
	}

	watch(() => store.playState, (playing) => {
		if (playing && store.previewState) {
			startScrolling();
		} else {
			clearScroll();
		}
	});

	onUnmounted(() => {
		clearScroll();
	});

	return {
		startScrolling,
		clearScroll,
		scrollStep,
		jumpToStart,
		jumpToEnd,
		setPlayState,
		handleControlCommand
	};
}
