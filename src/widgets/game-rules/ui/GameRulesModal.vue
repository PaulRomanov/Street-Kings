<script setup lang="ts">
import { useTranslation } from '@/src/shared/lib/useTranslation'

defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useTranslation()

const sections = [
  { title: 'rules_intro_title', text: 'rules_intro_text', icon: '🏙️' },
  { title: 'rules_ip_title', text: 'rules_ip_text', icon: '⚡' },
  { title: 'rules_capture_title', text: 'rules_capture_text', icon: '⚔️' },
  { title: 'rules_income_title', text: 'rules_income_text', icon: '💰' },
  { title: 'rules_bonus_title', text: 'rules_bonus_text', icon: '🎁' }
] as const
</script>

<template>
  <div v-if="isVisible" class="rules-overlay" @click.self="emit('close')">
    <div class="rules-modal anim-slide-up">
      <div class="rules-modal__header">
        <h2 class="rules-modal__title">{{ t('rules_title') }}</h2>
        <button class="rules-modal__close-x" @click="emit('close')">✕</button>
      </div>

      <div class="rules-modal__content custom-scrollbar">
        <div v-for="section in sections" :key="section.title" class="rules-section">
          <div class="rules-section__header">
            <span class="rules-section__icon">{{ section.icon }}</span>
            <h3 class="rules-section__title">{{ t(section.title) }}</h3>
          </div>
          <p class="rules-section__text">{{ t(section.text) }}</p>
        </div>
      </div>

      <div class="rules-modal__footer">
        <button class="rules-btn" @click="emit('close')">
          {{ t('rules_close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rules-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: $z-modal + 10; // Выше чем обычные модалки
  backdrop-filter: blur(8px);
  padding: 20px;
}

.rules-modal {
  background: $color-card-bg;
  border: 1px solid rgba($color-primary, 0.4);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba($color-primary, 0.1);
  overflow: hidden;

  &__header {
    padding: 24px;
    border-bottom: 1px solid rgba($color-white, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    color: $color-primary;
    font-size: 1.2rem;
    letter-spacing: 2px;
    font-weight: 900;
    margin: 0;
    text-transform: uppercase;
  }

  &__close-x {
    background: transparent;
    border: none;
    color: $color-text-muted;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s;
    &:hover { color: $color-white; }
  }

  &__content {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  &__footer {
    padding: 20px 24px;
    border-top: 1px solid rgba($color-white, 0.1);
    display: flex;
    justify-content: center;
  }
}

.rules-section {
  margin-bottom: 30px;
  &:last-child { margin-bottom: 0; }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__icon {
    font-size: 1.5rem;
  }

  &__title {
    color: $color-white;
    font-size: 1rem;
    font-weight: bold;
    margin: 0;
  }

  &__text {
    color: $color-text-muted;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
    padding-left: 40px;
  }
}

.rules-btn {
  width: 100%;
  background: $color-primary;
  color: $color-bg;
  border: none;
  padding: 14px;
  font-weight: 900;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s;
  &:hover { filter: brightness(1.2); transform: translateY(-2px); }
  &:active { transform: translateY(0); }
}

.custom-scrollbar {
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
  &::-webkit-scrollbar-thumb { background: rgba($color-primary, 0.3); border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba($color-primary, 0.5); }
}

.anim-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
