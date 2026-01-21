export const useCapture = () => {
  const supabase = useSupabaseClient();
  const loading = ref(false);

  const captureHex = async (hexId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('Capture failed: No session in client');
      return;
    }

    loading.value = true;
    
    const { error } = await supabase
      .from('zones')
      .upsert({ 
        id: hexId, 
        owner_id: session.user.id,
        captured_at: new Date().toISOString()
      });

    loading.value = false;

    if (error) console.error('DB Error:', error.message);
  };

  return { captureHex, loading };
};