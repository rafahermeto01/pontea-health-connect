import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CheckCircle,
  Loader2,
  CalendarDays,
  Clock,
  MessageCircle,
} from "lucide-react";
import {
  format,
  addDays,
  startOfDay,
  parseISO,
  parse,
  addMinutes,
  isBefore,
  isToday,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/* ─── types ─── */
type Availability = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type BlockedSlot = {
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  block_full_day: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctor: any;
};

/* ─── helpers ─── */
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").trim();

const digitsOnly = (s: string) => s.replace(/\D/g, "");

const formatPhone = (raw: string) => {
  const d = digitsOnly(raw);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

const getRefCode = () => {
  const local = localStorage.getItem("pontea_ref");
  const cookieMatch = document.cookie.match(/(?:^;\s*)pontea_ref=([^;]*)/);
  return local || (cookieMatch ? cookieMatch[1] : null);
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/* ═══════════════════════════════════════════════════════ */
export default function BookingModal({ open, onOpenChange, doctor }: Props) {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* state */
  const [step, setStep] = useState(1);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", agree: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  /* ── 30-minute session timeout ── */
  useEffect(() => {
    if (open && !success) {
      timeoutRef.current = setTimeout(() => {
        toast.error("Sua sessão expirou. Por favor tente novamente.");
        onOpenChange(false);
      }, SESSION_TIMEOUT_MS);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open, success, onOpenChange]);

  /* reset on open/close */
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setForm({ name: "", phone: "", email: "", agree: false });
      setSubmitting(false);
      setSuccess(false);
    }
  }, [open]);

  /* fetch availability + blocks once */
  useEffect(() => {
    if (!open || !doctor?.id) return;
    (async () => {
      const { data: avail } = await supabase
        .from("doctor_availability" as any)
        .select("*")
        .eq("doctor_id", doctor.id)
        .eq("is_active", true);
      setAvailability((avail as Availability[]) || []);

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const endStr = format(addDays(new Date(), 31), "yyyy-MM-dd");
      const { data: bl } = await supabase
        .from("blocked_slots" as any)
        .select("blocked_date, start_time, end_time, block_full_day")
        .eq("doctor_id", doctor.id)
        .gte("blocked_date", todayStr)
        .lte("blocked_date", endStr);
      setBlocks((bl as BlockedSlot[]) || []);
    })();
  }, [open, doctor?.id]);

  /* ── calendar ── */
  const calendarDays = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { date: Date; enabled: boolean }[] = [];
    const activeDOWs = new Set(availability.map((a) => a.day_of_week));
    const fullBlockDates = new Set(
      blocks.filter((b) => b.block_full_day).map((b) => b.blocked_date)
    );

    for (let i = 0; i < 30; i++) {
      const d = addDays(today, i);
      const dow = getDay(d);
      const dateStr = format(d, "yyyy-MM-dd");
      // Past dates are always disabled (i=0 is today, never past)
      const enabled = activeDOWs.has(dow) && !fullBlockDates.has(dateStr);
      days.push({ date: d, enabled });
    }
    return days;
  }, [availability, blocks]);

  /* ── slots for selected date ── */
  const fetchSlotsForDate = useCallback(
    async (date: Date) => {
      setLoadingSlots(true);
      const dayStart = format(date, "yyyy-MM-dd") + "T00:00:00";
      const dayEnd = format(date, "yyyy-MM-dd") + "T23:59:59";

      const { data: appts } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", doctor.id)
        .in("status", ["pending", "completed"])
        .gte("scheduled_at", dayStart)
        .lte("scheduled_at", dayEnd);

      setBookedSlots(
        (appts || []).map((a: any) =>
          format(parseISO(a.scheduled_at), "HH:mm")
        )
      );
      setLoadingSlots(false);
    },
    [doctor?.id]
  );

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = getDay(selectedDate);
    const periods = availability.filter((a) => a.day_of_week === dow);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const partialBlocks = blocks.filter(
      (b) => b.blocked_date === dateStr && !b.block_full_day && b.start_time && b.end_time
    );
    const duration = doctor.consultation_duration || 30;
    const slots: string[] = [];

    // Current time filter: if selected date is today, skip past slots
    const now = new Date();
    const isTodayDate = isToday(selectedDate);

    periods.forEach((p) => {
      let cur = parse(p.start_time.substring(0, 5), "HH:mm", selectedDate);
      const end = parse(p.end_time.substring(0, 5), "HH:mm", selectedDate);
      while (cur < end) {
        const t = format(cur, "HH:mm");
        const tEnd = format(addMinutes(cur, duration), "HH:mm");

        // Skip slots that are in the past for today
        if (isTodayDate && isBefore(cur, now)) {
          cur = addMinutes(cur, duration);
          continue;
        }

        // check partial blocks
        const isBlocked = partialBlocks.some((b) => {
          const bs = b.start_time!.substring(0, 5);
          const be = b.end_time!.substring(0, 5);
          return t < be && bs < tEnd;
        });

        // check booked
        const isBooked = bookedSlots.includes(t);

        if (!isBlocked && !isBooked) slots.push(t);
        cur = addMinutes(cur, duration);
      }
    });

    return slots.sort();
  }, [selectedDate, availability, blocks, bookedSlots, doctor.consultation_duration]);

  /* ── validation helpers ── */
  const validateForm = () => {
    const name = sanitize(form.name);
    if (name.length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres.");
      return false;
    }
    const digits = digitsOnly(form.phone);
    if (digits.length < 10 || digits.length > 11) {
      toast.error("Telefone inválido. Deve ter 10 ou 11 dígitos com DDD.");
      return false;
    }
    if (form.email) {
      const email = sanitize(form.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("E-mail inválido.");
        return false;
      }
    }
    if (!form.agree) {
      toast.error("Você precisa aceitar os termos para continuar.");
      return false;
    }
    return true;
  };

  /* ── confirm ── */
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || submitting) return;
    setSubmitting(true);

    try {
      /* build scheduled_at ISO */
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const scheduledAt = `${dateStr}T${selectedTime}:00`;

      /* Prevent past appointments – final check */
      if (isBefore(parseISO(scheduledAt), new Date())) {
        toast.error("Não é possível agendar em um horário que já passou.");
        setSubmitting(false);
        return;
      }

      /* double-check availability (prevents race conditions) */
      const { data: clash } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctor.id)
        .eq("scheduled_at", scheduledAt)
        .in("status", ["pending", "completed"]);

      if (clash && clash.length > 0) {
        toast.error("Este horário acabou de ser reservado. Por favor escolha outro.");
        setStep(2);
        setSelectedTime(null);
        if (selectedDate) fetchSlotsForDate(selectedDate);
        setSubmitting(false);
        return;
      }

      /* affiliate */
      const refCode = getRefCode();
      let affiliateId: string | null = null;
      let commissionRate = 0;

      if (refCode) {
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id, commission_rate")
          .eq("ref_code", refCode)
          .eq("status", "approved")
          .maybeSingle();
        if (aff) {
          affiliateId = aff.id;
          commissionRate = aff.commission_rate ?? 0;
        }
      }

      const priceCents = doctor.consultation_price || 0;
      const platformFeeCents = Math.round(priceCents * 0.2);
      const affiliateCommissionCents = affiliateId
        ? Math.round(priceCents * commissionRate / 100)
        : 0;

      const { data: inserted, error } = await supabase
        .from("appointments")
        .insert({
          doctor_id: doctor.id,
          affiliate_id: affiliateId,
          patient_name: sanitize(form.name),
          patient_phone: digitsOnly(form.phone),
          patient_email: form.email ? sanitize(form.email) : null,
          scheduled_at: scheduledAt,
          status: "pending",
          price_cents: priceCents,
          platform_fee_cents: platformFeeCents,
          affiliate_commission_cents: affiliateCommissionCents,
          ref_code: refCode,
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      /* update referral click */
      if (affiliateId && inserted) {
        await supabase
          .from("referral_clicks")
          .update({ converted: true, appointment_id: inserted.id })
          .eq("affiliate_id", affiliateId)
          .eq("doctor_id", doctor.id)
          .eq("converted", false)
          .order("created_at", { ascending: false })
          .limit(1);
      }

      // Clear timeout on success
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao agendar. Tente novamente.");
      setSubmitting(false);
    }
  };

  /* formatted price */
  const priceFormatted = doctor.consultation_price
    ? (doctor.consultation_price / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "Sob consulta";

  /* WhatsApp link builder */
  const buildWhatsAppLink = () => {
    if (!doctor.phone || !selectedDate || !selectedTime) return null;
    const cleanPhone = digitsOnly(doctor.phone);
    if (!cleanPhone) return null;
    const dataFormatada = format(selectedDate, "dd/MM/yyyy");
    const msg = `Olá Dr(a). ${doctor.full_name}! Acabei de agendar uma consulta pela Pontea para ${dataFormatada} às ${selectedTime}. Meu nome é ${sanitize(form.name)}. Aguardo confirmação!`;
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  /* ── step indicator ── */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              success
                ? "bg-teal-100 text-teal-700"
                : s === step
                ? "bg-teal-600 text-white"
                : s < step
                ? "bg-teal-100 text-teal-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {success || s < step ? <CheckCircle className="h-4 w-4" /> : s}
          </div>
          {i < 3 && (
            <div
              className={`w-8 h-0.5 ${
                s < step || success ? "bg-teal-300" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  /* ── render calendar grid ── */
  const renderCalendar = () => {
    const firstDate = calendarDays[0]?.date;
    if (!firstDate) return null;
    const firstDow = getDay(firstDate);
    const padded: (typeof calendarDays[number] | null)[] = [];
    for (let i = 0; i < firstDow; i++) padded.push(null);
    calendarDays.forEach((d) => padded.push(d));

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((l) => (
            <div
              key={l}
              className="text-center text-[11px] font-semibold text-slate-400 uppercase py-1"
            >
              {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {padded.map((item, i) => {
            if (!item)
              return <div key={`pad-${i}`} className="aspect-square" />;
            const isSelected =
              selectedDate &&
              format(item.date, "yyyy-MM-dd") ===
                format(selectedDate, "yyyy-MM-dd");

            return (
              <button
                key={format(item.date, "yyyy-MM-dd")}
                disabled={!item.enabled}
                onClick={() => {
                  setSelectedDate(item.date);
                  setSelectedTime(null);
                  fetchSlotsForDate(item.date);
                }}
                className={`
                  aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                  ${
                    !item.enabled
                      ? "text-slate-300 cursor-not-allowed bg-slate-50"
                      : isSelected
                      ? "bg-teal-600 text-white shadow-md shadow-teal-200 scale-105"
                      : "text-slate-700 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50"
                  }
                `}
              >
                <span className="text-sm leading-none">
                  {format(item.date, "d")}
                </span>
                <span
                  className={`text-[9px] leading-none ${
                    isSelected ? "text-teal-100" : "text-slate-400"
                  }`}
                >
                  {format(item.date, "MMM", { locale: ptBR })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ═══════  RENDER ═══════ */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-0 bg-white rounded-2xl shadow-xl max-w-lg mx-auto max-h-[90vh] overflow-hidden
                   max-sm:max-w-full max-sm:h-full max-sm:max-h-full max-sm:rounded-none"
      >
        <DialogTitle className="sr-only">Agendar Consulta</DialogTitle>

        <div className="overflow-y-auto max-h-[90vh] max-sm:max-h-full p-6">
          <StepIndicator />

          {/* ═══ SUCCESS SCREEN ═══ */}
          {success && (
            <div className="text-center py-4 animate-in fade-in-0 zoom-in-95">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <CheckCircle className="h-9 w-9 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Consulta agendada com sucesso!
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                O médico receberá sua solicitação e você será notificado da
                confirmação. Guarde essas informações.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6 border border-slate-100">
                <p>
                  <span className="text-slate-400">Médico:</span>{" "}
                  <span className="font-medium text-slate-700">
                    {doctor.full_name}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Especialidade:</span>{" "}
                  <span className="font-medium text-slate-700">
                    {doctor.specialty}
                  </span>
                </p>
                {selectedDate && (
                  <p>
                    <span className="text-slate-400">Data:</span>{" "}
                    <span className="font-medium text-slate-700">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </p>
                )}
                <p>
                  <span className="text-slate-400">Horário:</span>{" "}
                  <span className="font-medium text-slate-700">
                    {selectedTime}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Valor:</span>{" "}
                  <span className="font-medium text-slate-700">
                    {priceFormatted}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {buildWhatsAppLink() && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(buildWhatsAppLink()!, "_blank")}
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar confirmação ao médico via WhatsApp
                  </Button>
                )}

                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/buscar");
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-8"
                >
                  Voltar ao Marketplace
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 1: DATE ═══ */}
          {!success && step === 1 && (
            <div className="animate-in fade-in-0 slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-800">
                  Escolha uma data
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                Selecione o dia da sua consulta com{" "}
                <span className="font-medium text-slate-700">
                  {doctor.full_name}
                </span>
              </p>

              {renderCalendar()}

              <div className="mt-6 flex justify-end">
                <Button
                  disabled={!selectedDate}
                  onClick={() => setStep(2)}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: TIME ═══ */}
          {!success && step === 2 && (
            <div className="animate-in fade-in-0 slide-in-from-right-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center text-sm text-slate-500 hover:text-teal-600 mb-3 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-800">
                  Escolha um horário
                </h3>
              </div>
              {selectedDate && (
                <p className="text-sm text-slate-500 mb-5">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              )}

              {loadingSlots ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : slotsForDate.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Nenhum horário disponível nesta data.
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Tente outro dia.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-2">
                  {slotsForDate.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`
                        py-2.5 px-3 rounded-xl text-sm font-medium border transition-all
                        ${
                          selectedTime === t
                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200"
                            : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50"
                        }
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: PATIENT DATA ═══ */}
          {!success && step === 3 && (
            <div className="animate-in fade-in-0 slide-in-from-right-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center text-sm text-slate-500 hover:text-teal-600 mb-3 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </button>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Seus dados
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Precisamos de algumas informações para finalizar o agendamento.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Seu nome completo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                               focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Telefone com DDD *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        phone: formatPhone(e.target.value),
                      }))
                    }
                    placeholder="(31) 99999-9999"
                    maxLength={16}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                               focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    E-mail{" "}
                    <span className="text-slate-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="seu@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm
                               focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, agree: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600"
                  />
                  <span className="text-sm text-slate-600 leading-snug">
                    Concordo com os{" "}
                    <span className="text-teal-600 font-medium underline">
                      termos de uso
                    </span>{" "}
                    e{" "}
                    <span className="text-teal-600 font-medium underline">
                      política de privacidade
                    </span>{" "}
                    da Pontea.
                  </span>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    if (validateForm()) setStep(4);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6"
                >
                  Revisar
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: CONFIRMATION ═══ */}
          {!success && step === 4 && (
            <div className="animate-in fade-in-0 slide-in-from-right-4">
              <button
                onClick={() => setStep(3)}
                className="flex items-center text-sm text-slate-500 hover:text-teal-600 mb-3 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </button>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Confirme os dados
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Revise o resumo antes de confirmar.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Médico</span>
                  <span className="font-medium text-slate-700">
                    {doctor.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Especialidade</span>
                  <span className="font-medium text-slate-700">
                    {doctor.specialty}
                  </span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Data</span>
                  <span className="font-medium text-slate-700">
                    {selectedDate &&
                      format(
                        selectedDate,
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horário</span>
                  <span className="font-medium text-slate-700">
                    {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor</span>
                  <span className="font-bold text-teal-700 text-base">
                    {priceFormatted}
                  </span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Paciente</span>
                  <span className="font-medium text-slate-700">
                    {sanitize(form.name)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telefone</span>
                  <span className="font-medium text-slate-700">
                    {form.phone}
                  </span>
                </div>
                {form.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-mail</span>
                    <span className="font-medium text-slate-700">
                      {sanitize(form.email)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Agendando…
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
