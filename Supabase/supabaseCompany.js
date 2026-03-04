import { createClient } from "@supabase/supabase-js"

const supabaseUrlcompany = "https://wuyodajpxeoydzmulgkm.supabase.co"
const supabaseAnonKeycompany = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eW9kYWpweGVveWR6bXVsZ2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTc5MDIsImV4cCI6MjA4ODA3MzkwMn0._nBn3NOuspZGVJgZJRDnMlEKAVUdPLrFoS0PyH3jihM"

export const Supabase = 
createClient(supabaseUrlcompany,supabaseAnonKeycompany
);