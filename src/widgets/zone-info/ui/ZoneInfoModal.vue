<script setup lang="ts">
import { useZones } from '@/src/entities/zone/model/useZones';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';
import { useZoneStore } from '@/src/stores/useZoneStore';
import { useUserStore } from '@/src/stores/useUserStore';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { calculateLiveStorage } from '@/src/shared/lib/useEconomy';

const props = defineProps<{
  hexId: string | null;
  isVisible: boolean;
}>();

const emit = defineEmits(['close']);

const { fetchZones } = useZones();
const zoneStore = useZoneStore();
const userStore = useUserStore();
const { allZones } = storeToRefs(zoneStore);
const { getHexBoundary } = useHexgrid();
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const currentTime = ref(Date.now());
let tickerInterval: any = null;

onMounted(() => {
  tickerInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (tickerInterval) clearInterval(tickerInterval);
});

// Расчет накопленных IP в реальном времени (лимит 10, формат X.XX)
const accumulatedStorage = computed(() => {
  const zone = allZones.value.find(z => z.id === props.hexId);
  if (!zone) return 0;
  
  // Используем общую утилиту для расчета (с передачей currentTime для реактивности)
  return calculateLiveStorage(zone.storage || 0, zone.last_income_at, currentTime.value);
});

const zoneInfo = computed(() => {
  if (!props.hexId) return null;
  const zone = allZones.value.find(z => z.id === props.hexId);
  if (!zone) return { status: 'NEUTRAL', id: props.hexId, storage: 0 };

  const isMe = String(zone.owner_id) === String(user.value?.sub);
  
  return {
    id: zone.id,
    owner: zone.owner_id,
    username: zone.profiles?.username || 'ANONYMOUS',
    ownerColor: zone.profiles?.color || '#ffffff',
    status: isMe ? 'SECURED' : 'ENEMY',
    storage: accumulatedStorage.value,
    capturedAt: zone.updated_at ? new Date(zone.updated_at).toLocaleString() : 'Неизвестно'
  };
});

const isOwner = computed(() => String(zoneInfo.value?.owner) === String(user.value?.sub));

const harvestIp = async () => {
  if (!props.hexId) return;
  const { data, error } = await (supabase.rpc as any)('harvest_hexagon', { 
    target_hex_id: props.hexId 
  });
  
  if (error) return alert(error.message);
  if (data?.success) {
    await fetchZones();
    await userStore.fetchProfile();
  } else {
     alert(data?.message || 'Ошибка сбора');
  }
};

const fortifyHex = async () => {
  if (!props.hexId) return;
  const { data, error } = await (supabase.rpc as any)('fortify_hexagon', { 
    target_hex_id: props.hexId
  });

  if (error) return alert(error.message);
  if (data?.success) {
    await fetchZones();
    await userStore.fetchProfile();
  } else {
    alert(data?.message || 'Ошибка укрепления');
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isVisible && zoneInfo" class="zone-modal-overlay" @click.self="closeModal">
    <div class="zone-modal">
      <button class="zone-modal__close-btn" @click="closeModal">×</button>
      <h2 class="zone-modal__title">Сектор {{ zoneInfo.id.substring(0, 12) }}...</h2>
      
      <div class="zone-modal__content">
        <p class="zone-modal__status">
          Статус: <strong :class="{ 
            'zone-modal__tag--secured': zoneInfo.status === 'SECURED',
            'zone-modal__tag--enemy': zoneInfo.status === 'ENEMY'
          }">{{ zoneInfo.status }}</strong>
        </p>

        <div v-if="zoneInfo.owner" class="zone-modal__details">
          <div class="zone-detail">
            <span class="zone-detail__label">Владелец:</span>
            <span class="zone-detail__value" :style="{ color: zoneInfo.ownerColor }">
              {{ zoneInfo.username }}
            </span>
          </div>
          <div class="zone-detail">
            <span class="zone-detail__label">Хранилище:</span>
            <span 
              class="zone-detail__value zone-detail__value--highlight" 
              :class="{ 'zone-detail__value--limit': zoneInfo.storage >= 10 }"
            >
              {{ zoneInfo.storage?.toFixed(2) }} / 10.00 IP
            </span>
          </div>
          <div class="zone-detail">
            <span class="zone-detail__label">Захвачен:</span>
            <span class="zone-detail__value zone-detail__value--small">{{ zoneInfo.capturedAt }}</span>
          </div>

          <div v-if="isOwner" class="zone-modal__actions">
            <button 
              class="zone-action-btn zone-action-btn--harvest" 
              :disabled="zoneInfo.storage < 0.01"
              @click="harvestIp"
            >
              Собрать IP
            </button>
            <button 
              class="zone-action-btn zone-action-btn--fortify" 
              :disabled="zoneInfo.storage >= 10 || (userStore.profile?.balance || 0) < 1"
              @click="fortifyHex"
            >
              Укрепить (+1 IP)
            </button>
          </div>
          <p v-if="isOwner && zoneInfo.storage >= 10" class="zone-modal__limit-warning">Хранилище заполнено</p>
        </div>

        <div v-else class="zone-modal__empty">
          <p>Сектор свободен для захвата за 5.00 IP.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: $z-modal;
  backdrop-filter: blur(10px);
}

.zone-modal {
  background: $color-card-bg;
  border: 1px solid $color-gray-medium;
  padding: 30px;
  border-radius: 16px;
  color: $color-text;
  max-width: 400px;
  width: 90%;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);

  &__close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: $color-text-muted;
    cursor: pointer;
    &:hover { color: $color-white; }
  }

  &__title {
    color: $color-primary;
    margin: 0 0 24px 0;
    font-size: 1.1rem;
    letter-spacing: 1px;
    font-family: monospace;
  }

  &__status {
    margin-bottom: 20px;
    font-size: 0.9rem;
  }

  &__tag {
    color: $color-text-muted;
    &--secured { color: $color-success; }
    &--enemy { color: $color-error; }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid $color-gray-dark;
  }

  &__limit-warning {
    color: $color-error;
    font-size: 0.7rem;
    text-align: center;
    margin-top: 10px;
  }

  &__empty {
    text-align: center;
    color: $color-text-muted;
    padding: 20px 0;
    font-size: 0.9rem;
  }
}

.zone-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.85rem;
  
  &__label { color: $color-text-muted; }
  &__value { 
    font-weight: bold; 
    &--highlight { color: $color-primary; }
    &--limit { color: $color-error; }
    &--small { font-size: 0.75rem; color: $color-gray-light; }
  }
}

.zone-action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &--harvest {
    background: $color-success;
    color: #000;
    &:disabled { background: $color-gray-medium; color: $color-text-muted; cursor: not-allowed; }
  }

  &--fortify {
    background: transparent;
    border: 1px solid $color-primary;
    color: $color-primary;
    &:disabled { border-color: $color-gray-medium; color: $color-text-muted; cursor: not-allowed; }
  }
}
</style>