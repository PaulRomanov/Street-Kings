<script setup lang="ts">
import AuthForm from '@/src/features/auth-form/ui/AuthForm.vue'
import ProfileSettings from '@/src/features/profile/ui/ProfileSettings.vue'
import TheMap from '@/src/widgets/the-map/ui/TheMap.vue'
import ChatWidget from '@/src/widgets/chat/ui/ChatWidget.vue'
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
            <div class="user-block" @click="toggleProfile">
              <div class="user-block__avatar">
                <span class="user-block__icon">👤</span>
              </div>
              <div class="user-block__info">
                <span class="user-block__name">{{ userStore.profile?.username || 'STREET KING' }}</span>
                <span class="user-block__balance">⚡ {{ userStore.profile?.balance?.toFixed(1) || 0 }} IP</span>
              </div>
            </div>

            <div class="game-page__header-actions">
              <button class="lang-circle-btn" @click="toggleLanguage">
                {{ currentLang.toUpperCase() }}
              </button>
              <button class="logout-mini-btn" @click="handleLogout" :title="t('nav_logout')">
                🚪
              </button>
            </div>
          </div>

          <div v-if="isProfileOpen" class="game-page__settings-wrapper">
            <ProfileSettings @close="isProfileOpen = false" @saved="isProfileOpen = false" />
          </div>

          <ChatWidget />
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
  height: 100dvh;
  overflow: hidden;

  &__ui {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    pointer-events: none; 
    padding: 15px;
    z-index: $z-ui;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: auto; 
    gap: 15px;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__settings-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($color-black, 0.5);
    backdrop-filter: blur(8px);
    z-index: $z-modal;
    pointer-events: auto;
    padding: 20px;
  }

  &__auth {
    width: 100%;
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg;
    padding: 20px;
  }
}

.user-block {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba($color-black, 0.7);
  padding: 8px 16px 8px 8px;
  border-radius: 50px;
  border: 1px solid rgba($color-primary, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);

  &:hover {
    border-color: $color-primary;
    transform: translateY(-1px);
    background: rgba($color-black, 0.85);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    background: $color-primary;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: 1.2rem;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__name {
    color: $color-white;
    font-weight: 900;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
  }

  &__balance {
    color: $color-primary;
    font-weight: bold;
    font-size: 0.75rem;
  }
}

.lang-circle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba($color-black, 0.7);
  border: 1px solid rgba($color-white, 0.2);
  color: $color-primary;
  font-weight: 900;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  &:hover { border-color: $color-primary; background: $color-primary; color: $color-black; }
}

.logout-mini-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba($color-black, 0.7);
  border: 1px solid rgba($color-error, 0.4);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  &:hover { background: $color-error; border-color: $color-error; filter: brightness(1.2); }
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
