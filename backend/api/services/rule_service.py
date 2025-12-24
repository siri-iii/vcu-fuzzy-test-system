import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from api.database.db import Database
from api.models.schemas import RuleCreate, RuleUpdate


class RuleService:
    def __init__(self):
        self.db = Database()

    async def get_all_rules(self) -> List[dict]:
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rules ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "enabled": bool(r["enabled"]),
                "priority": r["priority"],
                "description": r["description"],
                "content": json.loads(r["content"]) if r["content"] else {},
                "version": r["version"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            })
        return result

    async def get_rule_by_id(self, rule_id: str) -> Optional[dict]:
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rules WHERE id = ?", (rule_id,))
        r = cursor.fetchone()
        conn.close()

        if not r:
            return None

        return {
            "id": r["id"],
            "name": r["name"],
            "type": r["type"],
            "enabled": bool(r["enabled"]),
            "priority": r["priority"],
            "description": r["description"],
            "content": json.loads(r["content"]) if r["content"] else {},
            "version": r["version"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }

    async def create_rule(self, rule: RuleCreate) -> dict:
        now = datetime.now().isoformat()
        rule_id = str(uuid.uuid4())

        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO rules
            (id, name, type, enabled, priority, description, content, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rule_id,
            rule.name,
            rule.type.value if hasattr(rule.type, "value") else str(rule.type),
            1 if rule.enabled else 0,
            rule.priority.value if hasattr(rule.priority, "value") else str(rule.priority),
            rule.description,
            json.dumps(rule.content, ensure_ascii=False),
            "v1",
            now,
            now
        ))
        conn.commit()
        conn.close()

        created = await self.get_rule_by_id(rule_id)
        return created

    async def update_rule(self, rule_id: str, rule: RuleUpdate) -> bool:
        now = datetime.now().isoformat()

        # 先确认存在
        existing = await self.get_rule_by_id(rule_id)
        if not existing:
            return False

        name = rule.name if rule.name is not None else existing["name"]
        enabled = rule.enabled if rule.enabled is not None else existing["enabled"]
        priority = rule.priority.value if rule.priority is not None and hasattr(rule.priority, "value") else (
            str(rule.priority) if rule.priority is not None else existing["priority"]
        )
        description = rule.description if rule.description is not None else existing["description"]
        content = rule.content if rule.content is not None else existing["content"]

        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE rules SET
                name = ?,
                enabled = ?,
                priority = ?,
                description = ?,
                content = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            name,
            1 if enabled else 0,
            priority,
            description,
            json.dumps(content, ensure_ascii=False),
            now,
            rule_id
        ))
        conn.commit()
        conn.close()
        return True

    async def delete_rule(self, rule_id: str) -> bool:
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ---------------- 新增：启用 / 禁用 ----------------

    async def set_rule_enabled(self, rule_id: str, enabled: bool) -> bool:
        """启用/禁用规则"""
        now = datetime.now().isoformat()

        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE rules SET enabled = ?, updated_at = ?
            WHERE id = ?
        """, (1 if enabled else 0, now, rule_id))
        changed = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return changed

    # ---------------- 新增：导出 / 导入 ----------------

    async def export_rules(self) -> List[dict]:
        """导出：直接返回所有规则 JSON（前端可保存为文件）"""
        return await self.get_all_rules()

    async def import_rules(self, items: List[Dict[str, Any]]) -> List[dict]:
        """
        导入：批量创建规则
        items 中每个元素应满足 RuleCreate 字段：
        name/type/enabled/priority/description/content
        """
        created = []
        for item in items:
            rule = RuleCreate(**item)
            created.append(await self.create_rule(rule))
        return created
