import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, QrCode, CreditCard, Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function TreatmentCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();

  const [step, setStep] = useState<"checkout" | "processing" | "pix_payment" | "success">("checkout");
  const [cpf, setCpf] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string; orderId: string; value: number } | null>(null);
  const [creditCard, setCreditCard] = useState({ number: "", holderName: "", expiry: "", ccv: "" });
  
  // State from previous page
  const { productId, cycle: selectedCycle, price, qrId, address, productName } = location.state || {};
  const cycle = selectedCycle || "monthly";

  useEffect(() => {
    if (!location.state || !qrId || !productId) {
      toast.error("Sessão de checkout inválida.");
      navigate(`/tratamento/${slug}`);
      return;
    }

    const fetchQuizData = async () => {
      try {
        const { data: quizResponse, error } = await supabase
          .from("quiz_responses")
          .select("patient_name, patient_email, patient_phone, patient_cpf")
          .eq("id", qrId)
          .single();

        if (error || !quizResponse) {
          throw new Error("Quiz não encontrado");
        }

        setPatientData(quizResponse);
        if (quizResponse.patient_cpf) {
          let c = quizResponse.patient_cpf.replace(/\D/g, "");
          if (c.length > 11) c = c.substring(0, 11);
          c = c.replace(/(\d{3})(\d)/, "$1.$2");
          c = c.replace(/(\d{3})(\d)/, "$1.$2");
          c = c.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          setCpf(c);
        }
      } catch (err) {
        console.error(err);
        toast.error("Sessão expirada. Por favor refaça o questionário.");
        navigate(`/tratamento/${slug}/quiz`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [location.state, navigate, qrId, productId, slug]);

  // Polling for PIX payment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (step === "pix_payment" && pixData?.orderId) {
      interval = setInterval(async () => {
        const { data: order } = await supabase
          .from("treatment_orders")
          .select("payment_status")
          .eq("id", pixData.orderId)
          .single();

        if (order?.payment_status === "paid") {
          clearInterval(interval);
          clearTimeout(timeout);
          setStep("success");
        }
      }, 5000);

      timeout = setTimeout(() => {
        clearInterval(interval);
        toast.error("Tempo de pagamento expirado.");
        setStep("checkout");
      }, 15 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [step, pixData?.orderId]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleCheckout = async () => {
    if (cpf.length < 14) {
      toast.error("Por favor, insira um CPF válido.");
      return;
    }

    if (paymentMethod === "credit_card") {
      if (!creditCard.number || !creditCard.holderName || !creditCard.expiry || !creditCard.ccv) {
        toast.error("Preencha todos os dados do cartão.");
        return;
      }
    }

    setStep("processing");

    try {
      const refCode = Cookies.get("pontea_ref") || localStorage.getItem("pontea_ref") || null;
      
      const payload: any = {
        quiz_response_id: qrId,
        product_id: productId,
        patient_name: patientData?.patient_name || "Paciente",
        patient_email: patientData?.patient_email || undefined,
        patient_phone: patientData?.patient_phone || "00000000000",
        patient_cpf: cpf.replace(/\D/g, ""),
        billing_cycle: cycle,
        payment_method: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
        shipping_address: address?.street ? `${address.street}, ${address.number} ${address.complement || ''}`.trim() : undefined,
        shipping_city: address?.city || undefined,
        shipping_state: address?.state || undefined,
        shipping_zip: address?.cep || undefined,
        ref_code: refCode
      };

      if (paymentMethod === "credit_card") {
        const [expiryMonth, expiryYear] = creditCard.expiry.split("/");
        payload.credit_card = {
          holderName: creditCard.holderName,
          number: creditCard.number.replace(/\D/g, ""),
          expiryMonth: expiryMonth?.trim(),
          expiryYear: expiryYear?.trim(),
          ccv: creditCard.ccv
        };
        payload.credit_card_holder = {
          name: creditCard.holderName,
          email: patientData?.patient_email || "",
          cpfCnpj: cpf.replace(/\D/g, ""),
          postalCode: address?.cep || "",
          addressNumber: address?.number || "",
          phone: patientData?.patient_phone || ""
        };
        payload.remote_ip = "127.0.0.1";
      }

      const response = await fetch('https://bouaarijeoqswyigjfca.supabase.co/functions/v1/create-treatment-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error || !data.success) {
        throw new Error(data.error || "Erro ao processar pagamento.");
      }

      if (paymentMethod === "pix") {
        setPixData({ 
          qrCode: data.pix_qr_code, 
          payload: data.pix_payload, 
          orderId: data.order_id,
          value: data.value || price
        });
        setStep("pix_payment");
      } else {
        if (data.payment_status === "paid" || data.payment_status === "awaiting_review") {
          setStep("success");
        } else {
          toast.error("O pagamento com cartão foi recusado ou está pendente.");
          setStep("checkout");
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao processar pedido. Tente novamente.");
      setStep("checkout");
    }
  };

  if (!location.state) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (step === "pix_payment" && pixData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento via PIX</h2>
          <p className="text-slate-600 mb-6">
            Escaneie o QR Code ou cole o código no app do seu banco
          </p>
          
          <div className="bg-slate-50 p-4 rounded-xl mb-6">
            <img 
              src={`data:image/png;base64,${pixData.qrCode}`} 
              alt="QR Code PIX" 
              className="w-64 h-64 mx-auto object-contain mix-blend-multiply" 
            />
          </div>

          <div className="mb-6">
            <Label className="text-left block mb-2">Código PIX Copia e Cola</Label>
            <div className="flex gap-2">
              <Input value={pixData.payload} readOnly className="bg-slate-50 font-mono text-xs" />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(pixData.payload);
                  toast.success("Código copiado!");
                }}
              >
                Copiar
              </Button>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center mb-6">
            <p className="text-sm text-teal-800 mb-1">Valor do pedido</p>
            <p className="text-2xl font-bold text-teal-900">
              {pixData.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-500 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Aguardando pagamento...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-sm text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Pedido realizado com sucesso!</h2>
          <p className="text-slate-600 mb-6 text-lg">
            Nosso médico analisará suas respostas em até 24 horas. Você receberá uma notificação por e-mail e WhatsApp com o resultado.
          </p>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-teal-800 text-sm mb-8 text-left">
            <strong>O que acontece agora?</strong><br/>
            Se o seu tratamento for aprovado pelo médico, a receita será enviada automaticamente para a farmácia e seu tratamento será entregue no conforto da sua casa.
          </div>
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
            onClick={() => navigate("/")}
          >
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-8">Finalizar Pedido</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Checkout Area */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Dados de Pagamento</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seu CPF</Label>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={cpf} 
                    onChange={handleCpfChange} 
                    maxLength={14}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Forma de Pagamento</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "pix"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-white hover:border-teal-200 text-slate-600"
                  }`}
                >
                  <QrCode className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">PIX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit_card")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "credit_card"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-white hover:border-teal-200 text-slate-600"
                  }`}
                >
                  <CreditCard className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">Cartão de Crédito</span>
                </button>
              </div>

              {paymentMethod === "credit_card" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <Input 
                      placeholder="0000 0000 0000 0000" 
                      value={creditCard.number}
                      onChange={e => setCreditCard({...creditCard, number: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade</Label>
                      <Input 
                        placeholder="MM/AA" 
                        value={creditCard.expiry}
                        onChange={e => setCreditCard({...creditCard, expiry: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input 
                        placeholder="123" 
                        value={creditCard.ccv}
                        onChange={e => setCreditCard({...creditCard, ccv: e.target.value})}
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome no Cartão</Label>
                    <Input 
                      placeholder="Nome como impresso no cartão" 
                      value={creditCard.holderName}
                      onChange={e => setCreditCard({...creditCard, holderName: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-top-4">
                  <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">
                    Ao confirmar o pedido, o QR Code do PIX será gerado para pagamento.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500">Produto</p>
                  <p className="font-semibold text-slate-900">{productName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ciclo de faturamento</p>
                  <p className="font-semibold text-slate-900 capitalize">
                    {cycle === 'monthly' ? 'Mensal' : cycle === 'quarterly' ? 'Trimestral' : 'Semestral'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600">Total a pagar</span>
                  <span className="font-bold text-xl text-teal-600">{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg font-bold"
                onClick={handleCheckout}
                disabled={step === "processing"}
              >
                {step === "processing" ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
