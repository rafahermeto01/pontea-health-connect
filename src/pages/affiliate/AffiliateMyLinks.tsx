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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "lucide-react";

export default function AffiliateMyLinks() {
  const { affiliate } = useOutletContext<{ affiliate: any }>();
  const [linksData, setLinksData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      // Fetch all clicks for this affiliate
      const { data } = await supabase
        .from("referral_clicks")
        .select("landing_page, converted, specialty_filter, city_filter") // Assume specialty_filter/city_filter might not natively be there in this schema version or we extract from URL
        .eq("affiliate_id", affiliate.id);

      if (data) {
        const groups: Record<string, {
          landing_page: string,
          specialty: string,
          city: string,
          clicks: number,
          conversions: number
        }> = {};

        data.forEach(item => {
          let lp = item.landing_page || "/";
          
          // Parse filters from landing page if not directly in columns
          let esp = "Geral";
          let cid = "Todas";
          try {
            if (lp.includes("?")) {
              const qs = lp.split("?")[1];
              const params = new URLSearchParams(qs);
              if (params.get("esp")) esp = params.get("esp") as string;
              if (params.get("cidade")) cid = params.get("cidade") as string;
            }
          } catch(e) {}

          // Use the exact fields from data if the DB supports them (as requested)
          if (item.specialty_filter) esp = item.specialty_filter;
          if (item.city_filter) cid = item.city_filter;

          const key = `${lp}-${esp}-${cid}`;

          if (!groups[key]) {
            groups[key] = {
              landing_page: lp,
              specialty: esp,
              city: cid,
              clicks: 0,
              conversions: 0
            };
          }

          groups[key].clicks += 1;
          if (item.converted) {
            groups[key].conversions += 1;
          }
        });

        // Convert to array and sort by clicks DESC
        const sorted = Object.values(groups).sort((a, b) => b.clicks - a.clicks);
        setLinksData(sorted);
      }
      setLoading(false);
    }
    
    fetchLinks();
  }, [affiliate.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Meus Links</h2>
        <p className="text-slate-500 mt-1">Desempenho detalhado de cada link compartilhado.</p>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-teal-600" />
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">Conversões por Link</CardTitle>
          </div>
          <CardDescription className="text-slate-500 mt-1">
            Acompanhe quais campanhas ou filtros estão trazendo mais resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_th]:font-medium border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Landing Page</TableHead>
                  <TableHead>Filtro Especialidade</TableHead>
                  <TableHead>Filtro Cidade</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Carregando links...</TableCell>
                  </TableRow>
                ) : linksData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Nenhum clique registrado ainda.</TableCell>
                  </TableRow>
                ) : (
                  linksData.map((row, i) => {
                    const convRate = row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(1) : "0.0";
                    return (
                      <TableRow key={i} className="hover:bg-slate-50/80 border-b border-slate-100">
                        <TableCell className="font-mono text-xs text-teal-600 max-w-[200px] truncate" title={row.landing_page}>
                          {row.landing_page}
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">{row.specialty}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{row.city}</TableCell>
                        <TableCell className="text-right font-heading font-semibold text-slate-900">{row.clicks}</TableCell>
                        <TableCell className="text-right font-heading font-semibold text-emerald-600">{row.conversions}</TableCell>
                        <TableCell className="text-right font-heading font-semibold text-sky-600">{convRate}%</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
