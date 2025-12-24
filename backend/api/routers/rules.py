import json
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File
from api.models.schemas import RuleCreate, RuleUpdate, RuleResponse
from api.services.rule_service import RuleService

router = APIRouter()
service = RuleService()

# ===== 1️⃣ 导出（必须最前）=====
@router.get("/rules/export")
async def export_rules():
    return await service.export_rules()

# ===== 2️⃣ 导入 =====
@router.post("/rules/import")
async def import_rules(file: UploadFile = File(...)):
    raw = await file.read()
    text = raw.decode("utf-8")
    items = json.loads(text)
    return await service.import_rules(items)

# ===== 3️⃣ 启用 / 禁用 =====
@router.post("/rules/{rule_id}/enable")
async def enable_rule(rule_id: str):
    ok = await service.set_rule_enabled(rule_id, True)
    if not ok:
        raise HTTPException(status_code=404, detail="规则不存在")
    return {"success": True}

@router.post("/rules/{rule_id}/disable")
async def disable_rule(rule_id: str):
    ok = await service.set_rule_enabled(rule_id, False)
    if not ok:
        raise HTTPException(status_code=404, detail="规则不存在")
    return {"success": True}

# ===== 4️⃣ 普通 CRUD =====
@router.get("/rules")
async def get_rules():
    return await service.get_all_rules()

@router.get("/rules/{rule_id}")
async def get_rule(rule_id: str):
    rule = await service.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return rule

@router.post("/rules")
async def create_rule(rule: RuleCreate):
    return await service.create_rule(rule)

@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, rule: RuleUpdate):
    ok = await service.update_rule(rule_id, rule)
    if not ok:
        raise HTTPException(status_code=404, detail="规则不存在")
    return {"success": True}

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    ok = await service.delete_rule(rule_id)
    if not ok:
        raise HTTPException(status_code=404, detail="规则不存在")
    return {"success": True}

