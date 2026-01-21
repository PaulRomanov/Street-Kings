export const useZones = () => {
  const supabase = useSupabaseClient()
  const allZones = ref<any[]>([])

const fetchZones = async () => {
  const { data, error } = await supabase
    .from('zones')
    .select('id, owner_id, profiles(color)')
  
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
        (payload) => {
          fetchZones();
        }
      )
      .subscribe();
      
    return channel
  }

  return { allZones, fetchZones, subscribeToZones }
}