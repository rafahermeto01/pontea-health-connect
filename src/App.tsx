import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Buscar from "./pages/Buscar";
import DoctorProfile from "./pages/DoctorProfile";
import ForDoctors from "./pages/ForDoctors";
import ForAffiliates from "./pages/ForAffiliates";
import Login from "./pages/Login";
import DoctorRegistration from "./pages/DoctorRegistration";
import AffiliateRegistration from "./pages/AffiliateRegistration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route path="/dr/:slug" element={<DoctorProfile />} />
            <Route path="/para-medicos" element={<ForDoctors />} />
            <Route path="/para-afiliados" element={<ForAffiliates />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro/medico" element={<DoctorRegistration />} />
            <Route path="/cadastro/afiliado" element={<AffiliateRegistration />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
