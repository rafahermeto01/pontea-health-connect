import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";

export default function DoctorAppointments() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    date: "",
    time: "",
    price_cents: doctor.consultation_price?.toString() || "0",
    ref_code: "",
  });

  const fetchAppointments = async () => {
    setLoading(true);
    const { data: apps, error } = await supabase
      .from("appointments")
      .select("*, affiliates(ref_code)")
      .eq("doctor_id", doctor.id)
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar agendamentos");
    } else {
      setAppointments(apps || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [doctor.id]);

  const updateStatus = async (appointment: any, newStatus: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    if (newStatus === "completed" && appointment.affiliate_id) {
      // Credit affiliate direct frontend approach as requested
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id, balance_cents, total_earned_cents")
        .eq("id", appointment.affiliate_id)
        .single();

      if (affiliate && appointment.affiliate_commission_cents) {
        await supabase
          .from("affiliates")
          .update({
            balance_cents: (affiliate.balance_cents || 0) + appointment.affiliate_commission_cents,
            total_earned_cents: (affiliate.total_earned_cents || 0) + appointment.affiliate_commission_cents,
          })
          .eq("id", affiliate.id);
      }
    }

    toast.success(`Consulta atualizada para ${newStatus}`);
    fetchAppointments();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none shadow-none">Pendente</Badge>;
      case "completed": return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none">Concluído</Badge>;
      case "cancelled": return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none shadow-none">Cancelado</Badge>;
      case "no_show": return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none shadow-none">Faltou</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let affiliate_id = null;
      let ref_code = null;
      let commission_cents = 0;
      const priceVal = parseInt(form.price_cents, 10);

      if (form.ref_code.trim()) {
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id, ref_code, commission_rate")
          .eq("ref_code", form.ref_code.trim().toLowerCase())
          .eq("status", "approved")
          .maybeSingle();

        if (aff) {
          affiliate_id = aff.id;
          ref_code = aff.ref_code;
          commission_cents = Math.round(priceVal * (aff.commission_rate / 100));
        } else {
          toast.warning("Código de afiliado não encontrado ou inativo. Registro será salvo sem afiliado.", { duration: 4000 });
        }
      }

      const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();

      const { error } = await supabase.from("appointments").insert({
        doctor_id: doctor.id,
        affiliate_id,
        patient_name: form.patient_name,
        patient_phone: form.patient_phone,
        patient_email: form.patient_email,
        price_cents: priceVal,
        platform_fee_cents: Math.round(priceVal * 0.20),
        affiliate_commission_cents: commission_cents,
        ref_code,
        scheduled_at,
        status: "pending",
        payment_status: "pending"
      });

      if (error) throw error;
      
      toast.success("Consulta registrada com sucesso!");
      setOpen(false);
      setForm({ ...form, patient_name: "", patient_phone: "", patient_email: "", date: "", time: "", ref_code: "" });
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar consulta");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Agendamentos</h2>
          <p className="text-slate-500 mt-1">Gerencie suas consultas e status.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 text-white rounded-xl hover:bg-teal-700">Registrar Nova Consulta</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-semibold text-slate-900">Registrar Consulta Manual</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Nome do Paciente</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} required />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Telefone</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" value={form.patient_phone} onChange={e => setForm({...form, patient_phone: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">E-mail</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" type="email" value={form.patient_email} onChange={e => setForm({...form, patient_email: e.target.value})} />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Data da Consulta</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Horário</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Valor cobrado (em centavos)</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" type="number" value={form.price_cents} onChange={e => setForm({...form, price_cents: e.target.value})} required />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Código do Afiliado (Opcional)</Label>
                <Input className="bg-slate-50 border border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500" value={form.ref_code} onChange={e => setForm({...form, ref_code: e.target.value})} placeholder="ex: joao_x1y2" />
              </div>
              <Button type="submit" className="w-full bg-teal-600 text-white rounded-xl hover:bg-teal-700">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_th]:font-medium border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead>Data da Consulta</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {loading ? "Carregando..." : "Nenhum agendamento encontrado."}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((app) => (
                <TableRow key={app.id} className="hover:bg-slate-50/80 border-b border-slate-100">
                  <TableCell className="text-slate-600 font-medium">
                    {app.scheduled_at 
                      ? new Date(app.scheduled_at).toLocaleDateString("pt-BR") 
                      : new Date(app.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {app.scheduled_at 
                      ? new Date(app.scheduled_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) 
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">{app.patient_name || "—"}</TableCell>
                  <TableCell className="text-slate-600">{app.patient_phone || "—"}</TableCell>
                  <TableCell className="font-heading font-semibold text-slate-900">
                    {((app.price_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {app.affiliates?.ref_code || app.ref_code || "Direto"}
                  </TableCell>
                  <TableCell>{statusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {app.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 bg-transparent" onClick={() => updateStatus(app, "completed")}>
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent" onClick={() => updateStatus(app, "cancelled")}>
                            Cancelar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:bg-slate-100" onClick={() => updateStatus(app, "no_show")}>
                            Faltou
                          </Button>
                        </>
                      )}
                      {(() => {
                        const cleanPhone = app.patient_phone ? app.patient_phone.replace(/\D/g, '') : '';
                        const dateFmt = app.scheduled_at ? new Date(app.scheduled_at).toLocaleDateString('pt-BR') : new Date(app.created_at).toLocaleDateString('pt-BR');
                        const timeFmt = app.scheduled_at ? new Date(app.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                        
                        const msg = `Olá ${app.patient_name}! Sua consulta na Pontea está confirmada para o dia ${dateFmt}${timeFmt ? ` às ${timeFmt}` : ''}. Aguardo você! 😊`;
                        
                        return (
                          <Button 
                            size="sm" 
                            className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                            onClick={() => window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')}
                            disabled={!cleanPhone}
                            title={!cleanPhone ? "Telefone não informado" : "Contato WhatsApp"}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
