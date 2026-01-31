<script setup lang="ts">
import { useUserStore } from '@/src/stores/useUserStore'
import ColorPicker from '@/src/widgets/user-profile/ui/ColorPicker.vue'
import PatternPicker from '@/src/widgets/user-profile/ui/PatternPicker.vue'
import { COLORS } from '@/src/shared/config/colors'
import { useTranslation } from '@/src/shared/lib/useTranslation'
import GameRulesModal from '@/src/widgets/game-rules/ui/GameRulesModal.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userStore = useUserStore()
const { t } = useTranslation()

const activeTab = ref<'profile' | 'security' | 'support'>('profile')
const isAppearanceMode = ref(false)
const showRules = ref(false)

// Данные профиля
const draftUsername = ref('')
const draftColor = ref('')
const draftPattern = ref<string | null>(null)
const colorPalette = COLORS.PLAYER_PALETTE

// Данные безопасности
const newEmail = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const securityLoading = ref(false)

// Поддержка
const feedbackMessage = ref('')
const feedbackType = ref<'bug' | 'suggestion'>('bug')
const feedbackLoading = ref(false)

const emit = defineEmits<{
  close: []
  saved: []
}>()

watch(() => userStore.profile, (profile) => {
  if (profile) {
    draftUsername.value = profile.username || ''
    draftColor.value = profile.color || COLORS.PLAYER_PALETTE[0]
    draftPattern.value = profile.pattern || null
  }
}, { immediate: true })

const hasChanges = computed(() => {
  if (!userStore.profile) return false
  return (
    draftUsername.value !== (userStore.profile.username || '') ||
    draftColor.value !== (userStore.profile.color || COLORS.PLAYER_PALETTE[0]) ||
    draftPattern.value !== (userStore.profile.pattern || null)
  )
})

const selectColor = (color: string) => {
  draftColor.value = color
}

const saveChanges = async () => {
  if (!hasChanges.value) return
  
  const updates: { username?: string; color?: string; pattern?: string | null } = {}
  
  if (draftUsername.value !== userStore.profile?.username) {
    if (draftUsername.value.length > 15) {
      alert(t('profile_error_long'))
      return
    }
    updates.username = draftUsername.value
  }
  
  if (draftColor.value !== userStore.profile?.color) {
    updates.color = draftColor.value
  }

  if (draftPattern.value !== userStore.profile?.pattern) {
    updates.pattern = draftPattern.value
  }
  
  try {
    const error = await userStore.updateProfile(updates)
    // Ошибка 23505 = unique_violation (PostgreSQL)
    if (error && (error as any).code === '23505') {
      alert(t('profile_error_duplicate_name') || 'This name is already claimed by another king.')
      return
    }
    emit('saved')
  } catch (e: any) {
    alert(e.message)
  }
}

const sendFeedback = async () => {
  if (!feedbackMessage.value) return
  feedbackLoading.value = true
  try {
    const { error } = await (supabase.from('feedback') as any).insert({
      user_id: user.value?.sub,
      username: userStore.profile?.username,
      email: user.value?.email,
      message: feedbackMessage.value,
      type: feedbackType.value
    })
    if (error) throw error
    alert(t('feedback_success' as any) || 'Message sent to headquarters.')
    feedbackMessage.value = ''
  } catch (e: any) {
    alert(e.message)
  } finally {
    feedbackLoading.value = false
  }
}

const updateEmail = async () => {
  if (!newEmail.value) return
  securityLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ email: newEmail.value })
    if (error) throw error
    alert(t('profile_alert_email'))
    newEmail.value = ''
  } catch (e: any) {
    alert(e.message)
  } finally {
    securityLoading.value = false
  }
}

const updatePassword = async () => {
  if (!newPassword.value) return
  if (newPassword.value !== confirmNewPassword.value) {
    alert(t('auth_error_mismatch'))
    return
  }
  
  securityLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    alert(t('profile_alert_pass'))
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (e: any) {
    alert(e.message)
  } finally {
    securityLoading.value = false
  }
}

const handleClose = () => {
  if (userStore.profile) {
    draftUsername.value = userStore.profile.username || ''
    draftColor.value = userStore.profile.color || COLORS.PLAYER_PALETTE[0]
    draftPattern.value = userStore.profile.pattern || null
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

const nextCollectDate = computed(() => {
  if (!userStore.profile?.last_daily_collect) return null
  const last = new Date(userStore.profile.last_daily_collect).getTime()
  return new Date(last + 24 * 60 * 60 * 1000).toLocaleString()
})

const collectBonus = async () => {
  const { data } = await (supabase.rpc as any)('collect_daily_bonus', { 
    user_id: user.value?.sub 
  })
  
  if (data?.success) {
    userStore.fetchProfile()
  } else {
    alert(t('auth_btn_wait'))
  }
}
</script>

<template>
  <div class="settings-card">
    <div class="settings-card__header">
      <h2 class="settings-card__title">{{ t('profile_title') }}</h2>
      <button class="settings-card__close" @click="handleClose">✕</button>
    </div>

    <div class="settings-card__body custom-scrollbar">
      <!-- Табы -->
      <div class="settings-tabs">
        <button 
          class="settings-tabs__item" 
          :class="{ 'settings-tabs__item--active': activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          {{ t('profile_tab_main') }}
        </button>
        <button 
          class="settings-tabs__item" 
          :class="{ 'settings-tabs__item--active': activeTab === 'security' }"
          @click="activeTab = 'security'"
        >
          {{ t('profile_tab_security') }}
        </button>
        <button 
          class="settings-tabs__item" 
          :class="{ 'settings-tabs__item--active': activeTab === 'support' }"
          @click="activeTab = 'support'"
        >
          {{ t('profile_tab_support') }}
        </button>
      </div>

      <div v-if="!userStore.profile" class="settings-card__loader">
        {{ t('loading') }}
      </div>
      
      <template v-else>
        <div v-if="activeTab === 'profile'" class="settings-card__content anim-slide-up">
          
          <!-- Главная страница профиля -->
          <template v-if="!isAppearanceMode">
            <div class="settings-card__field">
              <label class="settings-card__label">{{ t('profile_name_label') }}</label>
              <input 
                v-model="draftUsername" 
                type="text" 
                maxlength="15" 
                :placeholder="t('profile_name_label') + '...'"
                class="settings-card__input"
              />
            </div>

            <button class="settings-btn settings-btn--secondary" @click="isAppearanceMode = true">
              🎨 {{ t('profile_btn_customize' as any) }}
            </button>

            <div class="settings-card__stats">
              <div class="stat-box">
                <span class="stat-box__label">{{ t('profile_stats_balance') }}</span>
                <span class="stat-box__value">{{ userStore.profile.balance?.toFixed(1) || 0 }} IP</span>
              </div>
              <div class="stat-box">
                <span class="stat-box__label">{{ t('profile_stats_income') }}</span>
                <span class="stat-box__value">{{ userStore.totalIncome }} IP / h.</span>
                <span class="stat-box__sub">{{ t('profile_stats_sectors') }}: {{ userStore.ownedHexCount }}</span>
              </div>
            </div>

            <button 
              class="settings-card__collect-btn" 
              :disabled="!canCollect" 
              @click="collectBonus"
            >
              {{ canCollect ? t('profile_btn_bonus') : t('profile_btn_bonus_collected') }}
            </button>
            <p v-if="!canCollect && nextCollectDate" class="settings-card__bonus-info">
              {{ t('profile_bonus_next') }}: {{ nextCollectDate }}
            </p>

            <div class="settings-card__rules">
              <button class="rules-btn-mini" @click="showRules = true">
                📜 {{ t('rules_btn') }}
              </button>
            </div>

            <div class="settings-card__actions">
              <button class="settings-btn settings-btn--secondary" @click="handleClose">{{ t('profile_btn_cancel') }}</button>
              <button class="settings-btn settings-btn--primary" :disabled="!hasChanges" @click="saveChanges">{{ t('profile_btn_save') }}</button>
            </div>
          </template>

          <!-- Страница настройки внешности -->
          <template v-else>
            <div class="settings-card__header-mini">
              <button class="settings-btn settings-btn--secondary" style="flex: 0 0 auto; width: auto; padding: 8px 16px;" @click="isAppearanceMode = false">← {{ t('profile_btn_back' as any) }}</button>
              <span class="settings-card__subtitle">{{ t('profile_appearance_title' as any) }}</span>
            </div>

            <ColorPicker 
              :colors="colorPalette" 
              :active-color="draftColor"
              :label="t('profile_color_label')"
              @select="selectColor"
            />

            <PatternPicker 
              v-model="draftPattern" 
              :label="t('pattern_label' as any) || 'FACTION PATTERN'"
            />
            
            <div class="settings-card__actions">
               <button class="settings-btn settings-btn--primary" :disabled="!hasChanges" @click="saveChanges">{{ t('profile_btn_save') }}</button>
            </div>
          </template>
        </div>

        <div v-else-if="activeTab === 'security'" class="settings-card__content anim-slide-up">
          <div class="settings-card__section-title">{{ t('profile_sec_email_title') }}</div>
          <div class="settings-card__field">
            <label class="settings-card__label">{{ t('profile_sec_email_label') }}</label>
            <input 
              v-model="newEmail" 
              type="email" 
              placeholder="new-email@example.com"
              class="settings-card__input"
            />
            <button 
              class="settings-btn settings-btn--primary settings-btn--small" 
              :disabled="!newEmail || securityLoading"
              @click="updateEmail"
            >
              {{ t('profile_sec_email_btn') }}
            </button>
          </div>

          <div class="settings-card__divider"></div>

          <div class="settings-card__section-title">{{ t('profile_sec_pass_title') }}</div>
          <div class="settings-card__field">
            <label class="settings-card__label">{{ t('profile_sec_pass_label') }}</label>
            <input 
              v-model="newPassword" 
              type="password" 
              placeholder="********"
              class="settings-card__input"
            />
          </div>
          <div class="settings-card__field">
            <label class="settings-card__label">{{ t('profile_sec_pass_confirm') }}</label>
            <input 
              v-model="confirmNewPassword" 
              type="password" 
              placeholder="********"
              class="settings-card__input"
            />
            <button 
              class="settings-btn settings-btn--primary settings-btn--small" 
              :disabled="!newPassword || securityLoading"
              @click="updatePassword"
            >
              {{ t('profile_sec_pass_btn') }}
            </button>
          </div>
        </div>

        <div v-else class="settings-card__content anim-slide-up">
          <div class="settings-card__section-title">{{ t('profile_tab_support') }}</div>
          <p class="settings-card__description">{{ t('feedback_label') }}</p>
          
          <div class="settings-tabs settings-tabs--mini">
            <button 
              class="settings-tabs__item" 
              :class="{ 'settings-tabs__item--active': feedbackType === 'bug' }"
              @click="feedbackType = 'bug'"
            >
              {{ t('feedback_type_bug') }}
            </button>
            <button 
              class="settings-tabs__item" 
              :class="{ 'settings-tabs__item--active': feedbackType === 'suggestion' }"
              @click="feedbackType = 'suggestion'"
            >
              {{ t('feedback_type_suggestion') }}
            </button>
          </div>

          <div class="settings-card__field">
            <textarea 
              v-model="feedbackMessage" 
              :placeholder="t('feedback_placeholder')"
              class="settings-card__textarea"
              rows="4"
            ></textarea>
          </div>

          <button 
            class="settings-btn settings-btn--primary" 
            :disabled="!feedbackMessage || feedbackLoading"
            @click="sendFeedback"
          >
            {{ feedbackLoading ? '...' : t('feedback_btn') }}
          </button>
        </div>
      </template>
    </div>

    <!-- Модалка правил -->
    <GameRulesModal :is-visible="showRules" @close="showRules = false" />
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
  max-height: calc(100dvh - 60px);
  color: $color-white;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.1rem;
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

  &__body {
    overflow-y: auto;
    flex: 1;
    margin-right: -14px;
    padding-right: 14px;
    
    /* Сдвигаем маргин для компенсации паддинга и красоты скролла */
  }

  &__field {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    display: block;
    font-size: 0.75rem;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__input {
    width: 100%;
    background: $color-bg;
    border: 1px solid $color-gray-light;
    padding: 12px;
    border-radius: 8px;
    color: $color-white;
    font-size: 0.9rem;
    &:focus { border-color: $color-primary; outline: none; }
  }

  &__divider {
    height: 1px;
    background: $color-gray-medium;
    margin: 25px 0;
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
    padding: 14px;
    background: $color-success;
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: 900;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    margin-top: 15px;
    transition: all 0.2s;
    font-family: inherit;
    &:disabled { background: $color-gray-medium; color: $color-text-muted; cursor: not-allowed; }
    &:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); }
  }

  &__rules {
    margin-top: 15px;
    display: flex;
    justify-content: center;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 25px;
  }

  &__loader {
    text-align: center;
    color: $color-text-muted;
    padding: 20px;
  }

  &__bonus-info {
    font-size: 0.7rem;
    color: $color-text-muted;
    text-align: center;
    margin-top: 8px;
  }

  &__section-title {
    font-size: 0.9rem;
    font-weight: bold;
    color: $color-primary;
    margin: 15px 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__description {
    font-size: 0.8rem;
    color: $color-text-muted;
    margin-bottom: 20px;
  }

  &__textarea {
    width: 100%;
    background: $color-bg;
    border: 1px solid $color-gray-light;
    padding: 12px;
    border-radius: 8px;
    color: $color-white;
    font-size: 0.9rem;
    font-family: inherit;
    resize: none;
    &:focus { border-color: $color-primary; outline: none; }
  }

    &__header-mini {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
  }

  &__subtitle {
    font-size: 0.9rem;
    font-weight: bold;
    color: $color-white;
    text-transform: uppercase;
  }
}

.settings-tabs {
  display: flex;
  background: $color-bg;
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 25px;

  &--mini {
    margin-bottom: 20px;
    border-radius: 6px;
    .settings-tabs__item {
      padding: 6px;
      font-size: 0.7rem;
    }
  }

  &__item {
    flex: 1;
    padding: 8px;
    border: none;
    background: transparent;
    color: $color-text-muted;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &--active {
      background: $color-card-bg-light;
      color: $color-primary;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    &:hover:not(.settings-tabs__item--active) {
      color: $color-white;
    }
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
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;

  &--primary {
    background: $color-primary;
    color: #000;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); }
  }

  &--secondary {
    background: transparent;
    border: 1px solid $color-gray-light;
    color: $color-text-muted;
    &:hover { border-color: $color-text-muted; color: $color-white; background: rgba($color-white, 0.05); }
  }

  &--small {
    padding: 10px 16px;
    font-size: 0.75rem;
    margin-top: 10px;
    width: fit-content;
    align-self: flex-end;
  }
}

.rules-btn-mini {
  background: transparent;
  border: 1px solid rgba($color-primary, 0.3);
  color: $color-primary;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($color-primary, 0.1); border-color: $color-primary; }
}

.anim-slide-up {
  animation: slideUp 0.3s ease-out;
}



@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>