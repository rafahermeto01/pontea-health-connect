import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const niches = ["Fitness", "Saúde", "Nutrição", "Bem-estar", "Emagrecimento", "Lifestyle", "Esportes"];

export default function AffiliateRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", cpfCnpj: "", niche: "", instagram: "", followers: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      const { error: affError } = await supabase.from("affiliates").insert({
        id: userId,
        user_id: userId,
        full_name: form.fullName,
        document: form.cpfCnpj,
        niche: form.niche,
        instagram_handle: form.instagram,
        followers_count: Number(form.followers) || null,
        ref_code: form.fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      });
      if (affError) throw affError;

      toast.success("Cadastro realizado! Verifique seu email.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Erro no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Cadastro de Afiliado</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nome completo</Label><Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
          <div><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} /></div>
          <div><Label>CPF/CNPJ</Label><Input value={form.cpfCnpj} onChange={(e) => update("cpfCnpj", e.target.value)} required /></div>
          <div>
            <Label>Nicho</Label>
            <Select value={form.niche} onValueChange={(v) => update("niche", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{niches.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} required placeholder="@seuinstagram" /></div>
          <div><Label>Número de Seguidores</Label><Input type="number" value={form.followers} onChange={(e) => update("followers", e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Cadastrando..." : "Criar Conta"}</Button>
        </form>
      </div>
    </div>
  );
}
