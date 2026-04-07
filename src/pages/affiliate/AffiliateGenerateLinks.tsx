import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Copy, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AffiliateData } from "@/hooks/useAffiliate";

const BASE_URL = "pontea.com.br";

export default function AffiliateGenerateLinks() {
  const { affiliate } = useOutletContext<{ affiliate: AffiliateData }>();
  const refCode = affiliate.ref_code ?? "";

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedSpec, setSelectedSpec] = useState("none");
  const [selectedCity, setSelectedCity] = useState("none");

  useEffect(() => {
    async function load() {
      const [specRes, cityRes] = await Promise.all([
        supabase.from("doctors").select("specialty").eq("is_active", true).not("specialty", "is", null).order("specialty"),
        supabase.from("doctors").select("city").eq("is_active", true).not("city", "is", null).order("city"),
      ]);
      if (specRes.data) setSpecialties([...new Set(specRes.data.map((d) => d.specialty).filter(Boolean))] as string[]);
      if (cityRes.data) setCities([...new Set(cityRes.data.map((d) => d.city).filter(Boolean))] as string[]);
    }
    load();
  }, []);

  const mainLink = `${BASE_URL}?ref=${refCode}`;

  const generatedLink = useMemo(() => {
    const hasSpec = selectedSpec !== "none";
    const hasCity = selectedCity !== "none";
    if (!hasSpec && !hasCity) return `${BASE_URL}?ref=${refCode}`;

    const params = new URLSearchParams();
    if (hasSpec) params.set("esp", selectedSpec);
    if (hasCity) params.set("cidade", selectedCity);
    params.set("ref", refCode);
    return `${BASE_URL}/buscar?${params.toString()}`;
  }, [selectedSpec, selectedCity, refCode]);

  const whatsappText = useMemo(() => {
    const hasSpec = selectedSpec !== "none";
    const hasCity = selectedCity !== "none";
    let msg: string;
    if (hasSpec && hasCity) {
      msg = `Precisa de ${selectedSpec} em ${selectedCity}? Encontre os melhores médicos aqui: ${generatedLink}`;
    } else if (hasSpec) {
      msg = `Procurando um bom ${selectedSpec}? Veja aqui: ${generatedLink}`;
    } else {
      msg = `Precisa de médico? Encontre os melhores especialistas aqui: ${generatedLink}`;
    }
    return encodeURIComponent(msg);
  }, [selectedSpec, selectedCity, generatedLink]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      {/* Main link */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Seu link principal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={mainLink} readOnly className="font-mono text-sm" />
            <Button onClick={() => copyToClipboard(mainLink)}><Copy className="h-4 w-4 mr-1" /> Copiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom link generator */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Gerar link personalizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Especialidade (opcional)</label>
              <Select value={selectedSpec} onValueChange={setSelectedSpec}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Cidade (opcional)</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Link gerado</label>
            <div className="flex gap-2">
              <Input value={generatedLink} readOnly className="font-mono text-sm" />
              <Button onClick={() => copyToClipboard(generatedLink)}><Copy className="h-4 w-4 mr-1" /> Copiar</Button>
            </div>
          </div>

          <Button variant="outline" asChild>
            <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar no WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
