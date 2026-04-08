import { Link } from "react-router-dom";
import { MapPin, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Doctor } from "@/hooks/useDoctors";

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  const priceFormatted = doctor.consultation_price
    ? (doctor.consultation_price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Sob consulta";

  const rating = Number(doctor.avg_rating ?? 0);
  const reviews = doctor.total_reviews ?? 0;

  return (
    <Link to={`/dr/${doctor.slug}`} className="group block">
      <div className="flex flex-col sm:flex-row items-start gap-5 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        {/* Avatar */}
        <div className="shrink-0">
          <img
            src={doctor.avatar_url || "/placeholder.svg"}
            alt={doctor.full_name || "Médico"}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-100"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                {doctor.full_name}
              </h3>
              <p className="text-sm font-medium text-teal-600">{doctor.specialty}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {doctor.accepts_online && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Video size={11} />
                  Online
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Presencial
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-slate-400">
            <MapPin size={13} className="shrink-0" />
            <span>{doctor.city} / {doctor.state}</span>
          </div>

          {/* Stars */}
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700">{rating > 0 ? rating.toFixed(1) : "—"}</span>
            <span className="text-sm text-slate-400">({reviews} avaliações)</span>
          </div>

          {/* Footer row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-heading text-2xl font-bold text-slate-900">{priceFormatted}</span>
              <span className="ml-1 text-xs text-slate-400">a partir de</span>
            </div>
            <Button
              className="rounded-xl bg-teal-600 px-5 text-white hover:bg-teal-700 shadow-sm hover:shadow-md transition-all"
              size="sm"
            >
              Ver Perfil
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
