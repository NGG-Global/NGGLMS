import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from '../state/store';
import { SignIn } from './SignIn';
import { LearnerHome } from '../learner/LearnerHome';
import { ProgramView } from '../learner/ProgramView';
import { UnitOverview } from '../learner/UnitOverview';
import { UnitOpening } from '../learner/UnitOpening';
import { UnitPlay } from '../learner/UnitPlay';
import { Dashboard } from '../admin/Dashboard';
import { Programs } from '../admin/Programs';
import { ProgramBuilder } from '../admin/ProgramBuilder';
import { ProgramDashboard } from '../admin/ProgramDashboard';
import { Library, LibraryUnitPage } from '../admin/Library';
import { Learners } from '../admin/Learners';
import { Analytics } from '../admin/Analytics';
import { Settings } from '../admin/Settings';
import './shell.css';

function Gate({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { identity, ready } = useStore();
  const location = useLocation();
  if (!ready) return <div className="loading">טוען…</div>;
  if (!identity) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (adminOnly && identity.role !== 'admin') return <Navigate to="/learn" replace />;
  return <>{children}</>;
}

export function App() {
  const { identity } = useStore();

  return (
    <Routes>
      <Route path="/signin" element={identity ? <Navigate to="/" replace /> : <SignIn />} />

      <Route
        path="/"
        element={<Navigate to={identity?.role === 'admin' ? '/admin' : '/learn'} replace />}
      />

      {/* Learner side. Admins can open it too — that is the "preview as learner" path. */}
      <Route
        path="/learn"
        element={
          <Gate>
            <LearnerHome />
          </Gate>
        }
      />
      <Route
        path="/learn/:programId"
        element={
          <Gate>
            <ProgramView />
          </Gate>
        }
      />
      <Route
        path="/learn/:programId/:unitId"
        element={
          <Gate>
            <UnitOverview />
          </Gate>
        }
      />
      <Route
        path="/learn/:programId/:unitId/opening"
        element={
          <Gate>
            <UnitOpening />
          </Gate>
        }
      />
      <Route
        path="/learn/:programId/:unitId/play"
        element={
          <Gate>
            <UnitPlay />
          </Gate>
        }
      />

      {/* Admin side. */}
      <Route
        path="/admin"
        element={
          <Gate adminOnly>
            <Dashboard />
          </Gate>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <Gate adminOnly>
            <Programs />
          </Gate>
        }
      />
      <Route
        path="/admin/programs/new"
        element={
          <Gate adminOnly>
            <ProgramBuilder />
          </Gate>
        }
      />
      <Route
        path="/admin/programs/:programId"
        element={
          <Gate adminOnly>
            <ProgramDashboard />
          </Gate>
        }
      />
      <Route
        path="/admin/programs/:programId/build"
        element={
          <Gate adminOnly>
            <ProgramBuilder />
          </Gate>
        }
      />
      <Route
        path="/admin/library"
        element={
          <Gate adminOnly>
            <Library />
          </Gate>
        }
      />
      <Route
        path="/admin/library/:unitId"
        element={
          <Gate adminOnly>
            <LibraryUnitPage />
          </Gate>
        }
      />
      <Route
        path="/admin/learners"
        element={
          <Gate adminOnly>
            <Learners />
          </Gate>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <Gate adminOnly>
            <Analytics />
          </Gate>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <Gate adminOnly>
            <Settings />
          </Gate>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
