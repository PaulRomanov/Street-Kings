<script setup lang="ts">
defineProps<{
  user: any;
  currentHexId: string | null;
  isZoneCapturedByMe: boolean;
  captureLoading: boolean;
}>();

const emit = defineEmits(['capture']);

const handleCapture = () => {
    emit('capture');
};
</script>

<template>
  <div v-if="user" class="map-overlay">
    <div v-if="user" class="map-overlay__actions-panel">
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
</style>
