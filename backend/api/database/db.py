"""
数据库操作
使用SQLite存储测试计划、任务、异常等数据
"""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
from functools import wraps

def async_db_operation(func):
    """将同步数据库操作包装为异步"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
    return wrapper

class Database:
    """数据库操作类"""
    
    def __init__(self, db_path: str = "data/test_system.db"):
        """
        初始化数据库
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_database()

    
    def _get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_database(self):
        """初始化数据库表"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # 测试计划表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_plans (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                test_mode TEXT,
                traditional_config TEXT,
                gan_config TEXT,
                constraint_config TEXT,
                baseline_log_path TEXT,
                created_at TEXT,
                updated_at TEXT,
                status TEXT
            )
        """)
        
        # 测试任务表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_tasks (
                id TEXT PRIMARY KEY,
                plan_id TEXT,
                status TEXT,
                traditional_stats TEXT,
                gan_stats TEXT,
                total_cases INTEGER,
                total_anomalies INTEGER,
                started_at TEXT,
                paused_at TEXT,
                completed_at TEXT,
                created_at TEXT,
                FOREIGN KEY (plan_id) REFERENCES test_plans(id)
            )
        """)
        
        # 异常记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS anomalies (
                id TEXT PRIMARY KEY,
                task_id TEXT,
                anomaly_type TEXT,
                severity INTEGER,
                test_case TEXT,
                context TEXT,
                detected_at TEXT,
                source TEXT,
                reproducible INTEGER,
                min_reproduce_script TEXT,
                FOREIGN KEY (task_id) REFERENCES test_tasks(id)
            )
        """)
        
        # 约束统计表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS constraint_stats (
                task_id TEXT PRIMARY KEY,
                total_intercepted INTEGER,
                interception_reasons TEXT,
                enabled_rules TEXT,
                FOREIGN KEY (task_id) REFERENCES test_tasks(id)
            )
        """)

        # 安全检查配置表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS security_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                dual_layer_enabled INTEGER,
                layer1_rules TEXT,
                layer2_rules TEXT,
                audit_enabled INTEGER,
                alert_threshold INTEGER,
                updated_at TEXT
            )
        """)

         # 安全审计
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS security_audit (
                id TEXT PRIMARY KEY,
                event_type TEXT,
                detail TEXT,
                created_at TEXT
            )
        """)

        # 规则库表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                enabled INTEGER NOT NULL,
                priority TEXT,
                description TEXT,
                content TEXT,
                version TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        self._seed_rules()

  

        conn.commit()
        conn.close()
    
    @async_db_operation
    def save_test_plan(self, plan_data: Dict[str, Any]):
        """保存测试计划"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO test_plans 
            (id, name, description, test_mode, traditional_config, gan_config, 
             constraint_config, baseline_log_path, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_data["id"],
            plan_data["name"],
            plan_data.get("description"),
            plan_data.get("test_mode"),
            json.dumps(plan_data.get("traditional_config")),
            json.dumps(plan_data.get("gan_config")),
            json.dumps(plan_data.get("constraint_config")),
            plan_data.get("baseline_log_path"),
            plan_data.get("created_at"),
            plan_data.get("updated_at"),
            plan_data.get("status", "draft")
        ))
        
        conn.commit()
        conn.close()
    
    @async_db_operation
    def get_test_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """获取测试计划"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM test_plans WHERE id = ?", (plan_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            data = dict(row)
            data["traditional_config"] = json.loads(data["traditional_config"]) if data["traditional_config"] else None
            data["gan_config"] = json.loads(data["gan_config"]) if data["gan_config"] else None
            data["constraint_config"] = json.loads(data["constraint_config"]) if data["constraint_config"] else None
            return data
        return None
    
    @async_db_operation
    def get_test_plans(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """获取测试计划列表"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM test_plans ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, skip))
        rows = cursor.fetchall()
        conn.close()
        
        plans = []
        for row in rows:
            data = dict(row)
            data["traditional_config"] = json.loads(data["traditional_config"]) if data["traditional_config"] else None
            data["gan_config"] = json.loads(data["gan_config"]) if data["gan_config"] else None
            data["constraint_config"] = json.loads(data["constraint_config"]) if data["constraint_config"] else None
            plans.append(data)
        
        return plans
    
    @async_db_operation
    def update_test_plan(self, plan_id: str, plan_data: Dict[str, Any]):
        """更新测试计划"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE test_plans 
            SET name = ?, description = ?, test_mode = ?, traditional_config = ?, 
                gan_config = ?, constraint_config = ?, baseline_log_path = ?, 
                updated_at = ?, status = ?
            WHERE id = ?
        """, (
            plan_data["name"],
            plan_data.get("description"),
            plan_data.get("test_mode"),
            json.dumps(plan_data.get("traditional_config")),
            json.dumps(plan_data.get("gan_config")),
            json.dumps(plan_data.get("constraint_config")),
            plan_data.get("baseline_log_path"),
            plan_data.get("updated_at"),
            plan_data.get("status", "draft"),
            plan_id
        ))
        
        conn.commit()
        conn.close()
    
    @async_db_operation
    def delete_test_plan(self, plan_id: str) -> bool:
        """删除测试计划（级联删除相关任务）"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # 先获取所有相关的任务ID
        cursor.execute("SELECT id FROM test_tasks WHERE plan_id = ?", (plan_id,))
        task_ids = [row[0] for row in cursor.fetchall()]
        
        # 删除相关的异常记录
        for task_id in task_ids:
            cursor.execute("DELETE FROM anomalies WHERE task_id = ?", (task_id,))
            cursor.execute("DELETE FROM constraint_stats WHERE task_id = ?", (task_id,))
        
        # 删除相关的测试任务
        cursor.execute("DELETE FROM test_tasks WHERE plan_id = ?", (plan_id,))
        
        # 删除测试计划
        cursor.execute("DELETE FROM test_plans WHERE id = ?", (plan_id,))
        deleted = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        
        return deleted
    
    @async_db_operation
    def save_test_task(self, task_data: Dict[str, Any]):
        """保存测试任务"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO test_tasks 
            (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
             total_anomalies, started_at, paused_at, completed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task_data["id"],
            task_data["plan_id"],
            task_data.get("status"),
            json.dumps(task_data.get("traditional_stats", {})),
            json.dumps(task_data.get("gan_stats", {})),
            task_data.get("total_cases", 0),
            task_data.get("total_anomalies", 0),
            task_data.get("started_at"),
            task_data.get("paused_at"),
            task_data.get("completed_at"),
            task_data.get("created_at")
        ))
        
        conn.commit()
        conn.close()
    
    @async_db_operation
    def get_test_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取测试任务"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM test_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            data = dict(row)
            data["traditional_stats"] = json.loads(data["traditional_stats"]) if data["traditional_stats"] else {}
            data["gan_stats"] = json.loads(data["gan_stats"]) if data["gan_stats"] else {}
            return data
        return None
    
    @async_db_operation
    def update_test_task(self, task_id: str, task_data: Dict[str, Any]):
        """更新测试任务"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE test_tasks SET
                status = ?,
                traditional_stats = ?,
                gan_stats = ?,
                total_cases = ?,
                total_anomalies = ?,
                started_at = ?,
                paused_at = ?,
                completed_at = ?
            WHERE id = ?
        """, (
            task_data.get("status"),
            json.dumps(task_data.get("traditional_stats", {})),
            json.dumps(task_data.get("gan_stats", {})),
            task_data.get("total_cases", 0),
            task_data.get("total_anomalies", 0),
            task_data.get("started_at"),
            task_data.get("paused_at"),
            task_data.get("completed_at"),
            task_id
        ))
        
        conn.commit()
        conn.close()
    
    @async_db_operation
    def get_test_tasks(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """获取测试任务列表"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM test_tasks ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, skip))
        rows = cursor.fetchall()
        conn.close()
        
        tasks = []
        for row in rows:
            data = dict(row)
            data["traditional_stats"] = json.loads(data["traditional_stats"]) if data["traditional_stats"] else {}
            data["gan_stats"] = json.loads(data["gan_stats"]) if data["gan_stats"] else {}
            tasks.append(data)
        
        return tasks
    
    @async_db_operation
    def get_task_anomalies(
        self, 
        task_id: str, 
        top_n: int = 10,
        source: Optional[str] = None,
        min_severity: int = 1
    ) -> List[Dict[str, Any]]:
        """获取任务的异常列表"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM anomalies WHERE task_id = ? AND severity >= ?"
        params = [task_id, min_severity]
        
        if source:
            query += " AND source = ?"
            params.append(source)
        
        query += " ORDER BY severity DESC, detected_at DESC LIMIT ?"
        params.append(top_n)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        anomalies = []
        for row in rows:
            data = dict(row)
            data["test_case"] = json.loads(data["test_case"]) if data["test_case"] else {}
            data["context"] = json.loads(data["context"]) if data["context"] else {}
            data["min_reproduce_script"] = json.loads(data["min_reproduce_script"]) if data["min_reproduce_script"] else None
            data["reproducible"] = bool(data["reproducible"])
            anomalies.append(data)
        
        return anomalies

    
    @async_db_operation
    def save_anomaly(self, anomaly_data: Dict[str, Any]):
        """保存异常记录"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO anomalies 
            (id, task_id, anomaly_type, severity, test_case, context, 
             detected_at, source, reproducible, min_reproduce_script)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            anomaly_data["id"],
            anomaly_data["task_id"],
            anomaly_data["anomaly_type"],
            anomaly_data["severity"],
            json.dumps(anomaly_data.get("test_case", {})),
            json.dumps(anomaly_data.get("context", {})),
            anomaly_data["detected_at"],
            anomaly_data.get("source"),
            int(anomaly_data.get("reproducible", False)),
            json.dumps(anomaly_data.get("min_reproduce_script")) if anomaly_data.get("min_reproduce_script") else None
        ))
        
        conn.commit()
        conn.close()
    
    @async_db_operation
    def get_constraint_stats(self, task_id: str) -> Optional[Dict[str, Any]]:

    # 基本校验：空 & 太短直接认为无效
        if not task_id:
            return None
        if len(task_id.strip()) < 5:
            return None

        conn = self._get_connection()
        cursor = conn.cursor()

    # 先查 constraint_stats 表
        cursor.execute(
            "SELECT * FROM constraint_stats WHERE task_id = ?",
            (task_id,),
        )
        row = cursor.fetchone()

        if not row:
            conn.close()
            return None

        data = dict(row)

    # 先按原来逻辑解析 JSON（保留原始 ID 版本，方便前端或调试使用）
        raw_interception_reasons = (
            json.loads(data["interception_reasons"])
            if data.get("interception_reasons")
            else {}
        )
        raw_enabled_rules = (
            json.loads(data["enabled_rules"])
            if data.get("enabled_rules")
            else []
        )

    # 如果没有任何规则，直接返回空结构
        if not raw_interception_reasons and not raw_enabled_rules:
            data["interception_reasons"] = raw_interception_reasons
            data["enabled_rules"] = raw_enabled_rules
            data["rule_name_map"] = {}
            return data

    # 收集所有涉及到的规则 ID
        rule_ids = set(raw_interception_reasons.keys()) | set(raw_enabled_rules)

        # 从 rules 表中查出这些规则的中文名称
        placeholders = ",".join("?" for _ in rule_ids)
        cursor.execute(
            f"SELECT id, name FROM rules WHERE id IN ({placeholders})",
            tuple(rule_ids),
        )
        rule_rows = cursor.fetchall()
        conn.close()

    # id -> name 映射表
        rule_name_map = {r["id"]: r["name"] for r in rule_rows}

    # ========= 组装“人类可读”的字段 =========

    # 1) 拦截原因：key 直接用“中文名”，值还是次数（number）
    #    这样前端原来 Object.entries(...).map(([reason, count]) => ...)
    #    得到的 reason 就是中文名称了
        display_interception_reasons = {}
        for rule_id, count in raw_interception_reasons.items():
            label = rule_name_map.get(rule_id, rule_id)  # 找不到就退回 ID
            display_interception_reasons[label] = count

    # 2) 已启用规则：直接给“中文名数组”，同时保留原始 ID 数组
        display_enabled_rules = [
            rule_name_map.get(rule_id, rule_id) for rule_id in raw_enabled_rules
        ]

    # 保留原始数据，防止以后要用
        data["interception_reasons_raw"] = raw_interception_reasons
        data["enabled_rules_ids"] = raw_enabled_rules

    # 覆盖为“前端直接可读”的字段
        data["interception_reasons"] = display_interception_reasons
        data["enabled_rules"] = display_enabled_rules

    # 顺便把完整 name 映射也传回去，前端如果想更精细展示可以用
        data["rule_name_map"] = rule_name_map

        return data


    def _seed_rules(self):

        seed_rules = [
        # 白名单
            ("rule-whitelist-1", "CAN ID 白名单", "whitelist", 1, "high",
             "仅允许合法 CAN ID",
             {"ids": ["0x100", "0x101", "0x102"]}),

        # 黑名单
            ("rule-blacklist-1", "功能安全禁发信号", "blacklist", 1, "high",
             "禁止发送关键安全信号",
             {"ids": ["0x200", "0x201"]}),

        # 范围
            ("rule-range-speed", "车速范围限制", "range", 1, "medium",
             "车速必须在 0~120 km/h",
             {"signal": "speed", "min": 0, "max": 120}),

            ("rule-range-voltage", "CC2 电压范围", "range", 1, "medium",
             "CC2 电压 6~14V",
             {"signal": "CC2_VOLTAGE", "min": 6, "max": 14}),

        # CRC
            ("rule-crc", "CRC 校验规则", "crc", 1, "low",
             "报文 CRC 校验",
             {"algorithm": "CRC16", "polynomial": "0x1021"}),

        # DLC
            ("rule-dlc", "DLC 长度校验", "dlc", 1, "low",
             "DLC 长度必须合法",
             {"min": 0, "max": 8}),

        # 速率
            ("rule-rate", "发送速率限制", "rate", 0, "medium",
             "每秒最多 100 帧",
             {"max_per_second": 100}),
        ]

        conn = self._get_connection()
        cursor = conn.cursor()

        for r in seed_rules:
            cursor.execute("""
                INSERT OR IGNORE INTO rules
                (id, name, type, enabled, priority, description, content)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                r[0],
                r[1],
                r[2],
                r[3],
                r[4],
                r[5],
                json.dumps(r[6], ensure_ascii=False)
            ))

        conn.commit()
        conn.close()


       



