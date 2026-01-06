import { useState, useEffect } from 'react';
import { Wrench, Play, Pause, Square, RefreshCw, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

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

interface LogEntry {
  timestamp: string;
  message: string;
}

export function HILDebugging() {
  const [devices, setDevices] = useState<HILDevice[]>([]);
  const [testCases, setTestCases] = useState<DebugTestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testCaseLogs, setTestCaseLogs] = useState<Record<string, LogEntry[]>>({});
  const [selectedTestCaseLogs, setSelectedTestCaseLogs] = useState<{ testCaseId: string; testCaseName: string; logs: LogEntry[] } | null>(null);

  // 格式化日期时间
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 添加日志
  const addLog = (message: string, testCaseId?: string) => {
    const timestamp = formatDateTime(new Date());
    const logEntry = { timestamp, message };
    setLogs(prev => [...prev, logEntry]);
    
    // 如果指定了测试用例ID，也添加到该测试用例的日志中
    if (testCaseId) {
      setTestCaseLogs(prev => ({
        ...prev,
        [testCaseId]: [...(prev[testCaseId] || []), logEntry]
      }));
    }
  };

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

  useEffect(() => {
    loadDevices();
    loadTestCases();
    // 初始化日志
    const now = new Date();
    const initialLogs: LogEntry[] = [
      {
        timestamp: formatDateTime(new Date(now.getTime() - 3000)),
        message: `连接HIL设备: VCU HIL台架 #1`
      },
      {
        timestamp: formatDateTime(new Date(now.getTime() - 2000)),
        message: `设备连接成功`
      }
    ];
    setLogs(initialLogs);
  }, []);

  const handleRefresh = () => {
    loadDevices();
    loadTestCases();
    console.log('刷新HIL设备状态和测试用例');
  };

  const handleStartDebugging = () => {
    if (isRunning) {
      // 暂停联调
      setIsRunning(false);
      addLog('联调已暂停');
      return;
    }

    // 检查是否有已连接的设备
    const connectedDevices = devices.filter(d => d.status === 'connected');
    if (connectedDevices.length === 0) {
      alert('请先连接HIL设备后再开始联调');
      return;
    }

    // 开始联调
    setIsRunning(true);
    addLog('=== 开始HIL联调测试 ===');
    addLog(`已连接设备: ${connectedDevices.map(d => d.name).join(', ')}`);
    
    // 使用函数式更新获取最新的测试用例状态
    setTestCases(prevCases => {
      // 获取所有待执行的测试用例
      const pendingCases = prevCases.filter(c => c.status === 'pending');
      
      if (pendingCases.length === 0) {
        addLog('没有待执行的测试用例');
        setTimeout(() => setIsRunning(false), 100);
        return prevCases;
      }

      addLog(`发现 ${pendingCases.length} 个待执行测试用例，开始自动执行...`);
      
      // 依次执行所有待执行的测试用例
      pendingCases.forEach((testCase, index) => {
        setTimeout(() => {
          // 检查是否仍在运行
          setTestCases(currentCases => {
            const currentCase = currentCases.find(c => c.id === testCase.id);
            if (!currentCase || currentCase.status !== 'pending') {
              return currentCases;
            }
            
            addLog(`准备执行测试用例 ${index + 1}/${pendingCases.length}: ${testCase.name}`);
            handleRunTestCase(testCase.id);
            return currentCases;
          });
        }, index * 3000); // 每个测试用例间隔3秒执行
      });
      
      return prevCases;
    });
  };

  const handleRunTestCase = (testCaseId: string) => {
    const testCase = testCases.find(c => c.id === testCaseId);
    if (!testCase) return;

    // 如果测试用例已经在运行中，不重复执行
    if (testCase.status === 'running') return;

    // 初始化该测试用例的日志
    setTestCaseLogs(prev => ({
      ...prev,
      [testCaseId]: []
    }));

    // 更新测试用例状态为运行中
    setTestCases(prevCases =>
      prevCases.map(case_ =>
        case_.id === testCaseId
          ? { ...case_, status: 'running' as const }
          : case_
      )
    );
    
    // 添加开始执行日志
    addLog(`开始执行测试用例: ${testCase.name}`, testCaseId);
    addLog(`初始化测试环境...`, testCaseId);
    
    // 模拟测试执行
    setTimeout(() => {
      const duration = Math.floor(Math.random() * 1000) + 500;
      const passed = Math.random() > 0.1; // 90% 通过率
      
      // 添加中间步骤日志
      addLog(`执行测试步骤 1/3: 连接设备`, testCaseId);
      setTimeout(() => {
        addLog(`执行测试步骤 2/3: 发送测试信号`, testCaseId);
        setTimeout(() => {
          addLog(`执行测试步骤 3/3: 验证响应`, testCaseId);
          
          // 更新测试用例状态
          setTestCases(prevCases =>
            prevCases.map(case_ =>
              case_.id === testCaseId
                ? { 
                    ...case_, 
                    status: (passed ? 'passed' : 'failed') as const, 
                    duration 
                  }
                : case_
            )
          );
          
          // 添加测试结果日志
          if (passed) {
            addLog(`测试用例 ${testCase.name} 执行通过 (耗时: ${duration}ms)`, testCaseId);
          } else {
            addLog(`测试用例 ${testCase.name} 执行失败 (耗时: ${duration}ms)`, testCaseId);
            addLog(`错误信息: 测试信号响应超时`, testCaseId);
          }
          
          // 检查是否所有测试用例都已完成
          setTestCases(currentCases => {
            const allCompleted = currentCases.every(c => 
              c.status !== 'pending' && c.status !== 'running'
            );
            if (allCompleted && isRunning) {
              setTimeout(() => {
                addLog('=== 所有测试用例执行完成 ===');
                setIsRunning(false);
              }, 500);
            }
            return currentCases;
          });
        }, 400);
      }, 400);
    }, 400);
  };

  const handleViewLogs = (testCaseId: string) => {
    const testCase = testCases.find(c => c.id === testCaseId);
    if (!testCase) return;
    
    const logs = testCaseLogs[testCaseId] || [];
    setSelectedTestCaseLogs({
      testCaseId,
      testCaseName: testCase.name,
      logs
    });
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
            onClick={handleStartDebugging}
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
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
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
                <button 
                  onClick={() => handleRunTestCase(testCase.id)}
                  disabled={testCase.status === 'running'}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleViewLogs(testCase.id)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  查看日志
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 联调日志 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">联调日志</h3>
          <button
            onClick={() => setLogs([])}
            className="text-sm px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            清空日志
          </button>
        </div>
        <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
          <div className="space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>[{log.timestamp}] {log.message}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 测试用例日志模态框 */}
      {selectedTestCaseLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTestCaseLogs(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold">{selectedTestCaseLogs.testCaseName} - 日志</h3>
                <p className="text-sm text-gray-500 mt-1">共 {selectedTestCaseLogs.logs.length} 条日志记录</p>
              </div>
              <button
                onClick={() => setSelectedTestCaseLogs(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg">
                <div className="space-y-1">
                  {selectedTestCaseLogs.logs.length === 0 ? (
                    <div className="text-gray-500">该测试用例暂无日志记录</div>
                  ) : (
                    selectedTestCaseLogs.logs.map((log, index) => (
                      <div key={index}>[{log.timestamp}] {log.message}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTestCaseLogs(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
