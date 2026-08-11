import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Verifica se as credenciais são válidas e não são os placeholders padrão
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseUrl.indexOf('YOUR_SUPABASE') === -1;

// Utiliza placeholders em formato válido para evitar crash síncrono na inicialização
const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(url, key);
