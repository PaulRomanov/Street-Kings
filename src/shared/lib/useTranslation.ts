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
    profile_tab_support: 'Support',
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
    profile_error_duplicate_name: 'This callsign is already claimed by another king.',
    feedback_label: 'Report a bug or suggest an improvement',
    feedback_placeholder: 'Type your message here...',
    feedback_type_bug: 'Bug Report',
    feedback_type_suggestion: 'Suggestion',
    feedback_btn: 'Send to HQ',
    feedback_success: 'Message transmitted to headquarters.',

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

    // Chat
    chat_tab_global: 'Broadcast',
    chat_tab_private: 'Private',
    chat_send_private: 'Send Message',
    chat_no_messages: 'No messages here yet...',
    chat_private_with: 'Secure line with',
    chat_input_placeholder: 'Transmit message...',
    chat_connecting: 'Connecting to frequency...',

    // Map Overlay
    overlay_scanning: 'SCANNING...',
    overlay_secured: 'SECTOR SECURED',
    overlay_capture: 'CAPTURE ZONE',

    // Common
    loading: 'Loading data...',
    error_harvest: 'Harvest error',
    error_fortify: 'Fortify error',

    // Rules
    rules_title: 'STREET KINGS CODES',
    rules_btn: 'GAME RULES',
    rules_close: 'GOT IT',
    rules_intro_title: 'Welcome to the Streets',
    rules_intro_text: 'Street Kings is a strategic territorial war game. Your goal is to dominate the city by capturing sectors.',
    rules_ip_title: 'Intelligence Points (IP)',
    rules_ip_text: 'IP is your main currency. Use it to capture and fortify sectors. IP accumulates automatically over time (0.1 IP/hour per sector).',
    rules_capture_title: 'Capturing Sectors',
    rules_capture_text: 'Free sectors cost 5.00 IP. Capturing occupied sectors costs 10.00 IP + whatever the previous owner stored there.',
    rules_income_title: 'Income & Storage',
    rules_income_text: 'Maximum storage is 10.00 IP per sector. If you don\'t harvest, growth stops at the limit!',
    rules_bonus_title: 'Daily Bonus',
    rules_bonus_text: 'Collect 10.00 IP every 24 hours in your Profile Settings to boost your expansion.'
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
    profile_tab_main: 'Профиль',
    profile_tab_security: 'Безопасность',
    profile_tab_support: 'Поддержка',
    profile_name_label: 'Позывной (Street Name)',
    profile_color_label: 'Цвет твоих территорий',
    profile_stats_balance: 'Баланс',
    profile_stats_income: 'Доход (общий)',
    profile_stats_sectors: 'Секторы',
    profile_btn_bonus: 'Забрать ежедневный бонус',
    profile_btn_bonus_collected: 'Бонус получен',
    profile_bonus_next: 'Следующий бонус',
    profile_btn_cancel: 'Отмена',
    profile_btn_save: 'Сохранить изменения',
    profile_sec_email_title: 'Электронная почта',
    profile_sec_email_label: 'Новый Email',
    profile_sec_email_btn: 'Обновить почту',
    profile_sec_pass_title: 'Пароль',
    profile_sec_pass_label: 'Новый пароль',
    profile_sec_pass_confirm: 'Подтвердите пароль',
    profile_sec_pass_btn: 'Обновить пароль',
    profile_alert_email: 'Письмо подтверждения отправлено. Проверьте почту.',
    profile_alert_pass: 'Пароль успешно обновлен.',
    profile_error_long: 'Имя слишком длинное (макс. 15 символов)',
    profile_error_duplicate_name: 'Этот позывной уже занят другим королем улиц.',
    feedback_label: 'Сообщить о баге или предложить идею',
    feedback_placeholder: 'Опиши проблему здесь...',
    feedback_type_bug: 'Баг-репорт',
    feedback_type_suggestion: 'Предложение',
    feedback_btn: 'Отправить в штаб',
    feedback_success: 'Сообщение передано разработчикам.',

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

    // Chat
    chat_tab_global: 'Эфир',
    chat_tab_private: 'Личные',
    chat_send_private: 'Написать',
    chat_no_messages: 'Здесь пока пусто...',
    chat_private_with: 'Шифрованный канал с',
    chat_input_placeholder: 'Передать сообщение...',
    chat_connecting: 'Подключение к частоте...',

    // Map Overlay
    overlay_scanning: 'СКАНИРОВАНИЕ...',
    overlay_secured: 'СЕКТОР ЗАХВАЧЕН',
    overlay_capture: 'ЗАХВАТИТЬ СЕКТОР',

    // Common
    loading: 'Загрузка данных...',
    error_harvest: 'Ошибка сбора',
    error_fortify: 'Ошибка укрепления',

    // Rules
    rules_title: 'КОДЕКС STREET KINGS',
    rules_btn: 'ПРАВИЛА ИГРЫ',
    rules_close: 'ПОНЯТНО',
    rules_intro_title: 'Добро пожаловать на улицы',
    rules_intro_text: 'Street Kings — это стратегическая война за территории. Ваша цель — доминировать в городе, захватывая сектора.',
    rules_ip_title: 'Intelligence Points (IP)',
    rules_ip_text: 'IP — ваша основная валюта. Используйте её для захвата и укрепления секторов. IP накапливается автоматически (0.1 IP/час на сектор).',
    rules_capture_title: 'Захват секторов',
    rules_capture_text: 'Свободные сектора стоят 5.00 IP. Захват занятых секторов стоит 10.00 IP + всё, что предыдущий владелец накопил там.',
    rules_income_title: 'Доход и Хранилище',
    rules_income_text: 'Максимальная емкость — 10.00 IP на сектор. Если не собирать IP, рост остановится на этом лимите!',
    rules_bonus_title: 'Ежедневный бонус',
    rules_bonus_text: 'Забирайте 10.00 IP каждые 24 часа в Личном Кабинете для ускорения вашей экспансии.'
  }
};

export const useTranslation = () => {
  const t = (key: keyof typeof translations.en) => {
    const section = (translations as any)[currentLang.value]
    return section[key] || key;
  };

  const setLanguage = (lang: Language) => {
    currentLang.value = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  return { t, currentLang, setLanguage };
};
