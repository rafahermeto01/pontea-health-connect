import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET /api/doctors
router.get('/', async (req, res) => {
  try {
    const {
      specialty,
      city,
      min_price,
      max_price,
      min_rating,
      accepts_online,
      sort,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('doctors')
      .select('id, slug, full_name, specialty, city, state, consultation_price, avg_rating, total_reviews, accepts_online, accepts_presential, avatar_url', { count: 'exact' })
      .eq('is_active', true);

    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    if (city) query = query.ilike('city', `%${city}%`);
    if (min_price) query = query.gte('consultation_price', parseInt(min_price as string, 10));
    if (max_price) query = query.lte('consultation_price', parseInt(max_price as string, 10));
    if (min_rating) query = query.gte('avg_rating', parseFloat(min_rating as string));
    if (accepts_online === 'true') query = query.eq('accepts_online', true);

    // sort (best_rated | lowest_price | highest_price | most_reviewed)
    if (sort === 'best_rated') {
      query = query.order('avg_rating', { ascending: false });
    } else if (sort === 'lowest_price') {
      query = query.order('consultation_price', { ascending: true });
    } else if (sort === 'highest_price') {
      query = query.order('consultation_price', { ascending: false });
    } else if (sort === 'most_reviewed') {
      query = query.order('total_reviews', { ascending: false });
    } else {
      // default sort
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data: doctors, error, count } = await query;

    if (error) throw error;

    res.setHeader('X-Total-Count', count || 0);
    res.json(doctors);
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Doctor not found' });
      throw error;
    }

    // fetch recent reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('rating, comment, patient_name, created_at')
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsError) throw reviewsError;

    res.json({
      ...doctor,
      recent_reviews: reviews || []
    });
  } catch (error: any) {
    console.error('Error fetching doctor by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:slug/reviews
router.get('/:slug/reviews', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // First get the doctor id
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (doctorError) {
      if (doctorError.code === 'PGRST116') return res.status(404).json({ error: 'Doctor not found' });
      throw doctorError;
    }

    const { data: reviews, count, error } = await supabase
      .from('doctor_reviews')
      .select('rating, comment, patient_name, created_at', { count: 'exact' })
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.setHeader('X-Total-Count', count || 0);
    res.json(reviews);
  } catch (error: any) {
    console.error('Error fetching doctor reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
