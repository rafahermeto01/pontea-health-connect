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
import AffiliateDashboardLayout from "./pages/affiliate/AffiliateDashboardLayout";
import AffiliateOverview from "./pages/affiliate/AffiliateOverview";
import AffiliateGenerateLinks from "./pages/affiliate/AffiliateGenerateLinks";
import AffiliateMyLinks from "./pages/affiliate/AffiliateMyLinks";
import AffiliateCommissions from "./pages/affiliate/AffiliateCommissions";
import AffiliatePayouts from "./pages/affiliate/AffiliatePayouts";

import ProtectedRoute from "@/components/ProtectedRoute";

// Doctor Dashboard Imports
import DoctorDashboardLayout from "./pages/doctor/DoctorDashboardLayout";
import DoctorOverview from "./pages/doctor/DoctorOverview";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAgenda from "./pages/doctor/DoctorAgenda";
import DoctorProfileEdit from "./pages/doctor/DoctorProfileEdit";
import DoctorFinancial from "./pages/doctor/DoctorFinancial";
import DoctorReviews from "./pages/doctor/DoctorReviews";

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
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/afiliado" element={<AffiliateDashboardLayout />}>
              <Route index element={<AffiliateOverview />} />
              <Route path="links" element={<AffiliateGenerateLinks />} />
              <Route path="meus-links" element={<AffiliateMyLinks />} />
              <Route path="comissoes" element={<AffiliateCommissions />} />
              <Route path="saques" element={<AffiliatePayouts />} />
            </Route>

            <Route path="/dashboard/medico" element={<DoctorDashboardLayout />}>
              <Route index element={<DoctorOverview />} />
              <Route path="agendamentos" element={<DoctorAppointments />} />
              <Route path="agenda" element={<DoctorAgenda />} />
              <Route path="perfil" element={<DoctorProfileEdit />} />
              <Route path="financeiro" element={<DoctorFinancial />} />
              <Route path="avaliacoes" element={<DoctorReviews />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
