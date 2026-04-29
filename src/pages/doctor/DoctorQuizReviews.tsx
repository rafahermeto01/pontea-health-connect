import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch, CheckCircle, XCircle, HelpCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export default function DoctorQuizReviews() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "needs_info" | null>(null);
  
  const [doctorNotes, setDoctorNotes] = useState("");
  const [actionReason, setActionReason] = useState("");

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select(`
          *,
          treatment_programs ( title, name )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

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
    if (doctor?.id) fetchResponses();
  }, [doctor?.id]);

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
          doctor_id: doctor.id // track which doctor reviewed it
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

  // Helper to calculate BMI
  const calculateBMI = (answers: any) => {
    // Assuming keys might contain 'weight' or 'height' or in portuguese 'peso', 'altura'
    // This is a heuristic. In a real scenario, the question IDs or keys should be deterministic.
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
           if (num) height = num > 3 ? num / 100 : num; // convert cm to m
        }
      });
    }

    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return "N/A";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Avaliações Clínicas</h2>
        <p className="text-slate-600">Analise os questionários pendentes e defina as prescrições.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Carregando...</TableCell>
              </TableRow>
            ) : responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhuma avaliação pendente no momento.</TableCell>
              </TableRow>
            ) : (
              responses.map((resp) => (
                <TableRow key={resp.id}>
                  <TableCell>{new Date(resp.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{resp.patient_name}</TableCell>
                  <TableCell>{resp.treatment_programs?.title || resp.treatment_programs?.name || "Programa"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pendente
                    </span>
                  </TableCell>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileSearch className="text-teal-600 w-5 h-5" />
                Avaliação de Caso
              </DialogTitle>
              <DialogDescription>
                Revise as respostas do paciente e tome uma decisão clínica.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              {/* Patient Info Sidebar */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3 border-b pb-2">Dados do Paciente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 block text-xs uppercase">Nome</span> {selectedReview.patient_name}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">Idade / Nasc.</span> {new Date(selectedReview.patient_birthdate).toLocaleDateString('pt-BR')}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">Sexo</span> {selectedReview.patient_gender === 'male' ? 'Masculino' : 'Feminino'}</p>
                    <p><span className="text-slate-500 block text-xs uppercase">IMC Estimado</span> {calculateBMI(selectedReview.answers)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas Médicas (Apenas para você)</Label>
                  <Textarea 
                    className="min-h-[100px] text-sm" 
                    placeholder="Adicione observações clínicas..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Answers Main Content */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white border rounded-xl p-0 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b">
                    <h3 className="font-bold text-slate-900 text-sm">Questionário Preenchido</h3>
                  </div>
                  <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {typeof selectedReview.answers === 'object' && selectedReview.answers !== null ? (
                      Object.entries(selectedReview.answers).map(([qId, answer]: [string, any], idx) => (
                        <div key={qId} className="border-b pb-3 last:border-0 last:pb-0">
                          <p className="text-xs text-slate-500 font-medium mb-1">Pergunta {idx + 1}</p>
                          <p className="text-sm font-semibold text-slate-900 mb-1">
                            {/* In a real implementation, we might want to map qId to actual question text if we saved it or fetch it */}
                            ID da Pergunta: {qId}
                          </p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
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
                      <HelpCircle className="w-4 h-4 mr-2" /> Solicitar Info
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
                        placeholder={actionType === "reject" ? "Explique o motivo clínico da recusa (será enviado ao paciente)..." : "O que mais você precisa saber para aprovar?"}
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
                        Confirmar
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
