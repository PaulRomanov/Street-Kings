<script setup lang="ts">
import AuthForm from '@/src/features/auth-form/ui/AuthForm.vue'
import ProfileSettings from '@/src/features/profile/ui/ProfileSettings.vue'
import TheMap from '@/src/widgets/the-map/ui/TheMap.vue'
import { useUserStore } from '@/src/stores/useUserStore'
import { useTranslation } from '@/src/shared/lib/useTranslation'

const user = useSupabaseUser()
const userStore = useUserStore()
const { t, currentLang, setLanguage } = useTranslation()
const isProfileOpen = ref(false)

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const toggleLanguage = () => {
  setLanguage(currentLang.value === 'en' ? 'ru' : 'en')
}

const handleLogout = async () => {
  const supabase = useSupabaseClient()
  await supabase.auth.signOut()
}

</script>

<template>
  <main class="game-page">
    <template v-if="user">
      <TheMap>
        <div class="game-page__ui">
          <div class="game-page__header">
            <h1 class="game-page__title">{{ t('brand_name') }}</h1>
            <div class="game-page__header-actions">
              <button class="game-page__lang-btn" @click="toggleLanguage">
                {{ currentLang.toUpperCase() }}
              </button>
              <button class="game-page__profile-toggle" @click="toggleProfile">
                {{ t('nav_profile') }}
              </button>
              <button class="game-page__logout-btn" @click="handleLogout">
                {{ t('nav_logout') }}
              </button>
            </div>
          </div>

          <div class="game-page__status-bar">
            <div class="game-page__status-item">
              <span class="game-page__status-label">{{ t('status_sector') }}</span>
              <span class="game-page__status-value">{{ userStore.currentHexId?.substring(0, 12) || t('status_scanning') }}</span>
              <div v-if="userStore.currentHexId" class="game-page__status-tag" :class="{ 
                'game-page__status-tag--owned': userStore.isZoneCapturedByMe,
                'game-page__status-tag--enemy': userStore.currentZoneOwner && !userStore.isZoneCapturedByMe 
              }">
                {{ userStore.isZoneCapturedByMe ? t('status_secured') : (userStore.currentZoneOwner ? t('status_enemy') : t('status_neutral')) }}
              </div>
            </div>

            <div class="game-page__status-item">
              <span class="game-page__status-label">{{ t('status_balance') }}</span>
              <div class="game-page__status-value game-page__status-value--success">
                ⚡ {{ userStore.profile?.balance?.toFixed(1) || 0 }} IP
              </div>
            </div>
          </div>

          <div v-if="isProfileOpen" class="game-page__settings-wrapper">
            <ProfileSettings @close="isProfileOpen = false" @saved="isProfileOpen = false" />
          </div>
        </div>
      </TheMap>
    </template>
    
    <template v-else>
      <div class="game-page__auth">
        <AuthForm />
      </div>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.game-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  &__ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; 
    padding: 20px;
    z-index: $z-ui;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: auto; 
    gap: 15px;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
  }

  &__header-actions {
    display: flex;
    gap: 10px;

    @media (max-width: 600px) {
      flex-direction: column;
    }
  }

  &__title {
    color: $color-primary;
    text-shadow: 0 0 10px rgba($color-primary, 0.5);
    font-weight: 900;
    margin: 0;
    white-space: nowrap;

    @media (max-width: 600px) {
      text-align: center;
    }
  }

  &__settings-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($color-black, 0.5);
    backdrop-filter: blur(4px);
    z-index: $z-modal;
    pointer-events: auto;
    padding: 20px;
  }

  &__lang-btn {
    background: rgba($color-black, 0.7);
    border: 1px solid $color-gray-light;
    color: $color-primary;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
    &:hover { border-color: $color-primary; }
  }

  &__profile-toggle {
    background: rgba($color-black, 0.7);
    border: 1px solid $color-primary;
    color: $color-white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
    transition: all 0.2s;
    &:hover { background: $color-primary; color: $color-black; }
  }

  &__logout-btn {
    background: rgba($color-black, 0.7);
    border: 1px solid $color-error;
    color: $color-white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
    transition: all 0.2s;
    &:hover { background: $color-error; color: $color-white; }
  }

  &__auth {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg;
  }

  &__status-bar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    pointer-events: none;
  }

  &__status-item {
    background: rgba($color-black, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba($color-primary, 0.2);
    padding: 8px 16px;
    border-radius: 4px;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    min-width: 120px;
  }

  &__status-label {
    font-size: 8px;
    color: rgba($color-text, 0.4);
    letter-spacing: 1px;
    font-weight: bold;
    margin-bottom: 2px;
  }

  &__status-value {
    font-family: monospace;
    font-weight: bold;
    font-size: 0.9rem;
    color: $color-primary;

    &--success { color: $color-success; }
  }

  &__status-tag {
    font-size: 8px;
    margin-top: 4px;
    color: $color-text-muted;
    &--owned { color: $color-success; }
    &--enemy { color: $color-error; }
  }
}

@media (max-width: 470px) {
  .game-page {
    &__title { font-size: 1.2rem; }
    &__profile-toggle { padding: 6px 12px; font-size: 0.8rem; }
  }
}

/* Анимация появления */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
