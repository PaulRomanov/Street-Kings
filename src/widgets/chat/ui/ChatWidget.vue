<script setup lang="ts">
import { useUserStore } from '@/src/stores/useUserStore'
import { useTranslation } from '@/src/shared/lib/useTranslation'
import { vAutoAnimate } from '@formkit/auto-animate/vue'

interface Message {
  id: string
  content: string
  profile_id: string
  created_at: string
  profiles?: {
    username: string
    color: string
  }
}

const supabase = useSupabaseClient()
const userStore = useUserStore()
const { t } = useTranslation()

const messages = ref<Message[]>([])
const newMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isLoading = ref(true)

// Загрузка последних сообщений
const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(username, color)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!error && data) {
    messages.value = data.reverse()
    scrollToBottom()
  }
  isLoading.value = false
}

// Отправка сообщения
const sendMessage = async () => {
  if (!newMessage.value.trim() || !userStore.profile?.id) return

  const content = newMessage.value.trim()
  newMessage.value = ''

  const { error } = await supabase
    .from('messages')
    .insert({
      profile_id: userStore.profile.id,
      content: content
    })

  if (error) {
    console.error('Chat error:', error.message)
    // Возвращаем текст если не ушло
    newMessage.value = content
  }
}

// Подписка на Realtime
let channel: any = null

const subscribeChat = () => {
  channel = supabase.channel('global-chat')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages' 
    }, async (payload) => {
      // Подгружаем инфо о профиле для нового сообщения
      const { data } = await supabase
        .from('profiles')
        .select('username, color')
        .eq('id', payload.new.profile_id)
        .single()
      
      const fullMessage = { 
        ...payload.new, 
        profiles: data 
      } as Message
      
      messages.value.push(fullMessage)
      if (messages.value.length > 100) messages.value.shift()
      
      nextTick(() => scrollToBottom())
    })
    .subscribe()
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

onMounted(() => {
  fetchMessages()
  subscribeChat()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<template>
  <div class="chat-widget" :class="{ 'chat-widget--open': isOpen }">
    <!-- Кнопка открытия -->
    <button class="chat-toggle" @click="toggleChat">
      <span class="chat-toggle__icon">💬</span>
      <span v-if="!isOpen" class="chat-toggle__label">CHAT</span>
    </button>

    <!-- Окно чата -->
    <div v-if="isOpen" class="chat-window anim-slide-up">
      <div class="chat-window__header">
        <span class="chat-window__title">GLOBAL BROADCAST</span>
        <button class="chat-window__close" @click="isOpen = false">✕</button>
      </div>

      <div ref="chatContainer" class="chat-window__messages" v-auto-animate>
        <div v-if="isLoading" class="chat-loader">Connecting to frequency...</div>
        
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="chat-msg"
          :class="{ 'chat-msg--mine': msg.profile_id === userStore.profile?.id }"
        >
          <div class="chat-msg__meta">
            <span 
              class="chat-msg__author" 
              :style="{ color: msg.profiles?.color || '#fff' }"
            >
              {{ msg.profiles?.username || 'ANON' }}
            </span>
            <span class="chat-msg__time">{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
          <div class="chat-msg__content">{{ msg.content }}</div>
        </div>
      </div>

      <form class="chat-window__input-area" @submit.prevent="sendMessage">
        <input 
          v-model="newMessage" 
          type="text" 
          maxlength="200"
          placeholder="Transmit message..."
          class="chat-input"
        />
        <button type="submit" class="chat-send-btn" :disabled="!newMessage.trim()">
          ⚡
        </button>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-widget {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: $z-ui + 10;
  display: flex;
  flex-direction: column;
  pointer-events: auto;

  @media (max-width: 600px) {
    left: 15px;
    bottom: max(100px, env(safe-area-inset-bottom) + 90px);
  }

  &--open {
    width: 320px;
    @media (max-width: 400px) {
      width: calc(100vw - 30px);
    }
  }
}

.chat-toggle {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba($color-black, 0.85);
  border: 1px solid rgba($color-primary, 0.4);
  color: $color-primary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  transition: all 0.3s;
  backdrop-filter: blur(8px);
  gap: 8px;

  &:hover {
    border-color: $color-primary;
    transform: scale(1.05);
  }

  &__icon { font-size: 1.2rem; }
  
  &__label {
    display: none;
    font-weight: 900;
    font-size: 0.7rem;
    letter-spacing: 1px;
  }

  .chat-widget--open & {
    display: none;
  }
}

.chat-window {
  background: rgba($color-black, 0.9);
  border: 1px solid rgba($color-primary, 0.3);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  backdrop-filter: blur(12px);

  &__header {
    background: rgba($color-primary, 0.1);
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($color-primary, 0.2);
  }

  &__title {
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 2px;
    color: $color-primary;
  }

  &__close {
    background: none;
    border: none;
    color: rgba($color-white, 0.4);
    cursor: pointer;
    &:hover { color: $color-white; }
  }

  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: rgba($color-primary, 0.3) transparent;
  }

  &__input-area {
    padding: 10px;
    display: flex;
    gap: 8px;
    background: rgba($color-white, 0.05);
  }
}

.chat-msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 90%;

  &--mine {
    align-self: flex-end;
    align-items: flex-end;
    .chat-msg__meta { flex-direction: row-reverse; }
    .chat-msg__content {
      background: rgba($color-primary, 0.15);
      border-color: rgba($color-primary, 0.3);
    }
  }

  &__meta {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }

  &__author {
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  &__time {
    font-size: 0.6rem;
    color: rgba($color-white, 0.3);
  }

  &__content {
    background: rgba($color-white, 0.05);
    border: 1px solid rgba($color-white, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    color: rgba($color-white, 0.9);
    word-break: break-word;
  }
}

.chat-input {
  flex: 1;
  background: rgba($color-black, 0.5);
  border: 1px solid rgba($color-white, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  color: #fff;
  font-size: 0.8rem;
  &:focus { outline: none; border-color: $color-primary; }
}

.chat-send-btn {
  background: $color-primary;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &:hover:not(:disabled) { filter: brightness(1.2); }
}

.chat-loader {
  text-align: center;
  font-size: 0.7rem;
  color: rgba($color-primary, 0.5);
  padding-top: 50px;
}

.anim-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
