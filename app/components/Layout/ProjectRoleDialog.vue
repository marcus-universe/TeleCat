<template>
	<teleport to="body">
		<transition name="confirm-fade">
			<div v-if="show" class="confirm-dialog-overlay" @click.self="onCancel">
				<div class="confirm-dialog role-dialog" role="dialog" aria-modal="true" @click.stop>
					<div class="confirm-dialog-header">
						<h3>{{ title }}</h3>
					</div>
					<div class="confirm-dialog-body">
						<p>{{ message }}</p>
						<p v-if="hostTaken" class="role-hint">
							{{ t("roleDialog.hostTaken") }}
						</p>
					</div>
					<div class="confirm-dialog-actions role-actions">
						<button
							type="button"
							class="btn btn-primary"
							:disabled="hostTaken"
							@click="selectRole('host')"
						>
							{{ t("roleDialog.host") }}
						</button>
						<button type="button" class="btn btn-secondary" @click="selectRole('client')">
							{{ t("roleDialog.client") }}
						</button>
						<button type="button" class="btn btn-secondary" @click="onCancel">
							{{ t("fileMenu.cancel") }}
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
		message: string;
		hostTaken?: boolean;
	}>();

	const emit = defineEmits<{
		select: [role: "host" | "client"];
		cancel: [];
	}>();

	const { t } = useI18n();

	function selectRole(role: "host" | "client") {
		emit("select", role);
	}

	function onCancel() {
		emit("cancel");
	}
</script>

<style scoped>
.role-dialog .confirm-dialog-header h3 {
	font-size: 2.2rem;
}

.role-dialog .confirm-dialog-body {
	font-size: 1.4rem;
}

.role-hint {
	color: #ff8888;
	margin-top: 0.75rem;
}

.role-actions {
	flex-wrap: wrap;
	justify-content: center;
}

.role-actions .btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
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
	max-width: 520px;
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
	margin: 0;
	color: var(--color_p);
	line-height: 1.5;
}

.confirm-dialog-actions {
	padding: 0 1.25rem 1.25rem;
	display: flex;
	gap: 0.75rem;
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

.confirm-fade-enter-active,
.confirm-fade-leave-active {
	transition: opacity 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
	opacity: 0;
}
</style>
