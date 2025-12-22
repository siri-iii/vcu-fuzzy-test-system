# 测试工程师界面开发指南

## 📋 概述

本文档为负责**测试工程师**界面的开发者提供详细的实现指南。测试工程师界面主要负责测试执行、监控和结果分析。

## 🎯 负责的界面组件

你需要实现以下前端组件的后端接口连接：

1. **Dashboard.tsx** - 仪表盘
2. **TestManagement.tsx** - 测试管理
3. **TestMonitoring.tsx** - 实时监控
4. **ResultAnalysis.tsx** - 结果分析
5. **ReportCenter.tsx** - 报告中心

## 🔌 已实现的后端接口

### ✅ 真实数据接口（已连接GAN模型和北汽接口）

以下接口已经连接了真实的GAN模型和北汽接口，**不需要模拟数据**：

#### 1. GAN测试用例生成
- **POST** `/api/gan/generate` - 生成单个测试用例
- **POST** `/api/gan/generate/batch` - 批量生成测试用例
- **POST** `/api/gan/convert` - 转换数据格式（发送到北汽接口）

**数据来源**：
- ✅ GAN模型：`backend/model_weights/vcu/` 目录下的 `.h5` 权重文件
- ✅ 北汽接口：通过 `backend/api/services/baic_adapter.py` 发送数据
- ✅ 模型加载：`backend/api/services/gan_model_loader.py`

**使用示例**：
```typescript
// 在 TestManagement.tsx 中
import { ganAPI } from '@/services/api';

// 生成单个测试用例
const generateCase = async () => {
  const result = await ganAPI.generate({
    sequence_length: 10,
    temperature: 0.7,
    condition: { phase: 'wake' }
  });
  // result.gan_data 包含生成的测试数据
};

// 批量生成
const generateBatch = async () => {
  const result = await ganAPI.generateBatch({
    count: 10,
    sequence_length: 10,
    temperature: 0.7
  });
  // result.cases 包含批量生成的测试用例
};
```

#### 2. 测试任务控制
- **POST** `/api/test-tasks/{id}/start` - 启动任务
- **POST** `/api/test-tasks/{id}/pause` - 暂停任务
- **POST** `/api/test-tasks/{id}/stop` - 停止任务

**说明**：这些接口会实际控制测试任务的执行，包括调用GAN生成和发送到北汽接口。

### ⚠️ 需要模拟数据的接口

以下接口目前使用模拟数据，**需要你根据实际业务逻辑补充**：

#### 1. 测试计划管理
- **GET** `/api/test-plans` - 获取所有测试计划
- **GET** `/api/test-plans/{id}` - 获取单个测试计划
- **POST** `/api/test-plans` - 创建测试计划
- **PUT** `/api/test-plans/{id}` - 更新测试计划
- **DELETE** `/api/test-plans/{id}` - 删除测试计划

**当前状态**：
- ✅ 接口已实现
- ⚠️ 使用模拟数据（数据库为空时）
- 📝 **你需要**：连接真实的数据库操作，或根据实际需求调整数据结构

**数据位置**：
- 数据库：`backend/api/database/db.py`
- 服务层：`backend/api/services/test_plan_service.py`

#### 2. 测试任务管理
- **GET** `/api/test-tasks` - 获取所有测试任务
- **GET** `/api/test-tasks/{id}` - 获取单个测试任务
- **POST** `/api/test-tasks` - 创建测试任务

**当前状态**：
- ✅ 接口已实现
- ⚠️ 使用模拟数据（数据库为空时）
- 📝 **你需要**：连接真实的数据库操作

**数据位置**：
- 数据库：`backend/api/database/db.py`
- 服务层：`backend/api/services/test_task_service.py`

#### 3. 异常和监控数据
- **GET** `/api/test-tasks/{id}/anomalies` - 获取异常列表
- **GET** `/api/test-tasks/{id}/metrics` - 获取监控指标

**当前状态**：
- ✅ 接口已实现
- ⚠️ 使用模拟数据
- 📝 **你需要**：连接真实的异常检测和监控数据采集

**说明**：这些数据应该来自：
- 北汽接口的响应数据
- 异常检测模块的输出
- 实时监控数据采集

#### 4. 测试报告
- **POST** `/api/test-tasks/{id}/report` - 生成测试报告
- **GET** `/api/test-tasks/{id}/report/download` - 下载报告

**当前状态**：
- ✅ 接口已实现
- ⚠️ 使用模拟数据
- 📝 **你需要**：连接真实的报告生成逻辑

## 📝 实现步骤

### 步骤1：检查现有接口

1. 启动后端服务器：
```bash
cd backend
python3 run_server.py
```

2. 访问API文档：http://localhost:8000/docs

3. 测试GAN接口（真实数据）：
```bash
curl -X POST "http://localhost:8000/api/gan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence_length": 10,
    "temperature": 0.7,
    "condition": {"phase": "wake"}
  }'
```

### 步骤2：连接前端组件

1. **Dashboard.tsx**
   - 使用 `testTaskAPI.getAll()` 获取任务列表
   - 使用 `testPlanAPI.getAll()` 获取计划列表
   - 计算统计数据（总轮数、异常数、覆盖率等）

2. **TestManagement.tsx**
   - 使用 `testPlanAPI.getAll()` 和 `testTaskAPI.getAll()` 显示列表
   - 使用 `testTaskAPI.start()`, `pause()`, `stop()` 控制任务
   - 使用 `ganAPI.generateBatch()` 生成测试用例

3. **TestMonitoring.tsx**
   - 使用 `testTaskAPI.getById()` 获取任务详情
   - 使用 `testTaskAPI.getMetrics()` 获取监控指标
   - 使用 WebSocket 连接 `/ws/test-tasks/{taskId}` 获取实时数据

4. **ResultAnalysis.tsx**
   - 使用 `testTaskAPI.getAnomalies()` 获取异常列表
   - 使用 `testTaskAPI.getMetrics()` 获取对比数据

5. **ReportCenter.tsx**
   - 使用 `testTaskAPI.getAll()` 获取已完成任务
   - 使用 `reportAPI.generate()` 生成报告
   - 使用 `reportAPI.download()` 下载报告

### 步骤3：补充模拟数据接口

对于需要模拟数据的接口，你有两个选择：

#### 选项A：使用真实数据库
1. 修改 `backend/api/services/test_plan_service.py`
2. 移除模拟数据逻辑，直接使用数据库查询
3. 确保数据库表结构正确

#### 选项B：改进模拟数据
1. 保持模拟数据逻辑
2. 根据实际业务需求调整数据结构
3. 确保模拟数据符合前端期望

## 🔍 数据流说明

### GAN测试用例生成流程

```
前端请求 → POST /api/gan/generate
    ↓
GANIntegrationService.generate()
    ↓
GANModelLoader.load_model() → 加载模型权重
    ↓
GANModelLoader.generate() → 生成测试序列
    ↓
BaicAdapter.convert_and_send() → 转换格式并发送到北汽接口
    ↓
返回生成结果给前端
```

### 测试任务执行流程

```
前端 → POST /api/test-tasks/{id}/start
    ↓
TestTaskService.start_task()
    ↓
创建测试任务记录（数据库）
    ↓
循环生成测试用例：
    - 调用 GAN 生成用例
    - 发送到北汽接口
    - 收集响应数据
    - 检测异常
    ↓
更新任务状态和统计数据
    ↓
通过 WebSocket 推送实时数据
```

## 📚 相关文件

### 后端文件
- `backend/api/routers/test_plans.py` - 测试计划路由
- `backend/api/routers/test_tasks.py` - 测试任务路由
- `backend/api/routers/gan.py` - GAN生成路由
- `backend/api/routers/reports.py` - 报告路由
- `backend/api/services/test_plan_service.py` - 测试计划服务
- `backend/api/services/test_task_service.py` - 测试任务服务
- `backend/api/services/gan_integration_service.py` - GAN集成服务
- `backend/api/services/gan_model_loader.py` - GAN模型加载器
- `backend/api/services/baic_adapter.py` - 北汽接口适配器
- `backend/api/database/db.py` - 数据库操作

### 前端文件
- `frontend/src/components/Dashboard.tsx`
- `frontend/src/components/TestManagement.tsx`
- `frontend/src/components/TestMonitoring.tsx`
- `frontend/src/components/ResultAnalysis.tsx`
- `frontend/src/components/ReportCenter.tsx`
- `frontend/src/services/api.ts` - API服务层

## ⚠️ 注意事项

1. **GAN模型路径**：确保 `backend/model_weights/vcu/` 目录下有模型权重文件
2. **北汽接口配置**：检查 `backend/api/services/baic_adapter.py` 中的接口地址和认证信息
3. **数据库初始化**：首次运行需要初始化数据库表
4. **WebSocket连接**：确保WebSocket服务器正常运行
5. **错误处理**：所有API调用都需要添加错误处理

## 🚀 快速开始

1. 启动后端：
```bash
cd backend
python3 run_server.py
```

2. 启动前端：
```bash
cd frontend
npm run dev
```

3. 访问前端：http://localhost:3000

4. 切换到"测试工程师"角色，开始开发！

## 📞 需要帮助？

如果遇到问题，请检查：
1. 后端日志：查看控制台输出
2. 前端控制台：查看浏览器开发者工具
3. API文档：http://localhost:8000/docs
4. 数据库文件：`backend/data/test_system.db`

祝你开发顺利！🎉

