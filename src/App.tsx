import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ProjectsPage from "./pages/ProjectsPage";
import ClientsPage from "./pages/ClientsPage";
import CertificationsPage from "./pages/CertificationsPage";
import ContactPage from "./pages/ContactPage";
import CareersPage from "./pages/CareersPage";
import AdminGuard from "./components/admin/AdminGuard";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminForgotPasswordPage from "./pages/admin/AdminForgotPasswordPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminVerifyOtpPage from "./pages/admin/AdminVerifyOtpPage";
import { adminRoutes } from "@/lib/adminRoutes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          <Route path={adminRoutes.login} element={<AdminLoginPage />} />
          <Route path={adminRoutes.verify} element={<AdminVerifyOtpPage />} />
          <Route path={adminRoutes.forgotPassword} element={<AdminForgotPasswordPage />} />
          <Route element={<AdminGuard />}>
            <Route path={adminRoutes.dashboard} element={<AdminDashboardPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

