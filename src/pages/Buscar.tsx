import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import DoctorCard from "@/components/DoctorCard";
import StarRating from "@/components/StarRating";
import { mockDoctors, specialties, cities } from "@/data/mockDoctors";
import { useReferral } from "@/hooks/useReferral";

type SortOption = "rating" | "price_asc" | "price_desc";

export default function BuscarPage() {
  useReferral();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [specialty, setSpecialty] = useState(searchParams.get("esp") || "all");
  const [city, setCity] = useState(searchParams.get("cidade") || "all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("rating");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    let docs = mockDoctors.filter((d) => {
      if (query && !d.name.toLowerCase().includes(query.toLowerCase()) && !d.specialty.toLowerCase().includes(query.toLowerCase())) return false;
      if (specialty !== "all" && d.specialty !== specialty) return false;
      if (city !== "all" && !`${d.city} - ${d.uf}`.includes(city)) return false;
      if (d.consultationPrice < priceRange[0] || d.consultationPrice > priceRange[1]) return false;
      if (d.rating < minRating) return false;
      if (onlineOnly && !d.isOnline) return false;
      return true;
    });

    if (sort === "rating") docs.sort((a, b) => b.rating - a.rating);
    else if (sort === "price_asc") docs.sort((a, b) => a.consultationPrice - b.consultationPrice);
    else docs.sort((a, b) => b.consultationPrice - a.consultationPrice);

    return docs;
  }, [query, specialty, city, priceRange, minRating, onlineOnly, sort]);

  const visible = filtered.slice(0, visibleCount);

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Especialidade</label>
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Cidade</label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Faixa de Preço: R${priceRange[0]} – R${priceRange[1]}
        </label>
        <Slider min={0} max={1000} step={50} value={priceRange} onValueChange={setPriceRange} className="mt-2" />
      </div>
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
      <div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="accent-primary" />
          Apenas teleconsulta
        </label>
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
          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} médico(s) encontrado(s)</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {visible.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
          {visible.length < filtered.length && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + 6)}>Carregar mais</Button>
            </div>
          )}
          {filtered.length === 0 && (
            <p className="py-20 text-center text-muted-foreground">Nenhum médico encontrado com esses filtros.</p>
          )}
        </div>
      </div>
    </div>
  );
}
