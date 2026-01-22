import { createContext, useContext, useState } from "react";
import { Supabase } from "../Supabase/supabaseCompany";


export const DatabaseContext = createContext()

export const useDatabase = () =>{
    const context = useContext(DatabaseContext)
    return context
}

export const DatabaseContextProvider = ({children}) =>{

    const [Database, setDatabase] = useState([])
    const [Empresa_url, setEmpresa_url] = useState("https://wdcipvbcdrijezexqufg.supabase.co");
    const [Empresa_token, setEmpresa_token] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY2lwdmJjZHJpamV6ZXhxdWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTAwNjMsImV4cCI6MjA4MzQ2NjA2M30.vCbSGj2E4PRG_mATW8BSGHVI2itS1nMtDkfLGyWEImw");
    
    const buscarDatabase = async (id_empresa) => {
       
        try {
          const { data: empresa, error } = await Supabase
            .from('empresa')
            .select('database_url,database_token')
            .eq('id', id_empresa)
          
          if (error) {
         
            return;
          }
          setDatabase(empresa)
          setEmpresa_url(empresa[0].database_url)
          setEmpresa_token(empresa[0].database_token)
        } catch (error) {
       
        }
      };
    return(
        <DatabaseContext.Provider value={{Database, buscarDatabase, Empresa_url, Empresa_token}}>
        {children}
        </DatabaseContext.Provider>
    )
}