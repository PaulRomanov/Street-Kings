<script setup lang="ts">
interface Props {
  colors?: string[];
  activeColor?: string;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#00f2ff', '#ff0055', '#39ff14', '#bc13fe', '#ffce00', '#ffffff'],
  activeColor: '',
  label: 'FACTION COLOR'
});

const emit = defineEmits<{
  select: [color: string]
}>();

const handleSelect = (color: string) => {
  emit('select', color);
};
</script>

<template>
  <div class="color-picker">
    <span v-if="label" class="color-picker__label">{{ label }}</span>
    <div class="color-picker__list">
      <button 
        v-for="color in colors" 
        :key="color"
        class="color-picker__node"
        :class="{ 'color-picker__node--active': activeColor === color }"
        :style="{ '--node-color': color }"
        @click="handleSelect(color)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-picker {
  background: rgba($color-bg, 0.8);
  backdrop-filter: blur(10px);
  padding: 15px;
  border-radius: 2px;
  border: 1px solid $color-border-light;
  pointer-events: auto;

  &__label {
    display: block;
    font-size: 10px;
    color: rgba($color-text, 0.5);
    margin-bottom: 10px;
    letter-spacing: 1px;
    font-weight: bold;
  }

  &__list {
    display: flex;
    gap: 12px;
  }

  &__node {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    background: var(--node-color);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 5px var(--node-color);

    &:hover {
      transform: translateY(-3px);
    }

    &--active {
      border-color: $color-white;
      transform: scale(1.1);
      box-shadow: 0 0 15px var(--node-color);
    }
  }
}
</style>