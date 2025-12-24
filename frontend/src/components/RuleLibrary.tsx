import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ruleAPI } from '@/services/api';

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

type ModalMode = 'create' | 'edit';

type RuleFormState = {
  name: string;
  type: Rule['type'];
  enabled: boolean;
  priority: Rule['priority'];
  description: string;
  // 用 textarea 编辑 JSON，提交时 parse 成对象
  contentJson: string;
};

const DEFAULT_CONTENT_TEMPLATES: Record<Rule['type'], any> = {
  whitelist: { ids: [0x123, 0x456] },
  blacklist: { ids: [0x789] },
  range: { signal: 'voltage', min: 0, max: 12 },
  crc: { algorithm: 'CRC16', polynomial: '0x1021' },
  dlc: { min: 0, max: 8 },
  rate: { max_per_second: 100 },
};

function safeErrorMessage(err: any): string {
  // 兼容你 axios 拦截器 reject 出来的格式：{status, message, data}
  if (!err) return '未知错误';

  const msg = err.message ?? err?.response?.data?.detail ?? err?.response?.data?.message;

  if (typeof msg === 'string') return msg;

  // FastAPI 422: detail 是数组对象，避免直接渲染 object
  if (Array.isArray(err?.data?.detail)) {
    const first = err.data.detail[0];
    const loc = Array.isArray(first?.loc) ? first.loc.join('.') : '';
    const m = first?.msg ? String(first.msg) : '参数校验失败';
    return loc ? `${m}（字段: ${loc}）` : m;
  }

  try {
    return JSON.stringify(msg);
  } catch {
    return '请求失败';
  }
}

function prettifyJson(obj: any): string {
  try {
    return JSON.stringify(obj ?? {}, null, 2);
  } catch {
    return '{\n\n}';
  }
}

export function RuleLibrary() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false); // 保持原变量名不动
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [form, setForm] = useState<RuleFormState>({
    name: '',
    type: 'whitelist',
    enabled: true,
    priority: 'medium',
    description: '',
    contentJson: prettifyJson(DEFAULT_CONTENT_TEMPLATES.whitelist),
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await ruleAPI.getAll();
      setRules(data);
    } catch (error: any) {
      console.error('加载规则失败:', error);
      toast.error('加载规则失败: ' + safeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || rule.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [rules, searchTerm, filterType]);

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

  /** =========================
   *  启用 / 禁用
   *  ========================= */
  const toggleEnabled = async (rule: Rule) => {
    try {
      if (rule.enabled) {
        await ruleAPI.disable(rule.id);
        toast.success('规则已禁用');
      } else {
        await ruleAPI.enable(rule.id);
        toast.success('规则已启用');
      }
      await loadRules();
    } catch (e: any) {
      toast.error(safeErrorMessage(e));
    }
  };

  /** =========================
   *  删除
   *  ========================= */
  const deleteRule = async (rule: Rule) => {
    if (!confirm(`确认删除规则「${rule.name}」？`)) return;
    try {
      await ruleAPI.delete(rule.id);
      toast.success('规则已删除');
      await loadRules();
    } catch (e: any) {
      toast.error(safeErrorMessage(e));
    }
  };

  /** =========================
   *  导出
   *  ========================= */
  const exportRules = async () => {
    try {
      const data = await ruleAPI.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rules_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('规则已导出');
    } catch (e: any) {
      toast.error('导出失败: ' + safeErrorMessage(e));
    }
  };

  /** =========================
   *  导入（上传 JSON 文件）
   *  ========================= */
  const onImportFilePicked = async (file: File) => {
    try {
      await ruleAPI.import(file);
      toast.success('规则导入成功');
      await loadRules();
    } catch (e: any) {
      toast.error('导入失败: ' + safeErrorMessage(e));
    }
  };

  /** =========================
   *  打开“新建”弹窗：准备默认模板
   *  ========================= */
  const openCreateModal = () => {
    setModalMode('create');
    setEditingRuleId(null);
    setForm({
      name: '',
      type: 'whitelist',
      enabled: true,
      priority: 'medium',
      description: '',
      contentJson: prettifyJson(DEFAULT_CONTENT_TEMPLATES.whitelist),
    });
    setShowAddModal(true);
  };

  /** =========================
   *  打开“编辑”弹窗：填充已有数据
   *  ========================= */
  const openEditModal = async (rule: Rule) => {
    try {
      // 如果你希望确保拿到最新的单条数据，可用 getById：
      // const full = await ruleAPI.getById(rule.id);
      // 这里优先用列表里的 rule（更快），你也可以切换成 full
      const full = rule;

      setModalMode('edit');
      setEditingRuleId(full.id);
      setForm({
        name: full.name ?? '',
        type: full.type ?? 'whitelist',
        enabled: !!full.enabled,
        priority: full.priority ?? 'medium',
        description: full.description ?? '',
        contentJson: prettifyJson(full.content ?? DEFAULT_CONTENT_TEMPLATES[full.type ?? 'whitelist']),
      });
      setShowAddModal(true);
    } catch (e: any) {
      toast.error('加载规则详情失败: ' + safeErrorMessage(e));
    }
  };

  /** =========================
   *  content 模板联动：切换 type 时给出模板
   *  ========================= */
  const onTypeChanged = (newType: Rule['type']) => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      contentJson: prettifyJson(DEFAULT_CONTENT_TEMPLATES[newType]),
    }));
  };

  /** =========================
   *  提交：创建 / 更新
   *  ========================= */
  const submitRule = async () => {
    // 基本校验
    if (!form.name.trim()) {
      toast.error('规则名称不能为空');
      return;
    }
    if (!form.description.trim()) {
      toast.error('规则描述不能为空');
      return;
    }

    let contentObj: any = {};
    try {
      contentObj = form.contentJson?.trim() ? JSON.parse(form.contentJson) : {};
    } catch (e) {
      toast.error('content 必须是合法 JSON');
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      enabled: form.enabled,
      priority: form.priority,
      description: form.description.trim(),
      content: contentObj,
    };

    try {
      if (modalMode === 'create') {
        await ruleAPI.create(payload);
        toast.success('规则创建成功');
      } else {
        if (!editingRuleId) {
          toast.error('缺少 rule_id，无法更新');
          return;
        }
        await ruleAPI.update(editingRuleId, payload);
        toast.success('规则更新成功');
      }
      setShowAddModal(false);
      await loadRules();
    } catch (e: any) {
      toast.error(safeErrorMessage(e));
    }
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">工艺规则库</h2>
          <p className="text-sm text-gray-500">规则管理 · 版本控制 · 导入导出</p>
        </div>
        <div className="flex gap-2">
          {/* 导入规则：保持原按钮布局，内部加隐藏 input */}
          <label className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            导入规则
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFilePicked(f);
                // 允许重复选择同一文件也触发
                e.currentTarget.value = '';
              }}
            />
          </label>

          {/* 导出规则 */}
          <button
            onClick={exportRules}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出规则
          </button>

          {/* 新建规则 */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-black rounded-xl hover:shadow-lg hover:shadow-green-600/20 transition-all flex items-center gap-2"
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

                      {/* 启用/禁用：保持原图标布局，只加点击 */}
                      <button onClick={() => toggleEnabled(rule)} title={rule.enabled ? '点击禁用' : '点击启用'}>
                        {rule.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{rule.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>版本: {rule.version}</span>
                      <span>创建: {rule.created_at}</span>
                      <span>更新: {rule.updated_at}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* 更新规则：Edit 按钮接 PUT */}
                    <button
                      onClick={() => openEditModal(rule)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      title="编辑规则"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* 删除：Trash 按钮接 DELETE */}
                    <button
                      onClick={() => deleteRule(rule)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all"
                      title="删除规则"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 新建/编辑规则模态框：保持原“showAddModal”弹层结构不变，只把内容充实 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {modalMode === 'create' ? '新建规则' : '编辑规则'}
            </h3>

            {/* 详细创建/修改模板：不改布局层级，只在弹窗内部加表单 */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">规则名称（name）</div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例如：信号白名单检查"
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">规则类型（type）</div>
                <select
                  value={form.type}
                  onChange={(e) => onTypeChanged(e.target.value as Rule['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="whitelist">whitelist（白名单）</option>
                  <option value="blacklist">blacklist（黑名单）</option>
                  <option value="range">range（范围）</option>
                  <option value="crc">crc（CRC）</option>
                  <option value="dlc">dlc（DLC）</option>
                  <option value="rate">rate（速率）</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  切换类型会自动填充 content 模板；你可以再按业务修改 JSON。
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">优先级（priority）</div>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Rule['priority'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="high">high（高）</option>
                  <option value="medium">medium（中）</option>
                  <option value="low">low（低）</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">是否启用（enabled）</div>
                <button
                  onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  {form.enabled ? '已启用' : '已禁用'}
                </button>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">规则描述（description）</div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="说明这条规则拦截/校验的目的与范围"
                  rows={3}
                />
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">规则内容（content，JSON）</div>
                <textarea
                  value={form.contentJson}
                  onChange={(e) => setForm((p) => ({ ...p, contentJson: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={7}
                />
                <div className="text-xs text-gray-500 mt-1">
                  示例说明（按 type）：
                  <div className="mt-1">
                    whitelist/blacklist: {`{ "ids": [0x123, 0x456] }`}；range: {`{ "signal": "voltage", "min": 0, "max": 12 }`}；
                    dlc: {`{ "min": 0, "max": 8 }`}；rate: {`{ "max_per_second": 100 }`}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={submitRule}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                {modalMode === 'create' ? '创建规则' : '保存修改'}
              </button>
            </div>

            {modalMode === 'edit' && editingRuleId && (
              <div className="text-xs text-gray-400 mt-3">当前编辑规则ID：{editingRuleId}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
