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
    const { doctor_id, patient_name, patient_phone, patient_email, patient_cpf, scheduled_at, price_cents, ref_code, payment_method, credit_card, credit_card_holder, remote_ip } = body
    if (!doctor_id || !patient_name || !patient_phone || !patient_cpf || !scheduled_at || !price_cents || !payment_method) throw new Error("Campos obrigatórios faltando")
    if (payment_method !== "PIX" && payment_method !== "CREDIT_CARD") throw new Error("Método de pagamento inválido")
    const cpfClean = patient_cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11 && cpfClean.length !== 14) throw new Error("CPF/CNPJ inválido")
    if (payment_method === "CREDIT_CARD") {
      if (!credit_card || !credit_card.holderName || !credit_card.number || !credit_card.expiryMonth || !credit_card.expiryYear || !credit_card.ccv) throw new Error("Dados do cartão incompletos")
      if (!credit_card_holder || !credit_card_holder.postalCode || !credit_card_holder.addressNumber) throw new Error("CEP e número do endereço são obrigatórios para cartão")
      if (!remote_ip) throw new Error("IP do cliente é obrigatório para cartão")
    }
    const { data: doctor, error: doctorError } = await supabase.from("doctors").select("id, full_name, consultation_price").eq("id", doctor_id).eq("is_active", true).single()
    if (doctorError || !doctor) throw new Error("Médico não encontrado")
    const { data: existing } = await supabase.from("appointments").select("id").eq("doctor_id", doctor_id).eq("scheduled_at", scheduled_at).in("status", ["pending", "confirmed", "completed"]).maybeSingle()
    if (existing) throw new Error("Este horário já foi reservado. Escolha outro.")
    let affiliate_id = null; let affiliate_commission_cents = 0
    if (ref_code) { const { data: affiliate } = await supabase.from("affiliates").select("id, commission_rate").eq("ref_code", ref_code).eq("status", "approved").maybeSingle(); if (affiliate) { affiliate_id = affiliate.id; affiliate_commission_cents = Math.round(price_cents * affiliate.commission_rate / 100) } }
    const platform_fee_cents = Math.round(price_cents * 0.20)
    const priceValue = price_cents / 100
    const customerRes = await fetch(`${ASAAS_URL}/customers`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ name: patient_name.trim(), cpfCnpj: cpfClean, email: patient_email || undefined, mobilePhone: patient_phone.replace(/\D/g, ""), notificationDisabled: false }) })
    const customerData = await customerRes.json()
    if (customerData.errors) throw new Error(`Asaas: ${customerData.errors.map((e: any) => e.description).join(", ")}`)
    const dueDate = new Date(scheduled_at).toISOString().split("T")[0]
    let paymentData: any
    let pixData: any = null
    if (payment_method === "PIX") {
      const paymentRes = await fetch(`${ASAAS_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerData.id, billingType: "PIX", value: priceValue, dueDate, description: `Consulta - Dr(a). ${doctor.full_name} - Pontea Saúde`, externalReference: `pontea_${doctor_id}_${Date.now()}` }) })
      paymentData = await paymentRes.json()
      if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
      const pixRes = await fetch(`${ASAAS_URL}/payments/${paymentData.id}/pixQrCode`, { method: "GET", headers: { "access_token": ASAAS_API_KEY } })
      pixData = await pixRes.json()
    } else {
      const paymentRes = await fetch(`${ASAAS_URL}/payments/`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerData.id, billingType: "CREDIT_CARD", value: priceValue, dueDate, description: `Consulta - Dr(a). ${doctor.full_name} - Pontea Saúde`, externalReference: `pontea_${doctor_id}_${Date.now()}`, creditCard: { holderName: credit_card.holderName, number: credit_card.number, expiryMonth: credit_card.expiryMonth, expiryYear: credit_card.expiryYear, ccv: credit_card.ccv }, creditCardHolderInfo: { name: credit_card_holder.name || patient_name.trim(), email: credit_card_holder.email || patient_email, cpfCnpj: cpfClean, postalCode: credit_card_holder.postalCode.replace(/\D/g, ""), addressNumber: credit_card_holder.addressNumber, phone: patient_phone.replace(/\D/g, "") }, remoteIp: remote_ip }) })
      paymentData = await paymentRes.json()
      if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
    }
    const isPaidByCard = payment_method === "CREDIT_CARD" && (paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED")
    const { data: appointment, error: appointmentError } = await supabase.from("appointments").insert({ doctor_id, affiliate_id, patient_name: patient_name.trim(), patient_phone: patient_phone.replace(/\D/g, ""), patient_email: patient_email?.trim() || null, patient_cpf: cpfClean, scheduled_at, status: isPaidByCard ? "confirmed" : "pending", price_cents, platform_fee_cents, affiliate_commission_cents, ref_code: ref_code || null, payment_status: isPaidByCard ? "paid" : "pending", asaas_payment_id: paymentData.id, asaas_customer_id: customerData.id, pix_qr_code: pixData?.encodedImage || null, pix_payload: pixData?.payload || null, pix_expiration: pixData?.expirationDate || null }).select("id").single()
    if (appointmentError) throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`)
    if (affiliate_id) { await supabase.from("referral_clicks").update({ converted: true, appointment_id: appointment.id }).eq("affiliate_id", affiliate_id).eq("converted", false).order("created_at", { ascending: false }).limit(1) }
    if (isPaidByCard && affiliate_id && affiliate_commission_cents > 0) { const { data: aff } = await supabase.from("affiliates").select("id, balance_cents, total_earned_cents").eq("id", affiliate_id).single(); if (aff) { await supabase.from("affiliates").update({ balance_cents: (aff.balance_cents || 0) + affiliate_commission_cents, total_earned_cents: (aff.total_earned_cents || 0) + affiliate_commission_cents }).eq("id", aff.id) } }
    return new Response(JSON.stringify({ success: true, appointment_id: appointment.id, payment_id: paymentData.id, payment_method, payment_status: isPaidByCard ? "paid" : "pending", pix_qr_code: pixData?.encodedImage || null, pix_payload: pixData?.payload || null, pix_expiration: pixData?.expirationDate || null, value: priceValue }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
