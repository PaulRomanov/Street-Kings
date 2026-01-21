<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const isRegister = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isRegister.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      alert('Проверьте почту для подтверждения регистрации!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
    }
  } catch (e: any) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <h2 class="auth-form__title">{{ isRegister ? 'РЕГИСТРАЦИЯ' : 'ВХОД В СИСТЕМУ' }}</h2>
    
    <div class="auth-form__fields">
      <input v-model="email" type="email" placeholder="EMAIL" class="auth-form__input" />
      <input v-model="password" type="password" placeholder="PASSWORD" class="auth-form__input" />
    </div>

    <p v-if="errorMsg" class="auth-form__error">{{ errorMsg }}</p>

    <button @click="handleAuth" :disabled="loading" class="auth-form__submit">
      {{ loading ? 'WAIT...' : (isRegister ? 'CREATE ACCOUNT' : 'LOG IN') }}
    </button>

    <button @click="isRegister = !isRegister" class="auth-form__toggle">
      {{ isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.auth-form {
  background: rgba($color-bg, 0.95);
  border: 1px solid rgba($color-primary, 0.3);
  padding: 30px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);

  &__title {
    color: $color-primary;
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: 2px;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }

  &__input {
    background: rgba($color-text, 0.05);
    border: 1px solid rgba($color-text, 0.1);
    padding: 12px;
    color: $color-text;
    font-family: monospace;
    outline: none;

    &:focus {
      border-color: $color-primary;
    }
  }

  &__submit {
    width: 100%;
    background: $color-primary;
    color: $color-bg;
    border: none;
    padding: 14px;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 10px;
  }

  &__toggle {
    background: none;
    border: none;
    color: rgba($color-text, 0.5);
    font-size: 12px;
    cursor: pointer;
    width: 100%;
    text-align: center;

    &:hover {
      color: $color-text;
    }
  }

  &__error {
    color: $color-error;
    font-size: 12px;
    margin-bottom: 15px;
  }
}
</style>