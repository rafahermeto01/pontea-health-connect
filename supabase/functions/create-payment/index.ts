import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const ASAAS_URL = "https://api.asaas.com/v3"
    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing environment variables")
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json()
    const { doctor_id, patient_name, patient_phone, patient_email, patient_cpf, scheduled_at, price_cents, ref_code } = body
    if (!doctor_id || !patient_name || !patient_phone || !patient_cpf || !scheduled_at || !price_cents) throw new Error("Campos obrigatórios faltando")
    const cpfClean = patient_cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11 && cpfClean.length !== 14) throw new Error("CPF/CNPJ inválido")
    const { data: doctor, error: doctorError } = await supabase.from("doctors").select("id, full_name, consultation_price").eq("id", doctor_id).eq("is_active", true).single()
    if (doctorError || !doctor) throw new Error("Médico não encontrado")
    const { data: existing } = await supabase.from("appointments").select("id").eq("doctor_id", doctor_id).eq("scheduled_at", scheduled_at).in("status", ["pending", "confirmed", "completed"]).maybeSingle()
    if (existing) throw new Error("Este horário já foi reservado. Escolha outro.")
    let affiliate_id = null
    let affiliate_commission_cents = 0
    if (ref_code) {
      const { data: affiliate } = await supabase.from("affiliates").select("id, commission_rate").eq("ref_code", ref_code).eq("status", "approved").maybeSingle()
      if (affiliate) { affiliate_id = affiliate.id; affiliate_commission_cents = Math.round(price_cents * affiliate.commission_rate / 100) }
    }
    const platform_fee_cents = Math.round(price_cents * 0.20)
    const priceValue = price_cents / 100
    const customerRes = await fetch(`${ASAAS_URL}/customers`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ name: patient_name.trim(), cpfCnpj: cpfClean, email: patient_email || undefined, mobilePhone: patient_phone.replace(/\D/g, ""), notificationDisabled: false }) })
    const customerData = await customerRes.json()
    if (customerData.errors) throw new Error(`Asaas: ${customerData.errors.map((e: any) => e.description).join(", ")}`)
    const dueDate = new Date(scheduled_at).toISOString().split("T")[0]
    const paymentRes = await fetch(`${ASAAS_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerData.id, billingType: "PIX", value: priceValue, dueDate, description: `Consulta - Dr(a). ${doctor.full_name} - Pontea Saúde`, externalReference: `pontea_${doctor_id}_${Date.now()}` }) })
    const paymentData = await paymentRes.json()
    if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
    const pixRes = await fetch(`${ASAAS_URL}/payments/${paymentData.id}/pixQrCode`, { method: "GET", headers: { "access_token": ASAAS_API_KEY } })
    const pixData = await pixRes.json()
    const { data: appointment, error: appointmentError } = await supabase.from("appointments").insert({ doctor_id, affiliate_id, patient_name: patient_name.trim(), patient_phone: patient_phone.replace(/\D/g, ""), patient_email: patient_email?.trim() || null, patient_cpf: cpfClean, scheduled_at, status: "pending", price_cents, platform_fee_cents, affiliate_commission_cents, ref_code: ref_code || null, payment_status: "pending", asaas_payment_id: paymentData.id, asaas_customer_id: customerData.id, pix_qr_code: pixData.encodedImage || null, pix_payload: pixData.payload || null, pix_expiration: pixData.expirationDate || null }).select("id").single()
    if (appointmentError) throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`)
    if (affiliate_id) { await supabase.from("referral_clicks").update({ converted: true, appointment_id: appointment.id }).eq("affiliate_id", affiliate_id).eq("converted", false).order("created_at", { ascending: false }).limit(1) }
    return new Response(JSON.stringify({ success: true, appointment_id: appointment.id, payment_id: paymentData.id, pix_qr_code: pixData.encodedImage, pix_payload: pixData.payload, pix_expiration: pixData.expirationDate, value: priceValue }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
