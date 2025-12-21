import { useState, useEffect } from "react";
import { useRole } from "@/contexts/RoleContext";
import { Dashboard } from "./components/Dashboard";
import { TestMonitoring } from "./components/TestMonitoring";
import { TestManagement } from "./components/TestManagement";
import { ResultAnalysis } from "./components/ResultAnalysis";
import { ReportCenter } from "./components/ReportCenter";
import { SystemSettings } from "./components/SystemSettings";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
// 新组件（将逐步创建）
import { RuleLibrary } from "./components/RuleLibrary";
import { SecurityCheck } from "./components/SecurityCheck";
import { ConstraintStats } from "./components/ConstraintStats";
import { HILDebugging } from "./components/HILDebugging";
import { InterfaceVerification } from "./components/InterfaceVerification";
import { SystemDeployment } from "./components/SystemDeployment";
import { SystemMonitoring } from "./components/SystemMonitoring";

export default function App() {
  const { currentRole } = useRole();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 根据角色设置默认视图
  useEffect(() => {
    if (currentRole === 'test_engineer' && !['dashboard', 'tests', 'monitoring', 'analysis', 'reports'].includes(currentView)) {
      setCurrentView('dashboard');
    } else if (currentRole === 'process_engineer' && !['rule-library', 'security-check', 'constraint-stats'].includes(currentView)) {
      setCurrentView('rule-library');
    } else if (currentRole === 'maintenance_engineer' && !['hil-debugging', 'interface-verification', 'system-deployment', 'system-monitoring', 'system-settings'].includes(currentView)) {
      setCurrentView('hil-debugging');
    }
  }, [currentRole, currentView]);

  const renderView = () => {
    // 测试工程师的视图
    if (currentRole === 'test_engineer') {
      switch (currentView) {
        case "dashboard":
          return (
            <Dashboard
              onCreateTest={() => setCurrentView("tests")}
              onViewMonitoring={(taskId: string) => {
                setCurrentTaskId(taskId);
                setCurrentView("monitoring");
              }}
            />
          );
        case "tests":
          return (
            <TestManagement
              onCreateTest={() => setCurrentView("tests")}
              onViewMonitoring={(taskId: string) => {
                setCurrentTaskId(taskId);
                setCurrentView("monitoring");
              }}
            />
          );
        case "monitoring":
          return (
            <TestMonitoring
              taskId={currentTaskId || ""}
              onBack={() => setCurrentView("dashboard")}
            />
          );
        case "analysis":
          return <ResultAnalysis taskId={currentTaskId || undefined} />;
        case "reports":
          return <ReportCenter />;
        default:
          return (
            <Dashboard
              onCreateTest={() => setCurrentView("tests")}
              onViewMonitoring={(taskId: string) => {
                setCurrentTaskId(taskId);
                setCurrentView("monitoring");
              }}
            />
          );
      }
    }

    // 工艺工程师的视图
    if (currentRole === 'process_engineer') {
      switch (currentView) {
        case "rule-library":
          return <RuleLibrary />;
        case "security-check":
          return <SecurityCheck />;
        case "constraint-stats":
          return <ConstraintStats />;
        default:
          return <RuleLibrary />;
      }
    }

    // 台架维护工程师的视图
    if (currentRole === 'maintenance_engineer') {
      switch (currentView) {
        case "hil-debugging":
          return <HILDebugging />;
        case "interface-verification":
          return <InterfaceVerification />;
        case "system-deployment":
          return <SystemDeployment />;
        case "system-monitoring":
          return <SystemMonitoring />;
        case "system-settings":
          return <SystemSettings />;
        default:
          return <HILDebugging />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-slate-50/30">
      <TopNav />
      <div className="flex">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
        />
        <main className="flex-1 ml-[240px]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}