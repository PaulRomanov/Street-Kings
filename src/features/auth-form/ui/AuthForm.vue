<script setup lang="ts">
import { useTranslation } from '@/src/shared/lib/useTranslation'
import GameRulesModal from '@/src/widgets/game-rules/ui/GameRulesModal.vue'

const supabase = useSupabaseClient()
const { t, currentLang, setLanguage } = useTranslation()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegister = ref(false)
const isResetMode = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const showRules = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const toggleLanguage = () => {
  setLanguage(currentLang.value === 'en' ? 'ru' : 'en')
}

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isResetMode.value) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })
      if (error) throw error
      alert(t('auth_alert_reset'))
      isResetMode.value = false
    } else if (isRegister.value) {
      if (password.value !== confirmPassword.value) {
         throw new Error(t('auth_error_mismatch'))
      }
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      alert(t('auth_alert_signup'))
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

const toggleMode = () => {
  isRegister.value = !isRegister.value
  isResetMode.value = false
  errorMsg.value = ''
}

const toggleReset = () => {
  isResetMode.value = !isResetMode.value
  isRegister.value = false
  errorMsg.value = ''
}
</script>

<template>
  <div class="auth-container">
    <h1 class="auth-brand">{{ t('brand_name') }}</h1>
    
    <div class="auth-form">
      <div class="auth-form__header">
        <h2 class="auth-form__title">
          {{ isResetMode ? t('auth_title_reset') : (isRegister ? t('auth_title_register') : t('auth_title_login')) }}
        </h2>
        <button class="auth-form__lang" @click="toggleLanguage">
          {{ currentLang.toUpperCase() }}
        </button>
      </div>
      
      <div class="auth-form__fields">
        <div class="auth-field">
          <input v-model="email" type="email" :placeholder="t('auth_email_placeholder')" class="auth-field__input" />
        </div>

        <template v-if="!isResetMode">
          <div class="auth-field">
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              :placeholder="t('auth_pass_placeholder')" 
              class="auth-field__input" 
            />
            <button 
              type="button" 
              class="auth-field__toggle-eye" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div v-if="isRegister" class="auth-field">
            <input 
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'" 
              :placeholder="t('auth_confirm_pass_placeholder')" 
              class="auth-field__input" 
            />
            <button 
              type="button" 
              class="auth-field__toggle-eye" 
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </template>
      </div>

      <p v-if="errorMsg" class="auth-form__error">{{ errorMsg }}</p>

      <button @click="handleAuth" :disabled="loading" class="auth-form__submit">
        {{ loading ? t('auth_btn_wait') : (isResetMode ? t('auth_btn_reset') : (isRegister ? t('auth_btn_register') : t('auth_btn_login'))) }}
      </button>

      <div class="auth-form__navigation">
        <button v-if="!isResetMode" @click="toggleMode" class="auth-nav-btn">
          {{ isRegister ? t('auth_nav_login') : t('auth_nav_register') }}
        </button>
        <button @click="toggleReset" class="auth-nav-btn auth-nav-btn--muted">
          {{ isResetMode ? t('auth_nav_back') : t('auth_nav_forgot') }}
        </button>
        
        <div class="auth-form__rules-trigger">
          <button class="rules-trigger-btn" @click="showRules = true">
            📜 {{ t('rules_btn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка правил -->
    <GameRulesModal :is-visible="showRules" @close="showRules = false" />
  </div>
</template>

<style lang="scss" scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  width: 100%;
}

.auth-brand {
  font-size: 3rem;
  font-weight: 900;
  color: $color-primary;
  letter-spacing: 5px;
  text-shadow: 0 0 20px rgba($color-primary, 0.4);
  margin: 0;
  font-family: monospace;
}

.auth-form {
  background: rgba($color-bg, 0.95);
  border: 1px solid rgba($color-primary, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 440px;
  backdrop-filter: blur(10px);
  border-radius: 4px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    gap: 15px;
  }

  &__title {
    color: $color-primary;
    font-size: 20px;
    margin: 0;
    letter-spacing: 2px;
    font-weight: bold;
    text-align: left;
  }

  &__lang {
    background: rgba($color-white, 0.05);
    border: 1px solid rgba($color-primary, 0.3);
    color: $color-primary;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba($color-primary, 0.1); border-color: $color-primary; }
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
  }

  &__error {
    color: $color-error;
    font-size: 13px;
    margin-bottom: 15px;
    text-align: center;
    background: rgba($color-error, 0.1);
    padding: 8px;
    border-radius: 4px;
  }

  &__submit {
    width: 100%;
    background: $color-primary;
    color: $color-bg;
    border: none;
    padding: 16px;
    font-weight: 900;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 20px;
    letter-spacing: 1px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      filter: brightness(1.2);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__navigation {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  &__rules-trigger {
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px solid rgba($color-white, 0.1);
    width: 100%;
    display: flex;
    justify-content: center;
  }
}

.auth-field {
  position: relative;
  display: flex;
  align-items: center;

  &__input {
    width: 100%;
    background: rgba($color-text, 0.05);
    border: 1px solid rgba($color-text, 0.1);
    padding: 14px 45px 14px 14px;
    color: $color-text;
    font-family: monospace;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: $color-primary;
    }
  }

  &__toggle-eye {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    opacity: 0.5;
    transition: opacity 0.2s;
    user-select: none;

    &:hover {
      opacity: 1;
    }
  }
}

.auth-nav-btn {
  background: none;
  border: none;
  color: $color-white;
  font-size: 13px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    color: $color-primary;
  }

  &--muted {
    font-size: 12px;
    color: $color-text-muted;
  }
}

.rules-trigger-btn {
  background: transparent;
  border: 1px solid rgba($color-primary, 0.3);
  color: $color-primary;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba($color-primary, 0.1); border-color: $color-primary; }
}

@media (max-width: 480px) {
  .auth-brand { font-size: 2rem; }
  .auth-form { padding: 25px; }
}
</style>