import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentFrequency() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrId = searchParams.get("qr");
  const productId = searchParams.get("product");

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [cycle, setCycle] = useState<string>("quarterly");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!qrId || !productId) {
          toast.error("Sessão inválida.");
          navigate("/");
          return;
        }

        const { data, error } = await supabase
          .from("treatment_products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error || !data) throw new Error("Produto não encontrado");

        setProduct(data);
        
        // Default selection logic based on available cycles
        if (data.price_quarterly_cents) {
          setCycle("quarterly");
        } else if (data.price_semiannual_cents) {
          setCycle("semiannual");
        } else {
          setCycle("monthly");
        }

      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [qrId, productId, navigate]);

  const handleNextStep = () => {
    navigate(`/tratamento/${slug}/checkout?qr=${qrId}&product=${productId}&cycle=${cycle}`);
  };

  const getMonthlyEquivalent = (cycleType: string) => {
    if (!product) return 0;
    switch (cycleType) {
      case "monthly":
        return (product.price_monthly_cents || 0) / 100;
      case "quarterly":
        return (product.price_quarterly_cents || product.price_monthly_cents || 0) / 100;
      case "semiannual":
        return (product.price_semiannual_cents || product.price_monthly_cents || 0) / 100;
      default:
        return 0;
    }
  };

  const getTotalUpfront = () => {
    if (!product) return 0;
    switch (cycle) {
      case "monthly":
        return (product.price_monthly_cents || 0) / 100;
      case "quarterly":
        return ((product.price_quarterly_cents || product.price_monthly_cents || 0) * 3) / 100;
      case "semiannual":
        return ((product.price_semiannual_cents || product.price_monthly_cents || 0) * 6) / 100;
      default:
        return 0;
    }
  };

  const hasSemiannual = product?.price_semiannual_cents > 0;
  const hasQuarterly = product?.price_quarterly_cents > 0;
  const hasOnlyMonthly = !hasSemiannual && !hasQuarterly;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-40 pt-6">
      <div className="container mx-auto px-4 max-w-lg">
        
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Frequência do plano
          </h1>
          <p className="text-slate-600 text-sm">
            Escolha o plano que melhor se adapta à sua rotina.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {hasSemiannual && (
            <div 
              onClick={() => setCycle('semiannual')}
              className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all ${cycle === 'semiannual' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="absolute top-0 right-4 -translate-y-1/2">
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full px-3 py-1 border border-emerald-200">
                  Maior desconto
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">6 meses</h3>
                  <p className="text-sm text-slate-500">Cobrado a cada 6 meses</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-slate-900">
                    {getMonthlyEquivalent('semiannual').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    <span className="text-sm font-normal text-slate-500">/mês</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {(hasQuarterly || hasOnlyMonthly) && (
            <div 
              onClick={() => setCycle(hasQuarterly ? 'quarterly' : 'monthly')}
              className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${cycle === (hasQuarterly ? 'quarterly' : 'monthly') ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{hasQuarterly ? '3 meses' : 'Mensal'}</h3>
                  <p className="text-sm text-slate-500">{hasQuarterly ? 'Cobrado a cada 3 meses' : 'Cobrado mensalmente'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-slate-900">
                    {getMonthlyEquivalent(hasQuarterly ? 'quarterly' : 'monthly').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    <span className="text-sm font-normal text-slate-500">/mês</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits List */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Descomplicado, flexível e com suporte</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">Pause, ajuste ou cancele quando quiser</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">Suporte clínico ilimitado via WhatsApp</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">Entrega grátis no seu endereço</span>
            </li>
          </ul>
        </div>

        {/* Comparison Table */}
        {!hasOnlyMonthly && (
          <div className="mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold text-center py-2 border-b border-emerald-100">
              Oferta por tempo limitado em todos os planos
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 mb-4 text-center">Compare as parcelas</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">Parcelas</th>
                    {hasQuarterly && <th className="text-right py-2 font-bold text-slate-900">3 meses</th>}
                    {hasSemiannual && (
                      <th className="text-right py-2 font-bold text-slate-900 flex flex-col items-end justify-center gap-1">
                        <span>6 meses</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block">Maior Desconto</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 text-slate-700">Valor por mês</td>
                    {hasQuarterly && (
                      <td className="text-right py-3 font-semibold text-slate-900">
                        {getMonthlyEquivalent('quarterly').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    )}
                    {hasSemiannual && (
                      <td className="text-right py-3 font-semibold text-teal-600">
                        {getMonthlyEquivalent('semiannual').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 flex flex-col gap-3 md:items-center">
          <div className="flex justify-between items-center text-sm px-2 md:w-full md:max-w-lg">
            <span className="text-slate-600 font-medium">Total cobrado agora:</span>
            <span className="font-bold text-lg text-slate-900">
              {getTotalUpfront().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="text-center w-full px-2 md:max-w-lg">
            <p className="text-xs text-slate-500 mb-3">
              {cycle === 'semiannual' ? 'Pelos 6 primeiros meses.' : cycle === 'quarterly' ? 'Pelos 3 primeiros meses.' : 'Valor da mensalidade.'}
            </p>
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
              onClick={handleNextStep}
            >
              Continuar
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
