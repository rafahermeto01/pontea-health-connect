import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2, Save } from "lucide-react";

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const specialtiesList = ["Cardiologia", "Dermatologia", "Endocrinologia", "Ginecologia", "Neurologia", "Pediatria", "Psiquiatria", "Nutrição", "Psicologia", "Fisioterapia"];

export default function DoctorProfileEdit() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    full_name: doctor.full_name || "",
    avatar_url: doctor.avatar_url || "",
    specialty: doctor.specialty || "",
    crm_number: doctor.crm_number || "",
    crm_state: doctor.crm_state || "",
    city: doctor.city || "",
    state: doctor.state || "",
    consultation_price: doctor.consultation_price ? (doctor.consultation_price / 100).toString() : "",
    phone: doctor.phone || "",
    calendar_link: doctor.calendar_link || "",
    accepts_online: doctor.accepts_online || false,
    accepts_presential: doctor.accepts_presential || false,
    bio: doctor.bio || "",
    education: doctor.education || "",
    experience_years: doctor.experience_years ? doctor.experience_years.toString() : "",
  });

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${doctor.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      update("avatar_url", data.publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao fazer upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from("doctors").update({
        full_name: form.full_name,
        avatar_url: form.avatar_url,
        specialty: form.specialty,
        crm_number: form.crm_number,
        crm_state: form.crm_state,
        city: form.city,
        state: form.state,
        consultation_price: Number(form.consultation_price) * 100,
        phone: form.phone,
        calendar_link: form.calendar_link,
        accepts_online: form.accepts_online,
        accepts_presential: form.accepts_presential,
        bio: form.bio,
        education: form.education,
        experience_years: form.experience_years ? Number(form.experience_years) : null
      }).eq("id", doctor.id);

      if (error) throw error;
      
      toast.success("Perfil atualizado com sucesso!");
      navigate(0); // refresh layout context
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground">Atualize as suas informações de atendimento.</p>
      </div>

      <div className="flex items-center gap-6 rounded-lg border border-border bg-card p-6">
        <div className="relative h-20 w-20 shrink-0">
          <img 
            src={form.avatar_url || "/placeholder.svg"} 
            alt="Avatar" 
            className="h-full w-full rounded-full object-cover ring-2 ring-primary/20" 
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">Foto de Perfil</h3>
          <p className="text-xs text-muted-foreground mb-4">Recomendado: 400x400px (JPG, PNG).</p>
          <div className="relative">
            <Button variant="outline" size="sm" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> Enviar Foto
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Nome Completo</Label>
            <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
          </div>
          <div>
            <Label>Especialidade</Label>
            <Select value={form.specialty} onValueChange={v => update("specialty", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {specialtiesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Número do CRM/Registro</Label>
            <Input value={form.crm_number} onChange={e => update("crm_number", e.target.value)} required />
          </div>
          <div>
            <Label>Estado do CRM/Registro</Label>
            <Select value={form.crm_state} onValueChange={v => update("crm_state", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Cidade (Atuação)</Label>
            <Input value={form.city} onChange={e => update("city", e.target.value)} required />
          </div>
          <div>
            <Label>UF (Atuação)</Label>
            <Select value={form.state} onValueChange={v => update("state", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>Valor da Consulta (R$)</Label>
            <Input type="number" value={form.consultation_price} onChange={e => update("consultation_price", e.target.value)} required />
          </div>
        </div>

        <div>
          <Label>Link Público de Agendamento (Cal.com, Calendly, WhatsApp)</Label>
          <Input value={form.calendar_link} onChange={e => update("calendar_link", e.target.value)} placeholder="https://cal.com/seu-perfil" />
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.accepts_online} onChange={e => update("accepts_online", e.target.checked)} className="h-4 w-4 accent-primary" />
            Aceito Teleconsulta (Online)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.accepts_presential} onChange={e => update("accepts_presential", e.target.checked)} className="h-4 w-4 accent-primary" />
            Aceito Presencial
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
          <div>
            <Label>Formação Principal</Label>
            <Input value={form.education} onChange={e => update("education", e.target.value)} placeholder="Ex: Formado pela USP" />
          </div>
          <div>
            <Label>Anos de Experiência</Label>
            <Input type="number" value={form.experience_years} onChange={e => update("experience_years", e.target.value)} placeholder="Ex: 5" />
          </div>
        </div>

        <div>
          <Label>Biografia (Sobre você)</Label>
          <Textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={5} placeholder="Fale um pouco sobre a sua abordagem..." />
        </div>

        <Button type="submit" disabled={loading || uploading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
}
