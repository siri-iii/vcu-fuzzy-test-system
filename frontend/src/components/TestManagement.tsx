import { useState, useEffect } from 'react';
import { Search, Filter, Play, Pause, Trash2, Eye, Plus, Download, FileCode, Layers, Clock, Settings, GitBranch, User, Square } from 'lucide-react';
import { testPlanAPI, testTaskAPI } from '@/services/api';
import { toast } from 'sonner';

interface TestManagementProps {
  onCreateTest: () => void;
  onViewMonitoring: (taskId: string, taskName: string) => void;
}

export function TestManagement({ onViewMonitoring }: TestManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_mode: 'both',
    traditional_enabled: true,
    traditional_max_cases: 100,
    gan_enabled: true,
    gan_max_cases: 50,
    gan_temperature: 1.0,
    rate_limit: 100.0,
    crc_check: true,
    dlc_check: true,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 事件处理函数
  const handleCreateTest = () => {
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 构建测试计划数据
      const planData = {
        name: formData.name,
        description: formData.description,
        test_mode: formData.test_mode,
        traditional_config: formData.traditional_enabled ? {
          enabled: true,
          intensity: 5,
          max_cases: formData.traditional_max_cases,
        } : null,
        gan_config: formData.gan_enabled ? {
          enabled: true,
          model_version: "v1.0",
          sampling_temperature: formData.gan_temperature,
          max_cases: formData.gan_max_cases,
        } : null,
        constraint_config: {
          rate_limit: formData.rate_limit,
          crc_check: formData.crc_check,
          dlc_check: formData.dlc_check,
        },
      };

      // 创建测试计划（API拦截器已返回data）
      const plan = await testPlanAPI.create(planData) as any;
      toast.success('测试计划创建成功');

      // 创建测试任务
      const task = await testTaskAPI.create({ plan_id: plan.id }) as any;
      toast.success('测试任务创建成功');
      
      // 自动启动任务（方便演示）
      try {
        await testTaskAPI.start(task.id);
        toast.success('测试任务已自动启动');
      } catch (startError: any) {
        console.warn('自动启动任务失败:', startError);
        toast.warning('任务创建成功，但自动启动失败，请手动启动');
      }

      // 关闭模态框并刷新数据
      setShowCreateModal(false);
      loadData();
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        test_mode: 'both',
        traditional_enabled: true,
        traditional_max_cases: 100,
        gan_enabled: true,
        gan_max_cases: 50,
        gan_temperature: 1.0,
        rate_limit: 100.0,
        crc_check: true,
        dlc_check: true,
      });
    } catch (error: any) {
      console.error('创建测试失败:', error);
      toast.error('创建测试失败: ' + (error.message || '未知错误'));
    }
  };

  const handleViewMonitoring = (taskId: string, taskName: string) => {
    onViewMonitoring(taskId, taskName);
  };

  const handleStart = async (taskId: string) => {
    try {
      await testTaskAPI.start(taskId);
      toast.success('测试任务已启动');
      loadData();
    } catch (error: any) {
      console.error('启动任务失败:', error);
      toast.error('启动任务失败: ' + (error.message || '未知错误'));
    }
  };

  const handlePause = async (taskId: string) => {
    try {
      await testTaskAPI.pause(taskId);
      toast.success('测试任务已暂停');
      loadData();
    } catch (error: any) {
      console.error('暂停任务失败:', error);
      toast.error('暂停任务失败: ' + (error.message || '未知错误'));
    }
  };

  const handleStop = async (taskId: string) => {
    try {
      await testTaskAPI.stop(taskId);
      toast.success('测试任务已停止');
      loadData();
    } catch (error: any) {
      console.error('停止任务失败:', error);
      toast.error('停止任务失败: ' + (error.message || '未知错误'));
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('确定要删除这个测试计划吗？此操作无法撤销。')) {
      return;
    }
    try {
      await testPlanAPI.delete(planId);
      toast.success('测试计划已删除');
      loadData();
    } catch (error: any) {
      console.error('删除计划失败:', error);
      toast.error('删除计划失败: ' + (error.message || '未知错误'));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // API拦截器已返回data，直接使用
      const tasksData = await testTaskAPI.getAll() as any;
      const plansData = await testPlanAPI.getAll() as any;
      
      // 合并任务和计划数据，过滤掉没有关联计划的孤立任务
      const mergedTests = tasksData
        .filter((task: any) => {
          // 只保留有关联计划的任务
          return plansData.some((p: any) => p.id === task.plan_id);
        })
        .map((task: any) => {
        const plan = plansData.find((p: any) => p.id === task.plan_id);
        
        // 计算进度
        // 如果任务已完成，进度应该是100%
        // 如果任务正在运行，基于total_cases计算进度
        let progress = 0;
        if (task.status === 'completed') {
          progress = 100;
        } else if (task.status === 'running' || task.status === 'paused') {
          // 对于运行中的任务，基于total_cases计算进度（假设目标1000）
          const targetCases = 1000;
          progress = task.total_cases ? Math.min(100, Math.round((task.total_cases / targetCases) * 100)) : 0;
        } else {
          // 待执行或已停止的任务，进度为0
          progress = 0;
        }
        
        // 计算覆盖率（基于统计数据，这里简化处理）
        const totalCases = task.total_cases || 0;
        const traditionalCases = task.traditional_stats?.cases || 0;
        const ganCases = task.gan_stats?.cases || 0;
        const coverage = totalCases > 0 ? Math.min(100, Math.round((traditionalCases + ganCases) / totalCases * 100)) : 0;
        
        // 计算运行时长
        let duration = '-';
        if (task.started_at) {
          const startTime = new Date(task.started_at);
          const endTime = task.completed_at ? new Date(task.completed_at) : new Date();
          const diffMs = endTime.getTime() - startTime.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          if (diffHours > 0) {
            duration = `${diffHours}小时${diffMinutes}分`;
          } else {
            duration = `${diffMinutes}分`;
          }
        }
        
        return {
          id: task.id,
          name: plan?.name || `任务-${task.id}`,
          type: plan?.test_mode === 'both' ? '传统+GAN' : plan?.test_mode === 'gan' ? 'GAN' : '传统',
          status: task.status === 'running' ? 'running' : 
                  task.status === 'completed' ? 'completed' : 
                  task.status === 'paused' ? 'paused' : 
                  task.status === 'stopped' ? 'stopped' : 'pending',
          strategy: plan?.test_mode || '策略0',
          progress: progress,
          startTime: task.started_at || task.created_at || new Date().toISOString(),
          duration: duration,
          anomalies: task.total_anomalies || 0,
          coverage: coverage,
          dbcFile: plan?.constraint_config?.dbc_file_path || 'VCU_CAN_v2.3.dbc',
          dataFormat: plan?.baseline_log_path?.split('.').pop()?.toUpperCase() || 'BLF',
          requirementId: plan?.description?.match(/REQ-\d+/)?.[0] || 'REQ-001',
          configBaseline: plan?.test_mode || 'v2.0',
          createdBy: '系统',
          plan_id: task.plan_id,
        };
      });
      
      setTests(mergedTests);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesStrategy = filterStrategy === 'all' || test.strategy === filterStrategy;
    return matchesSearch && matchesStatus && matchesStrategy;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      running: 'bg-blue-50 text-blue-700 border border-blue-200',
      completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      pending: 'bg-slate-50 text-slate-600 border border-slate-200',
      paused: 'bg-amber-50 text-amber-700 border border-amber-200',
      failed: 'bg-rose-50 text-rose-700 border border-rose-200',
    };

    const labels = {
      running: '执行中',
      completed: '已完成',
      pending: '等待中',
      paused: '已暂停',
      failed: '失败',
    };

    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-8 pt-24 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl text-slate-900 mb-2">测试管理</h2>
          <p className="text-slate-600">统一执行接口 · 策略可追溯 · 数据中心化管理</p>
        </div>
        <button
          onClick={handleCreateTest}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          创建新测试
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-600">总测试计划</div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl text-slate-900 mb-1">{filteredTests.length}</div>
          <div className="text-xs text-slate-500">全生命周期管理</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-600">执行中</div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50" />
          </div>
          <div className="text-3xl text-blue-600 mb-1">
            {filteredTests.filter((t) => t.status === 'running').length}
          </div>
          <div className="text-xs text-slate-500">实时监控状态</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-600">已完成</div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileCode className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl text-emerald-600 mb-1">
            {filteredTests.filter((t) => t.status === 'completed').length}
          </div>
          <div className="text-xs text-slate-500">可生成报告</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-600">异常/暂停</div>
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm" />
          </div>
          <div className="text-3xl text-rose-600 mb-1">
            {filteredTests.filter((t) => t.status === 'failed' || t.status === 'paused').length}
          </div>
          <div className="text-xs text-slate-500">需人工介入</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索测试计划名称..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50"
            >
              <option value="all">全部状态</option>
              <option value="running">执行中</option>
              <option value="completed">已完成</option>
              <option value="pending">等待中</option>
              <option value="paused">已暂停</option>
              <option value="failed">失败</option>
            </select>
            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50"
            >
              <option value="all">全部策略</option>
              <option value="策略0">策略0 - 无约束</option>
              <option value="策略1">策略1 - 单参数</option>
              <option value="策略2">策略2 - 多参数</option>
              <option value="策略3">策略3 - 重复执行</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">加载中...</div>
        </div>
      )}

      {/* Test List - Clean Grid Layout */}
      {!loading && (
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无测试任务，点击"创建新测试"开始
          </div>
        ) : (
        filteredTests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="p-6">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <h3 className="text-lg text-slate-900 font-medium">{test.name}</h3>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                    {test.type}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                    {test.strategy}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(test.status)}
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button
                      onClick={() => handleViewMonitoring(test.id, test.name)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-600" />
                    </button>
                    {test.status === 'running' && (
                      <button 
                        onClick={() => handlePause(test.id)}
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors group/btn" 
                        title="暂停"
                      >
                        <Pause className="w-4 h-4 text-slate-500 group-hover/btn:text-amber-600" />
                      </button>
                    )}
                    {test.status === 'paused' && (
                      <button 
                        onClick={() => handleStart(test.id)}
                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors group/btn" 
                        title="继续"
                      >
                        <Play className="w-4 h-4 text-slate-500 group-hover/btn:text-emerald-600" />
                      </button>
                    )}
                    {(test.status === 'running' || test.status === 'paused') && (
                      <button 
                        onClick={() => handleStop(test.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn" 
                        title="停止"
                      >
                        <Square className="w-4 h-4 text-slate-500 group-hover/btn:text-red-600" />
                      </button>
                    )}
                    {test.status === 'completed' && (
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors group/btn" title="下载报告">
                        <Download className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-600" />
                      </button>
                    )}
                    {test.plan_id && (
                      <button 
                        onClick={() => handleDelete(test.plan_id)}
                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors group/btn" 
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-slate-500 group-hover/btn:text-rose-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-7 gap-6 mb-4">
                <div className="col-span-3">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-slate-600">进度</span>
                    <span className="text-slate-900 font-medium">{test.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full transition-all"
                      style={{ width: `${test.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">覆盖率</div>
                  <div className={`text-2xl font-semibold ${test.coverage >= 80 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {test.coverage}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">异常数</div>
                  <div className="text-2xl font-semibold text-orange-600">
                    {test.anomalies}
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <div className="text-slate-900">{test.startTime}</div>
                    <div className="text-xs text-slate-500">运行 {test.duration}</div>
                  </div>
                </div>
              </div>

              {/* Footer Row - 软工追溯信息：需求ID、配置基线、审计信息 */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs">
                {/* 需求ID - Tooltip展示完整信息 */}
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors cursor-help group/req"
                  title={`关联需求：${test.requirementId} - VCU相关功能测试`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="font-medium">{test.requirementId}</span>
                </div>

                {/* 配置基线 - 显示版本 */}
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 transition-colors cursor-help"
                  title={`配置基线版本：${test.configBaseline} (2025-11-20)`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="font-medium">{test.configBaseline}</span>
                </div>

                {/* 创建人 - 审计信息 */}
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors cursor-help"
                  title={`创建人：${test.createdBy} | 创建时间：${test.startTime}`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">{test.createdBy}</span>
                </div>

                <div className="w-px h-4 bg-slate-200" />

                {/* DBC文件和数据格式 */}
                <div className="flex items-center gap-2 text-slate-600">
                  <Settings className="w-3.5 h-3.5" />
                  <span>{test.dbcFile}</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="text-slate-600">{test.dataFormat}</div>
              </div>
            </div>
          </div>
        )))}
      </div>
      )}

      {/* 创建测试模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">创建新测试</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">基本信息</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">测试计划名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="例如：VCU休眠唤醒测试"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="测试计划的详细描述..."
                  />
                </div>
              </div>

              {/* 测试模式 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">测试模式</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, test_mode: 'traditional', traditional_enabled: true, gan_enabled: false })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.test_mode === 'traditional'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">传统测试</div>
                    <div className="text-xs text-gray-500 mt-1">边界值测试</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, test_mode: 'gan', traditional_enabled: false, gan_enabled: true })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.test_mode === 'gan'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">GAN测试</div>
                    <div className="text-xs text-gray-500 mt-1">智能生成</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, test_mode: 'both', traditional_enabled: true, gan_enabled: true })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.test_mode === 'both'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">混合模式</div>
                    <div className="text-xs text-gray-500 mt-1">传统+GAN</div>
                  </button>
                </div>
              </div>

              {/* 传统测试配置 */}
              {formData.traditional_enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">传统测试配置</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">最大用例数</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.traditional_max_cases}
                      onChange={(e) => setFormData({ ...formData, traditional_max_cases: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* GAN测试配置 */}
              {formData.gan_enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">GAN测试配置</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">最大用例数</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.gan_max_cases}
                      onChange={(e) => setFormData({ ...formData, gan_max_cases: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">采样温度</label>
                    <input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={formData.gan_temperature}
                      onChange={(e) => setFormData({ ...formData, gan_temperature: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">推荐值：0.8-1.2，值越大变化越大</p>
                  </div>
                </div>
              )}

              {/* 约束配置 */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700">约束配置</h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">速率限制 (msg/s)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rate_limit}
                    onChange={(e) => setFormData({ ...formData, rate_limit: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crc_check}
                      onChange={(e) => setFormData({ ...formData, crc_check: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">CRC校验</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dlc_check}
                      onChange={(e) => setFormData({ ...formData, dlc_check: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">DLC校验</span>
                  </label>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/20 transition-all font-medium"
                >
                  创建并启动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}