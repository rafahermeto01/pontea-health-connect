import { useState, useEffect } from "react";
import { CheckCircle, Crown, Copy, Loader2, QrCode, CreditCard, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

const digitsOnly = (s: string) => s.replace(/\D/g, "");

const formatCardNumber = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

const formatCep = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

const currentYear = new Date().getFullYear();

const planPrices: Record<string, number> = { basic: 7990, premium: 17990 };
const planLabels: Record<string, string> = { basic: "Básico", premium: "Premium" };

export default function DoctorPlanSelection() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(null);
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  /* payment method */
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [cardForm, setCardForm] = useState({
    holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "",
    postalCode: "", addressNumber: "", email: "",
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const priceFormatted = selectedPlan
    ? (planPrices[selectedPlan] / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";

  const handleSubmitPayment = async () => {
    setError(null);
    if (digitsOnly(cpf).length !== 11) {
      setError("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    if (paymentMethod === "CREDIT_CARD") {
      if (!cardForm.holderName || !cardForm.number || !cardForm.expiryMonth || !cardForm.expiryYear || !cardForm.ccv || !cardForm.postalCode || !cardForm.addressNumber || !cardForm.email) {
        setError("Preencha todos os campos do cartão, incluindo o e-mail.");
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      let bodyPayload: any = {
        plan_type: selectedPlan,
        doctor_cpf: cpf,
        payment_method: paymentMethod,
      };

      if (paymentMethod === "CREDIT_CARD") {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        bodyPayload = {
          ...bodyPayload,
          credit_card: {
            holderName: cardForm.holderName,
            number: cardForm.number.replace(/\s/g, ""),
            expiryMonth: cardForm.expiryMonth,
            expiryYear: cardForm.expiryYear,
            ccv: cardForm.ccv,
          },
          credit_card_holder: {
            name: cardForm.holderName,
            email: cardForm.email,
            postalCode: cardForm.postalCode,
            addressNumber: cardForm.addressNumber,
          },
          remote_ip: ipData.ip,
        };
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/create-plan-payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Erro ao gerar pagamento");

      /* Clear card data immediately */
      setCardForm({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "", postalCode: "", addressNumber: "", email: "" });

      if (payload.is_active) {
        /* Card subscription activated instantly */
        setSuccessMessage("Plano ativado com sucesso! Sua assinatura será cobrada automaticamente todo mês.");
        setIsSuccess(true);
      } else {
        /* PIX flow — show QR code */
        setPaymentData(payload);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentData?.pix_payload) {
      navigator.clipboard.writeText(paymentData.pix_payload);
      toast.success("Código copiado!");
    }
  };

  /* Polling for PIX payment confirmation */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (paymentData && !isSuccess) {
      interval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from("doctors")
          .select("plan_status")
          .eq("user_id", session.user.id)
          .single();

        if (data?.plan_status === "active") {
          setSuccessMessage("Plano ativado com sucesso!");
          setIsSuccess(true);
          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentData, isSuccess]);

  /* ═══ SUCCESS ═══ */
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center max-w-md mx-auto mt-12 animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{successMessage}</h2>
        <p className="text-slate-500 mb-8">Todos os recursos do seu plano já estão liberados.</p>
        <Button onClick={() => navigate(0)} className="w-full bg-teal-600 hover:bg-teal-700">
          Ir para o painel
        </Button>
      </div>
    );
  }

  /* ═══ PIX QR CODE ═══ */
  if (paymentData) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 mt-12 text-center animate-in fade-in zoom-in duration-300">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Pague via PIX</h2>
        <p className="text-slate-500 text-sm mb-6">Abra o app do seu banco e escaneie o código abaixo ou copie a chave PIX.</p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center mb-6">
          <img src={`data:image/png;base64,${paymentData.pix_qr_code}`} alt="QR Code PIX" className="w-48 h-48 rounded-lg shadow-sm" />
        </div>

        <div className="mb-6 text-left">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Código copia e cola</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 truncate font-mono">
              {paymentData.pix_payload}
            </div>
            <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0" title="Copiar">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Aguardando pagamento...</span>
        </div>

        <button onClick={() => setPaymentData(null)} className="mt-6 text-sm text-slate-500 hover:text-slate-800 underline">
          Voltar e escolher outro plano
        </button>
      </div>
    );
  }

  /* ═══ CPF + PAYMENT METHOD FORM ═══ */
  if (selectedPlan) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-200 mt-12 animate-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
          Assinar Plano {planLabels[selectedPlan]}
        </h2>
        <p className="text-sm text-slate-500 mb-6 text-center">
          {priceFormatted}/mês — escolha a forma de pagamento.
        </p>

        {/* Payment method selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setPaymentMethod("PIX")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              paymentMethod === "PIX"
                ? "bg-teal-600 text-white border-teal-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}
          >
            <QrCode className="h-4 w-4" /> PIX
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("CREDIT_CARD")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              paymentMethod === "CREDIT_CARD"
                ? "bg-teal-600 text-white border-teal-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}
          >
            <CreditCard className="h-4 w-4" /> Cartão de Crédito
          </button>
        </div>

        {/* CPF field */}
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-1">CPF do Titular *</label>
          <input
            type="text"
            value={cpf}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>

        {/* Credit card form */}
        {paymentMethod === "CREDIT_CARD" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">Dados do Cartão</span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">VISA</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">MC</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">ELO</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nome no cartão *</label>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={cardForm.holderName}
                  onChange={(e) => setCardForm(p => ({ ...p, holderName: e.target.value }))}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Número do cartão *</label>
                <input
                  type="text"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  value={cardForm.number}
                  onChange={(e) => setCardForm(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Mês *</label>
                  <select
                    autoComplete="cc-exp-month"
                    value={cardForm.expiryMonth}
                    onChange={(e) => setCardForm(p => ({ ...p, expiryMonth: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Ano *</label>
                  <select
                    autoComplete="cc-exp-year"
                    value={cardForm.expiryYear}
                    onChange={(e) => setCardForm(p => ({ ...p, expiryYear: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 11 }, (_, i) => String(currentYear + i)).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">CVV *</label>
                  <input
                    type="text"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    value={cardForm.ccv}
                    onChange={(e) => setCardForm(p => ({ ...p, ccv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">E-mail *</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={cardForm.email}
                  onChange={(e) => setCardForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">CEP *</label>
                  <input
                    type="text"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={cardForm.postalCode}
                    onChange={(e) => setCardForm(p => ({ ...p, postalCode: formatCep(e.target.value) }))}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nº endereço *</label>
                  <input
                    type="text"
                    value={cardForm.addressNumber}
                    onChange={(e) => setCardForm(p => ({ ...p, addressNumber: e.target.value }))}
                    placeholder="123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Assinatura mensal recorrente. A cobrança será feita automaticamente no seu cartão todo mês. Você pode cancelar a qualquer momento.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setSelectedPlan(null); setError(null); }} disabled={loading}>
            Voltar
          </Button>
          {paymentMethod === "PIX" ? (
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSubmitPayment} disabled={loading || cpf.length < 14}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
              Gerar PIX
            </Button>
          ) : (
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSubmitPayment} disabled={loading || cpf.length < 14}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Assinar {priceFormatted}/mês
            </Button>
          )}
        </div>

        {paymentMethod === "CREDIT_CARD" && (
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
            <Lock className="h-3 w-3" />
            <span>Pagamento seguro — dados processados pela Asaas</span>
          </div>
        )}
      </div>
    );
  }

  /* ═══ PLAN SELECTION ═══ */
  return (
    <div className="max-w-5xl mx-auto py-8 text-center animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-900">Escolha seu plano para começar</h1>
      <p className="mt-3 text-slate-500">Após o pagamento, todas as funcionalidades serão liberadas.</p>

      <div className="mt-12 grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        {/* Basic Plan */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-300 p-8 flex flex-col text-left">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Básico</h3>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-3xl font-extrabold text-slate-900">R$ 79,90</span>
            <span className="text-slate-500 text-sm">/mês</span>
          </div>
          <ul className="mb-8 space-y-4 flex-1">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Perfil no marketplace</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Receber agendamentos de pacientes</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Painel de agendamentos</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Até 50 consultas/mês</span>
            </li>
          </ul>
          <Button onClick={() => setSelectedPlan("basic")} className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-md font-medium shadow-sm">
            Assinar Básico
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white rounded-2xl shadow-md border ring-2 ring-teal-500 p-8 flex flex-col text-left relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-teal-500"></div>
          <div className="absolute top-4 right-4 bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" /> Recomendado
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1 mt-2">Premium</h3>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-3xl font-extrabold text-slate-900">R$ 179,90</span>
            <span className="text-slate-500 text-sm">/mês</span>
          </div>
          <ul className="mb-8 space-y-4 flex-1">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600 font-medium">Tudo do Básico</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Consultas ilimitadas</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Destaque no marketplace (aparece primeiro)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Relatórios financeiros avançados</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-slate-600">Suporte prioritário</span>
            </li>
          </ul>
          <Button onClick={() => setSelectedPlan("premium")} className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-md font-medium shadow-sm">
            Assinar Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
