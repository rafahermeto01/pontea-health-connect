import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
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
  
  const clearFilters = () => {
    setQuery("");
    setSelectedSpecialties([]);
    setCity("all");
    setPriceRange([0, 100000]);
    setMinRating(0);
    setConsultationType("all");
    setSort("rating");
  };

  const FilterPanel = () => (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 hidden lg:flex">
        <h3 className="text-sm font-bold text-slate-900 font-heading">Filtros</h3>
        <button 
          onClick={clearFilters}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Specialties - checkboxes */}
      <div className="pb-4 border-b border-slate-100 mb-4">
        <label className="mb-3 block font-heading font-semibold text-xs uppercase tracking-wider text-slate-500">
          Especialidade
        </label>
        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {specialties.map((s) => (
            <label key={s} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group">
              <Checkbox
                checked={selectedSpecialties.includes(s)}
                onCheckedChange={() => toggleSpecialty(s)}
                className="border-slate-300 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <span className="group-hover:text-teal-700 transition-colors">{s}</span>
            </label>
          ))}
          {specialties.length === 0 && (
            <span className="text-xs text-slate-400">Carregando...</span>
          )}
        </div>
      </div>

      {/* City */}
      <div className="pb-4 border-b border-slate-100 mb-4">
        <label className="mb-3 block font-heading font-semibold text-xs uppercase tracking-wider text-slate-500">
          Cidade
        </label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-teal-500 rounded-xl">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
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
      <div className="pb-4 border-b border-slate-100 mb-4">
        <label className="mb-3 block font-heading font-semibold text-xs uppercase tracking-wider text-slate-500">
          Preço da Consulta
        </label>
        <div className="text-sm font-medium text-teal-700 mb-3">
          {(priceRange[0] / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} –{" "}
          {(priceRange[1] / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        <Slider
          min={0}
          max={100000}
          step={5000}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mt-2 [&_[role=slider]]:bg-teal-600 [&_[role=slider]]:border-teal-600 [&_.bg-primary]:bg-teal-600"
        />
      </div>

      {/* Min rating */}
      <div className="pb-4 border-b border-slate-100 mb-4">
        <label className="mb-3 block font-heading font-semibold text-xs uppercase tracking-wider text-slate-500">
          Avaliação Mínima
        </label>
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                minRating === r 
                  ? "bg-teal-50 border-teal-200 text-teal-700 font-medium" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {r === 0 ? "Todas" : (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{r}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Consultation type */}
      <div>
        <label className="mb-3 block font-heading font-semibold text-xs uppercase tracking-wider text-slate-500">
          Tipo de Consulta
        </label>
        <div className="flex flex-col gap-2">
          {([["all", "Ambos"], ["online", "Online"], ["presential", "Presencial"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setConsultationType(val)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                consultationType === val 
                  ? "bg-teal-50 text-teal-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Botão limpar filtros mobile */}
      <div className="mt-6 lg:hidden">
        <button 
          onClick={clearFilters}
          className="w-full py-3 text-center border border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 font-medium transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* HEADER DE BUSCA */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou especialidade..."
                className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-base"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile filter trigger - Fixed at bottom */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 hover:shadow-xl px-6 h-12 font-medium">
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="bg-white rounded-t-3xl h-[85vh] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="font-heading text-left">Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6"><FilterPanel /></div>
                  </SheetContent>
                </Sheet>
              </div>

              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-14 w-full sm:w-48 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-teal-500">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="price_asc">Menor Preço</SelectItem>
                  <SelectItem value="price_desc">Maior Preço</SelectItem>
                  <SelectItem value="reviews">Mais Avaliados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 flex flex-col lg:flex-row gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sticky top-40">
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-heading font-semibold text-slate-700 text-lg">
               {loading && doctors.length === 0 ? (
                 "Buscando médicos..."
               ) : (
                 <>
                   <span className="text-teal-600">{totalCount}</span> médico(s) encontrado(s)
                 </>
               )}
            </h1>
          </div>

          <div className="grid gap-4 grid-cols-1">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>

          {loading && (
            <div className="mt-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
              <p>Buscando especialistas perfeitos para você...</p>
            </div>
          )}

          {!loading && hasMore && doctors.length > 0 && (
            <div className="mt-12 text-center">
              <Button 
                onClick={loadMore} 
                className="bg-white border-2 border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 h-12 px-8 font-medium font-heading transition-all"
              >
                Carregar mais médicos
              </Button>
            </div>
          )}

          {!loading && doctors.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200/60 border-dashed">
              <Search className="h-16 w-16 text-slate-300 mb-4" />
              <h2 className="font-heading text-xl font-semibold text-slate-700 mb-2">
                Nenhum médico encontrado
              </h2>
              <p className="text-slate-400 max-w-sm mb-6">
                Não localizamos nenhum especialista com os filtros atuais. Tente expandir sua busca.
              </p>
              <Button 
                onClick={clearFilters}
                className="bg-transparent border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-xl h-11 px-6 transition-colors"
                variant="outline"
              >
                Limpar todos os filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
