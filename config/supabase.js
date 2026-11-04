
import { createClient } from
    "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://kgjlqnuqbuagrlpikwba.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2s0dlUvd2xj9pSDcla0z7w_GGX40L3G";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
