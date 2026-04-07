import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Award, ExternalLink, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";

export default function DoctorProfile() {
  const { slug } = useParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
        
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setDoctor(data);
      
      const { data: revs } = await supabase
        .from("doctor_reviews")
        .select("rating, comment, patient_name, created_at")
        .eq("doctor_id", data.id)
        .order("created_at", { ascending: false })
        .limit(10);
        
      setReviews(revs || []);
      setLoading(false);
      
      // Tracking na carga
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get("ref");
      const localRef = localStorage.getItem("pontea_ref");
      const cookieMatch = document.cookie.match(/(?:^|;\s*)pontea_ref=([^;]*)/);
      const cookieRef = cookieMatch ? cookieMatch[1] : null;
      
      const activeRef = urlRef || localRef || cookieRef;
      
      if (activeRef) {
        if (urlRef) {
          localStorage.setItem("pontea_ref", urlRef);
          document.cookie = `pontea_ref=${urlRef}; max-age=2592000; path=/; SameSite=Lax`;
        }
        
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id")
          .eq("ref_code", activeRef)
          .eq("status", "approved")
          .single();
          
        if (affiliate) {
          await supabase.from("referral_clicks").insert({
            affiliate_id: affiliate.id,
            doctor_id: data.id,
            landing_page: `/dr/${slug}`
          });
        }
      }
    }
    
    loadProfile();
  }, [slug]);

  if (loading) {
    return <div className="container py-20 text-center">Carregando...</div>;
  }

  if (notFound || !doctor) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Médico não encontrado</h1>
        <Link to="/buscar"><Button className="mt-4">Voltar à busca</Button></Link>
      </div>
    );
  }

  const handleAgendar = async () => {
    if (doctor.calendar_link) {
      window.open(doctor.calendar_link, "_blank");
      
      // Registro do clique explícito
      const localRef = localStorage.getItem("pontea_ref");
      const cookieMatch = document.cookie.match(/(?:^|;\s*)pontea_ref=([^;]*)/);
      const cookieRef = cookieMatch ? cookieMatch[1] : null;
      const activeRef = localRef || cookieRef;
      
      if (activeRef) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id")
          .eq("ref_code", activeRef)
          .eq("status", "approved")
          .single();
          
        if (affiliate) {
          await supabase.from("referral_clicks").insert({
            affiliate_id: affiliate.id,
            doctor_id: doctor.id,
            landing_page: `/dr/${slug}/agendar_click`
          });
        }
      }
    }
  };

  const priceFormatted = doctor.consultation_price
    ? (doctor.consultation_price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Sob consulta";

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start gap-6">
            <img 
              src={doctor.avatar_url || "/placeholder.svg"} 
              alt={doctor.full_name} 
              className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/30" 
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{doctor.full_name}</h1>
              <p className="text-primary">{doctor.specialty}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Award size={14} /> CRM {doctor.crm_number}/{doctor.crm_state}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} /> {doctor.city}/{doctor.state}
              </div>
              <div className="mt-2">
                <StarRating rating={Number(doctor.avg_rating ?? 0)} count={doctor.total_reviews ?? 0} />
              </div>
            </div>
          </div>

          {/* Bio */}
          {doctor.bio && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Sobre</h2>
              <p className="leading-relaxed text-muted-foreground">{doctor.bio}</p>
            </div>
          )}
          
          {/* Formação */}
          {(doctor.education || doctor.experience_years) && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Formação</h2>
              <ul className="space-y-2 text-muted-foreground">
                {doctor.education && (
                  <li className="flex items-center gap-2">
                    <GraduationCap size={16} /> {doctor.education}
                  </li>
                )}
                {doctor.experience_years && (
                  <li className="flex items-center gap-2">
                    <Clock size={16} /> {doctor.experience_years} anos de experiência
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Avaliações ({reviews.length})
            </h2>
            {doctor.avg_rating && (
               <div className="mb-6 flex items-center gap-3">
                 <span className="text-4xl font-bold text-foreground">{Number(doctor.avg_rating).toFixed(1)}</span>
                 <StarRating rating={Number(doctor.avg_rating)} />
               </div>
            )}
            <div className="flex flex-col gap-4">
              {reviews.map((review, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-foreground">{review.patient_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                  {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma avaliação encontrada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / sticky bottom */}
        <div className="lg:w-80">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-6">
            <p className="mb-1 text-sm text-muted-foreground">Consulta a partir de</p>
            <p className="mb-4 text-3xl font-bold text-foreground">
              {priceFormatted}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {doctor.accepts_presential && (
                <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Presencial</Badge>
              )}
              {doctor.accepts_online && (
                <Badge className="bg-primary/20 text-primary">Online</Badge>
              )}
            </div>
            
            {doctor.calendar_link ? (
              <Button className="w-full" size="lg" onClick={handleAgendar}>
                <ExternalLink className="mr-2 h-4 w-4" /> Agendar Consulta
              </Button>
            ) : (
              <Button disabled className="w-full" size="lg">
                Agenda indisponível
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
