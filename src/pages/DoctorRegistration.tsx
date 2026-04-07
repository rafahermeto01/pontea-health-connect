import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { specialties } from "@/data/mockDoctors";

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", crm: "", uf: "", specialty: "",
    city: "", phone: "", consultationPrice: "", calendarLink: "", isOnline: false, bio: "",
  });

  const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, user_type: 'doctor' }, emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      const slug = form.fullName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { error: docError } = await supabase.from("doctors").insert({
        user_id: userId,
        full_name: form.fullName,
        slug,
        crm_number: form.crm,
        crm_state: form.uf,
        specialty: form.specialty,
        bio: form.bio,
        consultation_price: Number(form.consultationPrice) * 100,
        city: form.city,
        state: form.uf,
        phone: form.phone,
        calendar_link: form.calendarLink,
        accepts_online: form.isOnline,
      });
      if (docError) throw docError;

      toast.success("Cadastro realizado com sucesso!");
      navigate("/dashboard/medico");
    } catch (err: any) {
      toast.error(err.message || "Erro no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Cadastro de Médico</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Nome completo</Label><Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
          </div>
          <div><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>CRM</Label><Input value={form.crm} onChange={(e) => update("crm", e.target.value)} required placeholder="123456" /></div>
            <div>
              <Label>UF</Label>
              <Select value={form.uf} onValueChange={(v) => update("uf", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Especialidade</Label>
              <Select value={form.specialty} onValueChange={(v) => update("specialty", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-0000" /></div>
            <div><Label>Valor da Consulta (R$)</Label><Input type="number" value={form.consultationPrice} onChange={(e) => update("consultationPrice", e.target.value)} required /></div>
          </div>
          <div><Label>Link da Agenda (Cal.com / Calendly)</Label><Input value={form.calendarLink} onChange={(e) => update("calendarLink", e.target.value)} placeholder="https://cal.com/..." /></div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.isOnline} onChange={(e) => update("isOnline", e.target.checked)} className="accent-primary" />
            Aceito teleconsulta
          </label>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} placeholder="Conte sobre sua experiência..." /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Cadastrando..." : "Criar Conta"}</Button>
        </form>
      </div>
    </div>
  );
}
