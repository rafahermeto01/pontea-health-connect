import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import DoctorCard from "@/components/DoctorCard";
import { useDoctors, useFilterOptions, type SortOption } from "@/hooks/useDoctors";
import { supabase } from "@/integrations/supabase/client";

export default function BuscarPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Pre-fill from URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => {
    const esp = searchParams.get("esp");
    return esp ? esp.split(",").map((s) => s.trim()) : [];
  });
  const [city, setCity] = useState(searchParams.get("cidade") || "all");
  const [priceRange, setPriceRange] = useState([0, 100000]); // centavos
  const [minRating, setMinRating] = useState(0);
  const [consultationType, setConsultationType] = useState<"all" | "online" | "presential">("all");
  const [sort, setSort] = useState<SortOption>("rating");

  const { specialties, cities } = useFilterOptions();

  const { doctors, totalCount, loading, hasMore, loadMore } = useDoctors({
    query,
    specialties: selectedSpecialties,
    city,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
    minRating,
    consultationType,
    sort,
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedSpecialties.length) params.set("esp", selectedSpecialties.join(","));
    if (city !== "all") params.set("cidade", city);
    const existingRef = searchParams.get("ref");
    if (existingRef) params.set("ref", existingRef);
    setSearchParams(params, { replace: true });
  }, [query, selectedSpecialties, city]);

  // Referral tracking
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    localStorage.setItem("pontea_ref", ref);
    document.cookie = `pontea_ref=${ref}; max-age=2592000; path=/; SameSite=Lax`;

    // Track click in Supabase
    (async () => {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("ref_code", ref)
        .eq("status", "approved")
        .single();

      if (affiliate) {
        await supabase.from("referral_clicks").insert({
          affiliate_id: affiliate.id,
          doctor_id: null,
          landing_page: "/buscar",
          specialty_filter: searchParams.get("esp"),
          city_filter: searchParams.get("cidade"),
        });
      }
    })();
  }, []);

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      {/* Specialties - checkboxes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Especialidade</label>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
          {specialties.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <Checkbox
                checked={selectedSpecialties.includes(s)}
                onCheckedChange={() => toggleSpecialty(s)}
              />
              {s}
            </label>
          ))}
          {specialties.length === 0 && (
            <span className="text-xs text-muted-foreground">Carregando...</span>
          )}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Cidade</label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {cities.map((c) => (
              <SelectItem key={`${c.city}-${c.state}`} value={c.city}>
                {c.city} / {c.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Preço: {(priceRange[0] / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} –{" "}
          {(priceRange[1] / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </label>
        <Slider
          min={0}
          max={100000}
          step={5000}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-2"
        />
      </div>

      {/* Min rating */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Avaliação Mínima</label>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <Button key={r} size="sm" variant={minRating === r ? "default" : "outline"} onClick={() => setMinRating(r)}>
              {r === 0 ? "Todas" : `${r}+`}
            </Button>
          ))}
        </div>
      </div>

      {/* Consultation type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Consulta</label>
        <div className="flex gap-2 flex-wrap">
          {([["all", "Ambos"], ["online", "Online"], ["presential", "Presencial"]] as const).map(([val, label]) => (
            <Button key={val} size="sm" variant={consultationType === val ? "default" : "outline"} onClick={() => setConsultationType(val)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-8">
      {/* Search bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou especialidade..."
            className="pl-10"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Melhor Avaliado</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="reviews">Mais Avaliados</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile filter trigger */}
        <Sheet>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros</Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-background">
            <SheetTitle>Filtros</SheetTitle>
            <div className="mt-4"><FilterPanel /></div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 sm:block">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Filtros</h3>
          <FilterPanel />
        </aside>

        {/* Results */}
        <div className="flex-1">
          <p className="mb-4 text-sm text-muted-foreground">
            {loading && doctors.length === 0 ? "Buscando..." : `${totalCount} médico(s) encontrado(s)`}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>

          {loading && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && hasMore && doctors.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={loadMore}>Carregar mais</Button>
            </div>
          )}

          {!loading && doctors.length === 0 && (
            <p className="py-20 text-center text-muted-foreground">
              Nenhum médico encontrado. Tente ampliar sua busca.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
