import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Truck, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [trackingCode, setTrackingCode] = useState("");
  const [actionType, setActionType] = useState<"ship" | "cancel" | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("treatment_orders")
        .select(`
          *,
          quiz_responses ( patient_name, patient_email, patient_phone ),
          treatment_products ( name )
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const filteredOrders = orders.filter(o => {
    const patientName = o.quiz_responses?.patient_name || "";
    const customerCpf = o.customer_cpf || "";
    return patientName.toLowerCase().includes(searchQuery.toLowerCase()) || customerCpf.includes(searchQuery);
  });

  const handleOpenOrder = (order: any) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    setIsModalOpen(true);
    setActionType(null);
  };

  const handleAction = async () => {
    if (!selectedOrder) return;

    if (actionType === "ship" && !trackingCode.trim()) {
      toast.error("Por favor, insira o código de rastreio.");
      return;
    }

    try {
      let newStatus = selectedOrder.status;
      if (actionType === "ship") newStatus = "shipped";
      if (actionType === "cancel") newStatus = "cancelled"; // or refunded

      const { error: updateError } = await supabase
        .from("treatment_orders")
        .update({
          status: newStatus,
          tracking_code: actionType === "ship" ? trackingCode : selectedOrder.tracking_code,
        })
        .eq("id", selectedOrder.id);

      if (updateError) throw updateError;

      toast.success("Pedido atualizado com sucesso!");
      setIsModalOpen(false);
      fetchOrders();

    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar o pedido.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "awaiting_review": return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Em Revisão</span>;
      case "approved": return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Aprovado / Preparando</span>;
      case "shipped": return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Enviado</span>;
      case "rejected": return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejeitado Médico</span>;
      case "cancelled": return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">Cancelado</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos de Tratamento</h2>
          <p className="text-slate-600">Acompanhe compras, logística e status dos tratamentos prescritos.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar por paciente ou CPF..."
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
              <SelectItem value="awaiting_review">Aguardando Revisão</SelectItem>
              <SelectItem value="approved">Aprovado (Preparando)</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="cancelled">Cancelado/Rejeitado</SelectItem>
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
              <TableHead>Produto</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">Carregando...</TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">Nenhum pedido encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap">{new Date(order.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{order.quiz_responses?.patient_name || "Desconhecido"}</div>
                    <div className="text-xs text-slate-500">CPF: {order.customer_cpf}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.treatment_products?.name || "Produto"}</TableCell>
                  <TableCell className="capitalize">{order.billing_cycle}</TableCell>
                  <TableCell className="font-medium text-teal-700">{formatCurrency(order.amount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.ref_code ? (
                      <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded">Afiliado: {order.ref_code}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Direto</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenOrder(order)}>
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Package className="text-indigo-600 w-5 h-5" />
                Detalhes do Pedido
              </DialogTitle>
              <DialogDescription>
                Gerencie o envio e o status financeiro do pedido.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-2">Dados do Paciente</h3>
                  <p className="text-sm"><span className="text-slate-500">Nome:</span> {selectedOrder.quiz_responses?.patient_name}</p>
                  <p className="text-sm"><span className="text-slate-500">CPF:</span> {selectedOrder.customer_cpf}</p>
                  <p className="text-sm"><span className="text-slate-500">Telefone:</span> {selectedOrder.quiz_responses?.patient_phone}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-2">Produto</h3>
                  <p className="text-sm"><span className="text-slate-500">Item:</span> {selectedOrder.treatment_products?.name}</p>
                  <p className="text-sm"><span className="text-slate-500">Ciclo:</span> <span className="capitalize">{selectedOrder.billing_cycle}</span></p>
                  <p className="text-sm font-semibold text-teal-700 mt-1">{formatCurrency(selectedOrder.amount)}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-2 flex justify-between">
                  <span>Endereço de Entrega</span>
                  <Truck className="w-4 h-4 text-slate-400" />
                </h3>
                {selectedOrder.shipping_address ? (
                  <p className="text-sm text-slate-700">
                    {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}
                    {selectedOrder.shipping_address.complement && ` - ${selectedOrder.shipping_address.complement}`} <br/>
                    CEP: {selectedOrder.shipping_address.cep} - {selectedOrder.shipping_address.city}/{selectedOrder.shipping_address.state}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Endereço não informado.</p>
                )}
              </div>

              {selectedOrder.tracking_code && (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-indigo-800 font-medium">Código de Rastreio:</span>
                  <span className="text-sm bg-white px-3 py-1 rounded border border-indigo-200 font-mono text-slate-800">{selectedOrder.tracking_code}</span>
                </div>
              )}

              {/* Action Area */}
              {!actionType ? (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1" 
                    onClick={() => setActionType("ship")}
                    disabled={selectedOrder.status !== "approved"}
                  >
                    <Truck className="w-4 h-4 mr-2" /> Marcar como Enviado
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1" 
                    onClick={() => setActionType("cancel")}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Cancelar Pedido
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="font-bold text-slate-900">
                    {actionType === "ship" ? "Informar Envio" : "Cancelar e Reembolsar"}
                  </h3>
                  
                  {actionType === "ship" && (
                    <div className="space-y-2">
                      <Label>Código de Rastreio (Transportadora)</Label>
                      <Input 
                        placeholder="Ex: BR123456789BR"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                      />
                    </div>
                  )}

                  {actionType === "cancel" && (
                    <p className="text-sm text-slate-600">
                      Tem certeza que deseja cancelar este pedido? Se o pagamento já foi processado, você precisará realizar o reembolso no gateway de pagamento (Asaas).
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setActionType(null)} className="flex-1">Voltar</Button>
                    <Button 
                      className={`flex-1 text-white ${
                        actionType === "ship" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"
                      }`}
                      onClick={handleAction}
                    >
                      Confirmar {actionType === "ship" ? "Envio" : "Cancelamento"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
