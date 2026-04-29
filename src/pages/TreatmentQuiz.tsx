import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function TreatmentQuiz() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const [step, setStep] = useState<"personal_info" | "quiz" | "eliminated" | "submitting">("personal_info");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    birthdate: "",
    gender: "",
  });

  // Answers State: mapping question id to answer value
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Current question temporary state (for text/number/multiple/scale)
  const [tempAnswer, setTempAnswer] = useState<any>("");

  useEffect(() => {
    const fetchProgramAndQuestions = async () => {
      try {
        // Fetch program
        const { data: progData, error: progError } = await supabase
          .from("treatment_programs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (progError) throw progError;
        setProgram(progData);

        // Fetch questions
        const { data: questData, error: questError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("program_id", progData.id)
          .order("sort_order");

        if (questError) throw questError;
        setQuestions(questData || []);
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

  // Handle start quiz
  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInfo.name || !personalInfo.email || !personalInfo.phone || !personalInfo.birthdate || !personalInfo.gender) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setStep("quiz");
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Load tempAnswer when navigating to a new question
  useEffect(() => {
    if (step === "quiz" && currentQuestion) {
      const existingAnswer = answers[currentQuestion.id];
      if (currentQuestion.question_type === "multiple_choice") {
        setTempAnswer(existingAnswer || []);
      } else if (currentQuestion.question_type === "scale") {
        setTempAnswer(existingAnswer || 5);
      } else {
        setTempAnswer(existingAnswer || "");
      }
    }
  }, [currentQuestionIndex, step, answers, currentQuestion]);

  const handleNext = async (answerValue: any) => {
    // 1. Save answer
    const newAnswers = { ...answers, [currentQuestion.id]: answerValue };
    setAnswers(newAnswers);

    // 2. Check elimination
    if (currentQuestion.is_eliminatory) {
      // Basic match for strings, could be refined based on data structure
      if (String(answerValue).toLowerCase() === String(currentQuestion.eliminatory_answer).toLowerCase()) {
        setStep("eliminated");
        return;
      }
    }

    // 3. Next question or Submit
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Submit
      submitQuiz(newAnswers);
    }
  };

  const handleSingleChoice = (val: string) => {
    setTempAnswer(val);
    // Auto advance after 300ms
    setTimeout(() => {
      handleNext(val);
    }, 300);
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
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
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
        answers: finalAnswers, // Stored as JSONB
        is_eligible: true,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("quiz_responses")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      navigate(`/tratamento/${slug}/resultado?qr=${data.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Erro ao enviar respostas. Tente novamente.");
      setStep("quiz");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (step === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-slate-600">Analisando suas respostas...</p>
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
            {currentQuestion?.eliminatory_message || "Recomendamos que você agende uma consulta presencial com um endocrinologista."}
          </p>
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-6 md:p-8 rounded-2xl shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mb-2">
              Sobre você
            </h1>
            <p className="text-slate-600">
              Precisamos de alguns dados antes de iniciar sua avaliação médica para o programa {program?.title || program?.name}.
            </p>
          </div>
          <form onSubmit={handleStartQuiz} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                required
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <Input
                id="phone"
                required
                placeholder="(11) 99999-9999"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Data de nascimento</Label>
              <Input
                id="birthdate"
                type="date"
                required
                value={personalInfo.birthdate}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birthdate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo biológico</Label>
              <select
                id="gender"
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg mt-6"
            >
              Começar avaliação
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Quiz Step
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  // Options parsing safely
  let options: string[] = [];
  try {
    if (typeof currentQuestion.options === 'string') {
      options = JSON.parse(currentQuestion.options);
    } else if (Array.isArray(currentQuestion.options)) {
      options = currentQuestion.options;
    }
  } catch (e) {
    options = [];
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header & Progress */}
      <header className="sticky top-0 bg-white z-10 p-4 border-b border-slate-100 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 mx-4 max-w-xs">
          <div className="text-xs text-center text-slate-500 mb-2 font-medium">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="w-10"></div> {/* Spacer to balance the header */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center md:text-left leading-tight">
          {currentQuestion?.question_text}
        </h2>

        <div className="space-y-4">
          {/* SINGLE CHOICE */}
          {currentQuestion?.question_type === "single_choice" && (
            <div className="space-y-3">
              {options.map((opt: string, idx: number) => {
                const isSelected = tempAnswer === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSingleChoice(opt)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg font-medium text-slate-800">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* YES/NO */}
          {currentQuestion?.question_type === "yes_no" && (
            <div className="space-y-3">
              {["Sim", "Não"].map((opt) => {
                const isSelected = tempAnswer === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => handleSingleChoice(opt)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg font-medium text-slate-800">{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MULTIPLE CHOICE */}
          {currentQuestion?.question_type === "multiple_choice" && (
            <div className="space-y-3">
              {options.map((opt: string, idx: number) => {
                const isSelected = Array.isArray(tempAnswer) && tempAnswer.includes(opt);
                return (
                  <div
                    key={idx}
                    onClick={() => handleMultipleChoiceChange(opt)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border ${
                        isSelected ? "bg-teal-500 border-teal-500" : "bg-white border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-medium text-slate-800">{opt}</span>
                  </div>
                );
              })}
              <Button
                size="lg"
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
                onClick={() => handleNext(tempAnswer)}
                disabled={!Array.isArray(tempAnswer) || tempAnswer.length === 0}
              >
                {isLastQuestion ? "Ver meu resultado" : "Próxima"}
              </Button>
            </div>
          )}

          {/* TEXT */}
          {currentQuestion?.question_type === "text" && (
            <div className="space-y-6">
              <Textarea
                placeholder="Digite sua resposta..."
                className="min-h-[120px] text-lg p-4 rounded-xl resize-none"
                value={tempAnswer}
                onChange={(e) => setTempAnswer(e.target.value)}
              />
              <Button
                size="lg"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
                onClick={() => handleNext(tempAnswer)}
                disabled={!tempAnswer?.trim()}
              >
                {isLastQuestion ? "Ver meu resultado" : "Próxima"}
              </Button>
            </div>
          )}

          {/* NUMBER */}
          {currentQuestion?.question_type === "number" && (
            <div className="space-y-6">
              <Input
                type="number"
                placeholder="0"
                className="text-lg p-6 rounded-xl"
                value={tempAnswer}
                onChange={(e) => setTempAnswer(e.target.value)}
              />
              <Button
                size="lg"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
                onClick={() => handleNext(tempAnswer)}
                disabled={!tempAnswer}
              >
                {isLastQuestion ? "Ver meu resultado" : "Próxima"}
              </Button>
            </div>
          )}

          {/* SCALE */}
          {currentQuestion?.question_type === "scale" && (
            <div className="space-y-8 mt-8">
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
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 text-lg"
                onClick={() => handleNext(tempAnswer)}
              >
                {isLastQuestion ? "Ver meu resultado" : "Próxima"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
