import { useState, useEffect } from 'react';
import { Monitor, Activity, Cpu, HardDrive, Wifi, AlertTriangle, X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface AlertSettings {
  cpuThreshold: number;
  memoryThreshold: number;
  diskThreshold: number;
  networkThreshold: number;
  emailNotification: boolean;
  smsNotification: boolean;
  alertInterval: number;
}

export function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 1250,
  });
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 90,
    networkThreshold: 2000,
    emailNotification: true,
    smsNotification: false,
    alertInterval: 5,
  });

  useEffect(() => {
    // 生成模拟数据
    const generateMockData = () => {
      const data: SystemMetric[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000);
        data.push({
          timestamp: timestamp.toLocaleTimeString(),
          cpu: 30 + Math.random() * 40,
          memory: 50 + Math.random() * 30,
          disk: 20 + Math.random() * 30,
          network: 800 + Math.random() * 1000,
        });
      }
      setMetrics(data);
    };

    generateMockData();
    const interval = setInterval(() => {
      setCurrentMetrics({
        cpu: 30 + Math.random() * 40,
        memory: 50 + Math.random() * 30,
        disk: 20 + Math.random() * 30,
        network: 800 + Math.random() * 1000,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAlertSettings = () => {
    setShowAlertSettings(true);
  };

  const handleSaveAlertSettings = () => {
    console.log('保存告警设置', alertSettings);
    setShowAlertSettings(false);
    // 这里可以添加保存到后端的逻辑
  };

  const handleCloseAlertSettings = () => {
    setShowAlertSettings(false);
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">系统监控</h2>
          <p className="text-sm text-gray-500">实时监控 · 性能指标 · 资源使用</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAlertSettings} className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            告警设置
          </button>
        </div>
      </div>

      {/* 实时指标卡片 */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">CPU使用率</div>
              <div className="text-3xl font-bold">{currentMetrics.cpu.toFixed(1)}%</div>
            </div>
            <Cpu className="w-8 h-8 text-blue-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${currentMetrics.cpu}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">内存使用率</div>
              <div className="text-3xl font-bold">{currentMetrics.memory.toFixed(1)}%</div>
            </div>
            <HardDrive className="w-8 h-8 text-green-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${currentMetrics.memory}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">磁盘使用率</div>
              <div className="text-3xl font-bold">{currentMetrics.disk.toFixed(1)}%</div>
            </div>
            <HardDrive className="w-8 h-8 text-orange-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${currentMetrics.disk}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">网络流量</div>
              <div className="text-3xl font-bold">{(currentMetrics.network / 1000).toFixed(2)} MB/s</div>
            </div>
            <Wifi className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 性能趋势图 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">CPU和内存使用趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="memory" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">网络流量趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="network" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 告警设置模态框 */}
      {showAlertSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseAlertSettings}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold">告警设置</h3>
                <p className="text-sm text-gray-500 mt-1">配置系统资源监控告警阈值和通知方式</p>
              </div>
              <button
                onClick={handleCloseAlertSettings}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* CPU告警阈值 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU使用率告警阈值 (%)
                  </label>
                  <input
                    type="number"
                    value={alertSettings.cpuThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, cpuThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">当CPU使用率超过此值时触发告警</p>
                </div>

                {/* 内存告警阈值 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内存使用率告警阈值 (%)
                  </label>
                  <input
                    type="number"
                    value={alertSettings.memoryThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, memoryThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">当内存使用率超过此值时触发告警</p>
                </div>

                {/* 磁盘告警阈值 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    磁盘使用率告警阈值 (%)
                  </label>
                  <input
                    type="number"
                    value={alertSettings.diskThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, diskThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">当磁盘使用率超过此值时触发告警</p>
                </div>

                {/* 网络流量告警阈值 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网络流量告警阈值 (MB/s)
                  </label>
                  <input
                    type="number"
                    value={alertSettings.networkThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, networkThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">当网络流量超过此值时触发告警</p>
                </div>

                {/* 告警间隔 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    告警间隔 (分钟)
                  </label>
                  <input
                    type="number"
                    value={alertSettings.alertInterval}
                    onChange={(e) => setAlertSettings({ ...alertSettings, alertInterval: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="1"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">相同告警的最小间隔时间，避免频繁通知</p>
                </div>

                {/* 通知方式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    通知方式
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertSettings.emailNotification}
                        onChange={(e) => setAlertSettings({ ...alertSettings, emailNotification: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">邮件通知</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertSettings.smsNotification}
                        onChange={(e) => setAlertSettings({ ...alertSettings, smsNotification: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">短信通知</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseAlertSettings}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveAlertSettings}
                className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-all"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

