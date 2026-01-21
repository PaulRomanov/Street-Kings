<script setup lang="ts">
// Здесь в будущем будет аватарка или неоновая стрелка
</script>

<template>
  <div class="user-marker">
    <div class="user-marker__core"></div>
    <div class="user-marker__pulse"></div>
  </div>
</template>

<style lang="scss" scoped>
.user-marker {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &__core {
    width: 12px;
    height: 12px;
    background: $color-primary;
    border-radius: 50%;
    box-shadow: 0 0 10px $color-primary;
    z-index: 2;
  }

  &__pulse {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid $color-primary;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
</style>