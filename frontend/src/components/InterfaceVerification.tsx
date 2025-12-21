import { useState, useEffect } from 'react';
import { Network, CheckCircle, XCircle, Play, RefreshCw, Settings } from 'lucide-react';

interface Interface {
  id: string;
  name: string;
  type: 'CAN' | 'LIN' | 'Ethernet' | 'SPI';
  status: 'active' | 'inactive' | 'error';
  baudRate?: number;
  lastTest?: string;
  testResult?: 'passed' | 'failed';
}

interface TestCase {
  id: string;
  name: string;
  interfaceId: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  responseTime?: number;
}

export function InterfaceVerification() {
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');

  useEffect(() => {
    loadInterfaces();
    loadTestCases();
  }, []);

  const loadInterfaces = () => {
    // 模拟数据
    const mockInterfaces: Interface[] = [
      {
        id: 'can-001',
        name: 'CAN总线 #1',
        type: 'CAN',
        status: 'active',
        baudRate: 500000,
        lastTest: new Date().toISOString(),
        testResult: 'passed',
      },
      {
        id: 'can-002',
        name: 'CAN总线 #2',
        type: 'CAN',
        status: 'active',
        baudRate: 250000,
        lastTest: new Date().toISOString(),
        testResult: 'passed',
      },
      {
        id: 'lin-001',
        name: 'LIN总线 #1',
        type: 'LIN',
        status: 'active',
        baudRate: 19200,
        lastTest: new Date().toISOString(),
        testResult: 'passed',
      },
    ];
    setInterfaces(mockInterfaces);
    if (mockInterfaces.length > 0) {
      setSelectedInterface(mockInterfaces[0].id);
    }
  };

  const loadTestCases = () => {
    // 模拟数据
    const mockCases: TestCase[] = [
      {
        id: 'test-001',
        name: 'CAN报文发送测试',
        interfaceId: 'can-001',
        description: '测试CAN报文能否正常发送',
        status: 'pending',
      },
      {
        id: 'test-002',
        name: 'CAN报文接收测试',
        interfaceId: 'can-001',
        description: '测试CAN报文能否正常接收',
        status: 'pending',
      },
      {
        id: 'test-003',
        name: 'LIN唤醒测试',
        interfaceId: 'lin-001',
        description: '测试LIN总线唤醒功能',
        status: 'pending',
      },
    ];
    setTestCases(mockCases);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CAN: 'bg-blue-100 text-blue-700 border-blue-200',
      LIN: 'bg-green-100 text-green-700 border-green-200',
      Ethernet: 'bg-purple-100 text-purple-700 border-purple-200',
      SPI: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">接口验证</h2>
          <p className="text-sm text-gray-500">接口列表 · 测试用例 · 性能监控</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all flex items-center gap-2">
            <Play className="w-4 h-4" />
            执行测试
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
        </div>
      </div>

      {/* 接口列表 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {interfaces.map((iface) => (
          <div
            key={iface.id}
            className={`bg-white rounded-2xl p-5 shadow-lg border-2 ${
              selectedInterface === iface.id ? 'border-orange-500' : 'border-gray-100'
            } hover:border-orange-300 transition-all cursor-pointer`}
            onClick={() => setSelectedInterface(iface.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Network className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-semibold">{iface.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs border ${getTypeColor(iface.type)}`}>
                    {iface.type}
                  </span>
                </div>
              </div>
              {getStatusIcon(iface.status)}
            </div>
            {iface.baudRate && (
              <div className="text-sm text-gray-600 mb-2">
                波特率: {iface.baudRate.toLocaleString()} bps
              </div>
            )}
            {iface.testResult && (
              <div className={`text-xs px-2 py-1 rounded ${
                iface.testResult === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {iface.testResult === 'passed' ? '✓ 测试通过' : '✗ 测试失败'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 测试用例 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold mb-4">接口测试用例</h3>
        <div className="space-y-3">
          {testCases
            .filter(tc => !selectedInterface || tc.interfaceId === selectedInterface)
            .map((testCase) => (
              <div
                key={testCase.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{testCase.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      testCase.status === 'passed' ? 'bg-green-100 text-green-700' :
                      testCase.status === 'failed' ? 'bg-red-100 text-red-700' :
                      testCase.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {testCase.status === 'pending' ? '待执行' :
                       testCase.status === 'running' ? '执行中' :
                       testCase.status === 'passed' ? '通过' : '失败'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{testCase.description}</p>
                  {testCase.responseTime && (
                    <p className="text-xs text-gray-500 mt-1">响应时间: {testCase.responseTime}ms</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 性能监控 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">接口性能监控</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">总报文数</div>
            <div className="text-2xl font-bold">12,345</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">平均延迟</div>
            <div className="text-2xl font-bold">2.3ms</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">错误率</div>
            <div className="text-2xl font-bold text-green-600">0.01%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">吞吐量</div>
            <div className="text-2xl font-bold">1.2 MB/s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

