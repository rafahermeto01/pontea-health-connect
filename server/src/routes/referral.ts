import { Router } from 'express';
import { supabaseAdmin } from '../supabase';

const router = Router();

// POST /api/referral/click
router.post('/click', async (req, res) => {
  try {
    const { ref_code, doctor_id, landing_page, specialty_filter, city_filter } = req.body;

    if (!ref_code) return res.status(400).json({ error: 'ref_code is required' });

    // Find affiliate
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, status')
      .eq('ref_code', ref_code)
      .single();

    if (affiliateError) {
      if (affiliateError.code === 'PGRST116') return res.status(404).json({ error: 'Affiliate not found' });
      throw affiliateError;
    }

    if (affiliate.status !== 'approved') {
      return res.status(403).json({ error: 'Affiliate is not approved' });
    }

    const ip_hash = req.ip || req.socket.remoteAddress;

    const { data: click, error: clickError } = await supabaseAdmin
      .from('referral_clicks')
      .insert({
        affiliate_id: affiliate.id,
        doctor_id: doctor_id || null,
        landing_page,
        specialty_filter: specialty_filter || null,
        city_filter: city_filter || null,
        source_url: req.headers.referer || null,
        ip_hash: ip_hash,
      })
      .select()
      .single();

    if (clickError) throw clickError;

    res.json({ success: true, click });
  } catch (error: any) {
    console.error('Error in referral click:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
