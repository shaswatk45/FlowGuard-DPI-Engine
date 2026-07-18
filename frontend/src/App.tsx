import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Upload } from './pages/Upload';
import { Dashboard } from './pages/Dashboard';
import { Rules } from './pages/Rules';
import { History } from './pages/History';
import { ToastContainer } from './components/ToastContainer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AttackAlertOverlay } from './components/AttackAlertOverlay';

function AppRoutes() {
    const { showHelp, setShowHelp } = useKeyboardShortcuts();

    return (
        <>
            <MainLayout>
                <Routes>
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/history" element={<History />} />
                    <Route path="*" element={<Navigate to="/upload" replace />} />
                </Routes>
            </MainLayout>
            <ToastContainer />
            <AttackAlertOverlay />
            <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
        </>
    );
}

function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;
