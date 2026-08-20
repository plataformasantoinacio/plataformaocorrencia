import { createClient } from "@supabase/supabase-js";

const sanitize = (val?: string) => {
  if (!val) return "";
  return val.replace(/['"]/g, "").trim();
};

const supabaseUrl = sanitize(import.meta.env.VITE_SUPABASE_URL) || "https://nymtgmtayboanxklxesb.supabase.co";
const supabaseAnonKey = sanitize(import.meta.env.VITE_SUPABASE_ANON_KEY) || "sb_publishable_K7IsfPHdbihvbgLGKpxKNQ_-aE858cr";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
