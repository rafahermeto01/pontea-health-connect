import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft, CheckCircle, Info, Star, User, Sparkles, Package } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentQuiz() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  
  const [quizFlow, setQuizFlow] = useState<any[]>([]);

  const [step, setStep] = useState<"personal_info" | "quiz" | "eliminated" | "submitting" | "beautiful_loading">("personal_info");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    birthdate: "",
    gender: "",
  });
  
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Answers State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [tempAnswer, setTempAnswer] = useState<any>("");
  
  // Loading State
  const [finalResponseId, setFinalResponseId] = useState<string>("");
  const [loadingText, setLoadingText] = useState("Analisando suas respostas...");

  useEffect(() => {
    const fetchProgramAndQuestions = async () => {
      try {
        const { data: progData, error: progError } = await supabase
          .from("treatment_programs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (progError) throw progError;
        setProgram(progData);

        const { data: questData, error: questError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("program_id", progData.id)
          .order("sort_order");

        if (questError) throw questError;
        
        const qData = questData || [];
        const flow: any[] = [];
        
        qData.forEach((q, index) => {
          flow.push({ type: 'question', data: q });
          if (index === 2) {
            flow.push({ type: 'interstitial', id: 'int-1' });
          } else if (index === 15) {
            flow.push({ type: 'interstitial', id: 'int-2' });
          } else if (index === 21) {
            flow.push({ type: 'interstitial', id: 'int-3' });
          }
        });
        
        setQuizFlow(flow);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Erro ao carregar o questionário.");
        navigate(`/tratamento/${slug}`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProgramAndQuestions();
  }, [slug, navigate]);

  useEffect(() => {
    if (step === "beautiful_loading" && finalResponseId) {
      const messages = [
        "Analisando suas respostas...",
        "Buscando o melhor tratamento...",
        "Quase pronto..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingText(messages[i]);
      }, 1300);

      const timer = setTimeout(() => {
        navigate(`/tratamento/${slug}/resultado?qr=${finalResponseId}`);
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [step, finalResponseId, navigate, slug]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInfo.name || !personalInfo.email || !personalInfo.phone || !birthDay || !birthMonth || !birthYear || !personalInfo.gender) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(d) || d < 1 || d > 31) {
      toast.error("Dia de nascimento inválido.");
      return;
    }
    if (isNaN(m) || m < 1 || m > 12) {
      toast.error("Mês de nascimento inválido.");
      return;
    }
    if (isNaN(y) || y < 1920 || y > currentYear) {
      toast.error("Ano de nascimento inválido.");
      return;
    }

    const birthDateObj = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const mDiff = today.getMonth() - birthDateObj.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 18) {
      toast.error("Você precisa ter pelo menos 18 anos.");
      return;
    }

    const formattedBirthdate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setPersonalInfo({ ...personalInfo, birthdate: formattedBirthdate });

    setStep("quiz");
  };

  const currentStepObj = quizFlow[currentStepIndex];

  useEffect(() => {
    if (step === "quiz" && currentStepObj?.type === "question") {
      const q = currentStepObj.data;
      const existingAnswer = answers[q.id];
      if (q.question_type === "multiple_choice") {
        setTempAnswer(existingAnswer || []);
      } else if (q.question_type === "scale") {
        setTempAnswer(existingAnswer || 5);
      } else {
        setTempAnswer(existingAnswer || "");
      }
    }
  }, [currentStepIndex, step, answers, currentStepObj]);

  const handleNext = async (answerValue: any) => {
    let finalAnswers = answers;
    
    if (currentStepObj.type === "question") {
      const q = currentStepObj.data;
      finalAnswers = { ...answers, [q.id]: answerValue };
      setAnswers(finalAnswers);

      if (q.is_eliminatory) {
        if (String(answerValue).toLowerCase() === String(q.eliminatory_answer).toLowerCase()) {
          setStep("eliminated");
          return;
        }
      }
    }

    if (currentStepIndex < quizFlow.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      submitQuiz(finalAnswers);
    }
  };

  const handleInterstitialNext = () => {
    if (currentStepIndex < quizFlow.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSingleChoice = (val: string) => {
    setTempAnswer(val);
    setTimeout(() => {
      handleNext(val);
    }, 400);
  };

  const handleMultipleChoiceChange = (val: string) => {
    const current = Array.isArray(tempAnswer) ? tempAnswer : [];
    if (current.includes(val)) {
      setTempAnswer(current.filter((item) => item !== val));
    } else {
      setTempAnswer([...current, val]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setStep("personal_info");
    }
  };

  const submitQuiz = async (finalAnswers: Record<string, any>) => {
    setStep("submitting");
    try {
      const payload = {
        program_id: program.id,
        patient_name: personalInfo.name,
        patient_email: personalInfo.email,
        patient_phone: personalInfo.phone,
        patient_birthdate: personalInfo.birthdate,
        patient_gender: personalInfo.gender,
        answers: finalAnswers,
        is_eligible: true,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("quiz_responses")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setFinalResponseId(data.id);
      setStep("beautiful_loading");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Erro ao enviar respostas. Tente novamente.");
      setStep("quiz");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Carregando...</div>;
  }

  if (step === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5">
        <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Finalizando avaliação...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-8"></div>
      </div>
    );
  }

  if (step === "beautiful_loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-rose-50 px-6">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="w-16 h-16 text-teal-600 mx-auto mb-8 animate-bounce">
            <Package className="w-full h-full" />
          </div>
          
          <h2 className="font-heading text-2xl font-bold text-slate-900 text-center mb-10 leading-relaxed">
            Hora de conhecer o plano Pontea que mais se adequa ao seu perfil.
          </h2>
          
          <div className="w-64 mx-auto h-2 rounded-full bg-slate-200 mb-4 overflow-hidden relative">
            <div 
              className="bg-teal-500 h-full rounded-full absolute left-0 top-0"
              style={{
                animation: 'fillProgress 4s ease-in-out forwards',
              }}
            ></div>
          </div>
          
          <p className="text-sm font-medium text-slate-500 min-h-[20px] animate-pulse transition-opacity">
            {loadingText}
          </p>

          <style>{`
            @keyframes fillProgress {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (step === "eliminated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Não elegível</h2>
          <p className="text-slate-600 mb-6">
            Recomendamos que você agende uma consulta presencial com um endocrinologista.
          </p>
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg min-h-[56px]"
            onClick={() => navigate("/buscar?esp=endocrinologia")}
          >
            Buscar endocrinologista
          </Button>
        </div>
      </div>
    );
  }

  if (step === "personal_info") {
    return (
      <div className="min-h-screen bg-white px-5 flex items-center justify-center">
        <div className="w-full max-w-lg py-8">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-xl md:text-3xl font-heading font-bold text-slate-900 mb-2">
              Seus dados
            </h1>
            <p className="text-slate-600 text-sm">
              Precisamos de alguns dados antes de iniciar sua avaliação médica para o programa {program?.title || program?.name}.
            </p>
          </div>
          <form onSubmit={handleStartQuiz} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name" className="text-sm font-medium text-slate-600">Nome completo</Label>
              <Input
                id="name"
                required
                className="w-full py-4 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="email" className="text-sm font-medium text-slate-600">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                className="w-full py-4 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-600">Telefone (com DDD)</Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="(11) 99999-9999"
                className="w-full py-4 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-slate-600">Data de nascimento</Label>
              <div className="flex gap-2 w-full">
                <Input
                  placeholder="DD"
                  type="tel"
                  min="1"
                  max="31"
                  required
                  className="flex-1 w-full py-4 px-2 text-base text-center bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value.slice(0, 2))}
                />
                <Input
                  placeholder="MM"
                  type="tel"
                  min="1"
                  max="12"
                  required
                  className="flex-1 w-full py-4 px-2 text-base text-center bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value.slice(0, 2))}
                />
                <Input
                  placeholder="AAAA"
                  type="tel"
                  min="1920"
                  max={new Date().getFullYear()}
                  required
                  className="flex-1 w-full py-4 px-2 text-base text-center bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px]"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.slice(0, 4))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="gender" className="text-sm font-medium text-slate-600">Sexo biológico</Label>
              <select
                id="gender"
                required
                className="w-full py-4 px-4 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[52px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
              >
                <option value="">Selecione...</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 text-lg font-semibold mt-6 min-h-[56px]"
            >
              Iniciar questionário
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Quiz & Interstitials Layout
  const totalQuestions = quizFlow.filter(item => item.type === "question").length;
  const currentQuestionNumber = quizFlow.slice(0, currentStepIndex + 1).filter(item => item.type === "question").length;
  const progressPercentage = (currentQuestionNumber / totalQuestions) * 100;
  const isLastQuestion = currentQuestionNumber === totalQuestions;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header & Progress (Only show progress if it's a question, or keep it frozen if interstitial) */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 flex flex-col">
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-teal-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-slate-400 text-center py-2 bg-white relative">
          {currentStepIndex > 0 && (
            <button 
              onClick={handleBack} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {currentStepObj.type === "question" ? `Pergunta ${currentQuestionNumber} de ${totalQuestions}` : `Quase lá!`}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center w-full px-6 pt-16 pb-24 animate-in fade-in slide-in-from-right-4 duration-300">
        
        {/* INTERSTITIAL 1 */}
        {currentStepObj.type === "interstitial" && currentStepObj.id === "int-1" && (
          <div className="w-full max-w-md mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">
                Evolução de verdade com
              </h2>
              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-lg inline-block font-bold text-xl">
                suporte médico contínuo
              </span>
            </div>

            <div className="bg-teal-50 rounded-2xl p-5 mb-4 flex items-center gap-4">
              <span className="font-heading text-4xl font-extrabold text-teal-600">53%</span>
              <p className="text-slate-600 text-sm leading-tight">mais chances de resultados do que somente com medicação¹</p>
            </div>

            <div className="bg-teal-50 rounded-2xl p-5 mb-8 flex items-center gap-4">
              <span className="font-heading text-4xl font-extrabold text-teal-600">92%</span>
              <p className="text-slate-600 text-sm leading-tight">estão confiantes de que irão manter o peso conquistado²</p>
            </div>

            <div className="flex items-center gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex -space-x-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">AB</div>
                <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-xs font-bold text-rose-700">MC</div>
                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700">RL</div>
              </div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">
                Junte-se a mais de 10.000 pessoas emagrecendo com a Pontea
              </p>
            </div>

            <div className="space-y-1 mt-auto">
              <p className="text-xs text-slate-400">¹Em um estudo realizado com 57.975 participantes.</p>
              <p className="text-xs text-slate-400">²Em uma pesquisa de atendimento ao cliente com 300 assinantes ao longo de 6 meses.</p>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 md:static md:bg-transparent md:border-none md:p-0 md:mt-8">
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
                onClick={handleInterstitialNext}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* INTERSTITIAL 2 */}
        {currentStepObj.type === "interstitial" && currentStepObj.id === "int-2" && (
          <div className="w-full max-w-md mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <h2 className="font-heading text-2xl font-bold text-slate-900 text-center mb-6 leading-tight">
              Veja como a Pontea transformou a vida de muitas pessoas
            </h2>
            
            <div className="flex justify-center gap-1 mb-8 text-amber-400">
              <Star className="w-6 h-6 fill-amber-400" />
              <Star className="w-6 h-6 fill-amber-400" />
              <Star className="w-6 h-6 fill-amber-400" />
              <Star className="w-6 h-6 fill-amber-400" />
              <Star className="w-6 h-6 fill-amber-400" />
            </div>

            <div className="flex gap-4 items-center justify-center mb-10">
              <div className="bg-teal-50 rounded-xl p-5 text-center flex-1">
                <span className="font-heading text-3xl font-extrabold text-teal-600 block mb-1">-16 kg</span>
                <span className="text-sm text-slate-500 font-medium">em apenas 3 meses</span>
              </div>
              <div className="bg-slate-100 rounded-2xl w-32 h-40 flex items-center justify-center relative shrink-0">
                <User className="w-10 h-10 text-slate-300" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Antes</span>
                  <span className="bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Depois</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-400 mt-auto bg-slate-50 p-3 rounded-xl">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Os resultados são individuais e cada organismo responde de uma maneira.</p>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 md:static md:bg-transparent md:border-none md:p-0 md:mt-8">
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
                onClick={handleInterstitialNext}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* INTERSTITIAL 3 */}
        {currentStepObj.type === "interstitial" && currentStepObj.id === "int-3" && (
          <div className="w-full max-w-md mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center items-center text-center">
            
            <div className="bg-teal-50 rounded-full p-6 mb-8">
              <Sparkles className="w-16 h-16 text-teal-600" />
            </div>
            
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-3">
              Você está quase lá!
            </h2>
            <p className="text-slate-500 text-base mb-10">
              Faltam apenas algumas perguntas para montarmos o tratamento ideal para você.
            </p>

            <div className="w-full max-w-[200px] h-3 bg-slate-100 rounded-full overflow-hidden mb-12">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out w-0"
                style={{ width: '85%' }}
              ></div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 md:static md:bg-transparent md:border-none md:p-0 w-full">
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 min-h-[56px] text-lg font-semibold"
                onClick={handleInterstitialNext}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* QUESTION RENDER */}
        {currentStepObj.type === "question" && (
          <div className="w-full max-w-2xl mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900 text-center mb-8 px-2 leading-relaxed">
              {currentStepObj.data.question_text}
            </h2>

            <div className="w-full">
              {/* SINGLE CHOICE */}
              {currentStepObj.data.question_type === "single_choice" && (
                <div className="flex flex-col gap-3 w-full">
                  {(Array.isArray(currentStepObj.data.options) ? currentStepObj.data.options : JSON.parse(currentStepObj.data.options || "[]")).map((opt: string, idx: number) => {
                    const isSelected = tempAnswer === opt;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSingleChoice(opt)}
                        className={`w-full py-4 px-5 text-left text-base rounded-2xl active:scale-[0.98] transition-all duration-200 border-2 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="font-medium text-slate-800">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* YES/NO */}
              {currentStepObj.data.question_type === "yes_no" && (
                <div className="flex gap-4 w-full">
                  {["Sim", "Não"].map((opt) => {
                    const isSelected = tempAnswer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSingleChoice(opt)}
                        className={`flex-1 py-6 text-center text-lg font-semibold rounded-2xl active:scale-[0.98] transition-all duration-200 border-2 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MULTIPLE CHOICE */}
              {currentStepObj.data.question_type === "multiple_choice" && (
                <div className="flex flex-col gap-3 w-full">
                  {(Array.isArray(currentStepObj.data.options) ? currentStepObj.data.options : JSON.parse(currentStepObj.data.options || "[]")).map((opt: string, idx: number) => {
                    const isSelected = Array.isArray(tempAnswer) && tempAnswer.includes(opt);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleMultipleChoiceChange(opt)}
                        className={`w-full py-4 px-5 text-left text-base rounded-2xl active:scale-[0.98] transition-all duration-200 border-2 flex items-center gap-3 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center border shrink-0 ${
                            isSelected ? "bg-teal-500 border-teal-500" : "bg-white border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{opt}</span>
                      </button>
                    );
                  })}
                  <Button
                    size="lg"
                    className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 text-lg font-semibold min-h-[56px]"
                    onClick={() => handleNext(tempAnswer)}
                    disabled={!Array.isArray(tempAnswer) || tempAnswer.length === 0}
                  >
                    {isLastQuestion ? "Ver meu tratamento" : "Próxima"}
                  </Button>
                </div>
              )}

              {/* TEXT */}
              {currentStepObj.data.question_type === "text" && (
                <div className="flex flex-col gap-4 w-full">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    className="w-full min-h-[120px] p-4 text-base bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-0 resize-none"
                    value={tempAnswer}
                    onChange={(e) => setTempAnswer(e.target.value)}
                  />
                  <Button
                    size="lg"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 text-lg font-semibold mt-4 min-h-[56px]"
                    onClick={() => handleNext(tempAnswer)}
                    disabled={!tempAnswer?.trim()}
                  >
                    {isLastQuestion ? "Ver meu tratamento" : "Próxima"}
                  </Button>
                </div>
              )}

              {/* NUMBER */}
              {currentStepObj.data.question_type === "number" && (
                <div className="flex flex-col gap-4 w-full">
                  <Input
                    type="tel"
                    placeholder="0"
                    className="w-full py-4 px-5 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 min-h-[64px]"
                    value={tempAnswer}
                    onChange={(e) => setTempAnswer(e.target.value)}
                  />
                  <Button
                    size="lg"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 text-lg font-semibold mt-4 min-h-[56px]"
                    onClick={() => handleNext(tempAnswer)}
                    disabled={!tempAnswer}
                  >
                    {isLastQuestion ? "Ver meu tratamento" : "Próxima"}
                  </Button>
                </div>
              )}

              {/* SCALE */}
              {currentStepObj.data.question_type === "scale" && (
                <div className="flex flex-col gap-8 mt-4 w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold text-teal-600 mb-6">{tempAnswer}</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={tempAnswer || 5}
                      onChange={(e) => setTempAnswer(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between w-full mt-2 text-sm font-medium text-slate-400">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl py-4 text-lg font-semibold min-h-[56px]"
                    onClick={() => handleNext(tempAnswer)}
                  >
                    {isLastQuestion ? "Ver meu tratamento" : "Próxima"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
