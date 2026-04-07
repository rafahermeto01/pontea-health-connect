import { useParams, Link } from "react-router-dom";
import { MapPin, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { mockDoctors } from "@/data/mockDoctors";
import { useReferral } from "@/hooks/useReferral";

export default function DoctorProfile() {
  useReferral();
  const { slug } = useParams();
  const doctor = mockDoctors.find((d) => d.slug === slug);

  if (!doctor) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Médico não encontrado</h1>
        <Link to="/buscar"><Button className="mt-4">Voltar à busca</Button></Link>
      </div>
    );
  }

  const avgRating = doctor.reviews.length
    ? (doctor.reviews.reduce((s, r) => s + r.rating, 0) / doctor.reviews.length).toFixed(1)
    : doctor.rating.toFixed(1);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start gap-6">
            <img src={doctor.photoUrl} alt={doctor.name} className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/30" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{doctor.name}</h1>
              <p className="text-primary">{doctor.specialty}</p>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Award size={14} /> CRM {doctor.crm}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} /> {doctor.city} - {doctor.uf}
              </div>
              <div className="mt-2">
                <StarRating rating={doctor.rating} count={doctor.reviewCount} />
              </div>
              {doctor.isOnline && (
                <Badge className="mt-2 bg-primary/20 text-primary">Teleconsulta disponível</Badge>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Sobre</h2>
            <p className="leading-relaxed text-muted-foreground">{doctor.bio}</p>
          </div>

          {/* Reviews */}
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Avaliações ({doctor.reviews.length})
            </h2>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-4xl font-bold text-foreground">{avgRating}</span>
              <StarRating rating={Number(avgRating)} />
            </div>
            <div className="flex flex-col gap-4">
              {doctor.reviews.map((review, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-foreground">{review.patientName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / sticky bottom */}
        <div className="lg:w-80">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-6">
            <p className="mb-1 text-sm text-muted-foreground">Consulta a partir de</p>
            <p className="text-3xl font-bold text-foreground">
              {doctor.consultationPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <a href={doctor.calendarLink} target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 w-full" size="lg">
                <ExternalLink className="mr-2 h-4 w-4" /> Agendar Consulta
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
