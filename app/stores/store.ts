import { acceptHMRUpdate, defineStore } from "pinia";

export const useStore = defineStore("store", {
	state: () => {
		return {
			previewState: false,
			playState: false,
			speed: 0.4,
			textContent: "Hello, World!",
			settings: {
				open: false,
				mirroredX: false,
				mirroredY: false,
				colorText: "#eeeeee",
				colorBackground: "#392342",
				direction: true,
				fontScale: 1,
			}
		};
	},
	getters: {
		// getter
	},
	actions: {
		switchPreviewState() {
			this.previewState = !this.previewState;
		},
		togglePlayState() {
			this.playState = !this.playState;
		},
		setSpeed(newSpeed: number) {
			this.speed = newSpeed;
		},
		setSettingsOpen() {
			this.settings.open = !this.settings.open;
		},

		toggleDirection() {
			this.settings.direction = !this.settings.direction;
		}

	}
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
