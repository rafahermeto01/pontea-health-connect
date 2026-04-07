import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Doctor {
  id: string;
  full_name: string | null;
  slug: string | null;
  specialty: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  consultation_price: number | null;
  avg_rating: number | null;
  total_reviews: number | null;
  accepts_online: boolean | null;
  accepts_presential: boolean | null;
  bio: string | null;
}

export type SortOption = "rating" | "price_asc" | "price_desc" | "reviews";

interface Filters {
  query: string;
  specialties: string[];
  city: string;
  priceMin: number;
  priceMax: number;
  minRating: number;
  consultationType: "all" | "online" | "presential";
  sort: SortOption;
}

const PAGE_SIZE = 20;

export function useDoctors(filters: Filters) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchDoctors = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);

      let query = supabase
        .from("doctors")
        .select("id, full_name, slug, specialty, city, state, avatar_url, consultation_price, avg_rating, total_reviews, accepts_online, accepts_presential, bio", { count: "exact" })
        .eq("is_active", true);

      if (filters.query) {
        query = query.or(
          `full_name.ilike.%${filters.query}%,specialty.ilike.%${filters.query}%`
        );
      }

      if (filters.specialties.length > 0) {
        query = query.in("specialty", filters.specialties);
      }

      if (filters.city && filters.city !== "all") {
        query = query.eq("city", filters.city);
      }

      if (filters.priceMin > 0) {
        query = query.gte("consultation_price", filters.priceMin);
      }
      if (filters.priceMax < 100000) {
        query = query.lte("consultation_price", filters.priceMax);
      }

      if (filters.minRating > 0) {
        query = query.gte("avg_rating", filters.minRating);
      }

      if (filters.consultationType === "online") {
        query = query.eq("accepts_online", true);
      } else if (filters.consultationType === "presential") {
        query = query.eq("accepts_presential", true);
      }

      // Sorting
      switch (filters.sort) {
        case "price_asc":
          query = query.order("consultation_price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("consultation_price", { ascending: false });
          break;
        case "reviews":
          query = query.order("total_reviews", { ascending: false });
          break;
        default:
          query = query.order("avg_rating", { ascending: false });
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error("Error fetching doctors:", error);
        setLoading(false);
        return;
      }

      const results = (data ?? []) as Doctor[];
      setDoctors((prev) => (append ? [...prev, ...results] : results));
      setTotalCount(count ?? 0);
      setHasMore(results.length === PAGE_SIZE);
      setLoading(false);
    },
    [filters]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(0);
    fetchDoctors(0, false);
  }, [fetchDoctors]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchDoctors(next, true);
  }, [page, fetchDoctors]);

  return { doctors, totalCount, loading, hasMore, loadMore };
}

export function useFilterOptions() {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cities, setCities] = useState<{ city: string; state: string }[]>([]);

  useEffect(() => {
    async function load() {
      const [specRes, cityRes] = await Promise.all([
        supabase
          .from("doctors")
          .select("specialty")
          .eq("is_active", true)
          .not("specialty", "is", null)
          .order("specialty"),
        supabase
          .from("doctors")
          .select("city, state")
          .eq("is_active", true)
          .not("city", "is", null)
          .order("city"),
      ]);

      if (specRes.data) {
        const unique = [...new Set(specRes.data.map((d) => d.specialty).filter(Boolean))] as string[];
        setSpecialties(unique);
      }

      if (cityRes.data) {
        const seen = new Set<string>();
        const unique: { city: string; state: string }[] = [];
        for (const d of cityRes.data) {
          const key = `${d.city}-${d.state}`;
          if (!seen.has(key) && d.city) {
            seen.add(key);
            unique.push({ city: d.city, state: d.state ?? "" });
          }
        }
        setCities(unique);
      }
    }
    load();
  }, []);

  return { specialties, cities };
}
