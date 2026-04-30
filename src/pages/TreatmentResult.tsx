import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PackageCheck, Syringe, Pill } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentResult() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrId = searchParams.get("qr");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

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

  const handleNextStep = () => {
    if (!selectedProductId) {
      toast.error("Selecione um medicamento para continuar.");
      return;
    }
    
    navigate(`/tratamento/${slug}/frequencia?qr=${qrId}&product=${selectedProductId}`);
  };

  const renderProductImage = (product: any) => {
    if (product.image_url) {
      return <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2 mix-blend-multiply" />;
    }

    const nameLower = product.name.toLowerCase();
    if (nameLower.includes("semaglutida composta") || nameLower.includes("ozempic")) {
      return <div className="w-full h-full bg-teal-50 rounded-xl flex items-center justify-center"><Syringe className="w-8 h-8 text-teal-600" /></div>;
    }
    if (nameLower.includes("tirzepatida") || nameLower.includes("mounjaro")) {
      return <div className="w-full h-full bg-purple-50 rounded-xl flex items-center justify-center"><Syringe className="w-8 h-8 text-purple-600" /></div>;
    }
    if (nameLower.includes("oral") || nameLower.includes("cápsula")) {
      return <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center"><Pill className="w-8 h-8 text-blue-600" /></div>;
    }
    
    return <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center"><PackageCheck className="w-8 h-8 text-slate-400" /></div>;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="w-full bg-rose-500 text-white text-center py-2 text-sm font-semibold tracking-wide">
        🎉 33% de desconto no primeiro pedido!
      </div>

      <div className="container mx-auto px-0 md:px-4 py-6 max-w-2xl">
        <div className="mb-8 text-center px-5">
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-slate-900 mb-3">
            Plano sugerido para o seu caso
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Selecione o medicamento de sua preferência. O plano final será avaliado por um médico especialista.
          </p>
        </div>

        {/* Products */}
        <div className="space-y-4 mb-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              className={`mx-4 p-5 bg-white border rounded-2xl shadow-sm cursor-pointer transition-all flex flex-row items-center text-left ${selectedProductId === product.id ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20' : 'border-slate-200'}`}
              onClick={() => setSelectedProductId(product.id)}
            >
              <div className="w-20 h-20 shrink-0 mr-4">
                {renderProductImage(product)}
              </div>
              <div className="flex-1 flex flex-col items-start justify-center">
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">{product.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-3">{product.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Bottom */}
        <div className="mx-4 mt-8 px-2">
          <p className="text-xs text-slate-400 text-center">
            <strong>Vale lembrar:</strong> O médico definirá a sua prescrição após a avaliação. Se o tratamento não for aprovado, você será totalmente reembolsado. Os medicamentos são manipulados por farmácias certificadas.
          </p>
        </div>

        {/* Fixed Bottom CTA for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 md:static md:shadow-none md:border-none md:p-0 md:mx-4 md:mt-8">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
            onClick={handleNextStep}
            disabled={!selectedProductId}
          >
            Continuar
          </Button>
        </div>

      </div>
    </div>
  );
}
