export const useCapture = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const loading = ref(false);

  const captureHex = async (hexId: string) => {
    if (!user.value) {
      alert('Сначала нужно войти в систему!');
      return;
    }

    loading.value = true;
    
    const { error } = await supabase
      .from('zones')
      .upsert({ 
        id: hexId, 
        owner_id: user.value.id,
        captured_at: new Date().toISOString()
      });

    loading.value = false;

    if (error) {
      console.error('Ошибка захвата:', error.message);
    } else {
      console.log(`Зона ${hexId} теперь твоя!`);
    }
  };

  return { captureHex, loading };
};