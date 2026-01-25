import { useZoneStore } from '@/src/stores/useZoneStore'
import { storeToRefs } from 'pinia'

export const useZones = () => {
  const supabase = useSupabaseClient()
  const zoneStore = useZoneStore()
  const { allZones } = storeToRefs(zoneStore)

  const fetchZones = async () => {
    zoneStore.isLoading = true
    const { data, error } = await supabase
      .from('hexagons')
      .select('id, owner_id, storage, updated_at, profiles(color, username)')
    
    if (data) {
      zoneStore.setZones(data) 
    }
    zoneStore.isLoading = false
  }

  const subscribeToZones = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'hexagons' 
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