import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RoleProvider } from './lib/RoleContext'
import { ThemeProvider } from './lib/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './landing/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

/* The officer console pulls in Leaflet, Recharts and every dashboard screen.
   None of that belongs in the first load of a public landing page, so the
   authenticated routes are code-split. Routing itself is unchanged. */
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const BlockPage = lazy(() => import('./pages/BlockPage'))
const RiskMapPage = lazy(() => import('./pages/RiskMapPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const InterventionPage = lazy(() => import('./pages/InterventionPage'))
const WhyPage = lazy(() => import('./pages/WhyPage'))
const StressPage = lazy(() => import('./pages/StressPage'))
const ForecastPage = lazy(() => import('./pages/ForecastPage'))
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'))
const ScenarioPage = lazy(() => import('./pages/ScenarioPage'))
const SatellitePage = lazy(() => import('./pages/SatellitePage'))
const BlockOfficerPage = lazy(() => import('./pages/BlockOfficerPage'))
const AgricultureOfficerPage = lazy(() => import('./pages/AgricultureOfficerPage'))
const ConstructionProjectsPage = lazy(() => import('./pages/ConstructionProjectsPage'))
const ConstructionProjectDetailPage = lazy(() => import('./pages/ConstructionProjectDetailPage'))
const ExtractionRequestsPage = lazy(() => import('./pages/ExtractionRequestsPage'))
const ExtractionRequestDetailPage = lazy(() => import('./pages/ExtractionRequestDetailPage'))
const AdvisoryPage = lazy(() => import('./pages/AdvisoryPage'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary font-ui text-sm">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public landing page — the officer console lives behind /login */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Role landing pages */}
              <Route path="/dashboard"   element={<ProtectedRoute allow={['district']}><DashboardPage /></ProtectedRoute>} />
              <Route path="/block-dashboard" element={<ProtectedRoute allow={['block']}><BlockOfficerPage /></ProtectedRoute>} />
              <Route path="/agriculture" element={<ProtectedRoute allow={['agriculture']}><AgricultureOfficerPage /></ProtectedRoute>} />
              <Route path="/admin"       element={<ProtectedRoute allow={['admin']}><AdminPage /></ProtectedRoute>} />

              {/* Admin workflows */}
              <Route path="/admin/construction"      element={<ProtectedRoute allow={['admin']}><ConstructionProjectsPage /></ProtectedRoute>} />
              <Route path="/admin/construction/:id"  element={<ProtectedRoute allow={['admin']}><ConstructionProjectDetailPage /></ProtectedRoute>} />
              <Route path="/admin/extraction"        element={<ProtectedRoute allow={['admin']}><ExtractionRequestsPage /></ProtectedRoute>} />
              <Route path="/admin/extraction/:id"    element={<ProtectedRoute allow={['admin']}><ExtractionRequestDetailPage /></ProtectedRoute>} />
              <Route path="/admin/advisory"           element={<ProtectedRoute allow={['admin']}><AdvisoryPage /></ProtectedRoute>} />

              {/* Shared utility pages — any logged-in officer */}
              <Route path="/risk-map"    element={<ProtectedRoute><RiskMapPage /></ProtectedRoute>} />
              <Route path="/alerts"      element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />

              {/* Station drill-downs — any logged-in officer (backend still enforces block scoping) */}
              <Route path="/block/:station"        element={<ProtectedRoute><BlockPage /></ProtectedRoute>} />
              <Route path="/intervention/:station" element={<ProtectedRoute><InterventionPage /></ProtectedRoute>} />
              <Route path="/why/:station"          element={<ProtectedRoute><WhyPage /></ProtectedRoute>} />
              <Route path="/stress/:station"       element={<ProtectedRoute><StressPage /></ProtectedRoute>} />
              <Route path="/forecast/:station"     element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} />
              <Route path="/twin/:station"         element={<ProtectedRoute><DigitalTwinPage /></ProtectedRoute>} />
              <Route path="/scenario/:station"     element={<ProtectedRoute><ScenarioPage /></ProtectedRoute>} />
              <Route path="/satellite/:station"    element={<ProtectedRoute><SatellitePage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </RoleProvider>
    </ThemeProvider>
  )
}
