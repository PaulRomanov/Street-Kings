<script setup lang="ts">
import ColorPicker from '@/src/widgets/user-profile/ui/ColorPicker.vue';

defineProps<{
  user: any;
  currentHexId: string | null;
  isZoneCapturedByMe: boolean;
  captureLoading: boolean;
}>();

const emit = defineEmits(['colorUpdated', 'capture']);

const handleCapture = () => {
    emit('capture');
};

const onColorUpdated = () => {
    emit('colorUpdated');
};
</script>

<template>
  <div v-if="user" class="map-overlay">
    <div v-if="currentHexId" class="map-overlay__hex-info">
      <span class="map-overlay__hex-label">CURRENT SECTOR</span>
      <span class="map-overlay__hex-id">{{ currentHexId }}</span>
      
      <div class="map-overlay__zone-status" :class="{ 'map-overlay__zone-status--captured': isZoneCapturedByMe }">
        {{ isZoneCapturedByMe ? 'AREA CONTROLLED' : 'NEUTRAL TERRITORY' }}
      </div>
    </div>

    <div v-if="user" class="map-overlay__actions-panel">
      <ColorPicker @colorChanged="onColorUpdated" />

      <button 
        v-if="currentHexId"
        class="map-overlay__capture-btn"
        :class="{ 'map-overlay__capture-btn--owner': isZoneCapturedByMe }"
        :disabled="captureLoading || isZoneCapturedByMe" 
        @click="handleCapture"
      >
        <template v-if="captureLoading">
          <span>SCANNING...</span>
        </template>
        <template v-else-if="isZoneCapturedByMe">
          <span>● SECTOR SECURED</span>
        </template>
        <template v-else>
          <span>CAPTURE ZONE</span>
        </template>
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
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  
  & > * {
    pointer-events: auto; 
  }

  &__hex-info {
    background: rgba($color-bg, 0.8);
    backdrop-filter: blur(10px);
    border-left: 4px solid $color-primary;
    padding: 12px 20px;
    width: fit-content;
    font-family: monospace;
  }

  &__hex-label {
    color: rgba($color-text, 0.5);
    font-size: 10px;
    display: block;
  }
  
  &__hex-id {
    color: $color-primary;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  &__actions-panel {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
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
      background: #666;
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

  &__zone-status {
    margin-top: 8px;
    font-size: 11px;
    font-weight: bold;
    color: rgba($color-text, 0.4);
    text-transform: uppercase;

    &--captured {
      color: $color-primary;
      text-shadow: 0 0 8px rgba($color-primary, 0.5);
      
      &::before {
        content: '● ';
        animation: blink 1s infinite;
      }
    }
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
