<script setup lang="ts">
import { useTranslation } from '@/src/shared/lib/useTranslation'

defineProps<{
  user: any;
  currentHexId: string | null;
  isZoneCapturedByMe: boolean;
  currentZoneOwner: string | null;
  captureLoading: boolean;
}>();

const emit = defineEmits(['capture', 'center-me']);
const { t } = useTranslation();

const handleCapture = () => {
    emit('capture');
};

const handleCenterMe = () => {
  emit('center-me');
}
</script>

<template>
  <div v-if="user" class="map-overlay">
    <div v-if="user" class="map-overlay__actions-panel">
      <div v-if="currentHexId" class="map-overlay__sector-info anim-slide-up">
        <div class="sector-badge">
          <span class="sector-badge__id">{{ currentHexId.substring(0, 12) }}</span>
          <div class="sector-badge__status" :class="{ 
            'sector-badge__status--owned': isZoneCapturedByMe,
            'sector-badge__status--enemy': currentZoneOwner && !isZoneCapturedByMe 
          }">
            {{ isZoneCapturedByMe ? t('status_secured') : (currentZoneOwner ? t('status_enemy') : t('status_neutral')) }}
          </div>
        </div>
      </div>

      <button 
        v-if="currentHexId"
        class="map-overlay__capture-btn"
        :class="{ 'map-overlay__capture-btn--owner': isZoneCapturedByMe }"
        :disabled="captureLoading || isZoneCapturedByMe" 
        @click="handleCapture"
      >
        <template v-if="captureLoading">
          <span>{{ t('overlay_scanning') }}</span>
        </template>
        <template v-else-if="isZoneCapturedByMe">
          <span>● {{ t('overlay_secured') }}</span>
        </template>
        <template v-else>
          <span>{{ t('overlay_capture') }}</span>
        </template>
      </button>

      <!-- Кнопка центрации -->
      <button class="map-overlay__center-btn" @click="handleCenterMe" title="Find me">
        🎯
      </button>
    </div>
    
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.map-overlay {
  position: absolute;
  inset: 0;
  z-index: $z-ui;
  pointer-events: none;
  padding: 20px;
  
  /* Разрешаем клики по прямым потомкам */
  & > * {
    pointer-events: auto; 
  }

  &__actions-panel {
    position: absolute;
    bottom: max(30px, env(safe-area-inset-bottom) + 20px);
    left: 0;
    right: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__center-btn {
    position: absolute;
    right: 20px;
    bottom: 20px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba($color-black, 0.7);
    border: 1px solid rgba($color-primary, 0.3);
    color: $color-primary;
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    pointer-events: auto;

    &:hover {
      border-color: $color-primary;
      transform: scale(1.1);
      background: rgba($color-black, 0.85);
    }
  }

  &__sector-info {
    width: fit-content;
    pointer-events: none;
  }

  &__capture-btn {
    background: $color-primary;
    color: $color-bg;
    border: none;
    padding: 16px 40px;
    font-weight: 900;
    letter-spacing: 2px;
    clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 20px rgba($color-primary, 0.4);

    &:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba($color-primary, 0.6);
    }

    &:disabled {
      opacity: 0.5;
      background: $color-gray-light;
    }

    &--owner {
      background: rgba($color-primary, 0.1) !important;
      border: 1px solid $color-primary !important;
      color: $color-primary !important;
      box-shadow: inset 0 0 15px rgba($color-primary, 0.2);
      cursor: default;
      clip-path: none;
    }
  }
}

.sector-badge {
  background: rgba($color-black, 0.8);
  border: 1px solid rgba($color-white, 0.1);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);

  &__id {
    padding: 6px 12px;
    color: $color-primary;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: bold;
    border-right: 1px solid rgba($color-white, 0.1);
  }

  &__status {
    padding: 6px 12px;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $color-text-muted;

    &--owned {
      color: $color-success;
      text-shadow: 0 0 5px rgba($color-success, 0.5);
    }

    &--enemy {
      color: $color-error;
      text-shadow: 0 0 5px rgba($color-error, 0.5);
    }
  }
}

.anim-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
