import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClipboardList, Package, Stethoscope, Truck, ShieldCheck } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function TreatmentProgram() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Affiliate Tracking
    const ref = searchParams.get("ref");
    if (ref) {
      Cookies.set("pontea_ref", ref, { expires: 30 }); // 30 days expiration
    }

    const fetchProgram = async () => {
      try {
        const { data, error } = await supabase
          .from("treatment_programs")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        setProgram(data);
      } catch (error) {
        console.error("Error fetching program:", error);
        toast.error("Programa de tratamento não encontrado.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProgram();
    }
  }, [slug, searchParams, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!program) {
    return null; // Handled in the catch block
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pb-24 md:pb-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-slate-900 mb-6">
            {program.hero_title || "Descubra o tratamento ideal para você"}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {program.hero_subtitle || "Nossos especialistas avaliarão seu caso e indicarão a melhor abordagem médica, com acompanhamento contínuo e entrega na sua porta."}
          </p>
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg px-8 py-6 h-auto hidden md:inline-flex"
            onClick={() => navigate(`/tratamento/${slug}/quiz`)}
          >
            Começar avaliação gratuita
          </Button>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-slate-900">Como funciona</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div className="bg-teal-100 p-4 rounded-2xl mb-4 text-teal-600">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">1. Questionário médico</h3>
              <p className="text-slate-600">Responda perguntas sobre seu histórico de saúde para passar por uma avaliação médica.</p>
            </div>
            
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div className="bg-teal-100 p-4 rounded-2xl mb-4 text-teal-600">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">2. Recomendação</h3>
              <p className="text-slate-600">Você receberá uma sugestão inicial de tratamento, que poderá ser ajustada pelo médico durante a avaliação.</p>
            </div>
            
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div className="bg-teal-100 p-4 rounded-2xl mb-4 text-teal-600">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">3. Avaliação médica</h3>
              <p className="text-slate-600">Nosso médico endocrinologista avaliará seu caso e indicará o melhor tratamento. A consulta é assíncrona.</p>
            </div>
            
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div className="bg-teal-100 p-4 rounded-2xl mb-4 text-teal-600">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">4. Seu tratamento</h3>
              <p className="text-slate-600">Se houver prescrição, a receita será enviada para uma farmácia credenciada e você receberá em casa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 md:p-8 flex items-start gap-4">
            <div className="text-teal-600 shrink-0 mt-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-teal-900 font-medium md:text-lg">
                Todas as respostas são analisadas individualmente por um médico endocrinologista com CRM ativo. Nosso índice de aprovação é superior a 85% dos casos avaliados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-heading font-bold text-center mb-10 text-slate-900">Perguntas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold text-lg">Como funciona a avaliação?</AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base">
                Você preenche um questionário detalhado sobre sua saúde. Nossos médicos analisam essas informações de forma assíncrona (sem necessidade de chamada de vídeo) para determinar se o tratamento é seguro e adequado para você.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold text-lg">Quem é o médico que avalia?</AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base">
                Sua avaliação será realizada por um médico especialista, geralmente um endocrinologista, devidamente registrado no CRM, garantindo o mais alto padrão de cuidado e segurança.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold text-lg">E se eu não for aprovado?</AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base">
                Se o médico determinar que o tratamento não é indicado ou seguro para o seu perfil, você será informado imediatamente e não haverá cobrança pelo programa ou medicamentos.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold text-lg">Como é feita a entrega?</AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base">
                Caso haja prescrição, trabalhamos com farmácias parceiras que enviam o medicamento diretamente para o seu endereço em embalagem discreta e com controle de temperatura, quando necessário.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold text-lg">Posso cancelar a qualquer momento?</AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base">
                Sim, você tem total liberdade para pausar ou cancelar seu plano de tratamento a qualquer momento, sem taxas ocultas, entrando em contato com nosso suporte.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Mobile Fixed CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50">
        <Button
          size="lg"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg py-6 h-auto"
          onClick={() => navigate(`/tratamento/${slug}/quiz`)}
        >
          Começar avaliação gratuita
        </Button>
      </div>
    </div>
  );
}
