import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AffiliateData {
  id: string;
  ref_code: string | null;
  full_name: string | null;
  balance_cents: number | null;
  total_earned_cents: number | null;
  pix_key: string | null;
  commission_rate: number | null;
}

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("affiliates")
        .select("id, ref_code, full_name, balance_cents, total_earned_cents, pix_key, commission_rate")
        .eq("user_id", user.id)
        .maybeSingle();

      setAffiliate(data);
      setLoading(false);
    }
    load();
  }, []);

  const refetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("affiliates")
      .select("id, ref_code, full_name, balance_cents, total_earned_cents, pix_key, commission_rate")
      .eq("user_id", user.id)
      .maybeSingle();
    setAffiliate(data);
  };

  return { affiliate, loading, refetch };
}
