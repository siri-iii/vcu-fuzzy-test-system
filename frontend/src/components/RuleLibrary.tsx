import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Upload, Download, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  id: string;
  name: string;
  type: 'whitelist' | 'blacklist' | 'range' | 'crc' | 'dlc' | 'rate';
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  description: string;
  content: any;
  version: string;
  created_at: string;
  updated_at: string;
}

export function RuleLibrary() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      // TODO: 调用后端API
      // const data = await ruleAPI.getAll();
      
      // 模拟数据
      const mockRules: Rule[] = [
        {
          id: 'rule-001',
          name: '信号白名单检查',
          type: 'whitelist',
          enabled: true,
          priority: 'high',
          description: '仅允许DBC定义的合法信号ID',
          content: { signals: ['0x100', '0x101', '0x102'] },
          version: 'v1.0',
          created_at: '2025-01-20',
          updated_at: '2025-01-21',
        },
        {
          id: 'rule-002',
          name: '功能安全禁发列表',
          type: 'blacklist',
          enabled: true,
          priority: 'high',
          description: '禁止发送关键安全信号',
          content: { signals: ['0x200', '0x201'] },
          version: 'v1.2',
          created_at: '2025-01-19',
          updated_at: '2025-01-21',
        },
        {
          id: 'rule-003',
          name: '电压范围检查',
          type: 'range',
          enabled: true,
          priority: 'medium',
          description: 'CC2电压必须在6.0V-14.0V范围内',
          content: { min: 6.0, max: 14.0, signal: 'CC2_VOLTAGE' },
          version: 'v1.1',
          created_at: '2025-01-18',
          updated_at: '2025-01-20',
        },
      ];
      setRules(mockRules);
    } catch (error: any) {
      console.error('加载规则失败:', error);
      toast.error('加载规则失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || rule.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      whitelist: '白名单',
      blacklist: '黑名单',
      range: '范围检查',
      crc: 'CRC校验',
      dlc: 'DLC检查',
      rate: '速率限制',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      whitelist: 'bg-green-100 text-green-700 border-green-200',
      blacklist: 'bg-red-100 text-red-700 border-red-200',
      range: 'bg-blue-100 text-blue-700 border-blue-200',
      crc: 'bg-purple-100 text-purple-700 border-purple-200',
      dlc: 'bg-orange-100 text-orange-700 border-orange-200',
      rate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">工艺规则库</h2>
          <p className="text-sm text-gray-500">规则管理 · 版本控制 · 导入导出</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" />
            导入规则
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出规则
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:shadow-green-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建规则
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索规则名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">全部类型</option>
            <option value="whitelist">白名单</option>
            <option value="blacklist">黑名单</option>
            <option value="range">范围检查</option>
            <option value="crc">CRC校验</option>
            <option value="dlc">DLC检查</option>
            <option value="rate">速率限制</option>
          </select>
        </div>
      </div>

      {/* 规则列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无规则</p>
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:border-green-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs border ${getTypeColor(rule.type)}`}>
                        {getTypeLabel(rule.type)}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(rule.priority)}`}>
                        {rule.priority === 'high' ? '高优先级' : rule.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                      {rule.enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>版本: {rule.version}</span>
                      <span>创建: {rule.created_at}</span>
                      <span>更新: {rule.updated_at}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 新建规则模态框（简化版） */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">新建规则</h3>
            <p className="text-sm text-gray-600 mb-4">规则创建功能开发中...</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

