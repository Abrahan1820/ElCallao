import { createContext, useContext, useState } from "react";
import { Supabase } from "../Supabase/supabaseCompany";


export const DatabaseContext = createContext()

export const useDatabase = () =>{
    const context = useContext(DatabaseContext)
    return context
}

export const DatabaseContextProvider = ({children}) =>{

    const [Database, setDatabase] = useState([])
    const [Empresa_url, setEmpresa_url] = useState("https://wuyodajpxeoydzmulgkm.supabase.co");
    const [Empresa_token, setEmpresa_token] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eW9kYWpweGVveWR6bXVsZ2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTc5MDIsImV4cCI6MjA4ODA3MzkwMn0._nBn3NOuspZGVJgZJRDnMlEKAVUdPLrFoS0PyH3jihM");
    
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