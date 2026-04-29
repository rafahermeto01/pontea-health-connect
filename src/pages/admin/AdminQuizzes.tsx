import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSearch, CheckCircle, XCircle, HelpCircle, Eye, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminQuizzes() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "needs_info" | null>(null);
  
  const [doctorNotes, setDoctorNotes] = useState("");
  const [actionReason, setActionReason] = useState("");

  const fetchResponses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("quiz_responses")
        .select(`
          *,
          treatment_programs ( title, name ),
          treatment_orders ( product_id, billing_cycle, treatment_products(name) )
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [filterStatus]);

  const filteredResponses = responses.filter(r => 
    r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenReview = (response: any) => {
    setSelectedReview(response);
    setDoctorNotes(response.doctor_notes || "");
    setIsModalOpen(true);
    setActionType(null);
    setActionReason("");
  };

  const handleAction = async () => {
    if (!selectedReview) return;

    if ((actionType === "reject" || actionType === "needs_info") && !actionReason.trim()) {
      toast.error("Por favor, forneça um motivo/mensagem.");
      return;
    }

    try {
      let newStatus = selectedReview.status;
      if (actionType === "approve") newStatus = "approved";
      if (actionType === "reject") newStatus = "rejected";
      if (actionType === "needs_info") newStatus = "needs_review";

      // Update quiz_response
      const { error: updateError } = await supabase
        .from("quiz_responses")
        .update({
          status: newStatus,
          doctor_notes: doctorNotes,
        })
        .eq("id", selectedReview.id);

      if (updateError) throw updateError;

      // Update associated treatment_order if applicable
      if (actionType === "approve" || actionType === "reject") {
        const { error: orderError } = await supabase
          .from("treatment_orders")
          .update({ status: actionType === "approve" ? "approved" : "rejected" })
          .eq("quiz_response_id", selectedReview.id)
          .eq("status", "awaiting_review");

        if (orderError) {
          console.warn("Could not update order status or order not found:", orderError);
        }
      }

      toast.success("Avaliação atualizada com sucesso!");
      setIsModalOpen(false);
      fetchResponses(); // Refresh list

    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar avaliação.");
    }
  };

  const calculateBMI = (answers: any) => {
    let weight = 0;
    let height = 0;
    
    if (typeof answers === 'object' && answers !== null) {
      Object.entries(answers).forEach(([key, val]) => {
        const strVal = String(val).toLowerCase();
        if (key.includes("peso") || strVal.includes("kg")) {
           const num = parseFloat(strVal.replace(/[^0-9.]/g, ''));
           if (num) weight = num;
        }
        if (key.includes("altura") || strVal.includes("cm") || strVal.includes("m")) {
           const num = parseFloat(strVal.replace(/[^0-9.]/g, ''));
           if (num) height = num > 3 ? num / 100 : num;
        }
      });
    }

    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return "N/A";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Pendente</span>;
      case "approved": return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aprovado</span>;
      case "rejected": return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejeitado</span>;
      case "needs_review": return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Revisão Necessária</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quizzes e Avaliações</h2>
          <p className="text-slate-600">Gerencie todos os questionários médicos enviados pelos pacientes.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="needs_review">Revisão Necessária</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Carregando...</TableCell>
              </TableRow>
            ) : filteredResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Nenhum quiz encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredResponses.map((resp) => (
                <TableRow key={resp.id}>
                  <TableCell className="whitespace-nowrap">{new Date(resp.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{resp.patient_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{resp.patient_email}</div>
                    <div className="text-xs text-slate-500">{resp.patient_phone}</div>
                  </TableCell>
                  <TableCell>{resp.treatment_programs?.title || resp.treatment_programs?.name || "Programa"}</TableCell>
                  <TableCell>{getStatusBadge(resp.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenReview(resp)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Analisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedReview && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileSearch className="text-indigo-600 w-5 h-5" />
                Avaliação do Paciente
              </DialogTitle>
              <DialogDescription>
                Revise as respostas e tome uma ação administrativa/clínica.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3 border-b pb-2">Dados do Paciente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 block text-xs uppercase">Nome</span> {selectedReview.patient_name}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">E-mail</span> {selectedReview.patient_email}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">Telefone</span> {selectedReview.patient_phone}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">Idade / Nasc.</span> {new Date(selectedReview.patient_birthdate).toLocaleDateString('pt-BR')}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">Sexo</span> {selectedReview.patient_gender === 'male' ? 'Masculino' : 'Feminino'}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">IMC Estimado</span> {calculateBMI(selectedReview.answers)}</p>
                  </div>
                </div>

                {selectedReview.treatment_orders && selectedReview.treatment_orders.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-3 border-b border-indigo-200 pb-2">Pedido Vinculado</h3>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <p><span className="font-semibold">Produto:</span> {selectedReview.treatment_orders[0].treatment_products?.name}</p>
                      <p><span className="font-semibold">Ciclo:</span> {selectedReview.treatment_orders[0].billing_cycle}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notas Médicas / Admin</Label>
                  <Textarea 
                    className="min-h-[100px] text-sm" 
                    placeholder="Adicione observações..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border rounded-xl p-0 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Questionário Preenchido</h3>
                    {getStatusBadge(selectedReview.status)}
                  </div>
                  <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {typeof selectedReview.answers === 'object' && selectedReview.answers !== null ? (
                      Object.entries(selectedReview.answers).map(([qId, answer]: [string, any], idx) => (
                        <div key={qId} className="border-b pb-3 last:border-0 last:pb-0">
                          <p className="text-xs text-slate-500 font-medium mb-1">Pergunta ID: {qId}</p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Nenhuma resposta encontrada.</p>
                    )}
                  </div>
                </div>

                {/* Action Area */}
                {!actionType ? (
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => setActionType("approve")}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white flex-1" onClick={() => setActionType("needs_info")}>
                      <HelpCircle className="w-4 h-4 mr-2" /> Precisa Revisão
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setActionType("reject")}>
                      <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-bold text-slate-900">
                      {actionType === "approve" && "Confirmar Aprovação"}
                      {actionType === "reject" && "Motivo da Rejeição"}
                      {actionType === "needs_info" && "Mensagem para o Paciente"}
                    </h3>
                    
                    {actionType !== "approve" && (
                      <Textarea 
                        placeholder={actionType === "reject" ? "Motivo clínico da recusa..." : "O que mais precisa saber?"}
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    )}
                    
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setActionType(null)} className="flex-1">Cancelar</Button>
                      <Button 
                        className={`flex-1 text-white ${
                          actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                          actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                          "bg-amber-500 hover:bg-amber-600"
                        }`}
                        onClick={handleAction}
                      >
                        Confirmar Status
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
