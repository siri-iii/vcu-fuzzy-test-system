import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { Toggle } from './Toggle';

export function SecurityCheck() {
  const [firstCheckEnabled, setFirstCheckEnabled] = useState(true);
  const [secondCheckEnabled, setSecondCheckEnabled] = useState(true);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'running' | 'paused'>('idle');

  const firstCheckRules = [
    { id: 'dbc-check', name: 'DBC文件校验', enabled: true, description: '验证信号ID是否符合DBC定义' },
    { id: 'whitelist-check', name: '白名单检查', enabled: true, description: '仅允许白名单中的信号' },
    { id: 'blacklist-check', name: '黑名单检查', enabled: true, description: '禁止黑名单中的信号' },
  ];

  const secondCheckRules = [
    { id: 'range-check', name: '数值范围检查', enabled: true, description: '验证信号值是否在合法范围内' },
    { id: 'crc-check', name: 'CRC校验', enabled: true, description: '验证报文的CRC校验码' },
    { id: 'dlc-check', name: 'DLC长度检查', enabled: true, description: '验证数据长度是否符合DLC定义' },
    { id: 'rate-check', name: '速率限制检查', enabled: true, description: '验证报文发送速率是否超限' },
  ];

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">双重安全校验配置</h2>
          <p className="text-sm text-gray-500">第一重校验 · 第二重校验 · 流程可视化</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCheckStatus(checkStatus === 'running' ? 'paused' : 'running')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              checkStatus === 'running'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
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
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            重置配置
          </button>
        </div>
      </div>

      {/* 第一重校验 */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">第一重校验</h3>
              <p className="text-sm text-gray-500">协议层校验（DBC、白名单、黑名单）</p>
            </div>
          </div>
          <Toggle
            checked={firstCheckEnabled}
            onChange={setFirstCheckEnabled}
          />
        </div>

        {firstCheckEnabled && (
          <div className="space-y-3 pl-13">
            {firstCheckRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-500">{rule.description}</div>
                  </div>
                </div>
                <Toggle checked={rule.enabled} onChange={() => {}} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 校验流程箭头 */}
      <div className="flex justify-center mb-6">
        <div className="w-1 h-12 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
      </div>

      {/* 第二重校验 */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">第二重校验</h3>
              <p className="text-sm text-gray-500">数据层校验（范围、CRC、DLC、速率）</p>
            </div>
          </div>
          <Toggle
            checked={secondCheckEnabled}
            onChange={setSecondCheckEnabled}
          />
        </div>

        {secondCheckEnabled && (
          <div className="space-y-3 pl-13">
            {secondCheckRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-500">{rule.description}</div>
                  </div>
                </div>
                <Toggle checked={rule.enabled} onChange={() => {}} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 校验统计 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">总拦截数</div>
          <div className="text-3xl font-bold text-red-600">156</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">第一重拦截</div>
          <div className="text-3xl font-bold text-green-600">89</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">第二重拦截</div>
          <div className="text-3xl font-bold text-blue-600">67</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">校验通过率</div>
          <div className="text-3xl font-bold text-green-600">94.2%</div>
        </div>
      </div>
    </div>
  );
}

