<script setup lang="ts">
import AuthForm from '@/src/features/auth-form/ui/AuthForm.vue'
import ProfileSettings from '@/src/features/profile/ui/ProfileSettings.vue'
import TheMap from '@/src/widgets/the-map/ui/TheMap.vue'

const user = useSupabaseUser()
const isProfileOpen = ref(false)

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value
}

</script>

<template>
  <main class="game-page">
    <template v-if="user">
      <TheMap>
        <div class="game-page__ui">
          <div class="game-page__header">
            <h1 class="game-page__title">STREET KINGS</h1>
            <button class="profile-toggle" @click="toggleProfile">
              ЛИЧНЫЙ КАБИНЕТ
            </button>
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
    z-index: 10;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: auto; 
  }

  &__title {
    color: $color-primary;
    text-shadow: 0 0 10px rgba($color-primary, 0.5);
    font-weight: 900;
    margin: 0;
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
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
    pointer-events: auto;
    padding: 20px;
  }

  .profile-toggle {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid $color-primary;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
    &:hover { background: $color-primary; }
  }

  &__auth {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg;
  }
}

@media (max-width: 470px) {
  .game-page__title {
    font-size: 1.2rem;
  }
  .profile-toggle {
    padding: 6px 12px;
    font-size: 0.8rem;
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
