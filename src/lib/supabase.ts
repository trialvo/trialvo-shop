import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nzwzifffejnsyryfejra.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56d3ppZmZmZWpuc3lyeWZlanJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.VZY1xEuzh36ttMmbinQ-OAHG6ckGeMuM-TPLrVvd1Rg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
