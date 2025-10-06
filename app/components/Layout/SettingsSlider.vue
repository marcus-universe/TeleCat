<template>
  <div class="option flex_c_h alignCenter gap1">
    <slot name="prefix"></slot>
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <input
      :id="id"
      class="slider w100"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="onInputRange"
    />
    <input
      v-if="showNumber"
      :id="`${id}Value`"
      class="number"
      type="number"
      :step="step"
      :value="modelValue"
      @input="onInputNumber"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  id: string
  label?: string
  modelValue: number
  min?: number | string
  max?: number | string
  step?: number | string
  showNumber?: boolean
}>(), {
  step: 1,
  showNumber: true
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>();

function toNumber(val: any): number {
  const n = typeof val === 'string' ? Number(val) : val;
  return Number.isFinite(n) ? n : 0;
}

function onInputRange(ev: Event) {
  const t = ev.target as HTMLInputElement;
  emit('update:modelValue', toNumber(t.value));
}

function onInputNumber(ev: Event) {
  const t = ev.target as HTMLInputElement;
  emit('update:modelValue', toNumber(t.value));
}
</script>

<style scoped>
</style>