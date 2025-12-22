import { useRole } from '@/contexts/RoleContext';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, size = 'md' }: ToggleProps) {
  const { currentRole } = useRole();
  
  const sizeClasses = size === 'sm' 
    ? 'w-11 h-6' 
    : 'w-14 h-7';
  
  const thumbClasses = size === 'sm'
    ? 'after:h-5 after:w-5'
    : 'after:h-6 after:w-6';

  // 根据角色获取主题色
  const getThemeColors = () => {
    switch (currentRole) {
      case 'test_engineer':
        return {
          gradient: 'peer-checked:from-blue-600 peer-checked:to-blue-700',
          ring: 'peer-focus:ring-blue-200',
        };
      case 'process_engineer':
        return {
          gradient: 'peer-checked:from-green-600 peer-checked:to-green-700',
          ring: 'peer-focus:ring-green-200',
        };
      case 'maintenance_engineer':
        return {
          gradient: 'peer-checked:from-orange-600 peer-checked:to-orange-700',
          ring: 'peer-focus:ring-orange-200',
        };
      default:
        return {
          gradient: 'peer-checked:from-blue-600 peer-checked:to-blue-700',
          ring: 'peer-focus:ring-blue-200',
        };
    }
  };

  const theme = getThemeColors();

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div 
        className={`${sizeClasses} ${thumbClasses} bg-gray-300 peer-focus:outline-none peer-focus:ring-4 ${theme.ring} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:transition-all peer-checked:bg-gradient-to-r ${theme.gradient}`}
      />
    </label>
  );
}
