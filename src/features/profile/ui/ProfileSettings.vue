<script setup lang="ts">
import { useUserStore } from '@/src/stores/useUserStore'
import ColorPicker from '@/src/widgets/user-profile/ui/ColorPicker.vue'
import { COLORS } from '@/src/shared/config/colors'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userStore = useUserStore()

const draftUsername = ref('')
const draftColor = ref('')
const colorPalette = COLORS.PLAYER_PALETTE

const emit = defineEmits<{
  close: []
  saved: []
}>()

watch(() => userStore.profile, (profile) => {
  if (profile) {
    draftUsername.value = profile.username || ''
    draftColor.value = profile.color || COLORS.PLAYER_PALETTE[0]
  }
}, { immediate: true })

const hasChanges = computed(() => {
  if (!userStore.profile) return false
  return (
    draftUsername.value !== (userStore.profile.username || '') ||
    draftColor.value !== (userStore.profile.color || COLORS.PLAYER_PALETTE[0])
  )
})

const selectColor = (color: string) => {
  draftColor.value = color
}

const saveChanges = async () => {
  if (!hasChanges.value) return
  
  const updates: { username?: string; color?: string } = {}
  
  if (draftUsername.value !== userStore.profile?.username) {
    if (draftUsername.value.length > 15) {
      alert('Ник слишком длинный!')
      return
    }
    updates.username = draftUsername.value
  }
  
  if (draftColor.value !== userStore.profile?.color) {
    updates.color = draftColor.value
  }
  
  await userStore.updateProfile(updates)
  emit('saved')
}

const handleClose = () => {
  if (userStore.profile) {
    draftUsername.value = userStore.profile.username || ''
    draftColor.value = userStore.profile.color || COLORS.PLAYER_PALETTE[0]
  }
  emit('close')
}

watch(() => user.value?.sub, async (userId) => {
  if (userId) {
    await userStore.fetchProfile()
  }
}, { immediate: true })

const canCollect = computed(() => {
  if (!userStore.profile?.last_daily_collect) return true
  const last = new Date(userStore.profile.last_daily_collect).getTime()
  const now = Date.now()
  return now - last > 24 * 60 * 60 * 1000
})

const collectBonus = async () => {
  const { data } = await supabase.rpc('collect_daily_bonus', { 
    user_id: user.value?.sub 
  })
  
  if (data?.success) {
    userStore.fetchProfile()
    alert('Получено 10 IP!')
  } else {
    alert('Бонус еще не готов')
  }
}
</script>

<template>
  <div class="settings-card">
    <div class="settings-card__header">
      <h2 class="settings-card__title">Личный кабинет</h2>
      <button class="settings-card__close" @click="handleClose">✕</button>
    </div>

    <div v-if="!userStore.profile" class="settings-card__loader">
      Загрузка данных...
    </div>
    
    <template v-else>
      <div class="settings-card__field">
        <label class="settings-card__label">Твой позывной (Street Name)</label>
        <input 
          v-model="draftUsername" 
          type="text" 
          maxlength="15" 
          placeholder="Введите ник..."
          class="settings-card__input"
        />
      </div>

      <ColorPicker 
        :colors="colorPalette" 
        :active-color="draftColor"
        label="Цвет твоих территорий"
        @select="selectColor"
      />

      <div class="settings-card__stats">
        <div class="stat-box">
          <span class="stat-box__label">Баланс</span>
          <span class="stat-box__value">{{ userStore.profile.balance?.toFixed(1) || 0 }} IP</span>
        </div>
        <div class="stat-box">
          <span class="stat-box__label">Доход (общий)</span>
          <span class="stat-box__value">{{ userStore.totalIncome }} IP / ч.</span>
          <span class="stat-box__sub">Секторов: {{ userStore.ownedHexCount }}</span>
        </div>
      </div>

      <button 
        class="settings-card__collect-btn" 
        :disabled="!canCollect" 
        @click="collectBonus"
      >
        {{ canCollect ? 'СОБРАТЬ DAILY BONUS (+10 IP)' : 'DAILY BONUS СОБРАН' }}
      </button>

      <div class="settings-card__actions">
        <button 
          class="settings-btn settings-btn--secondary" 
          @click="handleClose"
        >
          Отмена
        </button>
        <button 
          class="settings-btn settings-btn--primary" 
          :disabled="!hasChanges"
          @click="saveChanges"
        >
          Сохранить
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.settings-card {
  background: $color-card-bg-light;
  border: 1px solid $color-gray-medium;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  color: $color-white;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: $color-primary;
    margin: 0;
  }

  &__close {
    background: transparent;
    border: none;
    color: $color-text-muted;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px 8px;
    &:hover { color: $color-white; }
  }

  &__field {
    margin-bottom: 20px;
  }

  &__label {
    display: block;
    font-size: 0.8rem;
    color: $color-text-muted;
    margin-bottom: 8px;
  }

  &__input {
    width: 100%;
    background: $color-bg;
    border: 1px solid $color-gray-light;
    padding: 10px 12px;
    border-radius: 8px;
    color: $color-white;
    &:focus { border-color: $color-primary; outline: none; }
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 24px;
    border-top: 1px solid $color-gray-medium;
    padding-top: 24px;
  }

  &__collect-btn {
    width: 100%;
    padding: 12px;
    background: $color-success;
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 15px;
    &:disabled { background: $color-gray-medium; color: $color-text-muted; cursor: not-allowed; }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  &__loader {
    text-align: center;
    color: $color-text-muted;
    padding: 20px;
  }
}

.stat-box {
  background: $color-bg;
  padding: 12px;
  border-radius: 10px;
  text-align: center;

  &__label { font-size: 0.7rem; color: $color-text-muted; display: block; }
  &__value { font-size: 1rem; font-weight: bold; color: $color-success; }
  &__sub { font-size: 0.6rem; color: $color-gray-light; display: block; margin-top: 4px; }
}

.settings-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    background: $color-primary;
    color: #000;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:not(:disabled):hover { filter: brightness(1.2); }
  }

  &--secondary {
    background: transparent;
    border: 1px solid $color-gray-light;
    color: $color-text-muted;
    &:hover { border-color: $color-text-muted; color: $color-white; }
  }
}
</style>