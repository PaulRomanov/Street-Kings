import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const activeTab = ref<'global' | 'private'>('global')
  const activeRecipientId = ref<string | null>(null)
  const activeRecipientName = ref<string | null>(null)

  const openChatWithUser = (userId: string, username: string) => {
    activeRecipientId.value = userId
    activeRecipientName.value = username
    activeTab.value = 'private'
    isOpen.value = true
  }

  const closeChat = () => {
    isOpen.value = false
    clearRecipient()
  }

  const clearRecipient = () => {
    activeRecipientId.value = null
    activeRecipientName.value = null
  }

  return {
    isOpen,
    activeTab,
    activeRecipientId,
    activeRecipientName,
    openChatWithUser,
    closeChat,
    clearRecipient
  }
})
