export const useProfile = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const profile = ref(null);

  const fetchProfileData = async () => {
    if (!user.value) return;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        username, 
        color, 
        balance,
        hexagons:hexagons(count) 
      `)
      .eq('id', user.value.id)
      .single();

    if (!error) {
      profile.value = data;
    }
  };

  return { profile, fetchProfileData };
};