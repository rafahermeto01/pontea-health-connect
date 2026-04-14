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
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("Não autorizado")
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error("Não autorizado")
    const body = await req.json()
    const { plan_type, doctor_cpf, payment_method, credit_card, credit_card_holder, remote_ip } = body
    if (!plan_type || !doctor_cpf || !payment_method) throw new Error("Campos obrigatórios: plan_type, doctor_cpf, payment_method")
    if (plan_type !== "basic" && plan_type !== "premium") throw new Error("Plano inválido")
    if (payment_method !== "PIX" && payment_method !== "CREDIT_CARD") throw new Error("Método inválido")
    const cpfClean = doctor_cpf.replace(/\D/g, "")
    if (cpfClean.length !== 11 && cpfClean.length !== 14) throw new Error("CPF/CNPJ inválido")
    if (payment_method === "CREDIT_CARD") {
      if (!credit_card || !credit_card.holderName || !credit_card.number || !credit_card.expiryMonth || !credit_card.expiryYear || !credit_card.ccv) throw new Error("Dados do cartão incompletos")
      if (!credit_card_holder || !credit_card_holder.postalCode || !credit_card_holder.addressNumber || !credit_card_holder.email) throw new Error("CEP, número do endereço e e-mail são obrigatórios para cartão")
      if (!remote_ip) throw new Error("IP do cliente obrigatório")
    }
    const planPrices: Record<string, number> = { basic: 7990, premium: 17990 }
    const planLabels: Record<string, string> = { basic: "Plano Básico", premium: "Plano Premium" }
    const priceCents = planPrices[plan_type]
    const priceValue = priceCents / 100
    const { data: doctor, error: docError } = await supabase.from("doctors").select("id, full_name, phone, asaas_customer_id").eq("user_id", user.id).single()
    if (docError || !doctor) throw new Error("Perfil de médico não encontrado")
    let customerId = doctor.asaas_customer_id
    if (!customerId) {
      const customerRes = await fetch(`${ASAAS_URL}/customers`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ name: doctor.full_name, cpfCnpj: cpfClean, mobilePhone: doctor.phone?.replace(/\D/g, "") || undefined, notificationDisabled: false }) })
      const customerData = await customerRes.json()
      if (customerData.errors) throw new Error(`Asaas: ${customerData.errors.map((e: any) => e.description).join(", ")}`)
      customerId = customerData.id
      await supabase.from("doctors").update({ asaas_customer_id: customerId }).eq("id", doctor.id)
    }
    const nextDueDate = new Date(); nextDueDate.setDate(nextDueDate.getDate() + 1); const dueDateStr = nextDueDate.toISOString().split("T")[0]
    let responseData: any
    if (payment_method === "PIX") {
      const paymentRes = await fetch(`${ASAAS_URL}/payments`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerId, billingType: "PIX", value: priceValue, dueDate: dueDateStr, description: `${planLabels[plan_type]} - Pontea Saúde - Mensal`, externalReference: `pontea_plan_${doctor.id}_${Date.now()}` }) })
      const paymentData = await paymentRes.json()
      if (paymentData.errors) throw new Error(`Asaas: ${paymentData.errors.map((e: any) => e.description).join(", ")}`)
      const pixRes = await fetch(`${ASAAS_URL}/payments/${paymentData.id}/pixQrCode`, { method: "GET", headers: { "access_token": ASAAS_API_KEY } })
      const pixData = await pixRes.json()
      await supabase.from("doctors").update({ plan_type, plan_price_cents: priceCents, plan_payment_id: paymentData.id, plan_status: "pending" }).eq("id", doctor.id)
      responseData = { success: true, payment_method: "PIX", payment_id: paymentData.id, pix_qr_code: pixData.encodedImage, pix_payload: pixData.payload, pix_expiration: pixData.expirationDate, value: priceValue, plan_type, plan_label: planLabels[plan_type] }
    } else {
      const subRes = await fetch(`${ASAAS_URL}/subscriptions/`, { method: "POST", headers: { "Content-Type": "application/json", "access_token": ASAAS_API_KEY }, body: JSON.stringify({ customer: customerId, billingType: "CREDIT_CARD", value: priceValue, nextDueDate: dueDateStr, cycle: "MONTHLY", description: `${planLabels[plan_type]} - Pontea Saúde`, externalReference: `pontea_sub_${doctor.id}`, creditCard: { holderName: credit_card.holderName, number: credit_card.number, expiryMonth: credit_card.expiryMonth, expiryYear: credit_card.expiryYear, ccv: credit_card.ccv }, creditCardHolderInfo: { name: credit_card_holder.name || doctor.full_name, email: credit_card_holder.email, cpfCnpj: cpfClean, postalCode: credit_card_holder.postalCode.replace(/\D/g, ""), addressNumber: credit_card_holder.addressNumber, phone: doctor.phone?.replace(/\D/g, "") || credit_card_holder.phone }, remoteIp: remote_ip }) })
      const subData = await subRes.json()
      if (subData.errors) throw new Error(`Asaas: ${subData.errors.map((e: any) => e.description).join(", ")}`)
      const isActive = subData.status === "ACTIVE"
      await supabase.from("doctors").update({ plan_type, plan_price_cents: priceCents, plan_payment_id: subData.id, plan_status: isActive ? "active" : "pending", plan_started_at: isActive ? new Date().toISOString() : null, plan_expires_at: isActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null }).eq("id", doctor.id)
      responseData = { success: true, payment_method: "CREDIT_CARD", subscription_id: subData.id, status: subData.status, value: priceValue, plan_type, plan_label: planLabels[plan_type], is_active: isActive }
    }
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
