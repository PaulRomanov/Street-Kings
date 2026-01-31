import { defineStore } from 'pinia'
import { COLORS } from '@/src/shared/config/colors'

export const useUserStore = defineStore('user', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref<any>(null)

  const fetchProfile = async () => {
    const userId = user.value?.sub
    if (!userId) {
      return
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: userId,
          balance: 20, 
          color: COLORS.PLAYER_PALETTE[0],
          pattern: null 
        })
        .select()
        .single()

      if (insertError) {
        console.error('Ошибка создания профиля:', insertError.message)
      } else {
        profile.value = newProfile
      }
    } else if (error) {
      console.error('Ошибка Supabase в сторе:', error.message)
    } else {
      profile.value = data
    }

    // Подсчитываем количество захваченных гексагенов
    const { count } = await supabase
      .from('hexagons')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    ownedHexCount.value = count || 0
  }

watch(() => user.value?.sub, (newId) => {
  if (newId && newId !== 'undefined') {
    fetchProfile()
  }
}, { immediate: true })

  async function updateProfile(updates: any) {
    if (!user.value?.sub) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.sub)

    if (!error && profile.value) {
      profile.value = { ...profile.value, ...updates }
    }

    return error
  }

  const currentHexId = ref<string | null>(null)
  const isZoneCapturedByMe = ref(false)
  const currentZoneOwner = ref<string | null>(null)
  const ownedHexCount = ref(0)
  const totalIncome = computed(() => (ownedHexCount.value * 0.1).toFixed(2))

  return { 
    profile, 
    fetchProfile, 
    updateProfile, 
    currentHexId, 
    isZoneCapturedByMe,
    currentZoneOwner,
    ownedHexCount,
    totalIncome 
  }
})