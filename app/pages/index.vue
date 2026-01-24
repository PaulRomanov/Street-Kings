<script setup lang="ts">
import AuthForm from '@/src/features/auth-form/ui/AuthForm.vue'
import TheMap from '@/src/widgets/the-map/ui/TheMap.vue'
const user = useSupabaseUser()
</script>

<template>
  <main class="game-page">
    <template v-if="user">
      <TheMap>
        <div class="game-page__ui">
          <h1 class="game-page__title">STREET KINGS</h1>
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
  &__ui {
    padding: 20px;
  }

  &__title {
    color: $color-primary;
    text-shadow: 0 0 10px rgba($color-primary, 0.5);
    font-weight: 900;
    letter-spacing: 2px;
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
</style>
