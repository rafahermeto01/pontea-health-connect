import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, CheckCircle2, PackageCheck, Stethoscope, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentResult() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrId = searchParams.get("qr");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cycle, setCycle] = useState<string>("quarterly");

  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!qrId) {
          toast.error("Resposta não encontrada.");
          navigate("/");
          return;
        }

        const { data: qrData, error: qrError } = await supabase
          .from("quiz_responses")
          .select("program_id")
          .eq("id", qrId)
          .single();

        if (qrError || !qrData) throw new Error("Quiz response not found");

        const { data: prodData, error: prodError } = await supabase
          .from("treatment_products")
          .select("*")
          .eq("program_id", qrData.program_id)
          .eq("is_active", true)
          .order("sort_order");

        if (prodError) throw prodError;

        setProducts(prodData || []);
        if (prodData && prodData.length > 0) {
          setSelectedProductId(prodData[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar resultados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [qrId, navigate]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const getCyclePrice = () => {
    if (!selectedProduct) return 0;
    switch (cycle) {
      case "monthly":
        return (selectedProduct.price_monthly_cents || 0) / 100;
      case "quarterly":
        return (selectedProduct.price_quarterly_cents || selectedProduct.price_monthly_cents || 0) / 100;
      case "semiannual":
        return (selectedProduct.price_semiannual_cents || selectedProduct.price_monthly_cents || 0) / 100;
      default:
        return (selectedProduct.price_monthly_cents || 0) / 100;
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, "$1-$2");
    if (value.length > 9) value = value.substring(0, 9);
    setAddress({ ...address, cep: value });
  };

  const handleStartTreatment = () => {
    if (!address.cep || !address.street || !address.number || !address.city || !address.state) {
      toast.error("Por favor, preencha o endereço de entrega.");
      return;
    }
    
    navigate(`/tratamento/${slug}/checkout`, {
      state: {
        productId: selectedProductId,
        cycle,
        price: getCyclePrice(),
        qrId,
        address,
        productName: selectedProduct?.name
      }
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Top Banner */}
      <div className="w-full bg-rose-500 text-white text-center py-2 text-sm font-semibold tracking-wide">
        🎉 33% de desconto no primeiro pedido!
      </div>

      <div className="container mx-auto px-0 md:px-4 py-6 max-w-4xl">
        <div className="mb-8 text-center px-5">
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            Plano sugerido para o seu caso
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            O plano será avaliado por um médico para diagnóstico e prescrição. Esta sugestão inicial poderá ser ajustada.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mx-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 mb-8 flex gap-3 flex-col md:flex-row items-start">
          <Info className="text-amber-600 shrink-0 mt-0.5 w-5 h-5" />
          <div className="space-y-2">
            <p className="font-semibold">Vale lembrar:</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-800">
              <li>O médico definirá a sua prescrição após a avaliação.</li>
              <li>Se o tratamento não for aprovado, você será totalmente reembolsado.</li>
              <li>Os medicamentos são manipulados por farmácias certificadas.</li>
            </ul>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mx-4">Medicamentos sugeridos</h2>
          {products.map((product) => (
            <div 
              key={product.id} 
              className={`mx-4 p-5 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col items-center text-center md:flex-row md:text-left ${selectedProductId === product.id ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20' : 'border-slate-200'}`}
              onClick={() => setSelectedProductId(product.id)}
            >
              <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 mb-4 md:mb-0 md:mr-5">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                ) : (
                  <PackageCheck className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 flex flex-col items-center md:items-start">
                <h3 className="font-semibold text-lg text-slate-900 mb-1">{product.name}</h3>
                <p className="text-slate-500 text-sm mb-3 line-clamp-2 px-2 md:px-0">{product.description}</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-teal-600">{((product.price_monthly_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</span>
                  <span className="text-slate-400 text-sm line-through">{(((product.price_monthly_cents || 0) * 1.5) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cycle Selection */}
        <div className="mx-4 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Resumo do seu tratamento</h2>
          <RadioGroup value={cycle} onValueChange={setCycle} className="flex flex-col gap-3">
            
            {selectedProduct?.price_quarterly_cents && (
              <Label htmlFor="quarterly" className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${cycle === 'quarterly' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start gap-3 w-full">
                  <RadioGroupItem value="quarterly" id="quarterly" className="mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="font-semibold text-slate-900 text-base">Plano Trimestral</span>
                      <span className="inline-flex bg-teal-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Recomendado</span>
                    </div>
                    <span className="text-sm text-slate-500 block mb-2">Cobrado a cada 3 meses</span>
                    <span className="font-bold text-lg text-slate-900">{((selectedProduct.price_quarterly_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-sm font-normal text-slate-500">/mês</span></span>
                  </div>
                </div>
              </Label>
            )}

            <Label htmlFor="monthly" className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${cycle === 'monthly' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start gap-3 w-full">
                <RadioGroupItem value="monthly" id="monthly" className="mt-1 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-slate-900 text-base block mb-1">Plano Mensal</span>
                  <span className="text-sm text-slate-500 block mb-2">Cobrado mensalmente</span>
                  <span className="font-bold text-lg text-slate-900">{((selectedProduct?.price_monthly_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-sm font-normal text-slate-500">/mês</span></span>
                </div>
              </div>
            </Label>

            {selectedProduct?.price_semiannual_cents && (
              <Label htmlFor="semiannual" className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${cycle === 'semiannual' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start gap-3 w-full">
                  <RadioGroupItem value="semiannual" id="semiannual" className="mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="font-semibold text-slate-900 text-base">Plano Semestral</span>
                      <span className="inline-flex bg-green-100 text-green-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Maior Economia</span>
                    </div>
                    <span className="text-sm text-slate-500 block mb-2">Cobrado a cada 6 meses</span>
                    <span className="font-bold text-lg text-slate-900">{((selectedProduct.price_semiannual_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span className="text-sm font-normal text-slate-500">/mês</span></span>
                  </div>
                </div>
              </Label>
            )}

          </RadioGroup>
        </div>

        {/* Shipping Address */}
        <div className="mx-4 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Endereço de entrega</h2>
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

        {/* Next Steps */}
        <div className="mx-4 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Próximos passos</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Avaliação médica</h3>
                <p className="text-xs text-slate-600">Um especialista avaliará seu perfil.</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Receba em casa</h3>
                <p className="text-xs text-slate-600">Tratamento entregue com descrição.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 md:static md:shadow-none md:border-none md:p-0 md:mx-4">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
            onClick={handleStartTreatment}
          >
            Iniciar tratamento — {getCyclePrice().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
          </Button>
        </div>

      </div>
    </div>
  );
}
