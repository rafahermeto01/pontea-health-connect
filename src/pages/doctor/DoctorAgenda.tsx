import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Settings, Lock, User, Clock as ClockIcon } from "lucide-react";
import { format, addDays, startOfDay, parseISO, isBefore, parse, addMinutes, startOfWeek, endOfWeek, subWeeks, addWeeks, isToday as isTodayFn } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Types
type Period = { start_time: string; end_time: string };
type DaySchedule = {
  day_of_week: number;
  active: boolean;
  periods: Period[];
};

type BlockedSlot = {
  id: string;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  block_full_day: boolean;
  reason: string | null;
};

type AppointmentRef = {
  id: string;
  scheduled_at: string;
  patient_name: string;
  patient_phone: string;
  status: string;
  payment_status: string;
  price_cents: number;
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h to 21h

export default function DoctorAgenda() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  // Mobile: selectedDayIndex for single-day view
  const [mobileDayIndex, setMobileDayIndex] = useState(() => new Date().getDay());

  // Section 1 State
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(
    WEEKDAYS.map((_, i) => ({ day_of_week: i, active: false, periods: [] }))
  );

  // Section 2 State
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [blockForm, setBlockForm] = useState({
    date: "",
    fullDay: true,
    start: "",
    end: "",
    reason: ""
  });

  // Appointments state (for the visual calendar)
  const [appointments, setAppointments] = useState<AppointmentRef[]>([]);

  // Collapsible states
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);

  // Appointment detail dialog
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRef | null>(null);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  useEffect(() => {
    if (doctor?.id) {
      fetchData();
    }
  }, [doctor?.id, currentWeekStart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Availability
      const { data: availData, error: availErr } = await supabase
        .from("doctor_availability" as any)
        .select("*")
        .eq("doctor_id", doctor.id)
        .order("day_of_week")
        .order("start_time");

      if (availErr) throw availErr;

      if (availData && availData.length > 0) {
        const scheduleMap = new Map<number, Period[]>();
        availData.forEach((row: any) => {
          if (!scheduleMap.has(row.day_of_week)) {
            scheduleMap.set(row.day_of_week, []);
          }
          if (row.is_active) {
            scheduleMap.get(row.day_of_week)!.push({
              start_time: row.start_time.substring(0, 5),
              end_time: row.end_time.substring(0, 5),
            });
          }
        });

        setWeekSchedule(
          WEEKDAYS.map((_, i) => ({
            day_of_week: i,
            active: scheduleMap.has(i),
            periods: scheduleMap.get(i) || [],
          }))
        );
      }

      // 2. Fetch Blocks for current week
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");
      const { data: blockData, error: blockErr } = await supabase
        .from("blocked_slots" as any)
        .select("*")
        .eq("doctor_id", doctor.id)
        .gte("blocked_date", weekStartStr)
        .lte("blocked_date", weekEndStr);

      if (blockErr) throw blockErr;
      setBlocks(blockData || []);

      // Also fetch all future blocks for the blocks list
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const { data: allBlocks } = await supabase
        .from("blocked_slots" as any)
        .select("*")
        .eq("doctor_id", doctor.id)
        .gte("blocked_date", todayStr)
        .order("blocked_date");

      // We keep the blocks state for the calendar visualization with only current week blocks
      // But we store allBlocks separately for the collapsible list
      setAllBlocks(allBlocks || []);

      // 3. Fetch Appointments for current week
      const { data: apptData, error: apptErr } = await supabase
        .from("appointments")
        .select("id, scheduled_at, patient_name, patient_phone, status, payment_status, price_cents")
        .eq("doctor_id", doctor.id)
        .gte("scheduled_at", currentWeekStart.toISOString())
        .lte("scheduled_at", weekEnd.toISOString())
        .in("status", ["pending", "confirmed", "completed"]);

      if (apptErr) throw apptErr;
      setAppointments(apptData || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [allBlocks, setAllBlocks] = useState<BlockedSlot[]>([]);

  // --- Week navigation ---
  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  // --- Handlers for Section 1 (Week Schedule) ---
  const handleToggleDay = (dayIndex: number, checked: boolean) => {
    setWeekSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayIndex) {
          return {
            ...d,
            active: checked,
            periods: checked && d.periods.length === 0 ? [{ start_time: "08:00", end_time: "12:00" }] : d.periods,
          };
        }
        return d;
      })
    );
  };

  const handlePeriodChange = (dayIndex: number, periodIndex: number, field: "start_time" | "end_time", val: string) => {
    setWeekSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayIndex) {
          const newPeriods = [...d.periods];
          newPeriods[periodIndex] = { ...newPeriods[periodIndex], [field]: val };
          return { ...d, periods: newPeriods };
        }
        return d;
      })
    );
  };

  const handleAddPeriod = (dayIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayIndex) {
          return { ...d, periods: [...d.periods, { start_time: "", end_time: "" }] };
        }
        return d;
      })
    );
  };

  const handleRemovePeriod = (dayIndex: number, periodIndex: number) => {
    setWeekSchedule((prev) =>
      prev.map((d) => {
        if (d.day_of_week === dayIndex) {
          const newPeriods = d.periods.filter((_, i) => i !== periodIndex);
          return { ...d, periods: newPeriods, active: newPeriods.length > 0 };
        }
        return d;
      })
    );
  };

  const saveSchedule = async () => {
    // Validation
    for (const day of weekSchedule) {
      if (!day.active) continue;
      
      if (day.periods.length === 0) {
         toast({ title: "Erro na Validação", description: `O dia ${WEEKDAYS[day.day_of_week]} está ativo mas não tem horários definidos.`, variant: "destructive" });
         return;
      }

      for (let i = 0; i < day.periods.length; i++) {
        const p = day.periods[i];
        if (!p.start_time || !p.end_time) {
          toast({ title: "Erro na Validação", description: `Preencha todos os horários ativados para ${WEEKDAYS[day.day_of_week]}.`, variant: "destructive" });
          return;
        }
        if (p.start_time >= p.end_time) {
          toast({ title: "Erro na Validação", description: `Em ${WEEKDAYS[day.day_of_week]}, o horário de início deve ser menor que o fim.`, variant: "destructive" });
          return;
        }

        // Check overlaps
        for (let j = i + 1; j < day.periods.length; j++) {
           const p2 = day.periods[j];
           if (p2.start_time && p2.end_time) {
             if (p.start_time < p2.end_time && p2.start_time < p.end_time) {
                toast({ title: "Erro na Validação", description: `Sobreposição de horários detectada em ${WEEKDAYS[day.day_of_week]}.`, variant: "destructive" });
                return;
             }
           }
        }
      }
    }

    setSaving(true);
    try {
      // 1. Delete all for doctor
      await supabase.from("doctor_availability" as any).delete().eq("doctor_id", doctor.id);

      // 2. Insert new
      const insertRows: any[] = [];
      weekSchedule.forEach((day) => {
        if (day.active && day.periods.length > 0) {
          day.periods.forEach((p) => {
             insertRows.push({
               doctor_id: doctor.id,
               day_of_week: day.day_of_week,
               start_time: p.start_time,
               end_time: p.end_time,
               is_active: true
             });
          });
        }
      });

      if (insertRows.length > 0) {
        const { error } = await supabase.from("doctor_availability" as any).insert(insertRows);
        if (error) throw error;
      }

      toast({ title: "Sucesso", description: "Horários salvos com sucesso." });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers for Section 2 (Blocks) ---
  const saveBlock = async () => {
    if (!blockForm.date) {
      toast({ title: "Erro", description: "Selecione uma data para bloquear.", variant: "destructive" });
      return;
    }
    
    // validate date
    const selectedDate = parseISO(blockForm.date);
    const today = startOfDay(new Date());
    if (isBefore(selectedDate, today)) {
       toast({ title: "Erro", description: "Não é possível bloquear uma data no passado.", variant: "destructive" });
       return;
    }

    if (!blockForm.fullDay) {
       if (!blockForm.start || !blockForm.end) {
          toast({ title: "Erro", description: "Defina os horários de início e fim do bloqueio.", variant: "destructive" });
          return;
       }
       if (blockForm.start >= blockForm.end) {
          toast({ title: "Erro", description: "O horário de início deve ser menor que o fim.", variant: "destructive" });
          return;
       }
    }

    try {
      const { error } = await supabase.from("blocked_slots" as any).insert({
        doctor_id: doctor.id,
        blocked_date: blockForm.date,
        start_time: blockForm.fullDay ? null : blockForm.start,
        end_time: blockForm.fullDay ? null : blockForm.end,
        block_full_day: blockForm.fullDay,
        reason: blockForm.reason || null
      });

      if (error) throw error;
      toast({ title: "Sucesso", description: "Data bloqueada com sucesso." });
      setBlockForm({ date: "", fullDay: true, start: "", end: "", reason: "" });
      fetchData(); // Refresh blocks and preview
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const removeBlock = async (id: string) => {
    try {
       const { error } = await supabase.from("blocked_slots" as any).delete().eq("id", id);
       if (error) throw error;
       toast({ title: "Removido", description: "Bloqueio removido com sucesso." });
       fetchData();
    } catch (err: any) {
       toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // --- Generate calendar grid data ---
  const generateWeekGrid = () => {
    const duration = doctor.consultation_duration || 30;
    const nowBrasilia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dateDate = addDays(currentWeekStart, i);
      const dateStr = format(dateDate, "yyyy-MM-dd");
      const dayOfWeek = dateDate.getDay();
      const daySchedule = weekSchedule.find(d => d.day_of_week === dayOfWeek);
      const isToday = isTodayFn(dateDate);
      const isPast = isBefore(dateDate, startOfDay(nowBrasilia)) && !isToday;

      const blocksForDay = blocks.filter(b => b.blocked_date === dateStr);
      const fullDayBlock = blocksForDay.find(b => b.block_full_day);

      const apptsForDay = appointments.filter(a =>
        format(parseISO(a.scheduled_at), "yyyy-MM-dd") === dateStr
      );

      type SlotRender = {
        time: string;
        endTime: string;
        status: "available" | "blocked" | "confirmed" | "pending" | "empty";
        patient?: string;
        appointment?: AppointmentRef;
        reason?: string;
        isPast: boolean;
      };

      let slots: SlotRender[] = [];

      // Generate slots for each hour from 7 to 21
      for (const hour of HOURS) {
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;

        if (fullDayBlock) {
          slots.push({
            time: timeStr,
            endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
            status: "blocked",
            reason: fullDayBlock.reason || "Bloqueado",
            isPast: isPast || (isToday && hour < nowBrasilia.getHours()),
          });
          continue;
        }

        // Check if this slot falls within any availability period
        let isWithinAvailability = false;
        if (daySchedule && daySchedule.active) {
          for (const p of daySchedule.periods) {
            if (p.start_time && p.end_time) {
              if (timeStr >= p.start_time && timeStr < p.end_time) {
                isWithinAvailability = true;
                break;
              }
            }
          }
        }

        if (!isWithinAvailability) {
          // Not in availability — skip or show as empty
          continue;
        }

        // Check partial blocks
        let isBlocked = false;
        let blockReason = "";
        for (const bb of blocksForDay) {
          if (!bb.block_full_day && bb.start_time && bb.end_time) {
            if (timeStr < bb.end_time.substring(0, 5) && bb.start_time.substring(0, 5) < `${(hour + 1).toString().padStart(2, "0")}:00`) {
              isBlocked = true;
              blockReason = bb.reason || "Bloqueado";
              break;
            }
          }
        }

        if (isBlocked) {
          slots.push({
            time: timeStr,
            endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
            status: "blocked",
            reason: blockReason,
            isPast: isPast || (isToday && hour < nowBrasilia.getHours()),
          });
          continue;
        }

        // Generate time slots within this hour using the consultation duration
        let cur = parse(timeStr, "HH:mm", dateDate);
        const hourEnd = parse(`${(hour + 1).toString().padStart(2, "0")}:00`, "HH:mm", dateDate);

        // Clamp to availability end
        let effectiveEnd = hourEnd;
        if (daySchedule && daySchedule.active) {
          for (const p of daySchedule.periods) {
            const pEnd = parse(p.end_time.substring(0, 5), "HH:mm", dateDate);
            if (timeStr >= p.start_time && timeStr < p.end_time && pEnd < hourEnd) {
              effectiveEnd = pEnd;
            }
          }
        }

        while (cur < effectiveEnd) {
          const slotTime = format(cur, "HH:mm");
          const slotEnd = format(addMinutes(cur, duration), "HH:mm");
          const slotIsPast = isPast || (isToday && isBefore(cur, nowBrasilia));

          // Match appointment
          const appt = apptsForDay.find(a =>
            format(parseISO(a.scheduled_at), "HH:mm") === slotTime
          );

          if (appt) {
            const isConfirmed = (appt.status === "confirmed" || appt.status === "completed") && appt.payment_status === "paid";
            slots.push({
              time: slotTime,
              endTime: slotEnd,
              status: isConfirmed ? "confirmed" : "pending",
              patient: appt.patient_name,
              appointment: appt,
              isPast: slotIsPast,
            });
          } else {
            slots.push({
              time: slotTime,
              endTime: slotEnd,
              status: "available",
              isPast: slotIsPast,
            });
          }

          cur = addMinutes(cur, duration);
        }
      }

      days.push({
        date: dateDate,
        dateStr,
        dayOfWeek,
        isToday,
        isPast,
        fullDayBlock,
        slots,
      });
    }

    return days;
  };

  const weekDays = generateWeekGrid();

  // Helper to get slot class
  const getSlotClasses = (slot: any) => {
    const base = "rounded-lg px-2 py-1.5 text-xs border transition-all cursor-default";
    const pastOpacity = slot.isPast ? "opacity-40" : "";

    switch (slot.status) {
      case "confirmed":
        return `${base} bg-emerald-50 border-emerald-200 text-emerald-800 ${slot.isPast ? pastOpacity : "hover:shadow-sm cursor-pointer"} `;
      case "pending":
        return `${base} bg-amber-50 border-amber-200 text-amber-800 ${slot.isPast ? pastOpacity : "hover:shadow-sm cursor-pointer"}`;
      case "blocked":
        return `${base} bg-red-50 border-red-100 text-red-400 ${pastOpacity}`;
      case "available":
        return `${base} bg-white border-dashed border-slate-200 text-slate-400 ${pastOpacity}`;
      default:
        return `${base} bg-slate-50 border-slate-100 text-slate-300 ${pastOpacity}`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 transition-all">
      {/* ═══════════════════════════════════════════ */}
      {/* VISUAL CALENDAR — MAIN SECTION              */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
        {/* Week Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h2 className="text-xl font-bold text-slate-800">Minha Agenda</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevWeek} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-4 text-xs font-semibold">
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {format(currentWeekStart, "dd", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* MOBILE: Day Selector */}
        <div className="sm:hidden flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {weekDays.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setMobileDayIndex(idx)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all min-w-[48px] ${
                mobileDayIndex === idx
                  ? "bg-teal-600 text-white shadow-md"
                  : day.isToday
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "bg-slate-50 text-slate-600 border border-slate-100"
              }`}
            >
              <span>{WEEKDAYS_SHORT[day.dayOfWeek]}</span>
              <span className="text-sm font-bold">{format(day.date, "dd")}</span>
            </button>
          ))}
        </div>

        {/* DESKTOP: 7-column grid */}
        <div className="hidden sm:grid grid-cols-7 gap-2">
          {/* Headers */}
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`text-center py-2 rounded-xl mb-1 ${
                day.isToday
                  ? "bg-teal-600 text-white"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              <div className="text-xs font-semibold uppercase">{WEEKDAYS_SHORT[day.dayOfWeek]}</div>
              <div className="text-lg font-bold">{format(day.date, "dd")}</div>
            </div>
          ))}

          {/* Slots */}
          {weekDays.map((day, idx) => (
            <div key={`slots-${idx}`} className="flex flex-col gap-1 min-h-[200px]">
              {day.fullDayBlock ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 rounded-xl bg-red-50 text-red-500 border border-red-100">
                  <Lock className="h-5 w-5 mb-1 opacity-70" />
                  <span className="text-xs font-medium">Bloqueado</span>
                  {day.fullDayBlock.reason && (
                    <span className="text-[10px] mt-0.5 opacity-70">{day.fullDayBlock.reason}</span>
                  )}
                </div>
              ) : day.slots.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-300 p-4">
                  Sem horários
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto max-h-[420px] pr-0.5">
                  {day.slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className={getSlotClasses(slot)}
                      onClick={() => {
                        if (slot.appointment && !slot.isPast) {
                          setSelectedAppointment(slot.appointment);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold">{slot.time}</span>
                        {slot.status === "confirmed" && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                        {slot.status === "pending" && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                      </div>
                      {slot.patient && (
                        <div className="truncate text-[10px] mt-0.5 font-medium opacity-80">
                          {slot.patient}
                        </div>
                      )}
                      {slot.status === "blocked" && (
                        <div className="text-[10px] mt-0.5 opacity-70">{slot.reason || "Bloqueado"}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MOBILE: Single day view */}
        <div className="sm:hidden">
          {weekDays[mobileDayIndex] && (() => {
            const day = weekDays[mobileDayIndex];
            return (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  {format(day.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                {day.fullDayBlock ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl bg-red-50 text-red-500 border border-red-100">
                    <Lock className="h-6 w-6 mb-2 opacity-70" />
                    <span className="text-sm font-medium">Dia inteiro bloqueado</span>
                    {day.fullDayBlock.reason && (
                      <span className="text-xs mt-1 opacity-70">{day.fullDayBlock.reason}</span>
                    )}
                  </div>
                ) : day.slots.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-400">
                    Sem horários configurados para este dia.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {day.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className={`${getSlotClasses(slot)} flex items-center justify-between py-3 px-4`}
                        onClick={() => {
                          if (slot.appointment && !slot.isPast) {
                            setSelectedAppointment(slot.appointment);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm">{slot.time}</span>
                          {slot.patient && (
                            <span className="font-medium text-sm">{slot.patient}</span>
                          )}
                          {slot.status === "blocked" && (
                            <span className="text-xs opacity-70">{slot.reason || "Bloqueado"}</span>
                          )}
                          {slot.status === "available" && (
                            <span className="text-xs">Disponível</span>
                          )}
                        </div>
                        {slot.status === "confirmed" && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Confirmado</span>
                        )}
                        {slot.status === "pending" && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pendente</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></span>
            Confirmado
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded bg-amber-50 border border-amber-200"></span>
            Pendente
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded bg-white border border-dashed border-slate-200"></span>
            Disponível
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-100"></span>
            Bloqueado
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* APPOINTMENT DETAIL DIALOG                   */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={!!selectedAppointment} onOpenChange={(v) => !v && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Detalhes do Agendamento
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3 text-sm pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Paciente</span>
                <span className="font-medium text-slate-800">{selectedAppointment.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telefone</span>
                <span className="font-medium text-slate-800">{selectedAppointment.patient_phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data/Hora</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedAppointment.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor</span>
                <span className="font-heading font-bold text-slate-800">
                  {((selectedAppointment.price_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  selectedAppointment.status === "confirmed" || selectedAppointment.status === "completed"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {selectedAppointment.status === "confirmed" ? "Confirmado" : selectedAppointment.status === "completed" ? "Concluído" : "Pendente"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pagamento</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  selectedAppointment.payment_status === "paid"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {selectedAppointment.payment_status === "paid" ? "Pago" : "Pendente"}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* COLLAPSIBLE: Configurar Horários             */}
      {/* ═══════════════════════════════════════════ */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center">
                  <Settings className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-slate-800">Configurar Horários de Atendimento</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Defina os dias e horários em que você atende</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${scheduleOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 border-t border-slate-100 pt-5">
              <div className="space-y-4">
                {weekSchedule.map((day, dIdx) => (
                  <div key={day.day_of_week} className={`border rounded-xl p-4 transition-colors ${day.active ? "border-teal-200 bg-teal-50/10" : "border-slate-100 bg-slate-50/50"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 w-40">
                        <Switch 
                          checked={day.active} 
                          onCheckedChange={(c) => handleToggleDay(day.day_of_week, c)}
                          className="data-[state=checked]:bg-teal-600"
                        />
                        <span className="font-medium text-slate-700">{WEEKDAYS[day.day_of_week]}</span>
                      </div>

                      {day.active && (
                        <div className="flex-1 flex flex-col gap-3">
                          {day.periods.map((period, pIdx) => (
                            <div key={pIdx} className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-500">Início</span>
                                 <input 
                                    type="time" 
                                    step="1800"
                                    value={period.start_time}
                                    onChange={(e) => handlePeriodChange(dIdx, pIdx, "start_time", e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500 outline-none w-28"
                                 />
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-500">Fim</span>
                                 <input 
                                    type="time" 
                                    step="1800"
                                    value={period.end_time}
                                    onChange={(e) => handlePeriodChange(dIdx, pIdx, "end_time", e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-teal-500 focus:border-teal-500 outline-none w-28"
                                 />
                              </div>
                              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                                 {pIdx === day.periods.length - 1 && (
                                   <Button onClick={() => handleAddPeriod(dIdx)} variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white text-teal-600 border-teal-200 hover:bg-teal-50">
                                     <Plus className="h-4 w-4" />
                                   </Button>
                                 )}
                                 <Button onClick={() => handleRemovePeriod(dIdx, pIdx)} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50">
                                     <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                            </div>
                          ))}
                          {day.periods.length === 0 && (
                            <Button onClick={() => handleAddPeriod(dIdx)} variant="outline" size="sm" className="w-fit text-teal-600 border-teal-200">
                              <Plus className="h-4 w-4 mr-2" /> Adicionar Período
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                 <Button onClick={saveSchedule} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Salvar Horários
                 </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* ═══════════════════════════════════════════ */}
      {/* COLLAPSIBLE: Bloquear Datas                  */}
      {/* ═══════════════════════════════════════════ */}
      <Collapsible open={blocksOpen} onOpenChange={setBlocksOpen}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center">
                  <Lock className="h-4.5 w-4.5 text-red-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-slate-800">Bloquear Datas</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Bloqueie dias que você não poderá atender</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${blocksOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-end gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50 mb-6">
                 <div className="flex flex-col gap-1.5">
                   <label className="text-xs font-medium text-slate-600">Data</label>
                   <input 
                      type="date" 
                      value={blockForm.date}
                      onChange={(e) => setBlockForm(prev => ({...prev, date: e.target.value}))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 outline-none w-36"
                   />
                 </div>
                 
                 <div className="flex flex-col gap-2 mb-2 ml-2">
                   <label className="text-xs font-medium text-slate-600">Dia inteiro</label>
                   <Switch 
                      checked={blockForm.fullDay}
                      onCheckedChange={(c) => setBlockForm(prev => ({...prev, fullDay: c}))}
                      className="data-[state=checked]:bg-teal-600"
                   />
                 </div>

                 {!blockForm.fullDay && (
                   <>
                     <div className="flex flex-col gap-1.5">
                       <label className="text-xs font-medium text-slate-600">Início</label>
                       <input 
                          type="time" 
                          value={blockForm.start}
                          onChange={(e) => setBlockForm(prev => ({...prev, start: e.target.value}))}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 outline-none w-28"
                       />
                     </div>
                     <div className="flex flex-col gap-1.5">
                       <label className="text-xs font-medium text-slate-600">Fim</label>
                       <input 
                          type="time" 
                          value={blockForm.end}
                          onChange={(e) => setBlockForm(prev => ({...prev, end: e.target.value}))}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 outline-none w-28"
                       />
                     </div>
                   </>
                 )}

                 <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                   <label className="text-xs font-medium text-slate-600">Motivo (Opcional)</label>
                   <input 
                      type="text"
                      placeholder="Ex: Feriado"
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm(prev => ({...prev, reason: e.target.value}))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-teal-500 outline-none w-full"
                   />
                 </div>

                 <Button onClick={saveBlock} variant="outline" className="border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100">
                   Bloquear
                 </Button>
              </div>

              {allBlocks.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">Nenhum bloqueio ativo.</div>
              ) : (
                <div className="space-y-3">
                   <h3 className="text-sm font-medium text-slate-700 mb-2">Bloqueios Ativos</h3>
                   {allBlocks.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 border border-red-100 bg-red-50/30 rounded-xl">
                         <div className="flex items-center gap-4">
                           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                              <AlertCircle className="h-5 w-5" />
                           </div>
                           <div>
                             <div className="text-sm font-medium text-slate-800">
                                {format(parseISO(b.blocked_date), "dd/MM/yyyy")}
                                {!b.block_full_day && b.start_time && b.end_time && (
                                   <span className="ml-2 font-normal text-slate-500">
                                      ({b.start_time.substring(0,5)} as {b.end_time.substring(0,5)})
                                   </span>
                                )}
                             </div>
                             {b.reason && <div className="text-xs text-slate-500">{b.reason}</div>}
                           </div>
                         </div>
                         <Button onClick={() => removeBlock(b.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-700 hover:bg-red-50 rounded-full">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                   ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
