import { useEffect, useState } from 'react'
import {
  Shield,
  CheckCircle,
  Pause,
  Play,
  RotateCcw,
  Settings,
} from 'lucide-react'
import { Toggle } from './Toggle'
import { securityAPI } from '@/services/api'
import { toast } from 'sonner'

interface SecurityConfig {
  dual_layer_enabled: boolean
  layer1_rules: string[]
  layer2_rules: string[]
  audit_enabled: boolean
  alert_threshold: number
  // 后端新增的人类可读映射：id -> 中文名称
  rule_name_map?: Record<string, string>
}

export function SecurityCheck() {
  const [config, setConfig] = useState<SecurityConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkStatus, setCheckStatus] = useState<'idle' | 'running' | 'paused'>(
    'idle'
  )

  // 当前使用的 TaskId（和 ConstraintStats 共用）
  const [taskId, setTaskId] = useState<string>('test-task-002')

  // 更新配置弹窗
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [draftLayer1, setDraftLayer1] = useState('')
  const [draftLayer2, setDraftLayer2] = useState('')

  /** 统一获取规则中文名：优先用后端 rule_name_map，没有就直接返回 id 本身 */
  const getRuleLabel = (id: string) => {
    if (config?.rule_name_map && config.rule_name_map[id]) {
      return config.rule_name_map[id]
    }
    return id
  }

  /** =========================
   *  初始化加载配置
   *  ========================= */
  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await securityAPI.getConfig()
      setConfig(data)
      // 同步到弹窗草稿里，方便编辑
      setDraftLayer1((data.layer1_rules || []).join(','))
      setDraftLayer2((data.layer2_rules || []).join(','))
    } catch (e: any) {
      toast.error(
        typeof e.message === 'string' ? e.message : '加载安全配置失败'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  /** =========================
   *  更新配置（公共函数）
   *  ========================= */
  const updateConfig = async (next: Partial<SecurityConfig>) => {
    if (!config) return
    try {
      const updated: SecurityConfig = { ...config, ...next }
      // 只把后端需要的字段发回去，rule_name_map 由后端自己维护
      const payload = {
        dual_layer_enabled: updated.dual_layer_enabled,
        layer1_rules: updated.layer1_rules,
        layer2_rules: updated.layer2_rules,
        audit_enabled: updated.audit_enabled,
        alert_threshold: updated.alert_threshold,
      }
      await securityAPI.updateConfig(payload)
      setConfig(updated)
      toast.success('配置已更新')
    } catch (e: any) {
      toast.error(
        typeof e.message === 'string' ? e.message : '配置更新失败'
      )
    }
  }

  /** =========================
   *  执行安全校验（verify）
   *  ========================= */
  const runVerify = async () => {
    if (!taskId.trim()) {
      toast.warning('请先输入 Task ID')
      return
    }

    try {
      const res = await securityAPI.verify({
        task_id: taskId, // 用当前 Task ID
        payload: {
          // 示例数据，将来可以换成真实报文
          id: '0x200',
          speed: 150,
          CC2_VOLTAGE: 3,
        },
      })

      // 核心：把 taskId 广播给 ConstraintStats，触发同一 task 的约束统计刷新
      window.dispatchEvent(
        new CustomEvent('constraint-updated', {
          detail: { taskId },
        })
      )

      if (res.passed) {
        toast.success('校验通过')
      } else {
        const names =
          (res.triggered_rules || [])
            .map((id: string) => getRuleLabel(id))
            .join('，') || '未知规则'
        toast.warning(`校验未通过，触发规则：${names}`)
      }
    } catch (e: any) {
      // 422 一般是“规则拦截”这种业务异常
      if (e?.status === 422) {
        toast.warning('校验未通过（规则拦截）')
      } else {
        toast.error(e.message || '安全校验失败')
      }
    }
  }

  /** =========================
   *  重置配置（清空规则，保持开启）
   *  ========================= */
  const resetConfig = async () => {
    await updateConfig({
      dual_layer_enabled: true,
      layer1_rules: [],
      layer2_rules: [],
      audit_enabled: true,
      alert_threshold: 0,
    })
    setDraftLayer1('')
    setDraftLayer2('')
  }

  /** =========================
   *  保存弹窗里的规则配置
   *  ========================= */
  const saveConfigFromModal = async () => {
    if (!config) return

    // 逗号分隔并去空格 + 过滤空字符串
    const l1 = draftLayer1
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const l2 = draftLayer2
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const allIds = [...l1, ...l2]

    // 用后端返回的 rule_name_map 做合法性校验
    const validIds = config.rule_name_map
      ? new Set(Object.keys(config.rule_name_map))
      : null

    if (validIds) {
      const invalid = allIds.filter((id) => !validIds.has(id))
      if (invalid.length > 0) {
        toast.error(
          `以下规则 ID 不存在：${invalid.join(
            '，'
          )}。请检查后再提交（可以在规则库中查看可用规则 ID）。`
        )
        return
      }
    }

    await updateConfig({
      layer1_rules: l1,
      layer2_rules: l2,
    })
    setShowConfigModal(false)
  }

  if (loading || !config) {
    return <div className="p-6 mt-[56px]">加载中...</div>
  }

  return (
    <div className="p-6 mt-[56px]">
      {/* 顶部操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">双重安全校验配置</h2>
          <p className="text-sm text-gray-500">
            第一重校验 · 第二重校验 · 流程可视化
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Task ID 输入框：SecurityCheck 与 ConstraintStats 共用 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">当前 Task ID</span>
            <input
              type="text"
              value={taskId}
              onChange={(e) => {
                const v = e.target.value
                setTaskId(v)
                // 同步通知约束统计页切换任务（不自动请求，交给那边自己判断）
                window.dispatchEvent(
                  new CustomEvent('constraint-task-changed', {
                    detail: { taskId: v },
                  })
                )
              }}
              placeholder="例如：test-task-001"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* 启动 / 暂停 */}
          <button
            onClick={() => {
              if (checkStatus === 'running') {
                setCheckStatus('paused')
              } else {
                setCheckStatus('running')
                runVerify()
              }
            }}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
              checkStatus === 'running'
                ? 'bg-yellow-600 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            {checkStatus === 'running' ? (
              <>
                <Pause className="w-4 h-4" />
                暂停校验
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                启动校验
              </>
            )}
          </button>

          {/* 更新配置按钮：打开弹窗，修改 layer1 / layer2 */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-xl flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            更新配置
          </button>

          {/* 重置配置 */}
          <button
            onClick={resetConfig}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置配置
          </button>
        </div>
      </div>

      {/* 第一重校验 */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">第一重校验</h3>
              <p className="text-sm text-gray-500">协议层校验</p>
            </div>
          </div>

          <Toggle
            checked={config.dual_layer_enabled}
            onChange={(v) => updateConfig({ dual_layer_enabled: v })}
          />
        </div>

        {config.dual_layer_enabled && (
          <div className="space-y-3 pl-13">
            {config.layer1_rules.map((r) => {
              const label = getRuleLabel(r)
              return (
                <div
                  key={r}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="font-medium">
                    {label}
                    <span className="ml-2 text-xs text-gray-400">
                      ({r})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 第二重校验 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">第二重校验</h3>
              <p className="text-sm text-gray-500">数据层校验</p>
            </div>
          </div>

          <Toggle
            checked={config.audit_enabled}
            onChange={(v) => updateConfig({ audit_enabled: v })}
          />
        </div>

        <div className="space-y-3 pl-13">
          {config.layer2_rules.map((r) => {
            const label = getRuleLabel(r)
            return (
              <div
                key={r}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div className="font-medium">
                  {label}
                  <span className="ml-2 text-xs text-gray-400">
                    ({r})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== 更新配置弹窗 ===== */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[520px]">
            <h3 className="text-lg font-semibold mb-2">
              更新安全规则配置
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              规则 ID 使用英文逗号分隔，例如：
              <code className="bg-gray-100 px-1 py-0.5 rounded mx-1">
                rule-whitelist-1, rule-blacklist-1
              </code>
              。只允许使用规则库中已存在的 ID。
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  第一重规则 ID 列表
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={draftLayer1}
                  onChange={(e) => setDraftLayer1(e.target.value)}
                  placeholder="例如：rule-whitelist-1, rule-blacklist-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  第二重规则 ID 列表
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={draftLayer2}
                  onChange={(e) => setDraftLayer2(e.target.value)}
                  placeholder="例如：rule-range-speed, rule-range-voltage"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300"
              >
                取消
              </button>
              <button
                onClick={saveConfigFromModal}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
