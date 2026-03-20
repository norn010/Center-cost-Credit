import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AutomateStatus from './pages/AutomateStatus';
import AutomateCompleted from './pages/AutomateCompleted';
import BPReport from './pages/BPReport';
import AutomationSettlementReport from './pages/AutomationSettlementReport';

function App() {
  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">ศูนย์ต้นทุนเงินเชื่อ Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor and automate center cost credit</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/automate-status"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
              }`
            }
          >
            Automation Status
          </NavLink>
          <NavLink
            to="/automate-completed"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
              }`
            }
          >
            รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ
          </NavLink>
          <NavLink
            to="/bp-report"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
              }`
            }
          >
            BPรายงานชำระหนี้
          </NavLink>
          <NavLink
            to="/automation-settlement-report"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
              }`
            }
          >
            Automation รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ
          </NavLink>
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Credit Automation
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 px-6 py-6 overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/automate-status" element={<AutomateStatus />} />
          <Route path="/automation-settlement-report" element={<AutomationSettlementReport />} />
          <Route path="/automate-completed" element={<AutomateCompleted />} />
          <Route path="/bp-report" element={<BPReport />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

