import { createClient } from "@supabase/supabase-js"
import { useDatabase } from  '../Context/DatabaseContext';
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const SupaClient = () => {
    const {Empresa_url, Empresa_token} = useDatabase();
    
    const SupaBaseURL = Empresa_url
    const SupaBaseAnonKey = Empresa_token

    const Supa = createClient(SupaBaseURL,SupaBaseAnonKey,{
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        });
    
        AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                Supa.auth.startAutoRefresh()
            } else {
                Supa.auth.stopAutoRefresh()
            }
          })

    return Supa;
}
