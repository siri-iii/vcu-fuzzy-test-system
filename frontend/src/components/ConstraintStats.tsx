import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { constraintAPI } from '@/services/api';
import { toast } from 'sonner';

export function ConstraintStats() {
  const [constraintStats, setConstraintStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    if (selectedTaskId) {
      loadConstraintStats();
    }
  }, [selectedTaskId]);

  const loadConstraintStats = async () => {
    try {
      setLoading(true);
      const stats = await constraintAPI.getStats(selectedTaskId);
      setConstraintStats(stats);
    } catch (error: any) {
      console.error('加载约束统计失败:', error);
      toast.error('加载约束统计失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 转换拦截原因数据为图表格式
  const getInterceptionData = () => {
    if (!constraintStats?.interception_reasons) return [];
    
    return Object.entries(constraintStats.interception_reasons).map(([reason, count]) => ({
      name: reason,
      value: count,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">约束统计</h2>
          <p className="text-sm text-gray-500">拦截统计 · 原因分析 · 规则状态</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="输入任务ID..."
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={loadConstraintStats}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            查询
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : constraintStats ? (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-5 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">总拦截数</div>
                  <div className="text-3xl font-bold text-red-600">{constraintStats.total_intercepted || 0}</div>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">已启用规则</div>
                  <div className="text-3xl font-bold text-green-600">
                    {constraintStats.enabled_rules?.length || 0}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">拦截原因数</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Object.keys(constraintStats.interception_reasons || {}).length}
                  </div>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">规则状态</div>
                  <div className="text-lg font-bold text-green-600">运行中</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* 拦截原因分布 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">拦截原因分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getInterceptionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getInterceptionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">拦截原因统计</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getInterceptionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 已启用规则列表 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">已启用规则</h3>
            <div className="grid grid-cols-3 gap-3">
              {constraintStats.enabled_rules?.map((rule: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>请输入任务ID查询约束统计</p>
        </div>
      )}
    </div>
  );
}

