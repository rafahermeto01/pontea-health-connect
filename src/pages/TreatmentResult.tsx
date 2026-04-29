import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, CheckCircle2, ChevronDown, PackageCheck, Stethoscope, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentResult() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrId = searchParams.get("qr");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cycle, setCycle] = useState<string>("trimestral");

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

        // Fetch quiz response to get program_id
        const { data: qrData, error: qrError } = await supabase
          .from("quiz_responses")
          .select("program_id")
          .eq("id", qrId)
          .single();

        if (qrError || !qrData) throw new Error("Quiz response not found");

        // Fetch products
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

  // Price calculations based on cycle
  const getCyclePrice = () => {
    if (!selectedProduct) return 0;
    const basePrice = selectedProduct.price;
    switch (cycle) {
      case "mensal":
        return basePrice;
      case "trimestral":
        return basePrice * 0.9; // 10% discount
      case "semestral":
        return basePrice * 0.8; // 20% discount
      default:
        return basePrice;
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
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Banner */}
      <div className="bg-coral-500 bg-rose-500 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide">
        🎉 33% de desconto no primeiro pedido!
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Plano sugerido para o seu caso
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            O plano será avaliado por um médico para diagnóstico e prescrição do tratamento. Esta é uma sugestão inicial e poderá ser ajustada durante a avaliação médica.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6 mb-10 flex gap-4">
          <Info className="text-blue-600 shrink-0 mt-1" />
          <div className="text-sm text-blue-900 space-y-2">
            <p><strong>Importante:</strong> Essa é uma sugestão de tratamento, o médico que definirá a sua prescrição.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>O médico poderá alterar os medicamentos após a avaliação.</li>
              <li>Se o tratamento não for necessário, o pedido será cancelado e você será reembolsado.</li>
              <li>Os medicamentos são manipulados por farmácias credenciadas pela Anvisa.</li>
            </ul>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-bold text-slate-900">Medicamentos sugeridos</h2>
          {products.map((product) => (
            <div 
              key={product.id} 
              className={`bg-white border rounded-2xl p-4 md:p-6 cursor-pointer transition-all ${selectedProductId === product.id ? 'border-teal-500 ring-1 ring-teal-500 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}
              onClick={() => setSelectedProductId(product.id)}
            >
              <div className="flex gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <PackageCheck className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg md:text-xl text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-slate-600 text-sm md:text-base mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 line-through text-sm">R$ {product.price.toFixed(2)}/mês</span>
                    <span className="font-bold text-lg text-teal-600">R$ {(product.price * 0.9).toFixed(2)}/mês*</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cycle Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Resumo do seu tratamento</h2>
          <RadioGroup value={cycle} onValueChange={setCycle} className="space-y-4">
            
            <Label htmlFor="trimestral" className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${cycle === 'trimestral' ? 'bg-teal-50 border-teal-500' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <RadioGroupItem value="trimestral" id="trimestral" />
                <div>
                  <span className="font-semibold text-slate-900 block">Plano Trimestral</span>
                  <span className="text-sm text-slate-500">Cobrado a cada 3 meses</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="font-bold text-lg text-slate-900 block">R$ {(selectedProduct?.price * 0.9).toFixed(2)} <span className="text-sm font-normal text-slate-500">/mês</span></span>
                <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">Economize 10%</span>
              </div>
            </Label>

            <Label htmlFor="mensal" className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${cycle === 'mensal' ? 'bg-teal-50 border-teal-500' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <RadioGroupItem value="mensal" id="mensal" />
                <div>
                  <span className="font-semibold text-slate-900 block">Plano Mensal</span>
                  <span className="text-sm text-slate-500">Cobrado mensalmente</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="font-bold text-lg text-slate-900 block">R$ {selectedProduct?.price.toFixed(2)} <span className="text-sm font-normal text-slate-500">/mês</span></span>
              </div>
            </Label>

            <Label htmlFor="semestral" className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${cycle === 'semestral' ? 'bg-teal-50 border-teal-500' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <RadioGroupItem value="semestral" id="semestral" />
                <div>
                  <span className="font-semibold text-slate-900 block">Plano Semestral</span>
                  <span className="text-sm text-slate-500">Cobrado a cada 6 meses</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="font-bold text-lg text-slate-900 block">R$ {(selectedProduct?.price * 0.8).toFixed(2)} <span className="text-sm font-normal text-slate-500">/mês</span></span>
                <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">Maior economia (20%)</span>
              </div>
            </Label>

          </RadioGroup>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Endereço de entrega</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input placeholder="00000-000" value={address.cep} onChange={handleCepChange} maxLength={9} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rua / Avenida</Label>
              <Input value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={address.number} onChange={(e) => setAddress({...address, number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input placeholder="Apto, Bloco..." value={address.complement} onChange={(e) => setAddress({...address, complement: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input placeholder="SP" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} maxLength={2} />
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA for Mobile / Inline for Desktop */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 md:static md:bg-transparent md:border-none md:p-0">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg md:shadow-none"
            onClick={handleStartTreatment}
          >
            Iniciar tratamento — R$ {getCyclePrice().toFixed(2)}/mês
          </Button>
        </div>

        {/* Next Steps */}
        <div className="py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Próximos passos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border text-center">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Plano de tratamento</h3>
              <p className="text-sm text-slate-600">Revise e adquira a sugestão inicial de plano para o seu caso.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border text-center">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Avaliação médica</h3>
              <p className="text-sm text-slate-600">Um médico especialista avaliará detalhadamente suas informações.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border text-center">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Inicie o tratamento</h3>
              <p className="text-sm text-slate-600">O médico garantirá a melhor prescrição e você recebe o tratamento em casa.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="pb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Dúvidas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full bg-white border rounded-2xl p-2">
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-4 font-semibold">Como é o tratamento?</AccordionTrigger>
              <AccordionContent className="px-4 text-slate-600">
                O tratamento envolve o uso de medicamentos prescritos pelo seu médico, acompanhado de orientações sobre estilo de vida. O acompanhamento é contínuo para garantir os melhores resultados.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="px-4 font-semibold">Como funciona a prescrição?</AccordionTrigger>
              <AccordionContent className="px-4 text-slate-600">
                A prescrição é feita após a análise do seu questionário por um médico. Caso aprovado, a receita é gerada eletronicamente e encaminhada para a farmácia parceira.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-4 font-semibold">Por que um plano recorrente?</AccordionTrigger>
              <AccordionContent className="px-4 text-slate-600">
                Tratamentos médicos muitas vezes exigem consistência. O plano recorrente garante que você não fique sem a medicação, recebendo-a no conforto da sua casa antes que a anterior acabe.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="px-4 font-semibold">Como é feita a entrega?</AccordionTrigger>
              <AccordionContent className="px-4 text-slate-600">
                A entrega é feita por transportadoras parceiras em embalagem discreta. Medicamentos que exigem controle de temperatura são enviados em embalagens térmicas especiais.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </div>
  );
}
