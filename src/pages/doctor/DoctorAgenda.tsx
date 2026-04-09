import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { format, addDays, startOfDay, parseISO, isBefore, parse, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

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
  scheduled_at: string;
  patient_name: string;
  status: string;
};

export default function DoctorAgenda() {
  const { doctor } = useOutletContext<{ doctor: any }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Section 3 State
  const [appointments, setAppointments] = useState<AppointmentRef[]>([]);

  useEffect(() => {
    if (doctor?.id) {
      fetchData();
    }
  }, [doctor?.id]);

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

      // 2. Fetch Blocks
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: blockData, error: blockErr } = await supabase
        .from("blocked_slots" as any)
        .select("*")
        .eq("doctor_id", doctor.id)
        .gte("blocked_date", todayStr)
        .order("blocked_date");

      if (blockErr) throw blockErr;
      setBlocks(blockData || []);

      // 3. Fetch Appointments for next 7 days
      const in7DaysStr = addDays(new Date(), 7).toISOString();
      const { data: apptData, error: apptErr } = await supabase
        .from("appointments")
        .select("scheduled_at, patient_name, status")
        .eq("doctor_id", doctor.id)
        .gte("scheduled_at", new Date().toISOString())
        .lte("scheduled_at", in7DaysStr);

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
      fetchData(); // reload preview
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


  // --- Logic for Section 3 (Preview) ---
  const generatePreviewSlots = () => {
    const previewDays = [];
    const today = startOfDay(new Date());
    const duration = doctor.consultation_duration || 30; // fallback 30m
    
    for (let i = 0; i < 7; i++) {
       const dateDate = addDays(today, i);
       const dateStr = format(dateDate, "yyyy-MM-dd");
       const dayOfWeek = dateDate.getDay();
       const daySchedule = weekSchedule.find(d => d.day_of_week === dayOfWeek);
       
       const blocksForDay = blocks.filter(b => b.blocked_date === dateStr);
       const fullDayBlock = blocksForDay.find(b => b.block_full_day);
       
       const apptsForDay = appointments.filter(a => format(parseISO(a.scheduled_at), "yyyy-MM-dd") === dateStr);

       type SlotRender = { time: string, status: "available" | "blocked" | "scheduled", patient?: string };
       let slots: SlotRender[] = [];

       if (fullDayBlock) {
          // If full day blocked, maybe no slots to show or just a big blocked message. We'll leave array empty and UI handles it.
       } else if (daySchedule && daySchedule.active) {
          // Generate slots based on periods
          daySchedule.periods.forEach(p => {
             if (p.start_time && p.end_time) {
                let current = parse(p.start_time, "HH:mm", dateDate);
                const end = parse(p.end_time, "HH:mm", dateDate);
                
                while (current < end) {
                   const timeStr = format(current, "HH:mm");
                   const slotEnd = addMinutes(current, duration);
                   const timeEndStr = format(slotEnd, "HH:mm");
                   
                   // Is it blocked by a partial block?
                   let isBlocked = false;
                   for (const bb of blocksForDay) {
                     if (!bb.block_full_day && bb.start_time && bb.end_time) {
                       // overlaps if max(start1, start2) < min(end1, end2)
                       if (timeStr < bb.end_time && bb.start_time < timeEndStr) {
                          isBlocked = true;
                          break;
                       }
                     }
                   }

                   // Is it scheduled?
                   const appt = apptsForDay.find(a => format(parseISO(a.scheduled_at), "HH:mm") === timeStr);

                   if (appt) {
                      slots.push({ time: timeStr, status: "scheduled", patient: appt.patient_name });
                   } else if (isBlocked) {
                      slots.push({ time: timeStr, status: "blocked" });
                   } else {
                      slots.push({ time: timeStr, status: "available" });
                   }
                   
                   current = slotEnd;
                }
             }
          });
       }

       previewDays.push({
          date: dateDate,
          dateStr,
          dayOfWeek,
          fullDayBlock,
          slots: slots.sort((a,b) => a.time.localeCompare(b.time))
       });
    }
    return previewDays;
  };

  const previewDays = generatePreviewSlots();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 transition-all">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Cofigurar Horários de Atendimento</h2>
          <p className="text-sm text-slate-500 mt-1">Defina os dias e horários que você atende. Os pacientes só poderão agendar nesses períodos.</p>
        </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Bloquear Datas</h2>
          <p className="text-sm text-slate-500 mt-1">Bloqueie datas específicas que você não poderá atender (férias, feriados, imprevistos).</p>
        </div>

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

        {blocks.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">Nenhum bloqueio ativo.</div>
        ) : (
          <div className="space-y-3">
             <h3 className="text-sm font-medium text-slate-700 mb-2">Bloqueios Ativos</h3>
             {blocks.map(b => (
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Preview da Semana</h2>
            <p className="text-sm text-slate-500 mt-1">Como sua agenda aparecerá nos próximos 7 dias.</p>
          </div>
          <CalendarIcon className="h-6 w-6 text-slate-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
           {previewDays.map((pDay, idx) => (
              <div key={idx} className={`border rounded-xl p-3 flex flex-col ${pDay.date < startOfDay(new Date()) ? 'opacity-50' : ''}`}>
                 <div className="mb-3 text-center border-b border-slate-100 pb-2">
                    <div className="text-xs font-medium text-slate-500 uppercase">{format(pDay.date, "EEEE", { locale: ptBR })}</div>
                    <div className="text-lg font-bold text-slate-800">{format(pDay.date, "dd/MM")}</div>
                 </div>
                 
                 <div className="flex-1 flex flex-col gap-2 min-h-[100px]">
                    {pDay.fullDayBlock ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 h-full">
                         <AlertCircle className="h-5 w-5 mb-1 opacity-70" />
                         <span className="text-xs font-medium">Bloqueado</span>
                         {pDay.fullDayBlock.reason && <span className="text-[10px] mt-1 opacity-80">{pDay.fullDayBlock.reason}</span>}
                       </div>
                    ) : pDay.slots.length === 0 ? (
                       <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                          Sem horários
                       </div>
                    ) : (
                       <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
                          {pDay.slots.map((slot, sIdx) => (
                             <div 
                               key={sIdx} 
                               className={`
                                 text-xs py-1.5 flex px-2 items-center justify-between rounded-md border
                                 ${slot.status === 'scheduled' ? 'bg-slate-100 border-slate-200 text-slate-600' : 
                                   slot.status === 'blocked' ? 'bg-red-50 border-red-100 text-red-600 line-through' :
                                   'bg-teal-50 border-teal-200 text-teal-800 font-medium'
                                 }
                               `}
                             >
                               <span>{slot.time}</span>
                               {slot.status === 'scheduled' && (
                                 <span className="truncate max-w-[80px] text-[10px] opacity-80">{slot.patient}</span>
                               )}
                               {slot.status === 'blocked' && (
                                 <span className="text-[10px] opacity-80">Bloqueado</span>
                               )}
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
