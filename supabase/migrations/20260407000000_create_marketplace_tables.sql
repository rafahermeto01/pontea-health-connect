-- 1. doctors
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    slug TEXT UNIQUE,
    crm_number TEXT,
    crm_state TEXT,
    specialty TEXT,
    bio TEXT,
    avatar_url TEXT,
    consultation_price INTEGER,
    consultation_duration INTEGER DEFAULT 30,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    calendar_link TEXT,
    accepts_online BOOLEAN DEFAULT false,
    accepts_presential BOOLEAN DEFAULT true,
    avg_rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    education TEXT,
    experience_years INTEGER,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    plan TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. affiliates
CREATE TABLE public.affiliates (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    document TEXT,
    niche TEXT,
    instagram_handle TEXT,
    followers_count INTEGER,
    ref_code TEXT UNIQUE,
    commission_rate INTEGER DEFAULT 10,
    balance_cents INTEGER DEFAULT 0,
    total_earned_cents INTEGER DEFAULT 0,
    pix_key TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id),
    affiliate_id UUID REFERENCES public.affiliates(id),
    patient_name TEXT,
    patient_phone TEXT,
    patient_email TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    price_cents INTEGER,
    platform_fee_cents INTEGER,
    affiliate_commission_cents INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    ref_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. referral_clicks
CREATE TABLE public.referral_clicks (
    id UUID PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id),
    doctor_id UUID REFERENCES public.doctors(id),
    landing_page TEXT,
    specialty_filter TEXT,
    city_filter TEXT,
    source_url TEXT,
    ip_hash TEXT,
    converted BOOLEAN DEFAULT false,
    appointment_id UUID REFERENCES public.appointments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. payouts
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id),
    amount_cents INTEGER,
    pix_key TEXT,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. doctor_reviews
CREATE TABLE public.doctor_reviews (
    id UUID PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id),
    appointment_id UUID REFERENCES public.appointments(id),
    patient_name TEXT,
    rating INTEGER CHECK (rating between 1 and 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
