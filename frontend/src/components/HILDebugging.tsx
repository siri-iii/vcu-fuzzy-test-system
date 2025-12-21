import { useState, useEffect } from 'react';
import { Wrench, Play, Pause, Square, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HILDevice {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastUpdate: string;
}

interface DebugTestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  result?: string;
}

export function HILDebugging() {
  const [devices, setDevices] = useState<HILDevice[]>([]);
  const [testCases, setTestCases] = useState<DebugTestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    loadDevices();
    loadTestCases();
  }, []);

  const loadDevices = () => {
    // 模拟数据
    const mockDevices: HILDevice[] = [
      {
        id: 'hil-001',
        name: 'VCU HIL台架 #1',
        type: 'dSPACE',
        status: 'connected',
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'hil-002',
        name: '域控制器HIL台架 #2',
        type: 'NI VeriStand',
        status: 'connected',
        lastUpdate: new Date().toISOString(),
      },
    ];
    setDevices(mockDevices);
    if (mockDevices.length > 0) {
      setSelectedDevice(mockDevices[0].id);
    }
  };

  const loadTestCases = () => {
    // 模拟数据
    const mockCases: DebugTestCase[] = [
      {
        id: 'case-001',
        name: 'CAN总线连接测试',
        description: '测试CAN总线通信是否正常',
        status: 'pending',
      },
      {
        id: 'case-002',
        name: '唤醒信号注入测试',
        description: '验证唤醒信号能否正确触发',
        status: 'pending',
      },
      {
        id: 'case-003',
        name: '休眠流程验证',
        description: '验证休眠流程是否符合预期',
        status: 'pending',
      },
    ];
    setTestCases(mockCases);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTestCaseStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">HIL联调</h2>
          <p className="text-sm text-gray-500">设备连接 · 联调测试 · 接口验证</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              isRunning
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                暂停联调
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始联调
              </>
            )}
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
        </div>
      </div>

      {/* HIL设备状态 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
              selectedDevice === device.id ? 'border-orange-500' : 'border-gray-100'
            } hover:border-orange-300 transition-all cursor-pointer`}
            onClick={() => setSelectedDevice(device.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wrench className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-lg font-semibold">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.type}</p>
                </div>
              </div>
              {getStatusIcon(device.status)}
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs border ${getStatusColor(device.status)}`}>
              {device.status === 'connected' ? '已连接' : device.status === 'disconnected' ? '未连接' : '错误'}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              最后更新: {new Date(device.lastUpdate).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 联调测试用例 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold mb-4">联调测试用例</h3>
        <div className="space-y-3">
          {testCases.map((testCase) => (
            <div
              key={testCase.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{testCase.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs border ${getTestCaseStatusColor(testCase.status)}`}>
                    {testCase.status === 'pending' ? '待执行' :
                     testCase.status === 'running' ? '执行中' :
                     testCase.status === 'passed' ? '通过' : '失败'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{testCase.description}</p>
                {testCase.duration && (
                  <p className="text-xs text-gray-500 mt-1">耗时: {testCase.duration}ms</p>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  <Play className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  查看日志
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 联调日志 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">联调日志</h3>
        <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
          <div className="space-y-1">
            <div>[2025-01-21 20:30:15] 连接HIL设备: VCU HIL台架 #1</div>
            <div>[2025-01-21 20:30:16] 设备连接成功</div>
            <div>[2025-01-21 20:30:17] 开始执行测试用例: CAN总线连接测试</div>
            <div>[2025-01-21 20:30:18] 测试通过</div>
            <div className="text-gray-500">...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

