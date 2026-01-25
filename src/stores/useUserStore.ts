import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = ref<any>(null)

  const fetchProfile = async () => {
    const userId = user.value?.sub
    if (!userId) {
      return
    }
    
    // Сначала пробуем получить существующий профиль
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Профиль не найден — создаём новый
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: userId,
          balance: 20, 
          color: '#3b82f6' 
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
      profile.value = data
    }
  }

  // Следим только за ID (sub в JWT)
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
  }

  return { profile, fetchProfile, updateProfile }
})