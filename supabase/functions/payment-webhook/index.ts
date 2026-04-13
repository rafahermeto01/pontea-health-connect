import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env vars")
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json()
    const event = body.event
    const payment = body.payment
    if (!payment || !payment.id) return new Response("OK", { status: 200 })
    const { data: appointment } = await supabase.from("appointments").select("id, affiliate_id, affiliate_commission_cents, status").eq("asaas_payment_id", payment.id).maybeSingle()
    if (!appointment) return new Response("OK", { status: 200 })
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      await supabase.from("appointments").update({ payment_status: "paid", status: "confirmed" }).eq("id", appointment.id)
      // Credit affiliate commission automatically
      if (appointment.affiliate_id && appointment.affiliate_commission_cents > 0) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id, balance_cents, total_earned_cents")
          .eq("id", appointment.affiliate_id)
          .single()
        if (affiliate) {
          await supabase
            .from("affiliates")
            .update({
              balance_cents: (affiliate.balance_cents || 0) + appointment.affiliate_commission_cents,
              total_earned_cents: (affiliate.total_earned_cents || 0) + appointment.affiliate_commission_cents,
            })
            .eq("id", affiliate.id)
        }
      }
    } else if (event === "PAYMENT_OVERDUE") {
      await supabase.from("appointments").update({ payment_status: "overdue", status: "cancelled" }).eq("id", appointment.id)
    } else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      await supabase.from("appointments").update({ payment_status: "refunded", status: "cancelled" }).eq("id", appointment.id)
      if (appointment.affiliate_id && appointment.affiliate_commission_cents) {
        const { data: affiliate } = await supabase.from("affiliates").select("id, balance_cents, total_earned_cents").eq("id", appointment.affiliate_id).single()
        if (affiliate) { await supabase.from("affiliates").update({ balance_cents: Math.max(0, (affiliate.balance_cents || 0) - appointment.affiliate_commission_cents), total_earned_cents: Math.max(0, (affiliate.total_earned_cents || 0) - appointment.affiliate_commission_cents) }).eq("id", affiliate.id) }
      }
    }
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error.message)
    return new Response("Error", { status: 500 })
  }
})
