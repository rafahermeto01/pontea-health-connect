import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar afiliados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const filteredAffiliates = affiliates.filter(a => 
    (a.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.ref_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = async (affiliate: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ status: newStatus })
        .eq("id", affiliate.id);

      if (error) throw error;
      toast.success(`Afiliado alterado para ${newStatus}.`);
      fetchAffiliates();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status do afiliado.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Afiliados</h2>
          <p className="text-slate-600">Acompanhe as parcerias, aprovações e saldo dos afiliados.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou código..."
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
              <TableHead>Ref Code</TableHead>
              <TableHead className="text-center">Cliques / Conversões</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">Carregando...</TableCell>
              </TableRow>
            ) : filteredAffiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">Nenhum afiliado encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredAffiliates.map((aff) => (
                <TableRow key={aff.id}>
                  <TableCell className="whitespace-nowrap">{new Date(aff.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Users className="w-4 h-4" />
                      </div>
                      {aff.full_name || "Sem Nome"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{aff.ref_code || "N/A"}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <span className="font-semibold">{aff.total_clicks || 0}</span> / <span className="font-semibold text-teal-600">{aff.total_conversions || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{formatCurrency(aff.balance || 0)}</TableCell>
                  <TableCell>
                    {aff.status === "active" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
                    ) : aff.status === "pending" ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Pendente</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Bloqueado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {aff.status !== "active" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Aprovar"
                          onClick={() => handleUpdateStatus(aff, "active")}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {aff.status !== "blocked" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Bloquear"
                          onClick={() => handleUpdateStatus(aff, "blocked")}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
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
