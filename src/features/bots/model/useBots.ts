import { ref } from 'vue'
import * as h3 from 'h3-js'
import { v4 as uuidv4 } from 'uuid'
import { useZoneStore } from '@/src/stores/useZoneStore'
import { useZones } from '@/src/entities/zone/model/useZones'

export const useBots = () => {
  const zoneStore = useZoneStore()
  const supabase = useSupabaseClient()
  const { fetchZones } = useZones()

  const BOT_NAMES = [
    'Neon', 'Cyber', 'Hex', 'Grid', 
    'Zone', 'Data', 'Net', 'Void',
    'King', 'Pixel'
  ]
  
  const getRandomColor = () => {
    const colors = [
      '#FF3366', '#33FF66', '#3366FF', '#FFCC33', 
      '#CC33FF', '#33CCFF', '#FF6633', '#66FF33'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const generateBotProfile = () => {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
    const suffix = Math.floor(Math.random() * 1000) // 3 digits
    return {
      id: uuidv4(),
      username: `${name}_${suffix}`, // Max ~5+1+3 = 9 chars
      color: getRandomColor(),
      balance: 1000
    }
  }

  const spawnBots = async (centerLat: number, centerLng: number) => {
    if (!centerLat || !centerLng) return

    const centerHex = h3.latLngToCell(centerLat, centerLng, 9)
    const nearbyHexes = h3.gridDisk(centerHex, 6)
    const existingIds = new Set(zoneStore.allZones.map((z: any) => z.id))
    const tooCloseHexes = new Set(h3.gridDisk(centerHex, 2))
    
    const candidates = nearbyHexes.filter(h => !existingIds.has(h) && !tooCloseHexes.has(h))

    if (candidates.length === 0) return

    // Shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const botsCount = 2 + Math.floor(Math.random() * 2) // 2-3 bots 
    
    // Arrays for batch insert
    const botsToInsert: any[] = []
    const zonesToInsert: any[] = []

    // Temporary local set to track occupancy within this spawn batch
    const newOccupied = new Set<string>()

    for (let i = 0; i < botsCount; i++) {
        if (candidates.length === 0) break
        
        let startHex: string | undefined
        
        // Find a candidate that isn't occupied by our current batch
        while (candidates.length > 0) {
            const c = candidates.pop()!
            if (!newOccupied.has(c)) {
                startHex = c
                break
            }
        }
        
        if (!startHex) break

        const botProfile = generateBotProfile()
        botsToInsert.push(botProfile)

        // Add start hex
        const startZone = createBotZone(startHex, botProfile)
        zonesToInsert.push(startZone)
        newOccupied.add(startHex)

        // Expand to neighbors
        const neighbors = h3.gridDisk(startHex, 1)
        const expansionCount = 3 + Math.floor(Math.random() * 2) 
        let occupiedCount = 1

        for (const neighbor of neighbors) {
            if (neighbor === startHex) continue
            if (existingIds.has(neighbor)) continue
            if (newOccupied.has(neighbor)) continue

            if (occupiedCount <= expansionCount) {
                 const z = createBotZone(neighbor, botProfile)
                 zonesToInsert.push(z)
                 newOccupied.add(neighbor)
                 occupiedCount++
            }
        }
    }

    if (botsToInsert.length === 0) return

    console.log(`Spawning ${botsToInsert.length} bots with ${zonesToInsert.length} zones...`)

    // Call RPC to batch insert bypassing RLS
    const { error } = await supabase.rpc('create_bots_batch', {
        bots: botsToInsert,
        zones: zonesToInsert
    })

    if (error) {
        console.error('Failed to spawn bots via RPC:', error)
    } else {
        console.log('Bots spawned successfully!')
        // Update local store immediately for responsiveness, then fetch strict sync
        zonesToInsert.forEach(z => zoneStore.updateZone(z))
        await fetchZones()
    }
  }

  const createBotZone = (hexId: string, profile: any) => {
    return {
      id: hexId,
      owner_id: profile.id,
      storage: 100 + Math.floor(Math.random() * 900),
      last_income_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Generate random unique coordinates to satisfy DB unique constraint
      // Using large offset to avoid collision with real map data
      coords_q: 1000000 + Math.floor(Math.random() * 1000000),
      coords_r: 1000000 + Math.floor(Math.random() * 1000000),
      profiles: {
        username: profile.username,
        color: profile.color
      }
    }
  }

  const spawnBotsForUser = async (targetUserId: string) => {
      // Find any zone owned by this user
      const userZone = zoneStore.allZones.find((z: any) => z.owner_id === targetUserId)
      
      if (!userZone) {
          console.warn(`User ${targetUserId} has no zones to spawn bots around.`)
          return
      }

      // Get lat/lng of that zone
      const [lat, lng] = h3.cellToLatLng(userZone.id)
      console.log(`Spawning bots for user ${targetUserId} at ${lat}, ${lng}`)
      
      await spawnBots(lat, lng)
  }

  return { spawnBots, spawnBotsForUser }
}
