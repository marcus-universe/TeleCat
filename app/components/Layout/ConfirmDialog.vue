<template>
	<teleport to="body">
		<transition name="confirm-fade">
			<div v-if="show" ref="overlay" class="confirm-dialog-overlay" @keydown.esc.prevent="onCancel" @click.self="onCancel">
				<div class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="title" @click.stop>
					<div v-if="title" class="confirm-dialog-header">
						<h3>{{ title }}</h3>
					</div>

					<div class="confirm-dialog-body">
						<div v-if="rawHtml" v-html="message" />
						<p v-else>
							{{ message }}
						</p>
					</div>

					<div class="confirm-dialog-actions">
						<button class="btn btn-secondary" type="button" @click="onCancel">
							{{ cancelText }}
						</button>
						<button ref="confirmBtn" class="btn btn-primary" type="button" @click="onConfirm">
							{{ confirmText }}
						</button>
					</div>
				</div>
			</div>
		</transition>
	</teleport>
</template>

<script lang="ts" setup>
	import { nextTick, onUnmounted, ref, watch } from "vue";

	const props = defineProps({
		show: { type: Boolean, required: true },
		title: { type: String, default: "" },
		message: { type: String, default: "" },
		confirmText: { type: String, default: "OK" },
		cancelText: { type: String, default: "Cancel" },
		rawHtml: { type: Boolean, default: false }
	});

	const emit = defineEmits(["confirm", "cancel"]);

	const confirmBtn = ref<HTMLButtonElement | null>(null);
	const overlay = ref<HTMLElement | null>(null);

	function onConfirm() {
		emit("confirm");
	}
	function onCancel() {
		emit("cancel");
	}

	// When opened, focus the confirm button and disable page scroll
	watch(() => props.show, (open) => {
		if (open) {
			nextTick(() => {
				confirmBtn.value?.focus();
			});
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
	});

	onUnmounted(() => {
		document.body.style.overflow = "";
	});
</script>

<style scoped>
/* Overlay centers the dialog in the middle of the screen */
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--color_bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: var(--color_bg);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 0.3rem solid var(--color_p);
  max-width: 480px;
  width: 92%;
  overflow: hidden;
  animation: dialogSlideIn 0.18s ease-out;
}

@keyframes dialogSlideIn {
  from { transform: translateY(-12px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.confirm-dialog-header {
  padding: 1.25rem 1.25rem 0;
  border-bottom: 1px solid var(--color_p);
}
.confirm-dialog-header h3 { margin: 0 0 0 0; color: var(--color_p); font-size: 5rem; }

.confirm-dialog-body { padding: 1rem; font-size: 1.5rem; }
.confirm-dialog-body p { margin: 0; color: var(--color_p); line-height: 1.5; }

.confirm-dialog-actions { padding: 0 1.25rem 1.25rem; display: flex; gap: 0.75rem; justify-content: flex-end; }

.btn { padding: 0.6rem 1.1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1.5rem; font-weight: 600; }
.btn:focus { outline: none; box-shadow: 0 0 0 3px rgba(64,120,255,0.18); }
.btn-primary, .btn-secondary { background: var(--color_bg); color: var(--color_p); border: 0.3rem solid var(--color_p); }

.confirm-fade-enter-active, .confirm-fade-leave-active { transition: opacity 0.15s ease; }
.confirm-fade-enter-from, .confirm-fade-leave-to { opacity: 0; }
</style>
