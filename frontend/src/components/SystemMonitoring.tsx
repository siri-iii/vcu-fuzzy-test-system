import { useState, useEffect } from 'react';
import { Monitor, Activity, Cpu, HardDrive, Wifi, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 1250,
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

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">系统监控</h2>
          <p className="text-sm text-gray-500">实时监控 · 性能指标 · 资源使用</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
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

      {/* 系统信息 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">系统信息</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">操作系统</div>
            <div className="font-medium">macOS 25.1.0</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Python版本</div>
            <div className="font-medium">Python 3.x</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Node.js版本</div>
            <div className="font-medium">v24.12.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}

