export const useCapture = () => {
  const supabase = useSupabaseClient();
  const loading = ref(false);

  const captureHex = async (hexId: string) => {
    loading.value = true;
    
    const { data, error } = await supabase.rpc('capture_hexagon', { 
      target_hex_id: hexId 
    });

    loading.value = false;

    if (error) {
      console.error('RPC Error:', error.message);
      return { success: false, message: error.message };
    }

    if (data && !data.success) {
      return { success: false, message: data.message };
    }

    return { success: true, price: data?.price };
  };

  return { captureHex, loading };
};