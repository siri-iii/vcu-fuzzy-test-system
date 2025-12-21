import { useState, useEffect } from 'react';
import { Server, Play, Square, RefreshCw, CheckCircle, XCircle, Clock, Download } from 'lucide-react';

interface Deployment {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  createdAt: string;
  completedAt?: string;
  progress?: number;
}

export function SystemDeployment() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    loadDeployments();
  }, []);

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
            onClick={() => setIsDeploying(!isDeploying)}
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
          <button className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
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
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                  查看日志
                </button>
                {deployment.status === 'failed' && (
                  <button className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
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
    </div>
  );
}

