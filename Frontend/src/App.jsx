import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

import Home from './pages/Home'
import SpeciesEncyclopedia from './pages/SpeciesEncyclopedia'
import SpeciesDetail from './pages/SpeciesDetail'
import AIIdentifier from './pages/AIIdentifier'
import ParkMap from './pages/ParkMap'
import Conservation from './pages/Conservation'
import ConservationArticleDetail from './pages/ConservationArticleDetail'
import AddSighting from './pages/AddSighting'
import Submissions from './pages/Submissions'
import Profile from './pages/Profile'
import Notices from './pages/Notices'
import SightingLogAdmin from './pages/admin/SightingLogAdmin'
import SightingDetailAdmin from './pages/admin/SightingDetailAdmin'
import AdminUsers from './pages/admin/AdminUsers'
import AdminConservation from './pages/admin/AdminConservation'
import AdminHotspots from './pages/admin/AdminHotspots'
import Login from './pages/Login'
import Signup from './pages/Signup'
import About from './pages/About'
import NotFound from './pages/NotFound'
import SightingDetail from './pages/SightingDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/species" element={<SpeciesEncyclopedia />} />
        <Route path="/species/:slug" element={<SpeciesDetail />} />
        <Route path="/identify" element={<AIIdentifier />} />
        <Route path="/map" element={<ParkMap />} />
        <Route path="/conservation" element={<Conservation />} />
        <Route path="/conservation/:id" element={<ConservationArticleDetail />} />
        <Route path="/sightings/:id" element={<SightingDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Signed-in visitor routes */}
        <Route
          path="/sightings/new"
          element={
            <ProtectedRoute>
              <AddSighting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <Submissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <Notices />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin/sightings"
          element={
            <ProtectedRoute adminOnly>
              <SightingLogAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sightings/:id"
          element={
            <ProtectedRoute adminOnly>
              <SightingDetailAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conservation"
          element={
            <ProtectedRoute adminOnly>
              <AdminConservation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hotspots"
          element={
            <ProtectedRoute adminOnly>
              <AdminHotspots />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
