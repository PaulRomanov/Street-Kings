<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const colors = ['#00f2ff', '#ff0055', '#39ff14', '#bc13fe', '#ffce00', '#ffffff'];
const activeColor = ref('');

watch(user, async (newUser) => {
  if (newUser?.id) {
    const { data } = await supabase
      .from('profiles')
      .select('color')
      .eq('id', newUser.id)
      .maybeSingle();
    
    if (data?.color) activeColor.value = data.color;
  }
}, { immediate: true });

const selectColor = async (color: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.warn('Manual session check failed. Try to re-login.');
    return;
  }
  
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: session.user.id, 
      color: color,
      username: session.user.email?.split('@')[0] 
    });

  if (error) {
    console.error('SQL Error:', error.message);
  } else {
    activeColor.value = color;
    emit('colorChanged', color);
  }
};

const emit = defineEmits(['colorChanged']);
</script>

<template>
  <div class="color-picker-widget">
    <span class="color-picker-widget__label">FACTION COLOR</span>
    <div class="color-picker-widget__list">
      <button 
        v-for="color in colors" 
        :key="color"
        class="color-node"
        :class="{ 'color-node--active': activeColor === color }"
        :style="{ '--node-color': color }"
        @click="selectColor(color)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-picker-widget {
  background: rgba($color-bg, 0.8);
  backdrop-filter: blur(10px);
  padding: 15px;
  border-radius: 2px;
  border: 1px solid rgba(white, 0.1);
  pointer-events: auto;

  &__label {
    display: block;
    font-size: 10px;
    color: rgba($color-text, 0.5);
    margin-bottom: 10px;
    letter-spacing: 1px;
    font-weight: bold;
  }

  &__list {
    display: flex;
    gap: 12px;
  }
}

.color-node {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  background: var(--node-color);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 5px var(--node-color);

  &:hover {
    transform: translateY(-3px);
  }

  &--active {
    border-color: white;
    transform: scale(1.1);
    box-shadow: 0 0 15px var(--node-color);
  }
}
</style>