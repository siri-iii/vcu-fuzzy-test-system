import json
import uuid
from datetime import datetime
from api.database.db import Database

class SecurityService:
    def __init__(self):
        self.db = Database()

    # ---------------- 配置 ----------------

    async def get_config(self):
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM security_config WHERE id=1")
        row = cursor.fetchone()
        conn.close()

        if not row:
            return {
                "dual_layer_enabled": False,
                "layer1_rules": [],
                "layer2_rules": [],
                "audit_enabled": True,
                "alert_threshold": 0
            }

        return {
            "dual_layer_enabled": bool(row["dual_layer_enabled"]),
            "layer1_rules": json.loads(row["layer1_rules"]),
            "layer2_rules": json.loads(row["layer2_rules"]),
            "audit_enabled": bool(row["audit_enabled"]),
            "alert_threshold": row["alert_threshold"]
        }

    async def update_config(self, config: dict):
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO security_config
            VALUES (1, ?, ?, ?, ?, ?, ?)
        """, (
            int(config["dual_layer_enabled"]),
            json.dumps(config["layer1_rules"]),
            json.dumps(config["layer2_rules"]),
            int(config["audit_enabled"]),
            config["alert_threshold"],
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

    # ---------------- 核心：规则执行 ----------------

    async def verify(self, task_id: str, payload: dict):
        config = await self.get_config()

        triggered = []

        if not config["dual_layer_enabled"]:
            return self._result(True, [], "安全检查关闭")

        # 合并两层规则（layer1 优先）
        rule_ids = config["layer1_rules"] + config["layer2_rules"]

        rules = self._load_rules(rule_ids)

        for rule in rules:
            if self._rule_triggered(rule, payload):
                triggered.append(rule["id"])

        passed = len(triggered) == 0
        message = "安全检查通过" if passed else "触发安全规则"

        if config["audit_enabled"]:
            await self._write_audit("VERIFY", json.dumps({
                "passed": passed,
                "triggered_rules": triggered,
                "payload": payload
            }))

        if triggered:
            await self._update_constraint_stats(task_id=task_id, triggered_rules=triggered)
        
        return self._result(passed, triggered, message)

    async def _update_constraint_stats(self, task_id: str, triggered_rules: list[str]):
    
        if not task_id:
            return

        conn = self.db._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM constraint_stats WHERE task_id = ?", (task_id,))
        row = cursor.fetchone()

        if row:
            total = int(row["total_intercepted"] or 0)
            reasons = json.loads(row["interception_reasons"] or "{}")
            enabled_rules = json.loads(row["enabled_rules"] or "[]")
        else:
            total = 0
            reasons = {}
            enabled_rules = []

        for rid in triggered_rules:
            reasons[rid] = reasons.get(rid, 0) + 1
            total += 1
            if rid not in enabled_rules:
                enabled_rules.append(rid)

        cursor.execute("""
            INSERT OR REPLACE INTO constraint_stats
            (task_id, total_intercepted, interception_reasons, enabled_rules)
            VALUES (?, ?, ?, ?)
        """, (
            task_id,
            total,
            json.dumps(reasons, ensure_ascii=False),
            json.dumps(enabled_rules, ensure_ascii=False)
        ))

        conn.commit()
        conn.close()
    
    # ---------------- 规则加载 ----------------

    def _load_rules(self, rule_ids):
        if not rule_ids:
            return []

        placeholders = ",".join("?" for _ in rule_ids)
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT * FROM rules WHERE id IN ({placeholders}) AND enabled = 1",
            rule_ids
        )
        rows = cursor.fetchall()
        conn.close()

        rules = []
        for r in rows:
            rules.append({
                "id": r["id"],
                "type": r["type"],
                "content": json.loads(r["content"])
            })
        return rules

    # ---------------- 规则判断 ----------------

    def _rule_triggered(self, rule, payload):
        rtype = rule["type"]
        content = rule["content"]

        try:
            # 白名单
            if rtype == "whitelist":
                return payload.get("id") not in content.get("ids", [])

            # 黑名单
            if rtype == "blacklist":
                return payload.get("id") in content.get("ids", [])

            # 数值范围
            if rtype == "range":
                signal = content["signal"]
                value = payload.get(signal)
                if value is None:
                    return False
                return value < content["min"] or value > content["max"]

            # 其他规则暂不触发
            return False

        except Exception:
            # 任意异常视为不触发（防止系统崩）
            return False

    # ---------------- 审计 ----------------

    async def get_audit_logs(self, limit: int = 50):
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM security_audit
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    async def _write_audit(self, event_type: str, detail: str):
        conn = self.db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO security_audit
            VALUES (?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            event_type,
            detail,
            datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()

    def _result(self, passed, triggered, message):
        return {
            "passed": passed,
            "triggered_rules": triggered,
            "message": message
        }
