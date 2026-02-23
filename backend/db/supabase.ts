import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
    return createClient(supabaseUrl, supabaseKey);
}
