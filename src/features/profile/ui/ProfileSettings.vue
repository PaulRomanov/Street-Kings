<script setup lang="ts">
import { useUserStore } from '@/src/stores/useUserStore'
import ColorPicker from '@/src/widgets/user-profile/ui/ColorPicker.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userStore = useUserStore()

// Local draft state (changes applied only on save)
const draftUsername = ref('')
const draftColor = ref('')
const colorPalette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

const emit = defineEmits<{
  close: []
  saved: []
}>()

// Initialize local state from profile
watch(() => userStore.profile, (profile) => {
  if (profile) {
    draftUsername.value = profile.username || ''
    draftColor.value = profile.color || '#3b82f6'
  }
}, { immediate: true })

// Check if there are unsaved changes
const hasChanges = computed(() => {
  if (!userStore.profile) return false
  return (
    draftUsername.value !== (userStore.profile.username || '') ||
    draftColor.value !== (userStore.profile.color || '#3b82f6')
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
  // Reset draft to current profile values
  if (userStore.profile) {
    draftUsername.value = userStore.profile.username || ''
    draftColor.value = userStore.profile.color || '#3b82f6'
  }
  emit('close')
}

// Load profile when user is ready
watch(() => user.value?.sub, async (userId) => {
  if (userId) {
    await userStore.fetchProfile()
  }
}, { immediate: true })

const canCollect = computed(() => {
  if (!userStore.profile?.last_daily_collect) return true
  const last = new Date(userStore.profile.last_daily_collect).getTime()
  const now = new Date().getTime()
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

    <div v-if="!userStore.profile" class="loader">
      Загрузка данных...
    </div>
    
    <template v-else>
      <div class="field">
        <label>Твой позывной (Street Name)</label>
        <input 
          v-model="draftUsername" 
          type="text" 
          maxlength="15" 
          placeholder="Введите ник..."
          class="field__input"
        />
      </div>

      <ColorPicker 
        :colors="colorPalette" 
        :active-color="draftColor"
        label="Цвет твоих территорий"
        @select="selectColor"
      />

      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-box__label">Баланс</span>
          <span class="stat-box__value">{{ userStore.profile.balance?.toFixed(1) || 0 }} IP</span>
        </div>
        <div class="stat-box">
          <span class="stat-box__label">Доход</span>
          <span class="stat-box__value">0.1 IP / ч.</span>
        </div>
      </div>

      <button 
        class="collect-btn" 
        :disabled="!canCollect" 
        @click="collectBonus"
      >
        {{ canCollect ? 'СОБРАТЬ DAILY BONUS (+10 IP)' : 'БОНУС СОБРАН' }}
      </button>

      <div class="settings-card__actions">
        <button 
          class="btn btn--secondary" 
          @click="handleClose"
        >
          Отмена
        </button>
        <button 
          class="btn btn--primary" 
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
  background: #1a1a1e;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  color: #fff;

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
    color: #3b82f6;
    margin: 0;
  }

  &__close {
    background: transparent;
    border: none;
    color: #666;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px 8px;
    &:hover { color: #fff; }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .field {
    margin-bottom: 20px;
    
    label {
      display: block;
      font-size: 0.8rem;
      color: #888;
      margin-bottom: 8px;
    }

    &__input {
      width: 100%;
      background: #000;
      border: 1px solid #444;
      padding: 10px 12px;
      border-radius: 8px;
      color: #fff;
      &:focus { border-color: #3b82f6; outline: none; }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 24px;
    border-top: 1px solid #333;
    padding-top: 24px;
  }

  .stat-box {
    background: #000;
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    &__label { font-size: 0.7rem; color: #666; display: block; }
    &__value { font-size: 1rem; font-weight: bold; color: #10b981; }
  }
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &--primary {
    background: #3b82f6;
    color: white;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:not(:disabled):hover { background: #2563eb; }
  }

  &--secondary {
    background: transparent;
    border: 1px solid #444;
    color: #888;
    &:hover { border-color: #666; color: #fff; }
  }
}

.collect-btn {
  width: 100%;
  padding: 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
  &:disabled { background: #333; cursor: not-allowed; }
}

.loader {
  text-align: center;
  color: #666;
  padding: 20px;
}
</style>