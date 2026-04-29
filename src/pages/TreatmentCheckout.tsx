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

  const [step, setStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [cpf, setCpf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  
  // State from previous page
  const { productId, cycle, price, qrId, address, productName } = location.state || {};

  useEffect(() => {
    if (!location.state || !qrId || !productId) {
      toast.error("Sessão de checkout inválida.");
      navigate(`/tratamento/${slug}`);
    }
  }, [location.state, navigate, qrId, productId, slug]);

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

    setStep("processing");

    try {
      // 1. Get affiliate tracking
      const refCode = Cookies.get("pontea_ref");
      
      // 2. Create treatment order
      const { data: orderData, error: orderError } = await supabase
        .from("treatment_orders")
        .insert({
          quiz_response_id: qrId,
          product_id: productId,
          billing_cycle: cycle,
          amount: price,
          status: "awaiting_review",
          payment_method: paymentMethod,
          shipping_address: address,
          customer_cpf: cpf.replace(/\D/g, ""),
          ref_code: refCode || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Mock Payment processing / edge function call
      if (paymentMethod === "pix") {
        // Here we would call the edge function create-treatment-payment
        // For now we simulate success
        await new Promise(r => setTimeout(r, 2000));
        setStep("success");
      } else {
        // Credit card logic
        await new Promise(r => setTimeout(r, 2000));
        setStep("success");
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar pedido. Tente novamente.");
      setStep("checkout");
    }
  };

  if (!location.state) return null;

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
                    <Input placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Validade</Label>
                      <Input placeholder="MM/AA" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome no Cartão</Label>
                    <Input placeholder="Nome como impresso no cartão" />
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
                  <p className="font-semibold text-slate-900 capitalize">{cycle}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600">Total a pagar</span>
                  <span className="font-bold text-xl text-teal-600">R$ {price.toFixed(2)}</span>
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
