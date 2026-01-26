<script setup lang="ts">
import { useZones } from '@/src/entities/zone/model/useZones';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';
import { useZoneStore } from '@/src/stores/useZoneStore';
import { useUserStore } from '@/src/stores/useUserStore';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { calculateLiveStorage } from '@/src/shared/lib/useEconomy';
import { useTranslation } from '@/src/shared/lib/useTranslation';

const props = defineProps<{
  hexId: string | null;
  isVisible: boolean;
}>();

const emit = defineEmits(['close']);

const { fetchZones } = useZones();
const zoneStore = useZoneStore();
const userStore = useUserStore();
const { t } = useTranslation();
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
  return calculateLiveStorage(zone.storage || 0, zone.last_income_at, currentTime.value);
});

const zoneInfo = computed(() => {
  if (!props.hexId) return null;
  const zone = allZones.value.find(z => z.id === props.hexId);
  if (!zone) return { status: t('status_neutral'), id: props.hexId, storage: 0 };

  const isMe = String(zone.owner_id) === String(user.value?.sub);
  
  return {
    id: zone.id,
    owner_id: zone.owner_id,
    username: zone.profiles?.username || t('zone_anonymous'),
    ownerColor: zone.profiles?.color || '#ffffff',
    status: isMe ? t('status_secured') : t('status_enemy'),
    isMe,
    storage: accumulatedStorage.value,
    capturedAt: zone.updated_at ? new Date(zone.updated_at).toLocaleString() : '---'
  };
});

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
    alert(data?.message || t('error_harvest'));
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
    alert(data?.message || t('error_fortify'));
  }
};

const handleCapture = async () => {
  if (!props.hexId) return;
  
  const { data, error } = await (supabase.rpc as any)('capture_hexagon', {
      target_hex_id: props.hexId
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data?.success) {
    await fetchZones();
    await userStore.fetchProfile();
    emit('close');
  } else {
    alert(data?.message || 'Error capturing');
  }
};

const closeModal = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isVisible && zoneInfo" class="zone-modal-overlay" @click.self="closeModal">
    <div class="zone-modal anim-slide-up">
      <button class="zone-modal__close-btn" @click="closeModal">✕</button>
      <h2 class="zone-modal__title">{{ t('zone_title') }} {{ zoneInfo.id.substring(0, 12) }}...</h2>
      
      <div class="zone-modal__content">
        <div class="zone-detail">
          <span class="zone-detail__label">{{ t('zone_status') }}:</span>
          <span class="zone-detail__value" :class="{ 
            'zone-detail__value--success': zoneInfo.isMe,
            'zone-detail__value--danger': !zoneInfo.isMe && zoneInfo.owner_id
          }">{{ zoneInfo.status }}</span>
        </div>

        <template v-if="zoneInfo.owner_id">
          <div class="zone-detail">
            <span class="zone-detail__label">{{ t('zone_owner') }}:</span>
            <span class="zone-detail__value" :style="{ color: zoneInfo.ownerColor }">
              {{ zoneInfo.username }}
            </span>
          </div>
          <div class="zone-detail">
            <span class="zone-detail__label">{{ t('zone_storage') }}:</span>
            <span 
              class="zone-detail__value zone-detail__value--highlight" 
              :class="{ 'zone-detail__value--limit': accumulatedStorage >= 10 }"
            >
              {{ accumulatedStorage.toFixed(2) }} / 10.00 IP
            </span>
          </div>
          <div class="zone-detail">
            <span class="zone-detail__label">{{ t('zone_captured') }}:</span>
            <span class="zone-detail__value zone-detail__value--small">{{ zoneInfo.capturedAt }}</span>
          </div>

          <div v-if="zoneInfo.isMe" class="zone-modal__actions">
            <button 
              class="zone-action-btn zone-action-btn--harvest" 
              :disabled="accumulatedStorage < 0.01"
              @click="harvestIp"
            >
              {{ t('zone_btn_harvest') }}
            </button>
            <button 
              class="zone-action-btn zone-action-btn--fortify" 
              :disabled="accumulatedStorage >= 10"
              @click="fortifyHex"
            >
              {{ accumulatedStorage >= 10 ? t('zone_limit_warning') : t('zone_btn_fortify') }}
            </button>
          </div>
        </template>

        <div v-else class="zone-modal__empty">
          <p>{{ t('zone_empty') }}</p>
          <div class="zone-modal__actions">
            <button class="zone-action-btn zone-action-btn--harvest" @click="handleCapture">
              CAPTURE (5.00 IP)
            </button>
          </div>
        </div>

        <div v-if="!zoneInfo.isMe && zoneInfo.owner_id" class="zone-modal__actions">
          <button class="zone-action-btn zone-action-btn--fortify" @click="handleCapture">
            ATTACK ({{ (10 + (zoneInfo.storage || 0)).toFixed(2) }} IP)
          </button>
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
  max-height: calc(100dvh - 40px);
  width: 95%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);

  &__content {
    overflow-y: auto;
    flex: 1;
    margin-right: -15px;
    padding-right: 15px;
  }

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
    text-transform: uppercase;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid $color-gray-dark;
  }

  &__empty {
    text-align: center;
    color: $color-text-muted;
    padding: 10px 0;
    font-size: 0.9rem;
    p { margin-bottom: 20px; }
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
    &--success { color: $color-success; }
    &--danger { color: $color-error; }
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

.anim-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>