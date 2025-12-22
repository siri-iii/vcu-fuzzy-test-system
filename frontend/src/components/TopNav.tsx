import { LogOut, ChevronDown } from 'lucide-react';
import { useRole, UserRole } from '@/contexts/RoleContext';
import { useState, useRef, useEffect } from 'react';

export function TopNav() {
  const { currentRole, setCurrentRole, roleName, roleColor } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleConfig = {
    test_engineer: { 
      name: '测试工程师', 
      color: 'blue', 
      bgColor: 'from-blue-600 to-blue-700', 
      textColor: 'text-blue-700', 
      bgLight: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      logoEmoji: '🧪',
      avatarEmoji: '🧪',
    },
    process_engineer: { 
      name: '工艺工程师', 
      color: 'green', 
      bgColor: 'from-green-600 to-green-700', 
      textColor: 'text-green-700', 
      bgLight: 'bg-green-50', 
      borderColor: 'border-green-200',
      logoEmoji: '📚',
      avatarEmoji: '📚',
    },
    maintenance_engineer: { 
      name: '台架维护工程师', 
      color: 'orange', 
      bgColor: 'from-orange-600 to-orange-700', 
      textColor: 'text-orange-700', 
      bgLight: 'bg-orange-50', 
      borderColor: 'border-orange-200',
      logoEmoji: '🛠️',
      avatarEmoji: '🛠️',
    },
  };

  const currentConfig = roleConfig[currentRole];

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setShowRoleMenu(false);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    if (showRoleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleMenu]);

  return (
    <nav className="bg-white text-slate-900 px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${currentRole === 'test_engineer' ? '' : `bg-gradient-to-br ${currentConfig.bgColor}`} rounded-lg flex items-center justify-center ${currentRole === 'test_engineer' ? '' : 'shadow-sm'} text-xl`}>
          {currentConfig.logoEmoji}
        </div>
        <h1 className="text-xl tracking-wide">IntelliFuzz</h1>
        <span className={`px-3 py-1 ${currentConfig.bgLight} rounded-full text-xs border ${currentConfig.borderColor} ${currentConfig.textColor}`}>Pro</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-3 px-4 py-2 ${currentConfig.bgLight} rounded-lg border ${currentConfig.borderColor} hover:opacity-90 transition-all cursor-pointer`}
          >
            <div className={`w-8 h-8 ${currentRole === 'test_engineer' ? 'bg-transparent' : `bg-gradient-to-br ${currentConfig.bgColor}`} rounded-full flex items-center justify-center text-lg`}>
              {currentConfig.avatarEmoji}
            </div>
            <span className={`text-sm ${currentConfig.textColor} font-medium`}>{roleName}</span>
            <ChevronDown className={`w-4 h-4 ${currentConfig.textColor} transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">切换角色</div>
              {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                const config = roleConfig[role];
                const isActive = currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-all ${
                      isActive ? `${config.bgLight} ${config.textColor} font-medium` : 'text-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 ${role === 'test_engineer' ? 'bg-transparent' : `bg-gradient-to-br ${config.bgColor}`} rounded-full flex items-center justify-center text-sm`}>
                      {config.avatarEmoji}
                    </div>
                    <span>{config.name}</span>
                    {isActive && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all">
          <LogOut className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-700">退出</span>
        </button>
      </div>
    </nav>
  );
}
