import { Link } from "react-router-dom";
import { MapPin, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import type { MockDoctor } from "@/data/mockDoctors";

export default function DoctorCard({ doctor }: { doctor: MockDoctor }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
      <div className="flex gap-4 p-4">
        <img
          src={doctor.photoUrl}
          alt={doctor.name}
          className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{doctor.name}</h3>
          <p className="text-sm text-primary">{doctor.specialty}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} /> {doctor.city} - {doctor.uf}
          </div>
          <StarRating rating={doctor.rating} count={doctor.reviewCount} size={14} />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {doctor.consultationPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          {doctor.isOnline && (
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              <Video size={12} className="mr-1" /> Online
            </Badge>
          )}
        </div>
        <Link to={`/dr/${doctor.slug}`}>
          <Button size="sm">Ver Perfil</Button>
        </Link>
      </div>
    </div>
  );
}
