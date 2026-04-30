import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, QrCode, CreditCard, Loader2, Copy } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function TreatmentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();

  const qrId = searchParams.get("qr");
  const productId = searchParams.get("product");
  const cycle = searchParams.get("cycle") || "monthly";

  const [step, setStep] = useState<"checkout" | "processing" | "pix_payment" | "success">("checkout");
  const [cpf, setCpf] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string; orderId: string; value: number } | null>(null);
  const [creditCard, setCreditCard] = useState({ number: "", holderName: "", expiry: "", ccv: "" });
  
  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (!qrId || !productId) {
      toast.error("Sessão de checkout inválida.");
      navigate(`/tratamento/${slug}`);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: quizResponse, error: qrError } = await supabase
          .from("quiz_responses")
          .select("patient_name, patient_email, patient_phone, patient_cpf")
          .eq("id", qrId)
          .single();

        if (qrError || !quizResponse) throw new Error("Quiz não encontrado");

        setPatientData(quizResponse);
        if (quizResponse.patient_cpf) {
          let c = quizResponse.patient_cpf.replace(/\D/g, "");
          if (c.length > 11) c = c.substring(0, 11);
          c = c.replace(/(\d{3})(\d)/, "$1.$2");
          c = c.replace(/(\d{3})(\d)/, "$1.$2");
          c = c.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          setCpf(c);
        }

        const { data: prodData, error: prodError } = await supabase
          .from("treatment_products")
          .select("*")
          .eq("id", productId)
          .single();

        if (prodError || !prodData) throw new Error("Produto não encontrado");
        
        setProductData(prodData);

      } catch (err) {
        console.error(err);
        toast.error("Sessão expirada. Por favor refaça o questionário.");
        navigate(`/tratamento/${slug}/quiz`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, qrId, productId, slug]);

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

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, "$1-$2");
    if (value.length > 9) value = value.substring(0, 9);
    setAddress({ ...address, cep: value });
  };

  const getTotalCents = () => {
    if (!productData) return 0;
    if (cycle === "semiannual") {
      return (productData.price_semiannual_cents || productData.price_monthly_cents || 0) * 6;
    } else if (cycle === "quarterly") {
      return (productData.price_quarterly_cents || productData.price_monthly_cents || 0) * 3;
    }
    return productData.price_monthly_cents || 0;
  };

  const getMonthlyValueCents = () => {
    if (!productData) return 0;
    if (cycle === "semiannual") {
      return productData.price_semiannual_cents || productData.price_monthly_cents || 0;
    } else if (cycle === "quarterly") {
      return productData.price_quarterly_cents || productData.price_monthly_cents || 0;
    }
    return productData.price_monthly_cents || 0;
  };

  const handleCheckout = async () => {
    if (cpf.length < 14) {
      toast.error("Por favor, insira um CPF válido.");
      return;
    }

    if (!address.cep || !address.street || !address.number || !address.city || !address.state) {
      toast.error("Por favor, preencha o endereço de entrega completo.");
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
        price_cents: getTotalCents(), // Send total value upfront
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
          value: data.value || (getTotalCents() / 100)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (step === "pix_payment" && pixData) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center px-5 py-8 pb-32">
        <div className="w-full max-w-md mx-auto">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Pague via PIX</h2>
          <p className="text-slate-600 mb-6 text-center text-sm md:text-base">
            Escaneie o QR Code ou cole o código no seu banco.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl mb-6 flex justify-center border border-slate-200">
            <img 
              src={`data:image/png;base64,${pixData.qrCode}`} 
              alt="QR Code PIX" 
              className="w-56 h-56 md:w-64 md:h-64 object-contain mix-blend-multiply" 
            />
          </div>

          <div className="mb-8">
            <Label className="text-left block mb-2 font-medium text-slate-700">Código PIX Copia e Cola</Label>
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 break-all font-mono text-xs text-slate-600">
                {pixData.payload}
              </div>
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-4 min-h-[56px] flex items-center justify-center gap-2 font-semibold"
                onClick={() => {
                  navigator.clipboard.writeText(pixData.payload);
                  toast.success("Código copiado!");
                }}
              >
                <Copy className="w-5 h-5" /> Copiar Código
              </Button>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center mb-6">
            <p className="text-sm text-teal-800 font-medium mb-1">Valor total a ser cobrado agora</p>
            <p className="text-3xl font-bold text-teal-900">
              {pixData.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-slate-500 animate-pulse bg-slate-50 py-3 rounded-full">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Aguardando pagamento...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-5">
        <div className="w-full max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Pedido realizado!</h2>
          <p className="text-slate-600 mb-6 text-lg">
            Nosso médico analisará suas respostas em até 24 horas. Você receberá uma notificação por e-mail e WhatsApp.
          </p>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 text-teal-800 text-sm mb-8 text-left">
            <strong>O que acontece agora?</strong><br/>
            Se o tratamento for aprovado pelo médico, a receita será enviada à farmácia e seu pedido entregue no conforto da sua casa.
          </div>
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
            onClick={() => navigate("/")}
          >
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 md:py-12 pb-32">
      <div className="container mx-auto px-5 md:px-4 max-w-5xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-8 text-center md:text-left">Finalizar Pedido</h1>
        
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Mobile Order Summary (Top on mobile, Side on desktop) */}
          <div className="md:col-span-1 md:col-start-3 md:row-start-1">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-2">
                <div>
                  <p className="text-sm text-slate-500">Produto</p>
                  <p className="font-semibold text-slate-900">{productData?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ciclo de faturamento</p>
                  <p className="font-semibold text-slate-900 capitalize">
                    {cycle === 'monthly' ? 'Plano Mensal' : cycle === 'quarterly' ? 'Plano Trimestral' : 'Plano Semestral'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ({(getMonthlyValueCents() / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / mês)
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-slate-600 font-medium text-sm">Valor total a ser</span>
                    <span className="text-slate-600 font-medium text-sm">cobrado agora</span>
                  </div>
                  <span className="font-heading font-bold text-2xl text-teal-600">{(getTotalCents() / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              {/* Desktop Checkout Button */}
              <div className="hidden md:block mt-6">
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg font-bold"
                  onClick={handleCheckout}
                  disabled={step === "processing"}
                >
                  {step === "processing" ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
                  ) : `Pagar ${(getTotalCents() / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Checkout Area */}
          <div className="md:col-span-2 md:row-start-1 flex flex-col gap-6">
            
            <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Dados do Paciente</h2>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-slate-600">Seu CPF</Label>
                <Input 
                  type="tel"
                  placeholder="000.000.000-00" 
                  value={cpf} 
                  onChange={handleCpfChange} 
                  maxLength={14}
                  className="w-full py-4 px-4 text-lg bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]"
                />
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Endereço de Entrega</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-slate-600">CEP</Label>
                  <Input type="tel" placeholder="00000-000" className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]" value={address.cep} onChange={handleCepChange} maxLength={9} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-slate-600">Rua / Avenida</Label>
                  <Input className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                </div>
                <div className="flex gap-3 w-full">
                  <div className="flex flex-col gap-1 w-1/3">
                    <Label className="text-sm font-medium text-slate-600">Número</Label>
                    <Input type="tel" className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]" value={address.number} onChange={(e) => setAddress({...address, number: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1 w-2/3">
                    <Label className="text-sm font-medium text-slate-600">Complemento</Label>
                    <Input placeholder="Apto, Bloco..." className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]" value={address.complement} onChange={(e) => setAddress({...address, complement: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <div className="flex flex-col gap-1 w-2/3">
                    <Label className="text-sm font-medium text-slate-600">Cidade</Label>
                    <Input className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1 w-1/3">
                    <Label className="text-sm font-medium text-slate-600">Estado</Label>
                    <Input placeholder="SP" className="w-full py-4 px-4 text-base bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] text-center uppercase" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value.toUpperCase()})} maxLength={2} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Forma de Pagamento</h2>
              
              <div className="flex flex-col md:grid md:grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex items-center justify-start md:flex-col md:justify-center p-4 rounded-2xl border-2 transition-all gap-4 md:gap-2 ${
                    paymentMethod === "pix"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white hover:border-teal-300 text-slate-600"
                  }`}
                >
                  <QrCode className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
                  <span className="font-semibold text-base md:text-sm">PIX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit_card")}
                  className={`flex items-center justify-start md:flex-col md:justify-center p-4 rounded-2xl border-2 transition-all gap-4 md:gap-2 ${
                    paymentMethod === "credit_card"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white hover:border-teal-300 text-slate-600"
                  }`}
                >
                  <CreditCard className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
                  <span className="font-semibold text-base md:text-sm">Cartão de Crédito</span>
                </button>
              </div>

              {paymentMethod === "credit_card" && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-600">Número do Cartão</Label>
                    <Input 
                      type="tel"
                      placeholder="0000 0000 0000 0000" 
                      value={creditCard.number}
                      onChange={e => setCreditCard({...creditCard, number: e.target.value})}
                      className="w-full py-4 px-4 text-lg bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <Label className="text-sm font-medium text-slate-600">Validade</Label>
                      <Input 
                        type="tel"
                        placeholder="MM/AA" 
                        value={creditCard.expiry}
                        onChange={e => setCreditCard({...creditCard, expiry: e.target.value})}
                        className="w-full py-4 px-4 text-lg bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <Label className="text-sm font-medium text-slate-600">CVC</Label>
                      <Input 
                        type="tel"
                        placeholder="123" 
                        value={creditCard.ccv}
                        onChange={e => setCreditCard({...creditCard, ccv: e.target.value})}
                        maxLength={4}
                        className="w-full py-4 px-4 text-lg bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] text-center"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-slate-600">Nome impresso no Cartão</Label>
                    <Input 
                      placeholder="NOME DO TITULAR" 
                      value={creditCard.holderName}
                      onChange={e => setCreditCard({...creditCard, holderName: e.target.value})}
                      className="w-full py-4 px-4 text-lg bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] uppercase"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-top-4">
                  <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm font-medium">
                    Ao confirmar o pedido, o QR Code do PIX será gerado para pagamento.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50">
        <Button 
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
          onClick={handleCheckout}
          disabled={step === "processing"}
        >
          {step === "processing" ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando...</>
          ) : `Pagar ${(getTotalCents() / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
        </Button>
      </div>

    </div>
  );
}
