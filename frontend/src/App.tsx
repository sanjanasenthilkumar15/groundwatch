import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RoleProvider } from './lib/RoleContext'
import { ThemeProvider } from './lib/ThemeContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BlockPage from './pages/BlockPage'
import RiskMapPage from './pages/RiskMapPage'
import FarmerPage from './pages/FarmerPage'
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

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Role landing pages */}
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/block-dashboard" element={<BlockOfficerPage />} />
            <Route path="/agriculture" element={<AgricultureOfficerPage />} />
            <Route path="/farmer"      element={<FarmerPage />} />

            {/* Shared utility pages */}
            <Route path="/risk-map"    element={<RiskMapPage />} />
            <Route path="/alerts"      element={<AlertsPage />} />

            {/* Station drill-downs */}
            <Route path="/block/:station"        element={<BlockPage />} />
            <Route path="/intervention/:station" element={<InterventionPage />} />
            <Route path="/why/:station"          element={<WhyPage />} />
            <Route path="/stress/:station"       element={<StressPage />} />
            <Route path="/forecast/:station"     element={<ForecastPage />} />
            <Route path="/twin/:station"         element={<DigitalTwinPage />} />
            <Route path="/scenario/:station"     element={<ScenarioPage />} />
            <Route path="/satellite/:station"    element={<SatellitePage />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </ThemeProvider>
  )
}
