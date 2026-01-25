export const useZones = () => {
  const supabase = useSupabaseClient()
  const allZones = ref<any[]>([])

const fetchZones = async () => {
  const { data, error } = await supabase
    .from('zones')
    .select('id, owner_id, profiles(color, username)')
  
  if (data) {
    allZones.value = [...data] 
  }
}

  const subscribeToZones = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'zones' 
        }, 
        () => {
          fetchZones();
        }
      )
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchZones();
        }
      )
      .subscribe();
      
    return channel
  }

  return { allZones, fetchZones, subscribeToZones }
}