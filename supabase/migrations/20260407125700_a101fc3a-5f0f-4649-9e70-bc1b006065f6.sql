
-- Affiliates can view their own referral clicks
CREATE POLICY "Affiliates can view their own referral clicks"
ON public.referral_clicks FOR SELECT
TO authenticated
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Affiliates can view their own appointments
CREATE POLICY "Affiliates can view their own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Affiliates can view their own payouts
CREATE POLICY "Affiliates can view their own payouts"
ON public.payouts FOR SELECT
TO authenticated
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Affiliates can insert payout requests
CREATE POLICY "Affiliates can insert their own payouts"
ON public.payouts FOR INSERT
TO authenticated
WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
