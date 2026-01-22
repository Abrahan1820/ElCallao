import { createClient } from "@supabase/supabase-js"

const supabaseUrlcompany = "https://wdcipvbcdrijezexqufg.supabase.co"
const supabaseAnonKeycompany = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY2lwdmJjZHJpamV6ZXhxdWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTAwNjMsImV4cCI6MjA4MzQ2NjA2M30.vCbSGj2E4PRG_mATW8BSGHVI2itS1nMtDkfLGyWEImw"

export const Supabase = 
createClient(supabaseUrlcompany,supabaseAnonKeycompany
);