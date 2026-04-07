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
        .select("landing_page, converted") // Assume specialty_filter/city_filter might not natively be there in this schema version or we extract from URL
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
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Meus Links</h2>
        <p className="text-slate-400">Desempenho detalhado de cada link compartilhado.</p>
      </div>

      <Card className="bg-[#1E293B] border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-[#0D9488]" />
            <CardTitle className="text-white">Conversões por Link</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Acompanhe quais campanhas ou filtros estão trazendo mais resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700 bg-[#0F172A] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1E293B] border-b border-slate-700">
                <TableRow className="border-b border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-300">Landing Page</TableHead>
                  <TableHead className="text-slate-300">Filtro Especialidade</TableHead>
                  <TableHead className="text-slate-300">Filtro Cidade</TableHead>
                  <TableHead className="text-right text-slate-300">Cliques</TableHead>
                  <TableHead className="text-right text-slate-300">Agendamentos</TableHead>
                  <TableHead className="text-right text-slate-300">Conversão</TableHead>
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
                      <TableRow key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-mono text-xs text-[#0D9488] max-w-[200px] truncate" title={row.landing_page}>
                          {row.landing_page}
                        </TableCell>
                        <TableCell className="text-slate-300">{row.specialty}</TableCell>
                        <TableCell className="text-slate-300">{row.city}</TableCell>
                        <TableCell className="text-right font-medium text-white">{row.clicks}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">{row.conversions}</TableCell>
                        <TableCell className="text-right font-medium text-blue-400">{convRate}%</TableCell>
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
