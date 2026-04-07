import { Router } from 'express';
import { supabase, supabaseAdmin } from '../supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();


// GET /api/affiliates/dashboard
router.get('/dashboard', requireAuth, async (req: any, res) => {
  try {
    const user_id = req.user.id;

    // Get the affiliate record for this user
    const { data: affiliate, error: affLibError } = await supabaseAdmin
      .from('affiliates')
      .select('id, balance_cents, total_earned_cents')
      .eq('user_id', user_id)
      .single();

    if (affLibError) {
      if (affLibError.code === 'PGRST116') return res.status(404).json({ error: 'User is not an affiliate' });
      throw affLibError;
    }

    // Get total clicks
    const { count: total_clicks, error: clicksError } = await supabaseAdmin
      .from('referral_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id);

    if (clicksError) throw clicksError;

    // Get total appointments
    const { count: total_appointments, error: apptError } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id);

    if (apptError) throw apptError;

    const conversion_rate = total_clicks && total_clicks > 0 
      ? ((total_appointments || 0) / total_clicks) * 100 
      : 0;

    // Calculate commissions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: recentAppointments, error: recApptError } = await supabaseAdmin
      .from('appointments')
      .select('affiliate_commission_cents')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    if (recApptError) throw recApptError;

    const commissions_this_month = recentAppointments.reduce((acc, curr) => acc + (curr.affiliate_commission_cents || 0), 0);

    res.json({
      total_clicks: total_clicks || 0,
      total_appointments: total_appointments || 0,
      conversion_rate,
      balance_cents: affiliate.balance_cents,
      total_earned_cents: affiliate.total_earned_cents,
      commissions_this_month
    });
  } catch (error: any) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/affiliates/payouts
router.post('/payouts', requireAuth, async (req: any, res) => {
  try {
    const user_id = req.user.id;
    const { amount_cents } = req.body;

    if (!amount_cents || isNaN(amount_cents)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (amount_cents < 5000) {
      return res.status(400).json({ error: 'Minimum payout is R$ 50,00' });
    }

    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('affiliates')
      .select('id, balance_cents, pix_key')
      .eq('user_id', user_id)
      .single();

    if (affError) {
      return res.status(400).json({ error: 'Affiliate not found for user' });
    }

    if (amount_cents > affiliate.balance_cents) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (!affiliate.pix_key) {
      return res.status(400).json({ error: 'Pix key is not configured' });
    }

    // Process payout: 1) Insert payout, 2) Decrease balance
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('payouts')
      .insert({
        affiliate_id: affiliate.id,
        amount_cents: amount_cents,
        pix_key: affiliate.pix_key,
        status: 'pending'
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    const { error: updateError } = await supabaseAdmin
      .from('affiliates')
      .update({ balance_cents: affiliate.balance_cents - amount_cents })
      .eq('id', affiliate.id);

    if (updateError) throw updateError;

    res.json({ success: true, payout });
  } catch (error: any) {
    console.error('Error in payout logic:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
