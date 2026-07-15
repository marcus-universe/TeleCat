<template>
	<teleport to="body">
		<transition name="confirm-fade">
			<div v-if="show" class="confirm-dialog-overlay" @click.self="onCancel">
				<div class="confirm-dialog name-dialog" role="dialog" aria-modal="true" @click.stop>
					<div class="confirm-dialog-header">
						<h3>{{ title }}</h3>
					</div>
					<div class="confirm-dialog-body">
						<p v-if="message">{{ message }}</p>
						<input
							ref="inputRef"
							v-model="nameValue"
							type="text"
							class="name-input"
							:placeholder="placeholder"
							@keydown.enter.prevent="onConfirm"
						>
					</div>
					<div class="confirm-dialog-actions">
						<button type="button" class="btn btn-secondary" @click="onCancel">
							{{ cancelText }}
						</button>
						<button type="button" class="btn btn-primary" :disabled="!nameValue.trim()" @click="onConfirm">
							{{ confirmText }}
						</button>
					</div>
				</div>
			</div>
		</transition>
	</teleport>
</template>

<script lang="ts" setup>
	const props = defineProps<{
		show: boolean;
		title: string;
		message?: string;
		placeholder?: string;
		initialValue?: string;
		confirmText?: string;
		cancelText?: string;
	}>();

	const emit = defineEmits<{
		confirm: [name: string];
		cancel: [];
	}>();

	const { t } = useI18n();
	const inputRef = ref<HTMLInputElement | null>(null);
	const nameValue = ref("");

	watch(() => props.show, (visible) => {
		if (visible) {
			nameValue.value = props.initialValue ?? "";
			nextTick(() => inputRef.value?.focus());
		}
	});

	function onConfirm() {
		const trimmed = nameValue.value.trim();
		if (!trimmed) return;
		emit("confirm", trimmed);
	}

	function onCancel() {
		emit("cancel");
	}
</script>

<style scoped>
.name-dialog .confirm-dialog-header h3 {
	font-size: 2.2rem;
}

.name-input {
	width: 100%;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	background: rgba(0, 0, 0, 0.3);
	color: inherit;
	font-size: 1.4rem;
	font-family: inherit;
	margin-top: 0.5rem;
}

.confirm-dialog-overlay {
	position: fixed;
	inset: 0;
	background: rgba(var(--color_bg), 0.85);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(2px);
}

.confirm-dialog {
	background: rgba(var(--color_bg), 0.9);
	border-radius: 8px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	border: 0.3rem solid var(--color_p);
	max-width: 480px;
	width: 92%;
	overflow: hidden;
}

.confirm-dialog-header {
	padding: 1.25rem 1.25rem 0;
	border-bottom: 1px solid var(--color_p);
}

.confirm-dialog-header h3 {
	margin: 0;
	color: var(--color_p);
}

.confirm-dialog-body {
	padding: 1rem 1.25rem;
}

.confirm-dialog-body p {
	margin: 0 0 0.5rem;
	color: var(--color_p);
}

.confirm-dialog-actions {
	padding: 0 1.25rem 1.25rem;
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
}

.btn {
	padding: 0.75rem 1.25rem;
	border: 0.2rem solid var(--color_p);
	border-radius: 6px;
	cursor: pointer;
	font-size: 1.3rem;
	font-weight: 600;
	background: rgba(var(--color_bg), 0.9);
	color: var(--color_p);
}

.btn-primary {
	background: var(--color_p);
	color: rgb(var(--color_bg));
}

.btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
	transition: opacity 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
	opacity: 0;
}
</style>
