import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Target, Fingerprint, RotateCcw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { testTaskAPI } from '@/services/api';
import { toast } from 'sonner';

interface ResultAnalysisProps {
  taskId?: string;
}

export function ResultAnalysis({ taskId }: ResultAnalysisProps = {}) {
  const [timeRange, setTimeRange] = useState('7d');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 查看异常详情
  const handleViewDetails = (anomalyId: string) => {
    const anomaly = anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      const details = `
异常ID: ${anomaly.id}
类型: ${anomaly.anomaly_type || '未知'}
严重等级: ${anomaly.severity || '未知'}
位置: ${anomaly.context?.location || '未知'}
是否可复现: ${anomaly.reproducible ? '是' : '否'}
时间戳: ${new Date(anomaly.timestamp).toLocaleString('zh-CN')}
描述: ${anomaly.description || '无描述'}
      `.trim();
      alert(details);
    } else {
      toast.error('未找到异常详情');
    }
  };

  // 加载数据
  useEffect(() => {
    loadAnalysisData();
  }, [timeRange]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      // 加载所有任务
      const tasksData = await testTaskAPI.getAll();
      const completedTasks = tasksData.filter((t: any) => t.status === 'completed');
      
      if (completedTasks.length === 0) {
        setAnomalies([]);
        setMetrics([]);
        setLoading(false);
        return;
      }
      
      // 汇总所有已完成任务的异常和指标数据
      const allAnomalies: any[] = [];
      const allMetrics: any[] = [];
      
      for (const task of completedTasks) {
        try {
          const [anomaliesData, metricsData] = await Promise.all([
            testTaskAPI.getAnomalies(task.id, { top_n: 50 }),
            testTaskAPI.getMetrics(task.id, 100)
          ]);
          allAnomalies.push(...anomaliesData);
          allMetrics.push(...metricsData);
        } catch (error) {
          console.error(`加载任务 ${task.id} 数据失败:`, error);
        }
      }
      
      // 按时间排序，取最新的数据
      allAnomalies.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
      allMetrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAnomalies(allAnomalies.slice(0, 10)); // 只保留最新的10条异常
      setMetrics(allMetrics.slice(0, 100)); // 只保留最新的100条指标
    } catch (error: any) {
      console.error('加载分析数据失败:', error);
      toast.error('加载分析数据失败: ' + (error.message || '未知错误'));
      setAnomalies([]);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  // 从 metrics 数据计算趋势图 - 按时间分组并聚合
  const performanceTrend = (() => {
    if (!metrics || metrics.length === 0) return [];
    
    // 按日期分组聚合数据
    const dateMap = new Map<string, { traditional: number, gan: number, coverage: number, count: number }>();
    
    metrics.forEach(m => {
      if (!m?.timestamp) return;
      const dateKey = new Date(m.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      const existing = dateMap.get(dateKey) || { traditional: 0, gan: 0, coverage: 0, count: 0 };
      dateMap.set(dateKey, {
        traditional: existing.traditional + (m?.traditional_anomalies || 0),
        gan: existing.gan + (m?.gan_anomalies || 0),
        coverage: existing.coverage + (m?.coverage || 0),
        count: existing.count + 1
      });
    });
    
    // 转换为数组并计算平均值
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        traditional: Math.round(data.traditional / data.count),
        gan: Math.round(data.gan / data.count),
        coverage: Math.round(data.coverage / data.count),
      }))
      .slice(-7); // 只取最近7天
  })();

  // 从 anomalies 数据计算分类统计
  const anomalyTypeMap = new Map<string, number>();
  anomalies.forEach(a => {
    const type = a.anomaly_type || '其他';
    anomalyTypeMap.set(type, (anomalyTypeMap.get(type) || 0) + 1);
  });
  
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];
  const anomalyTypes = Array.from(anomalyTypeMap.entries()).map(([name, value], idx) => ({
    name,
    value,
    color: COLORS[idx % COLORS.length],
  }));

  // 引擎对比数据（从最近的metrics中获取）
  const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const engineComparison = latestMetric ? [
    { metric: '用例生成速度', traditional: 450, gan: 620 },
    { metric: '异常检出率', traditional: latestMetric?.traditional_anomalies || 0, gan: latestMetric?.gan_anomalies || 0 },
    { metric: '代码覆盖率', traditional: latestMetric?.coverage || 0, gan: latestMetric?.coverage || 0 },
    { metric: '误报率', traditional: 15, gan: 8 },
  ] : [
    { metric: '用例生成速度', traditional: 0, gan: 0 },
    { metric: '异常检出率', traditional: 0, gan: 0 },
    { metric: '代码覆盖率', traditional: 0, gan: 0 },
    { metric: '误报率', traditional: 0, gan: 0 },
  ];


  // 处理异常数据
  const topAnomalies = anomalies.map((anomaly: any, index: number) => {
    // 映射严重等级
    const severityMap: { [key: number]: string } = {
      5: '严重',
      4: '高',
      3: '中',
      2: '低',
      1: '轻微'
    };
    
    return {
      id: anomaly.id || `ANO-${index + 1}`,
      type: anomaly.anomaly_type || '未知异常',
      severity: severityMap[anomaly.severity] || '未知',
      location: anomaly.context?.location || anomaly.context?.code_location || '未知位置',
      occurrences: 1, // 后端没有occurrences字段，默认为1
      engine: anomaly.source === 'gan' ? 'GAN' : '传统',
      strategy: '策略0', // 后端没有strategy字段
      reproducibility: anomaly.reproducible ? '100%' : '0%',
    };
  });

  const getSeverityBadge = (severity: string) => {
    const styles = {
      严重: 'bg-red-100 text-red-700',
      高: 'bg-orange-100 text-orange-700',
      中: 'bg-yellow-100 text-yellow-700',
      低: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-sm ${styles[severity as keyof typeof styles]}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">结果分析</h2>
          <p className="text-sm text-gray-500">数据概览 · 测试策略评估 · 异常指纹管理</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">时间范围：</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          加载中...
        </div>
      )}

      {/* 数据显示 */}
      {!loading && (
        <>
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">异常指纹总数</div>
              <div className="text-3xl">156</div>
            </div>
            <Fingerprint className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>去重后30条有效</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">平均信号覆盖率</div>
              <div className="text-3xl">78.5%</div>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>字段级 + 时序覆盖</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">平均复现率</div>
              <div className="text-3xl">87%</div>
            </div>
            <RotateCcw className="w-8 h-8 text-green-500" />
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>测试策略稳定</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">误报率</div>
              <div className="text-3xl">8.3%</div>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingDown className="w-4 h-4" />
            <span>-3.1% vs 上周</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4">异常检出趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="traditional"
                name="传统引擎"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line type="monotone" dataKey="gan" name="GAN引擎" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="mb-4">异常类型分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={anomalyTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {anomalyTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engine Comparison */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <h3 className="mb-4">引擎性能对比</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={engineComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="metric" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="traditional" name="传统引擎" fill="#3b82f6" />
            <Bar dataKey="gan" name="GAN引擎" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Anomalies - 重新设计的现代化表格 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
        <div className="mb-6">
          <h3 className="text-xl mb-1">异常指纹详细列表</h3>
          <p className="text-sm text-gray-500">去重后的有效异常 · 策略标注 · 复现率追踪</p>
        </div>
        
        {/* 现代化卡片式表格 */}
        <div className="space-y-3">
          {topAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all overflow-hidden bg-gradient-to-r from-white to-slate-50/30"
            >
              <div className="p-5">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      {anomaly.id}
                    </div>
                    <div className="text-base font-medium text-slate-900">{anomaly.type}</div>
                    {getSeverityBadge(anomaly.severity)}
                  </div>
                  <button 
                    onClick={() => handleViewDetails(anomaly.id)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    查看详情
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-6 gap-4 mb-3">
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500 mb-1">代码位置</div>
                    <div className="font-mono text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                      {anomaly.location}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">出现次数</div>
                    <div className="text-2xl font-semibold text-red-600">
                      {anomaly.occurrences}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">检出引擎</div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                      anomaly.engine === 'GAN' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {anomaly.engine}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">测试策略</div>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                      {anomaly.strategy}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">复现率</div>
                    <div className={`text-2xl font-semibold ${
                      parseInt(anomaly.reproducibility) >= 80 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {anomaly.reproducibility}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}