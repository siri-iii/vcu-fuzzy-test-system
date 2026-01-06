import { 
  LayoutDashboard, FlaskConical, BarChart3, FileText, Settings,
  BookOpen, Shield, Wrench, Network, Server, Monitor
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { currentRole, roleColor } = useRole();

  // 根据角色定义不同的菜单项
  const getMenuItems = () => {
    const colorClasses = {
      test_engineer: {
        active: 'bg-blue-600 text-white shadow-md',
        activeBar: 'bg-blue-800',
        hover: 'hover:bg-slate-100 hover:text-slate-900',
      },
      process_engineer: {
        active: 'bg-green-600 text-white shadow-md',
        activeBar: 'bg-green-800',
        hover: 'hover:bg-slate-100 hover:text-slate-900',
      },
      maintenance_engineer: {
        active: 'bg-orange-600 text-white shadow-md',
        activeBar: 'bg-orange-800',
        hover: 'hover:bg-slate-100 hover:text-slate-900',
      },
    };

    const colors = colorClasses[currentRole];

    switch (currentRole) {
      case 'test_engineer':
        return [
          { id: 'dashboard', label: '概览', icon: LayoutDashboard },
          { id: 'tests', label: '测试管理', icon: FlaskConical },
          { id: 'analysis', label: '结果分析', icon: BarChart3 },
          { id: 'reports', label: '报告中心', icon: FileText },
        ].map(item => ({ ...item, colors }));

      case 'process_engineer':
        return [
          { id: 'rule-library', label: '规则库管理', icon: BookOpen },
          { id: 'security-check', label: '安全校验配置', icon: Shield },
          { id: 'constraint-stats', label: '约束统计', icon: BarChart3 },
        ].map(item => ({ ...item, colors }));

      case 'maintenance_engineer':
        return [
          { id: 'hil-debugging', label: 'HIL联调', icon: Wrench },
          { id: 'interface-verification', label: '接口验证', icon: Network },
          //{ id: 'system-deployment', label: '系统部署', icon: Server },
          { id: 'system-monitoring', label: '系统监控', icon: Monitor },
          { id: 'system-settings', label: '系统配置', icon: Settings },
        ].map(item => ({ ...item, colors }));

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-[240px] bg-slate-50 h-screen fixed left-0 top-[56px] shadow-sm border-r border-slate-200 flex flex-col">
      {/* Navigation - Scrollable */}
      <nav className="px-3 pt-6 flex-1 overflow-y-auto min-h-0 pb-32">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-4 py-3 mb-1.5 flex items-center gap-3 rounded-lg transition-all duration-200 relative group ${
                isActive
                  ? item.colors.active
                  : `text-slate-700 ${item.colors.hover}`
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
              <span className="relative z-10 font-medium">{item.label}</span>
              {isActive && (
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 ${item.colors.activeBar} rounded-l-full`} />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Version Info - Aligned with requirement traceability matrix bottom */}
      <div className="absolute bottom-[200px] left-0 right-0 px-6 bg-slate-50 border-t border-slate-200">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-700 mb-1">系统版本</div>
          <div className="text-xs text-slate-500">v2.0 Beta</div>
        </div>
      </div>
    </aside>
  );
}