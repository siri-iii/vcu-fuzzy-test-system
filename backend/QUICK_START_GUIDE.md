# 测试工程师接口快速启动指南

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd /Users/linqi/Desktop/vcu-fuzzy-test-system/backend
python3 run_server.py
```

服务启动后可访问：
- API服务: http://localhost:8000
- API文档: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/ws/test-tasks/{task_id}

### 2. 运行测试
```bash
cd /Users/linqi/Desktop/vcu-fuzzy-test-system/backend
python3 test_test_engineer_api.py
```

## 📋 常用API示例

### 测试计划管理

#### 创建测试计划
```bash
curl -X POST "http://localhost:8000/api/test-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VCU测试计划",
    "description": "测试VCU控制器功能",
    "test_mode": "both",
    "traditional_config": {
      "enabled": true,
      "intensity": 5,
      "max_cases": 100
    },
    "gan_config": {
      "enabled": true,
      "model_version": "v1.0",
      "sampling_temperature": 1.0,
      "max_cases": 50
    },
    "constraint_config": {
      "rate_limit": 100.0,
      "crc_check": true,
      "dlc_check": true
    }
  }'
```

#### 获取所有测试计划
```bash
curl "http://localhost:8000/api/test-plans"
```

#### 获取单个测试计划
```bash
curl "http://localhost:8000/api/test-plans/{plan_id}"
```

### 测试任务管理

#### 创建测试任务
```bash
curl -X POST "http://localhost:8000/api/test-tasks" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "YOUR_PLAN_ID"}'
```

#### 启动测试任务
```bash
curl -X POST "http://localhost:8000/api/test-tasks/{task_id}/start"
```

#### 获取任务状态
```bash
curl "http://localhost:8000/api/test-tasks/{task_id}"
```

#### 暂停测试任务
```bash
curl -X POST "http://localhost:8000/api/test-tasks/{task_id}/pause"
```

#### 停止测试任务
```bash
curl -X POST "http://localhost:8000/api/test-tasks/{task_id}/stop"
```

### 监控和分析

#### 获取监控指标
```bash
curl "http://localhost:8000/api/test-tasks/{task_id}/metrics?limit=100"
```

#### 获取异常列表
```bash
# 获取所有异常
curl "http://localhost:8000/api/test-tasks/{task_id}/anomalies?top_n=10"

# 只获取GAN测试的异常
curl "http://localhost:8000/api/test-tasks/{task_id}/anomalies?source=gan&top_n=10"

# 只获取高严重度异常
curl "http://localhost:8000/api/test-tasks/{task_id}/anomalies?min_severity=3"
```

### 报告生成

#### 生成测试报告
```bash
curl -X POST "http://localhost:8000/api/test-tasks/{task_id}/report" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "YOUR_TASK_ID",
    "format": "markdown",
    "include_comparison": true
  }'
```

#### 下载报告
```bash
curl "http://localhost:8000/api/test-tasks/{task_id}/report/download?format=markdown" \
  --output test_report.md
```

#### 获取方法对比
```bash
curl "http://localhost:8000/api/test-tasks/{task_id}/report/comparison"
```

### GAN测试

#### 生成单个测试用例
```bash
curl -X POST "http://localhost:8000/api/gan/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence_length": 8,
    "temperature": 1.0,
    "condition": {"phase": "wake"},
    "send_to_baic": true
  }'
```

#### 批量生成测试用例
```bash
curl -X POST "http://localhost:8000/api/gan/generate/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "sequence_length": 8,
    "temperature": 1.0
  }'
```

## 🔌 WebSocket连接示例

### JavaScript
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/test-tasks/YOUR_TASK_ID');

ws.onopen = () => {
  console.log('WebSocket连接已建立');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
  
  if (data.type === 'metrics_update') {
    // 更新UI显示测试进度
    updateMetrics(data.metrics);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
};

ws.onclose = () => {
  console.log('WebSocket连接已关闭');
};
```

### Python
```python
import asyncio
import websockets
import json

async def monitor_task(task_id):
    uri = f"ws://localhost:8000/ws/test-tasks/{task_id}"
    
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            print(f"收到消息: {data}")
            
            if data['type'] == 'metrics_update':
                print(f"测试进度: {data['metrics']}")

# 运行
asyncio.run(monitor_task('YOUR_TASK_ID'))
```

## 📊 完整工作流程示例

```bash
#!/bin/bash

# 1. 创建测试计划
PLAN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/test-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "自动化测试",
    "test_mode": "both",
    "traditional_config": {"enabled": true, "max_cases": 50},
    "gan_config": {"enabled": true, "max_cases": 30},
    "constraint_config": {"rate_limit": 100.0, "crc_check": true}
  }')

PLAN_ID=$(echo $PLAN_RESPONSE | jq -r '.id')
echo "创建测试计划: $PLAN_ID"

# 2. 创建测试任务
TASK_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/test-tasks" \
  -H "Content-Type: application/json" \
  -d "{\"plan_id\": \"$PLAN_ID\"}")

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "创建测试任务: $TASK_ID"

# 3. 启动测试任务
curl -s -X POST "http://localhost:8000/api/test-tasks/$TASK_ID/start"
echo "启动测试任务"

# 4. 等待一段时间
sleep 30

# 5. 查看任务状态
curl -s "http://localhost:8000/api/test-tasks/$TASK_ID" | jq '.'

# 6. 查看监控指标
curl -s "http://localhost:8000/api/test-tasks/$TASK_ID/metrics" | jq '.'

# 7. 暂停任务
curl -s -X POST "http://localhost:8000/api/test-tasks/$TASK_ID/pause"
echo "暂停测试任务"

# 8. 生成报告
curl -s -X POST "http://localhost:8000/api/test-tasks/$TASK_ID/report" \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\", \"format\": \"markdown\"}" | jq '.'

# 9. 下载报告
curl -s "http://localhost:8000/api/test-tasks/$TASK_ID/report/download?format=markdown" \
  -o "report_$TASK_ID.md"
echo "报告已下载: report_$TASK_ID.md"
```

## 🗂️ 数据文件位置

```
backend/
├── data/
│   ├── test_system.db              # SQLite数据库
│   ├── test_plans/                 # 测试计划JSON备份
│   │   └── {plan_id}.json
│   └── reports/                    # 测试报告
│       └── report_{task_id}_{timestamp}.{format}
```

## 🔍 常见问题

### Q: GAN模型加载失败怎么办？
A: 如果没有GAN模型文件，系统会自动跳过GAN测试，只执行传统测试。可以运行：
```bash
cd backend
python3 setup_model.py
```

### Q: 如何查看详细日志？
A: 后端服务启动时会输出详细日志到控制台。

### Q: 数据库文件在哪里？
A: `backend/data/test_system.db`

### Q: 如何清空测试数据？
A: 删除数据库文件和相关数据：
```bash
rm backend/data/test_system.db
rm backend/data/test_plans/*.json
rm backend/data/reports/*
```

### Q: WebSocket连接失败？
A: 确保后端服务正在运行，并且使用正确的任务ID。

## 📝 测试数据示例

### 测试计划模式
- `traditional`: 只使用传统模糊测试
- `gan`: 只使用GAN生成测试
- `both`: 同时使用两种方法

### 异常类型
- `state_machine_error`: 状态机错误
- `timeout`: 超时
- `value_out_of_range`: 值越界
- `crc_error`: CRC校验错误
- `unexpected_response`: 意外响应

### 任务状态
- `pending`: 待启动
- `running`: 运行中
- `paused`: 已暂停
- `stopped`: 已停止
- `completed`: 已完成
- `failed`: 执行失败

## 🎯 性能建议

1. **批量生成限制**: GAN批量生成建议不超过10个
2. **监控指标查询**: 建议limit设置为100以内
3. **异常列表查询**: top_n建议设置为50以内
4. **并发任务**: 建议同时运行的任务不超过5个

---

**最后更新**: 2025年12月23日  
**版本**: v1.0
