import { useEffect, useState } from "react";
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
    price_cents: doctor.consultation_price?.toString() || "0",
    ref_code: "",
  });

  const fetchAppointments = async () => {
    setLoading(true);
    const { data: apps, error } = await supabase
      .from("appointments")
      .select("*, affiliates(ref_code)")
      .eq("doctor_id", doctor.id)
      .order("created_at", { ascending: false });

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
      case "pending": return <Badge variant="secondary">Pendente</Badge>;
      case "completed": return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelado</Badge>;
      case "no_show": return <Badge variant="outline" className="border-red-500 text-red-500">Faltou</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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
        status: "pending",
        payment_status: "pending"
      });

      if (error) throw error;
      
      toast.success("Consulta registrada com sucesso!");
      setOpen(false);
      setForm({ ...form, patient_name: "", patient_phone: "", patient_email: "", ref_code: "" });
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar consulta");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie suas consultas e status.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Registrar Nova Consulta</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Consulta Manual</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label>Nome do Paciente</Label>
                <Input value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} required />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.patient_phone} onChange={e => setForm({...form, patient_phone: e.target.value})} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.patient_email} onChange={e => setForm({...form, patient_email: e.target.value})} />
              </div>
              <div>
                <Label>Valor cobrado (em centavos)</Label>
                <Input type="number" value={form.price_cents} onChange={e => setForm({...form, price_cents: e.target.value})} required />
              </div>
              <div>
                <Label>Código do Afiliado (Opcional)</Label>
                <Input value={form.ref_code} onChange={e => setForm({...form, ref_code: e.target.value})} placeholder="ex: joao_x1y2" />
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data de Criação</TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {loading ? "Carregando..." : "Nenhum agendamento encontrado."}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{new Date(app.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{app.patient_name || "—"}</TableCell>
                  <TableCell>{app.patient_phone || "—"}</TableCell>
                  <TableCell>
                    {((app.price_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    {app.affiliates?.ref_code || app.ref_code || "Direto"}
                  </TableCell>
                  <TableCell>{statusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    {app.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10" onClick={() => updateStatus(app, "completed")}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10" onClick={() => updateStatus(app, "cancelled")}>
                          Cancelar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(app, "no_show")}>
                          Faltou
                        </Button>
                      </div>
                    )}
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
