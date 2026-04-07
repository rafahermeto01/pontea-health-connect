import { Router } from 'express';
import { supabase, supabaseAdmin } from '../supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { doctor_id, patient_name, patient_phone, patient_email, scheduled_at, ref_code } = req.body;

    if (!doctor_id || !patient_name || !scheduled_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Get Doctor to know the price
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id, consultation_price')
      .eq('id', doctor_id)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const price_cents = doctor.consultation_price || 0;
    const platform_fee_cents = Math.floor(price_cents * 0.20);
    let affiliate_id = null;
    let affiliate_commission_cents = 0;

    // 2. Resolve affiliate if ref_code is present
    if (ref_code) {
      const { data: affiliate, error: affError } = await supabaseAdmin
        .from('affiliates')
        .select('id, commission_rate, status')
        .eq('ref_code', ref_code)
        .eq('status', 'approved')
        .single();

      if (affiliate && !affError) {
        affiliate_id = affiliate.id;
        affiliate_commission_cents = Math.floor(price_cents * (affiliate.commission_rate / 100));
      }
    }

    // 3. Insert appointment
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        doctor_id,
        affiliate_id,
        patient_name,
        patient_phone,
        patient_email,
        scheduled_at,
        status: 'pending',
        price_cents,
        platform_fee_cents,
        affiliate_commission_cents,
        payment_status: 'pending',
        ref_code: ref_code || null
      })
      .select()
      .single();

    if (apptError) throw apptError;

    // 4. Update latest click to converted=true if referral
    if (affiliate_id) {
      // Find the most recent click
      const { data: latestClick } = await supabaseAdmin
        .from('referral_clicks')
        .select('id')
        .eq('affiliate_id', affiliate_id)
        .eq('converted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestClick) {
        await supabaseAdmin
          .from('referral_clicks')
          .update({ 
            converted: true,
            appointment_id: appointment.id
          })
          .eq('id', latestClick.id);
      }
    }

    res.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/status
router.put('/:id/status', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    if (!['completed', 'cancelled', 'no_show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify if the logged-in user is the doctor that owns the appointment
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (doctorError) {
      return res.status(403).json({ error: 'User is not a doctor' });
    }

    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (apptError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.doctor_id !== doctor.id) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    if (appointment.status === status) {
      return res.json({ success: true, appointment });
    }

    // Update the appointment
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    // Provide commission if completed and has affiliate
    if (status === 'completed' && appointment.status !== 'completed' && appointment.affiliate_id) {
      // Get the affiliate
      const { data: affiliate } = await supabaseAdmin
        .from('affiliates')
        .select('balance_cents, total_earned_cents')
        .eq('id', appointment.affiliate_id)
        .single();
      
      if (affiliate) {
        await supabaseAdmin
          .from('affiliates')
          .update({
            balance_cents: affiliate.balance_cents + (appointment.affiliate_commission_cents || 0),
            total_earned_cents: affiliate.total_earned_cents + (appointment.affiliate_commission_cents || 0)
          })
          .eq('id', appointment.affiliate_id);
      }
    }

    res.json({ success: true, status });
  } catch (error: any) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
