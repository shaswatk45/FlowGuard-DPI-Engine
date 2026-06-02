import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Upload } from './pages/Upload';
import { Dashboard } from './pages/Dashboard';
import { Traffic } from './pages/Traffic';
import { Rules } from './pages/Rules';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/upload" element={<Upload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/traffic" element={<Traffic />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
 
