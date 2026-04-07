import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET /api/specialties
router.get('/specialties', async (req, res) => {
  try {
    // In PostgreSQL / PostgREST through Supabase, we can use an RPC or just fetch distinct values.
    // If you don't have an RPC for distinct, fetching all active and mapping uniqueness in memory is acceptable for small datasets,
    // though the best approach at scale is a database view or RPC: SELECT DISTINCT specialty FROM doctors WHERE is_active = true.
    // Given standard PostgREST doesn't support SELECT DISTINCT natively without RPCs/Views, we simulate here or use RPC if created.
    // We'll simulate via JS for now
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('specialty')
      .eq('is_active', true)
      .neq('specialty', null);

    if (error) throw error;

    const specialties = [...new Set(doctors.map(d => d.specialty))].sort();

    res.json(specialties);
  } catch (error: any) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cities
router.get('/cities', async (req, res) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('city, state')
      .eq('is_active', true)
      .neq('city', null);

    if (error) throw error;

    // To make it distinct based on city AND state
    const uniqueCityMap = new Map();
    doctors.forEach(d => {
      const key = `${d.city}-${d.state}`;
      if (!uniqueCityMap.has(key)) {
        uniqueCityMap.set(key, { city: d.city, state: d.state });
      }
    });

    const cities = Array.from(uniqueCityMap.values()).sort((a, b) => a.city.localeCompare(b.city));

    res.json(cities);
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
