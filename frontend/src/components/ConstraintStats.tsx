import { useState, useEffect } from 'react'
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { constraintAPI } from '@/services/api'
import { toast } from 'sonner'

// ⚠️ 不再写死 RULE_NAME_MAP，统一从后端的 rule_name_map 取

export function ConstraintStats() {
  const [constraintStats, setConstraintStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  /** =========================
   *  查询约束统计
   *  ========================= */
  const loadConstraintStats = async (taskId?: string) => {
    const id = taskId ?? selectedTaskId

    if (!id || !id.trim()) {
      // 手动点击“查询”时才提示；自动刷新时静默返回
      if (!taskId) {
        toast.warning('请输入任务ID')
      }
      return
    }

    try {
      setLoading(true)
      const stats = await constraintAPI.getStats(id)
      // 如果接口按约定返回 null / 404 被你在 api.ts 映射成特定错误，也可以在这里判断
      if (!stats) {
        toast.warning('该任务ID不存在或没有约束统计')
        setConstraintStats(null)
        return
      }
      setConstraintStats(stats)
    } catch (error: any) {
      console.error('加载约束统计失败:', error)

      // 如果你在 api.ts 里对 404 做了特殊 message，这里可以判断 message
      if (error?.status === 404) {
        toast.warning('该任务ID不存在')
      } else {
        toast.error(error.message || '加载约束统计失败')
      }

      setConstraintStats(null)
    } finally {
      setLoading(false)
    }
  }

  // ✅ 只在用户手动点击“查询”时调用，不再监听输入变化
  const handleManualQuery = () => {
    loadConstraintStats()
  }

  /** =========================
   *  监听 SecurityCheck 事件
   *  ========================= */
  useEffect(() => {
    // 1) SecurityCheck 改变 taskId 时同步输入框
    const onTaskChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { taskId?: string }
      if (detail?.taskId !== undefined) {
        setSelectedTaskId(detail.taskId)
      }
    }

    // 2) 安全校验成功后通知刷新
    const onConstraintUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as { taskId?: string }
      if (detail?.taskId) {
        setSelectedTaskId(detail.taskId)
        // 自动刷新，但不弹“请输入任务ID”的提示
        loadConstraintStats(detail.taskId)
      }
    }

    window.addEventListener('constraint-task-changed', onTaskChanged)
    window.addEventListener('constraint-updated', onConstraintUpdated)

    return () => {
      window.removeEventListener('constraint-task-changed', onTaskChanged)
      window.removeEventListener('constraint-updated', onConstraintUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** =========================
   *  图表数据转换
   *  ========================= */
  const getInterceptionData = () => {
    if (!constraintStats?.interception_reasons) return []

    // ⭐ 动态规则名映射：从后端返回的 rule_name_map 里取
    const ruleNameMap: Record<string, string> =
      constraintStats.rule_name_map || {}

    return Object.entries(constraintStats.interception_reasons).map(
      ([reason, count]) => ({
        name: ruleNameMap[reason] || reason,
        value: count as number,
      })
    )
  }

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
  ]

  const interceptionData = getInterceptionData()
  const ruleNameMap: Record<string, string> =
    constraintStats?.rule_name_map || {}

  return (
    <div className="p-6 mt-[56px]">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">约束统计</h2>
          <p className="text-sm text-gray-500">
            拦截统计 · 原因分析 · 规则状态
          </p>
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
            onClick={handleManualQuery}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            查询
          </button>
        </div>
      </div>

      {/* ===== 状态区 ===== */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : constraintStats ? (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-5 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg border">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-600">总拦截数</div>
                  <div className="text-3xl font-bold text-red-600">
                    {constraintStats.total_intercepted || 0}
                  </div>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-600">已启用规则</div>
                  <div className="text-3xl font-bold text-green-600">
                    {constraintStats.enabled_rules?.length || 0}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-600">拦截原因数</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {Object.keys(
                      constraintStats.interception_reasons || {}
                    ).length}
                  </div>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-600">规则状态</div>
                  <div className="text-lg font-bold text-green-600">
                    运行中
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* 拦截原因图表 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* 饼图 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <h3 className="text-lg font-semibold mb-4">
                拦截原因分布
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interceptionData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    // 如果你之前有自定义 label（带更小字体），在这里替换
                    label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                      // 简单版：只用默认 label 位置，字体稍微小一点
                      const radius = outerRadius + 10
                      const RADIAN = Math.PI / 180
                      const x =
                        cx + radius * Math.cos(-midAngle * RADIAN)
                      const y =
                        cy + radius * Math.sin(-midAngle * RADIAN)
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={15} // 比默认小
                        >
                          {name}: {(percent * 100).toFixed(0)}%
                        </text>
                      )
                    }}
                  >
                    {interceptionData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 柱状图 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <h3 className="text-lg font-semibold mb-4">
                拦截原因统计
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interceptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={{
                      fontSize: 10, // 之前你说的“6号”字体，这里保持较小
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 已启用规则 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <h3 className="text-lg font-semibold mb-4">
              已启用规则
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {constraintStats.enabled_rules?.map(
                (ruleId: string, i: number) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
                  >
                    {/* 显示“人类可读名称 + (ID)” */}
                    {ruleNameMap[ruleId] || ruleId}
                    <span className="ml-1 text-xs text-gray-400">
                      
                    </span>
                  </div>
                )
              )}
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
  )
}
