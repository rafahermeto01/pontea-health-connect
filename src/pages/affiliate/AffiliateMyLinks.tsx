import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateData } from "@/hooks/useAffiliate";
import { Loader2 } from "lucide-react";

interface LinkStats {
  landing_page: string;
  specialty_filter: string | null;
  city_filter: string | null;
  clicks: number;
  conversions: number;
}

export default function AffiliateMyLinks() {
  const { affiliate } = useOutletContext<{ affiliate: AffiliateData }>();
  const [data, setData] = useState<LinkStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from("referral_clicks")
        .select("landing_page, specialty_filter, city_filter, converted")
        .eq("affiliate_id", affiliate.id);

      if (!rows) { setLoading(false); return; }

      // Group client-side
      const map: Record<string, LinkStats> = {};
      for (const r of rows) {
        const key = `${r.landing_page}|${r.specialty_filter ?? ""}|${r.city_filter ?? ""}`;
        if (!map[key]) {
          map[key] = {
            landing_page: r.landing_page ?? "/",
            specialty_filter: r.specialty_filter,
            city_filter: r.city_filter,
            clicks: 0,
            conversions: 0,
          };
        }
        map[key].clicks++;
        if (r.converted) map[key].conversions++;
      }

      setData(Object.values(map).sort((a, b) => b.clicks - a.clicks));
      setLoading(false);
    }
    load();
  }, [affiliate.id]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Meus Links — Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum clique registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landing Page</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs max-w-[180px] truncate">{row.landing_page}</TableCell>
                    <TableCell>{row.specialty_filter || "Geral"}</TableCell>
                    <TableCell>{row.city_filter || "Todas"}</TableCell>
                    <TableCell className="text-right">{row.clicks}</TableCell>
                    <TableCell className="text-right">{row.conversions}</TableCell>
                    <TableCell className="text-right">
                      {row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
