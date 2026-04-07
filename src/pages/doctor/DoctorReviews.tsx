import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "@/components/StarRating";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DoctorReviews() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from("doctor_reviews")
        .select("*")
        .eq("doctor_id", doctor.id)
        .order("created_at", { ascending: false });

      setReviews(data || []);
      setLoading(false);
    }
    fetchReviews();
  }, [doctor.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Avaliações</h2>
        <p className="text-muted-foreground">Feedback que seus pacientes deixaram na plataforma.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : reviews.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sem avaliações</CardTitle>
              <CardDescription>Você ainda não possui avaliações visíveis.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          reviews.map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{r.patient_name || "Paciente Anônimo"}</h3>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="mb-4">
                  <StarRating rating={r.rating} size={16} />
                </div>
                {r.comment ? (
                  <p className="text-muted-foreground">{r.comment}</p>
                ) : (
                  <p className="text-muted-foreground italic opacity-60">Sem comentário escrito.</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
