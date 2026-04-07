import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const baseUrl = "https://pontea.com.br";
  
  const mainLink = `${baseUrl}?ref=${refCode}`;
  
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
    <div className="space-y-6 max-w-4xl text-slate-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Gerar Links</h2>
        <p className="text-slate-400">Crie links personalizados para indicar a plataforma.</p>
      </div>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Seu link principal</CardTitle>
          <CardDescription className="text-slate-400">Use este link para convidar pacientes diretamente para a plataforma principal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-[#0F172A] p-3 rounded-md border border-slate-700 text-slate-300 font-mono text-sm truncate">
              {mainLink}
            </div>
            <Button onClick={() => copyToClipboard(mainLink)} className="bg-[#0D9488] hover:bg-[#0f766e] text-white">
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Gerar link personalizado</CardTitle>
          <CardDescription className="text-slate-400">Direcione seu público diretamente para médicos específicos de uma localização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Especialidade (Opcional)</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-200">
                  <SelectValue placeholder="Todas as especialidades" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-200">
                  <SelectItem value="all">Todas as especialidades</SelectItem>
                  {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-200">Cidade (Opcional)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-[#0F172A] border-slate-700 text-slate-200">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-slate-700 text-slate-200">
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-200">Preview do Link</Label>
            <div className="bg-[#0F172A] p-4 rounded-md border border-slate-700">
              <p className="text-teal-400 break-all font-mono text-sm">{generatedLink}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => copyToClipboard(generatedLink)} className="bg-[#0D9488] hover:bg-[#0f766e] text-white">
              <Copy className="mr-2 h-4 w-4" /> Copiar Link
            </Button>
            <Button onClick={shareWhatsApp} className="bg-[#22C55E] hover:bg-[#16a34a] text-white font-medium">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar no WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
