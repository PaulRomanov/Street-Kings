<script setup lang="ts">
import { useUserStore } from '@/src/stores/useUserStore'
import { useChatStore } from '@/src/stores/useChatStore'
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
const chatStore = useChatStore()
const { t } = useTranslation()

const messages = ref<Message[]>([])
const privateMessages = ref<any[]>([])
const newMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)

// Загрузка последних сообщений (Глобальные)
const fetchMessages = async () => {
  const { data, error } = await (supabase.from('messages') as any)
    .select('*, profiles(username, color)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!error && data) {
    messages.value = data.reverse()
    scrollToBottom()
  }
  isLoading.value = false
}

// Загрузка личных сообщений
const fetchPrivateMessages = async () => {
  if (!userStore.profile?.id) return
  const { data, error } = await (supabase.from('private_messages') as any)
    .select('*, sender:profiles!private_messages_sender_id_fkey(username, color), recipient:profiles!private_messages_recipient_id_fkey(username, color)')
    .or(`sender_id.eq.${userStore.profile.id},recipient_id.eq.${userStore.profile.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!error && data) {
    privateMessages.value = data.reverse()
  }
}

const conversations = computed(() => {
  if (!userStore.profile?.id) return []
  const groups: Record<string, any> = {}
  
  privateMessages.value.forEach(msg => {
    const isMeSender = msg.sender_id === userStore.profile.id
    const otherUser = isMeSender ? msg.recipient : msg.sender
    const otherId = isMeSender ? msg.recipient_id : msg.sender_id
    
    if (!otherId) return

    if (!groups[otherId] || new Date(msg.created_at) > new Date(groups[otherId].lastMessageDate)) {
      groups[otherId] = {
        userId: otherId,
        username: otherUser?.username || 'ANON',
        color: otherUser?.color || '#fff',
        lastMessage: msg.content,
        lastMessageDate: msg.created_at
      }
    }
  })
  
  return Object.values(groups).sort((a: any, b: any) => 
    new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
  )
})

const filteredPrivateMessages = computed(() => {
  if (!chatStore.activeRecipientId) return []
  return privateMessages.value.filter(msg => 
    msg.sender_id === chatStore.activeRecipientId || msg.recipient_id === chatStore.activeRecipientId
  )
})

const selectConversation = (conv: any) => {
  chatStore.activeRecipientId = conv.userId
  chatStore.activeRecipientName = conv.username
  nextTick(() => scrollToBottom())
}

// Отправка сообщения
const sendMessage = async () => {
  if (!newMessage.value.trim() || !userStore.profile?.id) return

  const content = newMessage.value.trim()
  
  if (chatStore.activeTab === 'global') {
    newMessage.value = ''
    const { error } = await (supabase.from('messages') as any).insert({
      profile_id: userStore.profile.id,
      content: content
    })
    if (error) newMessage.value = content
  } else if (chatStore.activeRecipientId) {
    newMessage.value = ''
    const { error } = await (supabase.from('private_messages') as any).insert({
      sender_id: userStore.profile.id,
      recipient_id: chatStore.activeRecipientId,
      content: content
    })
    if (error) {
       console.error(error)
       newMessage.value = content
    }
  }
}

// Подписки на Realtime
let globalChannel: any = null
let privateChannel: any = null

const subscribeChat = () => {
  globalChannel = supabase.channel('global-chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
      const { data } = await (supabase.from('profiles') as any).select('username, color').eq('id', payload.new.profile_id).single()
      const fullMessage = { ...payload.new, profiles: data }
      messages.value.push(fullMessage as any)
      if (messages.value.length > 100) messages.value.shift()
      
      if (!chatStore.isOpen || chatStore.activeTab !== 'global') {
        chatStore.hasUnreadMessages = true
      }
      
      if (chatStore.isOpen && chatStore.activeTab === 'global') nextTick(() => scrollToBottom())
    })
    .subscribe()

  privateChannel = supabase.channel('private-chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, async (payload) => {
      if (payload.new.sender_id === userStore.profile?.id || payload.new.recipient_id === userStore.profile?.id) {
        const { data: sender } = await (supabase.from('profiles') as any).select('username, color').eq('id', payload.new.sender_id).single()
        const { data: recipient } = await (supabase.from('profiles') as any).select('username, color').eq('id', payload.new.recipient_id).single()
        
        const fullMsg = { ...payload.new, sender, recipient }
        privateMessages.value.push(fullMsg)

        if (!chatStore.isOpen || chatStore.activeTab !== 'private' || chatStore.activeRecipientId !== (payload.new.sender_id === userStore.profile?.id ? payload.new.recipient_id : payload.new.sender_id)) {
           chatStore.hasUnreadMessages = true
        }

        if (chatStore.isOpen && chatStore.activeTab === 'private') nextTick(() => scrollToBottom())
      }
    })
    .subscribe()
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const toggleChat = () => {
  if (chatStore.isOpen) {
    chatStore.closeChat()
  } else {
    chatStore.isOpen = true
    chatStore.markAsRead()
    fetchMessages()
    fetchPrivateMessages()
    nextTick(() => scrollToBottom())
  }
}

watch(() => chatStore.activeTab, (newTab) => {
  if (newTab === 'private') {
    fetchPrivateMessages()
  } else {
    fetchMessages()
  }
  nextTick(() => scrollToBottom())
})

onMounted(() => {
  fetchMessages()
  subscribeChat()
})

onUnmounted(() => {
  if (globalChannel) supabase.removeChannel(globalChannel)
  if (privateChannel) supabase.removeChannel(privateChannel)
})
</script>

<template>
  <div class="chat-widget" :class="{ 'chat-widget--open': chatStore.isOpen }">
    <!-- Кнопка открытия -->
    <button 
      class="chat-toggle" 
      :class="{ 'chat-toggle--unread': chatStore.hasUnreadMessages }"
      @click="toggleChat"
    >
      <span class="chat-toggle__icon">💬</span>
      <span v-if="!chatStore.isOpen" class="chat-toggle__label">CHAT</span>
      <span v-if="chatStore.hasUnreadMessages && !chatStore.isOpen" class="chat-toggle__badge"></span>
    </button>

    <!-- Окно чата -->
    <div v-if="chatStore.isOpen" class="chat-window anim-slide-up">
      <div class="chat-window__header">
        <div class="chat-tabs">
          <button 
            class="chat-tabs__item" 
            :class="{ 'chat-tabs__item--active': chatStore.activeTab === 'global' }"
            @click="chatStore.activeTab = 'global'"
          >
            {{ t('chat_tab_global' as any) }}
          </button>
          <button 
            class="chat-tabs__item" 
            :class="{ 'chat-tabs__item--active': chatStore.activeTab === 'private' }"
            @click="chatStore.activeTab = 'private'"
          >
            {{ t('chat_tab_private' as any) }}
          </button>
        </div>
        <button class="chat-window__close" @click="chatStore.closeChat()">✕</button>
      </div>

      <div ref="chatContainer" class="chat-window__messages" v-auto-animate>
        <div v-if="isLoading" class="chat-loader">{{ t('chat_connecting' as any) }}</div>
        
        <!-- Глобальный чат -->
        <template v-if="chatStore.activeTab === 'global'">
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="chat-msg"
            :class="{ 'chat-msg--mine': msg.profile_id === userStore.profile?.id }"
          >
            <div class="chat-msg__meta">
              <span class="chat-msg__author" :style="{ color: msg.profiles?.color || '#fff' }">
                {{ msg.profiles?.username || 'ANON' }}
              </span>
              <span class="chat-msg__time">{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <div class="chat-msg__content">{{ msg.content }}</div>
          </div>
        </template>

        <!-- Личный чат -->
        <template v-else>
          <!-- Список диалогов -->
          <div v-if="!chatStore.activeRecipientId" class="chat-conversations">
            <div v-if="conversations.length === 0" class="chat-empty">
              {{ t('chat_no_messages' as any) }}
            </div>
            <div 
              v-for="conv in conversations" 
              :key="conv.userId" 
              class="chat-conv-item"
              @click="selectConversation(conv)"
            >
              <div class="chat-conv-item__avatar" :style="{ background: conv.color }">
                {{ conv.username.charAt(0) }}
              </div>
              <div class="chat-conv-item__info">
                <div class="chat-conv-item__meta">
                  <span class="chat-conv-item__user" :style="{ color: conv.color }">{{ conv.username }}</span>
                  <span class="chat-conv-item__date">{{ new Date(conv.lastMessageDate).toLocaleDateString() }}</span>
                </div>
                <div class="chat-conv-item__last">{{ conv.lastMessage }}</div>
              </div>
            </div>
          </div>

          <!-- Окно конкретного диалога -->
          <template v-else>
            <div class="chat-active-recipient">
              <button class="chat-back-btn" @click="chatStore.clearRecipient()">←</button>
              📟 <span>{{ chatStore.activeRecipientName }}</span>
            </div>
            
            <div v-if="filteredPrivateMessages.length === 0" class="chat-empty">
              {{ t('chat_no_messages' as any) }}
            </div>
            <div 
              v-for="msg in filteredPrivateMessages" 
              :key="msg.id" 
              class="chat-msg"
              :class="{ 'chat-msg--mine': msg.sender_id === userStore.profile?.id }"
            >
              <div class="chat-msg__meta">
                <span class="chat-msg__author" :style="{ color: (msg.sender_id === userStore.profile?.id ? msg.recipient?.color : msg.sender?.color) || '#fff' }">
                  {{ msg.sender_id === userStore.profile?.id ? 'YOU' : (msg.sender?.username || '...') }}
                </span>
                <span class="chat-msg__time">{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <div class="chat-msg__content">{{ msg.content }}</div>
            </div>
          </template>
        </template>
      </div>

      <form 
        v-if="chatStore.activeTab === 'global' || chatStore.activeRecipientId" 
        class="chat-window__input-area" 
        @submit.prevent="sendMessage"
      >
        <input 
          v-model="newMessage" 
          type="text" 
          maxlength="200"
          :placeholder="t('chat_input_placeholder' as any)"
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

  &--unread {
    border-color: $color-error;
    box-shadow: 0 0 15px rgba($color-error, 0.4);
  }

  &__icon { font-size: 1.2rem; }
  
  &__label {
    display: none;
    font-weight: 900;
    font-size: 0.7rem;
    letter-spacing: 1px;
  }

  &__badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: $color-error;
    border: 2px solid $color-black;
    border-radius: 50%;
    animation: badge-pulse 1.5s infinite;
  }

  .chat-widget--open & {
    display: none;
  }
}

@keyframes badge-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
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
    padding: 8px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($color-primary, 0.2);
  }

  &__close {
    background: none;
    border: none;
    color: rgba($color-white, 0.4);
    font-size: 1.1rem;
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

.chat-active-recipient {
  padding: 8px 12px;
  background: rgba($color-primary, 0.1);
  border-radius: 6px;
  font-size: 0.75rem;
  color: $color-text-muted;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  span { color: $color-primary; font-weight: 900; }
}

.chat-back-btn {
  background: rgba($color-white, 0.1);
  border: none;
  color: $color-white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: rgba($color-white, 0.2); }
}

.chat-conversations {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-conv-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba($color-white, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: rgba($color-white, 0.08);
    border-color: rgba($color-primary, 0.2);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 0.9rem;
    color: rgba(0,0,0,0.7);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  &__user {
    font-size: 0.75rem;
    font-weight: 900;
  }

  &__date {
    font-size: 0.6rem;
    color: rgba($color-white, 0.3);
  }

  &__last {
    font-size: 0.7rem;
    color: rgba($color-white, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.chat-empty {
  text-align: center;
  padding: 40px 0;
  color: $color-text-muted;
  font-size: 0.8rem;
  font-style: italic;
}

.chat-tabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  padding: 2px;
  border-radius: 6px;
  gap: 2px;

  &__item {
    padding: 4px 12px;
    border: none;
    background: transparent;
    color: rgba($color-white, 0.4);
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &--active {
      background: rgba($color-primary, 0.2);
      color: $color-primary;
    }

    &:hover:not(.chat-tabs__item--active) {
      color: $color-white;
    }
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
