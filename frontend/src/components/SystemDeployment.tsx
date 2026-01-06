import { useState, useEffect } from 'react';
import { Server, Play, Square, RefreshCw, CheckCircle, XCircle, Clock, Download, X } from 'lucide-react';

interface Deployment {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  createdAt: string;
  completedAt?: string;
  progress?: number;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export function SystemDeployment() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedDeploymentLogs, setSelectedDeploymentLogs] = useState<{ deploymentId: string; deploymentName: string; logs: LogEntry[] } | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<Record<string, LogEntry[]>>({});

  useEffect(() => {
    loadDeployments();
  }, []);

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const generateDeploymentLogs = (deployment: Deployment): LogEntry[] => {
    const logs: LogEntry[] = [];
    const createdAt = new Date(deployment.createdAt);
    
    logs.push({
      timestamp: formatDateTime(createdAt),
      level: 'info',
      message: `开始部署: ${deployment.name} (版本: ${deployment.version})`
    });
    
    logs.push({
      timestamp: formatDateTime(new Date(createdAt.getTime() + 1000)),
      level: 'info',
      message: '检查部署环境...'
    });
    
    logs.push({
      timestamp: formatDateTime(new Date(createdAt.getTime() + 2000)),
      level: 'info',
      message: '环境检查通过'
    });
    
    logs.push({
      timestamp: formatDateTime(new Date(createdAt.getTime() + 3000)),
      level: 'info',
      message: '下载部署包...'
    });
    
    if (deployment.status === 'success') {
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 5000)),
        level: 'success',
        message: '部署包下载完成'
      });
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 6000)),
        level: 'info',
        message: '执行部署脚本...'
      });
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 8000)),
        level: 'success',
        message: '部署脚本执行成功'
      });
      if (deployment.completedAt) {
        logs.push({
          timestamp: formatDateTime(new Date(deployment.completedAt)),
          level: 'success',
          message: '部署完成！所有服务已启动'
        });
      }
    } else if (deployment.status === 'failed') {
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 5000)),
        level: 'error',
        message: '部署包下载失败: 网络连接超时'
      });
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 6000)),
        level: 'warning',
        message: '尝试重试下载...'
      });
      if (deployment.completedAt) {
        logs.push({
          timestamp: formatDateTime(new Date(deployment.completedAt)),
          level: 'error',
          message: '部署失败: 无法连接到部署服务器'
        });
      }
    } else if (deployment.status === 'deploying') {
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 5000)),
        level: 'info',
        message: '部署包下载中... (65%)'
      });
      logs.push({
        timestamp: formatDateTime(new Date(createdAt.getTime() + 6000)),
        level: 'info',
        message: '正在执行部署脚本...'
      });
    }
    
    return logs;
  };

  const loadDeployments = () => {
    // 模拟数据
    const mockDeployments: Deployment[] = [
      {
        id: 'deploy-001',
        name: '生产环境部署',
        version: 'v2.0.1',
        status: 'success',
        createdAt: '2025-01-21T10:00:00',
        completedAt: '2025-01-21T10:15:00',
      },
      {
        id: 'deploy-002',
        name: '测试环境部署',
        version: 'v2.0.2',
        status: 'deploying',
        createdAt: new Date().toISOString(),
        progress: 65,
      },
      {
        id: 'deploy-003',
        name: '开发环境部署',
        version: 'v2.0.0',
        status: 'failed',
        createdAt: '2025-01-20T15:30:00',
        completedAt: '2025-01-20T15:35:00',
      },
    ];
    setDeployments(mockDeployments);
    
    // 为每个部署生成日志
    const logs: Record<string, LogEntry[]> = {};
    mockDeployments.forEach(deployment => {
      logs[deployment.id] = generateDeploymentLogs(deployment);
    });
    setDeploymentLogs(logs);
  };

  const handleRefresh = () => {
    loadDeployments();
    console.log('刷新部署状态');
  };

  const handleViewLogs = (deploymentId: string) => {
    const deployment = deployments.find(d => d.id === deploymentId);
    if (!deployment) return;
    
    const logs = deploymentLogs[deploymentId] || [];
    setSelectedDeploymentLogs({
      deploymentId,
      deploymentName: deployment.name,
      logs
    });
  };

  const handleStartDeployment = () => {
    if (isDeploying) {
      // 停止部署
      setIsDeploying(false);
      // 停止所有正在部署的任务
      setDeployments(prev => prev.map(d => 
        d.status === 'deploying' 
          ? { ...d, status: 'pending' as const, progress: undefined }
          : d
      ));
      return;
    }

    // 检查部署配置 - 从页面获取选中的环境和版本
    // 这里简化处理，直接使用默认值
    const environment = '生产环境';
    const version = 'v2.0.2';

    if (confirm(`确定要在 ${environment} 环境部署版本 ${version} 吗？`)) {
      setIsDeploying(true);
      
      // 创建新的部署任务
      const newDeployment: Deployment = {
        id: `deploy-${Date.now()}`,
        name: `${environment}部署`,
        version: version,
        status: 'deploying',
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      setDeployments(prev => [newDeployment, ...prev]);

      // 生成初始日志
      const initialLogs: LogEntry[] = [{
        timestamp: formatDateTime(new Date()),
        level: 'info',
        message: `开始部署: ${newDeployment.name} (版本: ${newDeployment.version})`
      }];
      setDeploymentLogs(prev => ({
        ...prev,
        [newDeployment.id]: initialLogs
      }));

      // 模拟部署过程
      let progress = 0;
      const progressInterval = setInterval(() => {
        setDeployments(currentDeployments => {
          const currentDeployment = currentDeployments.find(d => d.id === newDeployment.id);
          if (!currentDeployment || currentDeployment.status !== 'deploying') {
            clearInterval(progressInterval);
            return currentDeployments;
          }
          return currentDeployments;
        });

        progress += 5;
        if (progress <= 100) {
          setDeployments(prev => prev.map(d => 
            d.id === newDeployment.id ? { ...d, progress } : d
          ));

          const currentTime = new Date();
          setDeploymentLogs(prev => {
            const existingLogs = prev[newDeployment.id] || [];
            const newLog = {
              timestamp: formatDateTime(currentTime),
              level: 'info' as const,
              message: `部署进度: ${progress}%`
            };
            return {
              ...prev,
              [newDeployment.id]: [...existingLogs, newLog]
            };
          });
        } else {
          clearInterval(progressInterval);
          // 部署完成
          const completedAt = new Date();
          setDeployments(prev => prev.map(d => 
            d.id === newDeployment.id 
              ? { 
                  ...d, 
                  status: 'success' as const,
                  completedAt: completedAt.toISOString(),
                  progress: undefined
                }
              : d
          ));
          setDeploymentLogs(prev => {
            const existingLogs = prev[newDeployment.id] || [];
            return {
              ...prev,
              [newDeployment.id]: [
                ...existingLogs,
                {
                  timestamp: formatDateTime(completedAt),
                  level: 'success' as const,
                  message: '部署完成！所有服务已启动'
                }
              ]
            };
          });
          setIsDeploying(false);
        }
      }, 300);
    }
  };

  const handleRedeploy = (deploymentId: string) => {
    const deployment = deployments.find(d => d.id === deploymentId);
    if (!deployment) return;

    if (confirm(`确定要重新部署 "${deployment.name}" (版本: ${deployment.version}) 吗？`)) {
      // 更新部署状态为部署中
      setDeployments(prev => prev.map(d => 
        d.id === deploymentId 
          ? { 
              ...d, 
              status: 'deploying' as const, 
              progress: 0,
              createdAt: new Date().toISOString(),
              completedAt: undefined
            }
          : d
      ));

      // 生成新的日志
      const newLogs: LogEntry[] = [];
      const now = new Date();
      newLogs.push({
        timestamp: formatDateTime(now),
        level: 'info',
        message: `开始重新部署: ${deployment.name} (版本: ${deployment.version})`
      });
      setDeploymentLogs(prev => ({
        ...prev,
        [deploymentId]: newLogs
      }));

      // 模拟部署过程
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setDeployments(prev => prev.map(d => 
            d.id === deploymentId ? { ...d, progress } : d
          ));

          const currentTime = new Date();
          setDeploymentLogs(prev => {
            const existingLogs = prev[deploymentId] || [];
            const newLog = {
              timestamp: formatDateTime(currentTime),
              level: 'info' as const,
              message: `部署进度: ${progress}%`
            };
            return {
              ...prev,
              [deploymentId]: [...existingLogs, newLog]
            };
          });
        } else {
          clearInterval(progressInterval);
          // 部署完成
          const completedAt = new Date();
          setDeployments(prev => prev.map(d => 
            d.id === deploymentId 
              ? { 
                  ...d, 
                  status: 'success' as const,
                  completedAt: completedAt.toISOString(),
                  progress: undefined
                }
              : d
          ));
          setDeploymentLogs(prev => {
            const existingLogs = prev[deploymentId] || [];
            return {
              ...prev,
              [deploymentId]: [
                ...existingLogs,
                {
                  timestamp: formatDateTime(completedAt),
                  level: 'success' as const,
                  message: '部署完成！所有服务已启动'
                }
              ]
            };
          });
        }
      }, 500);
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const handleStopDeployment = (deploymentId: string) => {
    setDeployments(prev => prev.map(d => 
      d.id === deploymentId ? { ...d, status: 'pending' as const, progress: undefined } : d
    ));
    console.log(`停止部署: ${deploymentId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'deploying':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'deploying':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return '部署成功';
      case 'failed':
        return '部署失败';
      case 'deploying':
        return '部署中';
      default:
        return '待部署';
    }
  };

  return (
    <div className="p-6 mt-[56px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mb-1">系统部署</h2>
          <p className="text-sm text-gray-500">部署配置 · 部署历史 · 状态监控</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStartDeployment}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              isDeploying
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isDeploying ? (
              <>
                <Square className="w-4 h-4" />
                停止部署
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始部署
              </>
            )}
          </button>
          <button onClick={handleRefresh} className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
        </div>
      </div>

      {/* 部署配置 */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">部署配置</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">环境</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>生产环境</option>
              <option>测试环境</option>
              <option>开发环境</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">版本</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>v2.0.2 (最新)</option>
              <option>v2.0.1</option>
              <option>v2.0.0</option>
            </select>
          </div>
        </div>
      </div>

      {/* 部署历史 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold mb-4">部署历史</h3>
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                {getStatusIcon(deployment.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{deployment.name}</h4>
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">v{deployment.version}</span>
                    <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(deployment.status)}`}>
                      {getStatusLabel(deployment.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    创建时间: {new Date(deployment.createdAt).toLocaleString()}
                    {deployment.completedAt && (
                      <> | 完成时间: {new Date(deployment.completedAt).toLocaleString()}</>
                    )}
                  </div>
                  {deployment.progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>部署进度</span>
                        <span>{deployment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${deployment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewLogs(deployment.id)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  查看日志
                </button>
                {deployment.status === 'failed' && (
                  <button 
                    onClick={() => handleRedeploy(deployment.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  >
                    重新部署
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 部署状态监控 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">总部署数</div>
              <div className="text-3xl font-bold">{deployments.length}</div>
            </div>
            <Server className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">成功部署</div>
              <div className="text-3xl font-bold text-green-600">
                {deployments.filter(d => d.status === 'success').length}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">失败部署</div>
              <div className="text-3xl font-bold text-red-600">
                {deployments.filter(d => d.status === 'failed').length}
              </div>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">部署中</div>
              <div className="text-3xl font-bold text-blue-600">
                {deployments.filter(d => d.status === 'deploying').length}
              </div>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 部署日志模态框 */}
      {selectedDeploymentLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedDeploymentLogs(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold">{selectedDeploymentLogs.deploymentName} - 部署日志</h3>
                <p className="text-sm text-gray-500 mt-1">共 {selectedDeploymentLogs.logs.length} 条日志记录</p>
              </div>
              <button
                onClick={() => setSelectedDeploymentLogs(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg">
                <div className="space-y-1">
                  {selectedDeploymentLogs.logs.length === 0 ? (
                    <div className="text-gray-500">该部署暂无日志记录</div>
                  ) : (
                    selectedDeploymentLogs.logs.map((log, index) => (
                      <div key={index} className={`${getLogLevelColor(log.level)}`}>
                        <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                        <span className="font-semibold">[{log.level.toUpperCase()}]</span>{' '}
                        {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedDeploymentLogs(null)}
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

