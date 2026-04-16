import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataProvider } from './context/DataContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Devices from './pages/Devices';
import Analytics from './pages/Analytics';
import Students from './pages/Students';
import Exams from './pages/Exams';
import Summary from './pages/Summary';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  if (isBooting) {
    return <SplashScreen onComplete={() => setIsBooting(false)} />;
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          theme="dark"
          toastClassName="!bg-[var(--attendly-bg-card)] !border !border-[var(--attendly-border)] !rounded-2xl !shadow-2xl"
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="summary" element={<Summary />} />
            <Route path="exams" element={<Exams />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="devices" element={<Devices />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
