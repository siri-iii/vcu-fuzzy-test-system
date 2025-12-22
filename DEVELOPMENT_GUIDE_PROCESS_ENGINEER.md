# 工艺工程师界面开发指南

## 📋 概述

本文档为负责**工艺工程师**界面的开发者提供详细的实现指南。工艺工程师界面主要负责规则库管理、安全检查和约束统计。

## 🎯 负责的界面组件

你需要实现以下前端组件的后端接口连接：

1. **RuleLibrary.tsx** - 规则库管理
2. **SecurityCheck.tsx** - 安全检查配置
3. **ConstraintStats.tsx** - 约束统计

## 🔌 已实现的后端接口

### ✅ 部分真实数据接口

#### 1. 约束统计
- **GET** `/api/test-tasks/{id}/constraints` - 获取约束统计

**当前状态**：
- ✅ 接口已实现
- ⚠️ 使用模拟数据（数据库为空时）
- 📝 **你需要**：连接真实的约束拦截数据

**数据说明**：
- 约束拦截数据来自测试任务执行过程中的约束器模块
- 需要统计：拦截总数、拦截原因分布、已启用规则列表

**数据位置**：
- 路由：`backend/api/routers/constraints.py`
- 服务：`backend/api/services/constraint_service.py`

### ⚠️ 需要新增的接口

以下接口**目前不存在**，需要你实现：

#### 1. 规则库管理接口

需要实现以下接口：

- **GET** `/api/rules` - 获取所有规则
- **GET** `/api/rules/{id}` - 获取单个规则
- **POST** `/api/rules` - 创建规则
- **PUT** `/api/rules/{id}` - 更新规则
- **DELETE** `/api/rules/{id}` - 删除规则
- **POST** `/api/rules/{id}/enable` - 启用规则
- **POST** `/api/rules/{id}/disable` - 禁用规则
- **POST** `/api/rules/import` - 导入规则（从文件）
- **GET** `/api/rules/export` - 导出规则（到文件）

**数据结构**：
```python
{
  "id": "string",
  "name": "string",
  "type": "whitelist" | "blacklist" | "range" | "crc" | "dlc" | "rate",
  "enabled": boolean,
  "priority": "high" | "medium" | "low",
  "description": "string",
  "content": {
    # 根据type不同，content结构不同
    # whitelist: {"ids": [0x123, 0x456]}
    # blacklist: {"ids": [0x789]}
    # range: {"signal": "voltage", "min": 0, "max": 12}
    # crc: {"algorithm": "CRC16", "polynomial": 0x1021}
    # dlc: {"min": 0, "max": 8}
    # rate: {"max_per_second": 100}
  },
  "version": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**实现建议**：
1. 创建 `backend/api/routers/rules.py`
2. 创建 `backend/api/services/rule_service.py`
3. 在数据库中创建 `rules` 表
4. 实现CRUD操作

#### 2. 安全检查配置接口

需要实现以下接口：

- **GET** `/api/security/config` - 获取安全检查配置
- **PUT** `/api/security/config` - 更新安全检查配置
- **POST** `/api/security/verify` - 执行安全检查验证
- **GET** `/api/security/audit` - 获取审计日志

**数据结构**：
```python
{
  "dual_layer_enabled": boolean,
  "layer1_rules": ["rule_id1", "rule_id2"],
  "layer2_rules": ["rule_id3", "rule_id4"],
  "audit_enabled": boolean,
  "alert_threshold": number
}
```

**实现建议**：
1. 创建 `backend/api/routers/security.py`
2. 创建 `backend/api/services/security_service.py`
3. 实现双层次安全检查逻辑

## 📝 实现步骤

### 步骤1：创建规则库管理接口

1. **创建路由文件** `backend/api/routers/rules.py`：
```python
from fastapi import APIRouter, HTTPException
from typing import List
from api.models.schemas import RuleCreate, RuleResponse, RuleUpdate
from api.services.rule_service import RuleService

router = APIRouter()
service = RuleService()

@router.get("/rules", response_model=List[RuleResponse])
async def get_rules():
    """获取所有规则"""
    return await service.get_all_rules()

@router.get("/rules/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: str):
    """获取单个规则"""
    rule = await service.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return rule

@router.post("/rules", response_model=RuleResponse)
async def create_rule(rule: RuleCreate):
    """创建规则"""
    return await service.create_rule(rule)

# ... 其他接口
```

2. **创建服务文件** `backend/api/services/rule_service.py`：
```python
from typing import List, Optional
from api.database.db import Database
from api.models.schemas import RuleCreate, RuleResponse, RuleUpdate

class RuleService:
    def __init__(self):
        self.db = Database()
    
    async def get_all_rules(self) -> List[RuleResponse]:
        """获取所有规则"""
        # 实现数据库查询逻辑
        # 如果数据库为空，返回模拟数据
        pass
    
    async def create_rule(self, rule: RuleCreate) -> RuleResponse:
        """创建规则"""
        # 实现数据库插入逻辑
        pass
    
    # ... 其他方法
```

3. **创建数据模型** `backend/api/models/schemas.py`（添加）：
```python
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RuleType(str, Enum):
    WHITELIST = "whitelist"
    BLACKLIST = "blacklist"
    RANGE = "range"
    CRC = "crc"
    DLC = "dlc"
    RATE = "rate"

class RulePriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RuleCreate(BaseModel):
    name: str
    type: RuleType
    enabled: bool = True
    priority: RulePriority = RulePriority.MEDIUM
    description: str
    content: Dict[str, Any]

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    priority: Optional[RulePriority] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None

class RuleResponse(BaseModel):
    id: str
    name: str
    type: RuleType
    enabled: bool
    priority: RulePriority
    description: str
    content: Dict[str, Any]
    version: str
    created_at: datetime
    updated_at: datetime
```

4. **在main.py中注册路由**：
```python
from api.routers import rules

app.include_router(rules.router, prefix="/api", tags=["规则管理"])
```

### 步骤2：创建安全检查配置接口

1. **创建路由文件** `backend/api/routers/security.py`
2. **创建服务文件** `backend/api/services/security_service.py`
3. **实现双层次安全检查逻辑**

### 步骤3：连接前端组件

1. **RuleLibrary.tsx**
   - 使用 `ruleAPI.getAll()` 获取规则列表
   - 使用 `ruleAPI.create()`, `update()`, `delete()` 管理规则
   - 使用 `ruleAPI.enable()`, `disable()` 启用/禁用规则

2. **SecurityCheck.tsx**
   - 使用 `securityAPI.getConfig()` 获取配置
   - 使用 `securityAPI.updateConfig()` 更新配置
   - 使用 `securityAPI.verify()` 执行验证

3. **ConstraintStats.tsx**
   - 使用 `constraintAPI.getStats()` 获取约束统计（已实现）
   - 显示拦截统计和原因分布

### 步骤4：更新API服务层

在 `frontend/src/services/api.ts` 中添加：

```typescript
// 规则库API
export const ruleAPI = {
  getAll: () => api.get('/rules'),
  getById: (id: string) => api.get(`/rules/${id}`),
  create: (rule: any) => api.post('/rules', rule),
  update: (id: string, rule: any) => api.put(`/rules/${id}`, rule),
  delete: (id: string) => api.delete(`/rules/${id}`),
  enable: (id: string) => api.post(`/rules/${id}/enable`),
  disable: (id: string) => api.post(`/rules/${id}/disable`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/rules/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  export: () => api.get('/rules/export', { responseType: 'blob' }),
};

// 安全检查API
export const securityAPI = {
  getConfig: () => api.get('/security/config'),
  updateConfig: (config: any) => api.put('/security/config', config),
  verify: (data: any) => api.post('/security/verify', data),
  getAudit: (params?: any) => api.get('/security/audit', { params }),
};
```

## 🔍 数据流说明

### 规则库管理流程

```
前端 → POST /api/rules
    ↓
RuleService.create_rule()
    ↓
验证规则内容
    ↓
保存到数据库
    ↓
返回创建的规则
```

### 约束统计流程

```
测试任务执行
    ↓
约束器拦截测试用例
    ↓
记录拦截信息（原因、规则ID等）
    ↓
前端 → GET /api/test-tasks/{id}/constraints
    ↓
ConstraintService.get_constraint_stats()
    ↓
统计拦截数据
    ↓
返回统计结果
```

## 📚 相关文件

### 后端文件（需要创建）
- `backend/api/routers/rules.py` - 规则管理路由
- `backend/api/routers/security.py` - 安全检查路由
- `backend/api/services/rule_service.py` - 规则服务
- `backend/api/services/security_service.py` - 安全检查服务

### 后端文件（已存在）
- `backend/api/routers/constraints.py` - 约束管理路由
- `backend/api/services/constraint_service.py` - 约束服务

### 前端文件
- `frontend/src/components/RuleLibrary.tsx`
- `frontend/src/components/SecurityCheck.tsx`
- `frontend/src/components/ConstraintStats.tsx`
- `frontend/src/services/api.ts` - API服务层

## ⚠️ 注意事项

1. **规则类型**：确保支持所有规则类型（白名单、黑名单、范围、CRC、DLC、速率）
2. **规则优先级**：实现规则优先级逻辑，高优先级规则先执行
3. **规则版本管理**：实现规则版本控制，支持回滚
4. **数据验证**：所有规则内容都需要验证
5. **性能优化**：规则查询和匹配需要优化性能

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

4. 切换到"工艺工程师"角色，开始开发！

## 📞 需要帮助？

如果遇到问题，请检查：
1. 后端日志：查看控制台输出
2. 前端控制台：查看浏览器开发者工具
3. API文档：http://localhost:8000/docs
4. 数据库文件：`backend/data/test_system.db`

祝你开发顺利！🎉

