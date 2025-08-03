import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const supabase: SupabaseClient = createClient(
    'https://brjrbhrckggldyirmlix.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyanJiaHJja2dnbGR5aXJtbGl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg4MTY0NiwiZXhwIjoyMDY3NDU3NjQ2fQ.iOyiZ5un0Uki83yaitJPOnsTW4atBOgo43QcJBUkmkk',
)
