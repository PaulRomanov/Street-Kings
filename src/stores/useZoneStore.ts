import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useZoneStore = defineStore('zone', () => {
  const allZones = ref<any[]>([])
  const isLoading = ref(false)

  const setZones = (zones: any[]) => {
    allZones.value = zones
  }

  const updateZone = (updatedZone: any) => {
    const index = allZones.value.findIndex(z => z.id === updatedZone.id)
    if (index !== -1) {
      allZones.value[index] = { ...allZones.value[index], ...updatedZone }
    } else {
      allZones.value.push(updatedZone)
    }
  }

  return {
    allZones,
    isLoading,
    setZones,
    updateZone
  }
})
