<script setup lang="ts">
const logs = ref<{ id: number; text: string; type: 'system' | 'error' | 'success' }[]>([]);
let logId = 0;

const addLog = (text: string, type: 'system' | 'error' | 'success' = 'system') => {
  const id = logId++;
  logs.value.push({ id, text, type });
  
  // Удаляем сообщение через 5 секунд, чтобы не забивать экран
  setTimeout(() => {
    logs.value = logs.value.filter(l => l.id !== id);
  }, 5000);
};

// Экспортируем метод, чтобы вызывать его извне
defineExpose({ addLog });
</script>

<template>
  <div class="terminal-log">
    <TransitionGroup name="log-fade">
      <div v-for="log in logs" :key="log.id" :class="['log-item', `log-item--${log.type}`]">
        <span class="log-item__prefix">[{{ log.type.toUpperCase() }}]:</span>
        <span class="log-item__text">{{ log.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.terminal-log {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  font-family: 'Courier New', Courier, monospace;
}

.log-item {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  padding: 8px 12px;
  border-left: 3px solid #00f2ff;
  font-size: 12px;
  color: #00f2ff;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);

  &--error { border-color: #ff0055; color: #ff0055; }
  &--success { border-color: #39ff14; color: #39ff14; }

  &__prefix { font-weight: bold; margin-right: 8px; opacity: 0.7; }
}

.log-fade-enter-active, .log-fade-leave-active { transition: all 0.3s ease; }
.log-fade-enter-from { opacity: 0; transform: translateX(-20px); }
.log-fade-leave-to { opacity: 0; transform: scale(0.9); }
</style>