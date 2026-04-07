import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useReferral() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("pontea_ref", ref);
      document.cookie = `pontea_ref=${ref}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }, [searchParams]);

  return localStorage.getItem("pontea_ref");
}
