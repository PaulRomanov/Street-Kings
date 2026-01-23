<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { useZones } from '@/src/entities/zone/model/useZones';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';

const props = defineProps<{
  hexId: string | null;
  isVisible: boolean;
}>();

const emit = defineEmits(['close']);

const { allZones } = useZones();
const { getHexBoundary } = useHexgrid();
const zoneInfo = computed(() => {
  if (!props.hexId) return null;
  const zone = allZones.value.find(z => z.id === props.hexId);
  if (!zone) return { status: 'Нейтральный', id: props.hexId };

  return {
    id: zone.id,
    owner: zone.owner_id,
    ownerColor: zone.profiles?.color || '#ffffff',
    status: 'Захвачен',
    capturedAt: zone.captured_at ? new Date(zone.captured_at).toLocaleString() : 'Неизвестно'
  };
});

const closeModal = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isVisible && zoneInfo" class="zone-info-modal-overlay" @click.self="closeModal">
    <div class="zone-info-modal">
      <button class="zone-info-modal__close-btn" @click="closeModal">×</button>
      <h2>Сектор {{ zoneInfo.id }}</h2>
      <p>Статус: <strong>{{ zoneInfo.status }}</strong></p>
      <div v-if="zoneInfo.owner" class="owner-info">
        <p>Владелец ID: <span :style="{ color: zoneInfo.ownerColor }">{{ zoneInfo.owner }}</span></p>
        <p>Захвачен: {{ zoneInfo.capturedAt }}</p>
      </div>
      <div v-else>
        <p>На данный момент сектор ничей.</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-info-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: $z-modal;
}

.zone-info-modal {
  background: rgba($color-bg, 0.95);
  backdrop-filter: blur(15px);
  padding: 30px;
  border-radius: 8px;
  border: 1px solid rgba(white, 0.1);
  box-shadow: 0 0 40px rgba($color-primary, 0.3);
  color: $color-text;
  max-width: 400px;
  width: 90%;
  position: relative;

  &__close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    color: rgba($color-text, 0.5);
    cursor: pointer;
    &:hover {
      color: $color-primary;
    }
  }

  h2 {
    color: $color-primary;
    margin-top: 0;
    margin-bottom: 20px;
    text-transform: uppercase;
  }

  .owner-info {
    margin-top: 20px;
    border-top: 1px dashed rgba($color-text, 0.2);
    padding-top: 15px;
  }
}
</style>