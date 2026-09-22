import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RoleProvider } from './lib/RoleContext'
import { ThemeProvider } from './lib/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import BlockPage from './pages/BlockPage'
import RiskMapPage from './pages/RiskMapPage'
import AdminPage from './pages/AdminPage'
import AlertsPage from './pages/AlertsPage'
import InterventionPage from './pages/InterventionPage'
import WhyPage from './pages/WhyPage'
import StressPage from './pages/StressPage'
import ForecastPage from './pages/ForecastPage'
import DigitalTwinPage from './pages/DigitalTwinPage'
import ScenarioPage from './pages/ScenarioPage'
import SatellitePage from './pages/SatellitePage'
import BlockOfficerPage from './pages/BlockOfficerPage'
import AgricultureOfficerPage from './pages/AgricultureOfficerPage'
import ConstructionProjectsPage from './pages/ConstructionProjectsPage'
import ConstructionProjectDetailPage from './pages/ConstructionProjectDetailPage'
import ExtractionRequestsPage from './pages/ExtractionRequestsPage'
import ExtractionRequestDetailPage from './pages/ExtractionRequestDetailPage'
import AdvisoryPage from './pages/AdvisoryPage'

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
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
        </BrowserRouter>
      </RoleProvider>
    </ThemeProvider>
  )
}
