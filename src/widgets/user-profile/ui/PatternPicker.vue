<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTranslation } from '@/src/shared/lib/useTranslation'
import { getPatternDataUrl } from '@/src/shared/lib/patternGenerator'

interface Props {
  modelValue?: string | null;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: 'FACTION PATTERN'
});

const emit = defineEmits<{
  'update:modelValue': [pattern: string | null]
}>();

const { t } = useTranslation();

const patterns = ref([
  { id: null, trKey: 'pattern_none', preview: '' },
  { id: 'stripes', trKey: 'pattern_stripes', preview: '' },
  { id: 'dots', trKey: 'pattern_dots', preview: '' },
  { id: 'grid', trKey: 'pattern_grid', preview: '' },
  { id: 'horizontal', trKey: 'pattern_horizontal', preview: '' },
  { id: 'diamonds', trKey: 'pattern_diamonds', preview: '' },
  { id: 'waves', trKey: 'pattern_waves', preview: '' },
  { id: 'dashed', trKey: 'pattern_dashed', preview: '' }
]);

onMounted(() => {
  // Generate previews
  patterns.value.forEach(p => {
    if (p.id) {
       p.preview = getPatternDataUrl(p.id, 64, '#ffffff');
    }
  });
});

const selectPattern = (patternId: string | null) => {
  emit('update:modelValue', patternId);
};
</script>

<template>
  <div class="pattern-picker">
    <span v-if="label" class="pattern-picker__label">{{ label }}</span>
    <div class="pattern-picker__list custom-scrollbar">
      <button 
        v-for="pattern in patterns" 
        :key="pattern.id || 'none'"
        class="pattern-picker__node"
        :class="{ 'pattern-picker__node--active': modelValue === pattern.id }"
        @click="selectPattern(pattern.id)"
        :title="t(pattern.trKey as any)"
      >
        <div v-if="!pattern.id" class="pattern-picker__none">Ø</div>
        <!-- Use background image for preview -->
        <div 
          v-else 
          class="pattern-picker__preview"
          :style="{ backgroundImage: `url(${pattern.preview})` }"
        ></div>
         <span class="pattern-picker__name">{{ t(pattern.trKey as any) }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pattern-picker {
  background: rgba($color-bg, 0.8);
  backdrop-filter: blur(10px);
  padding: 15px;
  border-radius: 2px;
  border: 1px solid $color-border-light;
  pointer-events: auto;
  margin-top: 10px;

  &__label {
    display: block;
    font-size: 10px;
    color: rgba($color-text, 0.5);
    margin-bottom: 10px;
    letter-spacing: 1px;
    font-weight: bold;
    text-transform: uppercase;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  &__node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    border: 1px solid $color-border;
    border-radius: 6px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    height: 70px;

    &:hover {
      background: rgba(255,255,255,0.05);
      border-color: $color-primary;
    }

    &--active {
      background: rgba($color-primary, 0.1);
      border-color: $color-primary;
      box-shadow: 0 0 10px rgba($color-primary, 0.2);
    }
  }

  &__none {
    font-size: 1.5rem;
    color: $color-text-muted;
    font-weight: bold;
    margin-bottom: 4px;
  }

  &__preview {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background-color: rgba(0,0,0,0.5);
    background-size: cover;
    margin-bottom: 6px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  &__name {
    font-size: 0.6rem;
    color: $color-text-muted;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
