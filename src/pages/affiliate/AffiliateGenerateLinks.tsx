import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SITE_URL } from "@/config";

export default function AffiliateGenerateLinks() {
  const { affiliate } = useOutletContext<{ affiliate: any }>();
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  useEffect(() => {
    async function loadFilters() {
      const { data } = await supabase
        .from("doctors")
        .select("specialty, city")
        .eq("is_active", true);

      if (data) {
        const uniqueSpecialties = Array.from(new Set(data.map((d: any) => d.specialty).filter(Boolean))).sort() as string[];
        const uniqueCities = Array.from(new Set(data.map((d: any) => d.city).filter(Boolean))).sort() as string[];

        setSpecialties(uniqueSpecialties);
        setCities(uniqueCities);
      }
    }
    loadFilters();
  }, []);

  const refCode = affiliate.ref_code;
  const baseUrl = SITE_URL;
  
  const mainLink = `${baseUrl}/buscar?ref=${refCode}`;
  
  let generatedLink = mainLink;
  if (selectedSpecialty !== "all" || selectedCity !== "all") {
    const params = new URLSearchParams();
    if (selectedSpecialty !== "all") params.append("esp", selectedSpecialty);
    if (selectedCity !== "all") params.append("cidade", selectedCity);
    params.append("ref", refCode);
    generatedLink = `${baseUrl}/buscar?${params.toString()}`;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  const getWhatsAppText = () => {
    let msg = "";
    if (selectedSpecialty !== "all" && selectedCity !== "all") {
      msg = `Precisa de ${selectedSpecialty} em ${selectedCity}? Encontre os melhores médicos aqui: ${generatedLink}`;
    } else if (selectedSpecialty !== "all") {
      msg = `Procurando um bom ${selectedSpecialty}? Veja aqui: ${generatedLink}`;
    } else {
      msg = `Precisa de médico? Encontre os melhores especialistas aqui: ${generatedLink}`;
    }
    return encodeURIComponent(msg);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${getWhatsAppText()}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Gerar Links</h2>
        <p className="text-slate-500 mt-1">Crie links personalizados para indicar a plataforma.</p>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="font-heading text-lg font-semibold text-slate-900">Link do Marketplace</CardTitle>
          <CardDescription className="text-slate-500 mt-1">Use este link para convidar pacientes diretamente para o marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex gap-3 items-center">
            <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 font-mono text-sm truncate">
              {mainLink}
            </div>
            <Button onClick={() => copyToClipboard(mainLink)} className="bg-teal-600 text-white rounded-xl hover:bg-teal-700 h-14 px-6 shadow-sm">
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="font-heading text-lg font-semibold text-slate-900">Gerar link personalizado</CardTitle>
          <CardDescription className="text-slate-500 mt-1">Direcione seu público diretamente para médicos específicos de uma localização.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Especialidade (Opcional)</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-12 focus:ring-2 focus:ring-teal-500">
                  <SelectValue placeholder="Todas as especialidades" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl shadow-lg">
                  <SelectItem value="all">Todas as especialidades</SelectItem>
                  {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Cidade (Opcional)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-12 focus:ring-2 focus:ring-teal-500">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-xl shadow-lg">
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Preview do Link</Label>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-teal-600 break-all font-mono text-sm">{generatedLink}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => copyToClipboard(generatedLink)} className="bg-teal-600 text-white rounded-xl hover:bg-teal-700 h-12 shadow-sm font-medium px-6">
              <Copy className="mr-2 h-4 w-4" /> Copiar Link
            </Button>
            <Button onClick={shareWhatsApp} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 shadow-sm font-medium px-6">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar no WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
