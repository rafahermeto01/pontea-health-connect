import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const ASAAS_URL = "https://api.asaas.com/v3"
    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env vars")
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json()
    const { quiz_response_id, product_id, patient_name, patient_email, patient_phone, patient_cpf, billing_cycle, payment_method, credit_card, credit_card_holder, remote_ip, shipping_address, shipping_city, shipping_state, shipping_zip, ref_code } = body
    if (!quiz_response_id || !product_id || !patient_name || !patient_phone || !patient_cpf || !billing_cycle || !payment_method) throw new Error("Campos obrigatórios faltando")
    const cpfClean = patient_cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11 && cpfClean.length !== 14) throw new Error("CPF/CNPJ inválido")
    const { data: product, error: prodError } = await supabase.from("treatment_products").select("*").eq("id", product_id).single()
    if (prodError || !product) throw new Error("Produto não encontrado")
    let priceCents = product.price_monthly_cents
    if (billing_cycle === "quarterly" && product.price_quarterly_cents) priceCents = product.price_quarterly_cents
    if (billing_cycle === "semiannual" && product.price_semiannual_cents) priceCents = product.price_semiannual_cents
    const priceValue = priceCents / 100
    let affiliate_id = null
    let affiliate_commission_cents = 0
    if (ref_code) {
      const { data: affiliate } = await supabase.from("affiliates").select("id, commission_rate").eq("ref_code", ref_code).eq("status", "approved").maybeSingle()
      if (affiliate) { affiliate_id = affiliate.id; affiliate_commission_cents = Math.round(priceCents * affiliate.commission_rate / 100) }
    }
    const customerRes = await fetch(`${ASAAS_URL}/customers`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ name: patient_name.trim(), cpfCnpj: cpfClean, email: patient_email || undefined, mobilePhone: patient_phone.replace(/\D/g, ""), notificationDisabled: false }) })
    const customerData = await customerRes.json()
    if (customerData.errors) throw new Error(`Asaas: ${customerData.errors.map((e: any) => e.description).join(", ")}`)
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 1); const dueDateStr = dueDate.toISOString().split("T")[0]
    let paymentData: any
    let pixData: any = null
    let subscriptionId: any = null
    if (payment_method === "PIX") {
      const payRes = await fetch(`${ASAAS_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerData.id, billingType: "PIX", value: priceValue, dueDate: dueDateStr, description: `Tratamento ${product.name} - Pontea Saúde`, externalReference: `pontea_treat_${quiz_response_id}` }) })
      paymentData = await payRes.json()
      if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
      const pixRes = await fetch(`${ASAAS_URL}/payments/${paymentData.id}/pixQrCode`, { method: "GET", headers: { "access_token": ASAAS_API_KEY } })
      pixData = await pixRes.json()
    } else if (payment_method === "CREDIT_CARD") {
      if (!credit_card || !credit_card_holder || !remote_ip) throw new Error("Dados do cartão incompletos")
      const cycle = billing_cycle === "monthly" ? "MONTHLY" : billing_cycle === "quarterly" ? "QUARTERLY" : "SEMIANNUALLY"
      const subRes = await fetch(`${ASAAS_URL}/subscriptions`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerData.id, billingType: "CREDIT_CARD", value: priceValue, nextDueDate: dueDateStr, cycle, description: `Tratamento ${product.name} - Pontea Saúde`, externalReference: `pontea_treat_${quiz_response_id}`, creditCard: { holderName: credit_card.holderName, number: credit_card.number, expiryMonth: credit_card.expiryMonth, expiryYear: credit_card.expiryYear, ccv: credit_card.ccv }, creditCardHolderInfo: { name: credit_card_holder.name || patient_name, email: credit_card_holder.email || patient_email, cpfCnpj: cpfClean, postalCode: credit_card_holder.postalCode.replace(/\D/g, ""), addressNumber: credit_card_holder.addressNumber, phone: patient_phone.replace(/\D/g, "") }, remoteIp: remote_ip }) })
      paymentData = await subRes.json()
      if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
      subscriptionId = paymentData.id
    }
    const isPaid = payment_method === "CREDIT_CARD" && (paymentData.status === "ACTIVE" || paymentData.status === "CONFIRMED")
    const { data: order, error: orderError } = await supabase.from("treatment_orders").insert({
      quiz_response_id, product_id, patient_name: patient_name.trim(), patient_email: patient_email?.trim() || null, patient_phone: patient_phone.replace(/\D/g, ""), patient_cpf: cpfClean, billing_cycle, price_cents: priceCents, status: isPaid ? "awaiting_review" : "awaiting_review", payment_status: isPaid ? "paid" : "pending", asaas_payment_id: payment_method === "PIX" ? paymentData.id : null, asaas_subscription_id: subscriptionId, shipping_address: shipping_address || null, shipping_city: shipping_city || null, shipping_state: shipping_state || null, shipping_zip: shipping_zip || null, ref_code: ref_code || null, affiliate_id, affiliate_commission_cents
    }).select("id").single()
    if (orderError) throw new Error(`Erro ao criar pedido: ${orderError.message}`)
    if (isPaid && affiliate_id && affiliate_commission_cents > 0) {
      const { data: aff } = await supabase.from("affiliates").select("id, balance_cents, total_earned_cents").eq("id", affiliate_id).single()
      if (aff) { await supabase.from("affiliates").update({ balance_cents: (aff.balance_cents || 0) + affiliate_commission_cents, total_earned_cents: (aff.total_earned_cents || 0) + affiliate_commission_cents }).eq("id", aff.id) }
    }
    return new Response(JSON.stringify({ success: true, order_id: order.id, payment_method, payment_status: isPaid ? "paid" : "pending", pix_qr_code: pixData?.encodedImage || null, pix_payload: pixData?.payload || null, pix_expiration: pixData?.expirationDate || null, value: priceValue }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
