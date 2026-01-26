import { ref, watchEffect } from 'vue';

export type Language = 'en' | 'ru';

const STORAGE_KEY = 'sk_lang';

const currentLang = ref<Language>('en');

// Инициализация из localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY) as Language;
  if (saved === 'en' || saved === 'ru') {
    currentLang.value = saved;
  }
}

// Словарь переводов
const translations = {
  en: {
    // Auth
    auth_title_login: 'SYSTEM LOGIN',
    auth_title_register: 'REGISTRATION',
    auth_title_reset: 'PASSWORD RESET',
    auth_email_placeholder: 'EMAIL',
    auth_pass_placeholder: 'PASSWORD',
    auth_confirm_pass_placeholder: 'CONFIRM PASSWORD',
    auth_btn_login: 'LOG IN',
    auth_btn_register: 'CREATE ACCOUNT',
    auth_btn_reset: 'SEND RESET LINK',
    auth_btn_wait: 'WAIT...',
    auth_nav_login: 'Already have an account? Log in',
    auth_nav_register: 'No account? Register',
    auth_nav_forgot: 'Forgot password?',
    auth_nav_back: 'Back to login',
    auth_alert_signup: 'Check your email to confirm registration!',
    auth_alert_reset: 'Reset instructions sent to your email!',
    auth_error_mismatch: 'Passwords do not match',

    // Header
    nav_profile: 'PROFILE',
    nav_logout: 'LOGOUT',
    brand_name: 'STREET KINGS',

    // Status Bar
    status_sector: 'SECTOR',
    status_balance: 'BALANCE',
    status_scanning: 'SCANNING...',
    status_secured: 'SECURED',
    status_enemy: 'ENEMY',
    status_neutral: 'NEUTRAL',

    // Profile Settings
    profile_title: 'Profile Settings',
    profile_tab_main: 'PROFILE',
    profile_tab_security: 'SECURITY',
    profile_name_label: 'STREET NAME (CALLSIGN)',
    profile_color_label: 'COLOR OF YOUR TERRITORIES',
    profile_stats_balance: 'Balance',
    profile_stats_income: 'Income (total)',
    profile_stats_sectors: 'Sectors',
    profile_btn_bonus: 'COLLECT DAILY BONUS (+10 IP)',
    profile_btn_bonus_collected: 'DAILY BONUS COLLECTED',
    profile_bonus_next: 'Next bonus',
    profile_btn_cancel: 'Cancel',
    profile_btn_save: 'Save',
    profile_sec_email_title: 'Change Email',
    profile_sec_email_label: 'New Email (verification required)',
    profile_sec_email_btn: 'UPDATE EMAIL',
    profile_sec_pass_title: 'Change Password',
    profile_sec_pass_label: 'New Password',
    profile_sec_pass_confirm: 'Confirm New Password',
    profile_sec_pass_btn: 'CHANGE PASSWORD',
    profile_alert_email: 'Instructions sent to both addresses.',
    profile_alert_pass: 'Password changed successfully!',
    profile_error_long: 'Name is too long!',

    // Zone Info
    zone_title: 'Sector',
    zone_status: 'Status',
    zone_owner: 'Owner',
    zone_storage: 'Storage',
    zone_captured: 'Captured',
    zone_btn_harvest: 'Harvest IP',
    zone_btn_fortify: 'Fortify (+1 IP)',
    zone_limit_warning: 'Storage Full',
    zone_empty: 'Sector is free for capture for 5.00 IP.',
    zone_anonymous: 'ANONYMOUS',

    // Map Overlay
    overlay_scanning: 'SCANNING...',
    overlay_secured: 'SECTOR SECURED',
    overlay_capture: 'CAPTURE ZONE',

    // Common
    loading: 'Loading data...',
    error_harvest: 'Harvest error',
    error_fortify: 'Fortify error'
  },
  ru: {
    // Auth
    auth_title_login: 'ВХОД В СИСТЕМУ',
    auth_title_register: 'РЕГИСТРАЦИЯ',
    auth_title_reset: 'СБРОС ПАРОЛЯ',
    auth_email_placeholder: 'EMAIL',
    auth_pass_placeholder: 'ПАРОЛЬ',
    auth_confirm_pass_placeholder: 'ПОДТВЕРДИТЕ ПАРОЛЬ',
    auth_btn_login: 'ВОЙТИ',
    auth_btn_register: 'СОЗДАТЬ АККАУНТ',
    auth_btn_reset: 'ОТПРАВИТЬ ССЫЛКУ',
    auth_btn_wait: 'ПОДОЖДИТЕ...',
    auth_nav_login: 'Уже есть аккаунт? Войти',
    auth_nav_register: 'Нет аккаунта? Регистрация',
    auth_nav_forgot: 'Забыли пароль?',
    auth_nav_back: 'Вернуться ко входу',
    auth_alert_signup: 'Проверьте почту для подтверждения регистрации!',
    auth_alert_reset: 'Инструкции по сбросу отправлены на почту!',
    auth_error_mismatch: 'Пароли не совпадают',

    // Header
    nav_profile: 'ЛИЧНЫЙ КАБИНЕТ',
    nav_logout: 'ВЫХОД',
    brand_name: 'STREET KINGS',

    // Status Bar
    status_sector: 'СЕКТОР',
    status_balance: 'БАЛАНС',
    status_scanning: 'СКАНИРОВАНИЕ...',
    status_secured: 'ЗАХВАЧЕН',
    status_enemy: 'ВРАГ',
    status_neutral: 'НЕЙТРАЛ',

    // Profile Settings
    profile_title: 'Личный кабинет',
    profile_tab_main: 'ПРОФИЛЬ',
    profile_tab_security: 'БЕЗОПАСНОСТЬ',
    profile_name_label: 'ТВОЙ ПОЗЫВНОЙ (STREET NAME)',
    profile_color_label: 'ЦВЕТ ТВОИХ ТЕРРИТОРИЙ',
    profile_stats_balance: 'Баланс',
    profile_stats_income: 'Доход (общий)',
    profile_stats_sectors: 'Секторов',
    profile_btn_bonus: 'СОБРАТЬ DAILY BONUS (+10 IP)',
    profile_btn_bonus_collected: 'DAILY BONUS СОБРАН',
    profile_bonus_next: 'Следующий бонус',
    profile_btn_cancel: 'Отмена',
    profile_btn_save: 'Сохранить',
    profile_sec_email_title: 'Смена почты',
    profile_sec_email_label: 'Новый Email (нужно подтверждение)',
    profile_sec_email_btn: 'ОБНОВИТЬ ПОЧТУ',
    profile_sec_pass_title: 'Смена пароля',
    profile_sec_pass_label: 'Новый пароль',
    profile_sec_pass_confirm: 'Подтвердите новый пароль',
    profile_sec_pass_btn: 'СМЕНИТЬ ПАРОЛЬ',
    profile_alert_email: 'Инструкции отправлены на оба адреса.',
    profile_alert_pass: 'Пароль успешно изменен!',
    profile_error_long: 'Ник слишком длинный!',

    // Zone Info
    zone_title: 'Сектор',
    zone_status: 'Статус',
    zone_owner: 'Владелец',
    zone_storage: 'Хранилище',
    zone_captured: 'Захвачен',
    zone_btn_harvest: 'Собрать IP',
    zone_btn_fortify: 'Укрепить (+1 IP)',
    zone_limit_warning: 'Хранилище заполнено',
    zone_empty: 'Сектор свободен для захвата за 5.00 IP.',
    zone_anonymous: 'АНОНИМ',

    // Map Overlay
    overlay_scanning: 'СКАНИРОВАНИЕ...',
    overlay_secured: 'СЕКТОР ЗАХВАЧЕН',
    overlay_capture: 'ЗАХВАТИТЬ СЕКТОР',

    // Common
    loading: 'Загрузка данных...',
    error_harvest: 'Ошибка сбора',
    error_fortify: 'Ошибка укрепления'
  }
};

export const useTranslation = () => {
  const t = (key: keyof typeof translations.en) => {
    return translations[currentLang.value][key] || key;
  };

  const setLanguage = (lang: Language) => {
    currentLang.value = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  return { t, currentLang, setLanguage };
};
