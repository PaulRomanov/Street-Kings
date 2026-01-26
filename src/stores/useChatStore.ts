import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const activeTab = ref<'global' | 'private'>('global')
  const activeRecipientId = ref<string | null>(null)
  const activeRecipientName = ref<string | null>(null)
  const hasUnreadMessages = ref(false)

  const openChatWithUser = (userId: string, username: string) => {
    activeRecipientId.value = userId
    activeRecipientName.value = username
    activeTab.value = 'private'
    isOpen.value = true
    hasUnreadMessages.value = false
  }

  const closeChat = () => {
    isOpen.value = false
    clearRecipient()
  }

  const clearRecipient = () => {
    activeRecipientId.value = null
    activeRecipientName.value = null
  }

  const markAsRead = () => {
    hasUnreadMessages.value = false
  }

  return {
    isOpen,
    activeTab,
    activeRecipientId,
    activeRecipientName,
    hasUnreadMessages,
    openChatWithUser,
    closeChat,
    clearRecipient,
    markAsRead
  }
})
