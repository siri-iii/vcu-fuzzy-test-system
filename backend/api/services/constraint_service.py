"""
约束服务
"""
from api.models.schemas import ConstraintStats
from api.database.db import Database

class ConstraintService:
    def __init__(self):
        self.db = Database()
    
    async def get_constraint_stats(self, task_id: str) -> ConstraintStats:
    
        stats_data = await self.db.get_constraint_stats(task_id)

            # 1. 如果数据库里已经有真实统计，直接返回
        if stats_data:
                # 确保是 dict（sqlite3.Row 需要转）
             data = dict(stats_data)

             return ConstraintStats(
                    total_intercepted=data.get("total_intercepted", 0),
                    interception_reasons=data.get("interception_reasons", {}),
                    enabled_rules=data.get("enabled_rules", [])
             )

    
        
       



