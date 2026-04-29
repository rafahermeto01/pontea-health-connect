import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, Power, Gift } from "lucide-react";
import { toast } from "sonner";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar médicos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => 
    (d.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.crm || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (doctor: any) => {
    const newStatus = doctor.plan_status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ plan_status: newStatus })
        .eq("id", doctor.id);

      if (error) throw error;
      toast.success(`Status alterado para ${newStatus}.`);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status.");
    }
  };

  const handleGrantFreeAccess = async (doctorId: string) => {
    try {
      // Sets plan_status to 'active' (and optionally we could set a future expiration date)
      const { error } = await supabase
        .from("doctors")
        .update({ 
          plan_status: "active",
          plan_type: "premium" // give premium free access
        })
        .eq("id", doctorId);

      if (error) throw error;
      toast.success("Acesso premium liberado gratuitamente!");
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao liberar acesso.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Médicos Cadastrados</h2>
          <p className="text-slate-600">Gerencie o acesso e as assinaturas dos profissionais.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou CRM..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadastro</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CRM</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Carregando...</TableCell>
              </TableRow>
            ) : filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Nenhum médico encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="whitespace-nowrap">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      {doc.full_name || "Sem Nome"}
                    </div>
                  </TableCell>
                  <TableCell>{doc.crm || "N/A"}</TableCell>
                  <TableCell className="capitalize">{doc.plan_type || "Nenhum"}</TableCell>
                  <TableCell>
                    {doc.plan_status === "active" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Inativo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title={doc.plan_status === "active" ? "Desativar" : "Ativar"}
                        onClick={() => handleToggleStatus(doc)}
                      >
                        <Power className={`w-4 h-4 ${doc.plan_status === "active" ? "text-red-500" : "text-green-500"}`} />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        title="Liberar Acesso Gratuito (Premium)"
                        onClick={() => handleGrantFreeAccess(doc.id)}
                      >
                        <Gift className="w-4 h-4 mr-2" /> Free
                      </Button>
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
