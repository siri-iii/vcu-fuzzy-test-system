"""
初始化演示数据
为测试工程师界面添加模拟数据，使所有功能可以正常演示
"""
import sqlite3
import json
import os
from datetime import datetime, timedelta
import random
import uuid
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from api.database.db import Database

def generate_id(prefix: str) -> str:
    """生成带前缀的ID"""
    return f"{prefix}-{str(uuid.uuid4())[:8]}"

def init_demo_data():
    """初始化演示数据"""
    db_path = "data/test_system.db"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # 先初始化数据库结构
    print("🗄️  初始化数据库结构...")
    db = Database(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🚀 开始初始化演示数据...")
    
    # 1. 创建测试计划
    print("\n📋 创建测试计划...")
    plans = [
        {
            "id": generate_id("TP"),
            "name": "VCU基础功能测试",
            "description": "包含唤醒、休眠、充电等基础功能的测试",
            "test_mode": "both",
            "traditional_config": json.dumps({
                "enabled": True,
                "max_cases": 100,
                "strategies": ["boundary", "mutation"]
            }),
            "gan_config": json.dumps({
                "enabled": True,
                "max_cases": 50,
                "temperature": 1.0,
                "model_path": "model_weights/vcu/vcu_gan_model.h5"
            }),
            "constraint_config": json.dumps({
                "rate_limit": 100.0,
                "crc_check": True,
                "dlc_check": True
            }),
            "baseline_log_path": None,
            "status": "active",
            "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": generate_id("TP"),
            "name": "充电管理系统测试",
            "description": "针对充电模式下的各种场景测试",
            "test_mode": "gan",
            "traditional_config": json.dumps({
                "enabled": False,
                "max_cases": 0
            }),
            "gan_config": json.dumps({
                "enabled": True,
                "max_cases": 80,
                "temperature": 0.8,
                "model_path": "model_weights/vcu/vcu_gan_model.h5"
            }),
            "constraint_config": json.dumps({
                "rate_limit": 150.0,
                "crc_check": True,
                "dlc_check": True
            }),
            "baseline_log_path": None,
            "status": "active",
            "created_at": (datetime.now() - timedelta(days=8)).isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": generate_id("TP"),
            "name": "高负载压力测试",
            "description": "模拟高负载场景下的系统稳定性测试",
            "test_mode": "traditional",
            "traditional_config": json.dumps({
                "enabled": True,
                "max_cases": 200,
                "strategies": ["boundary", "mutation", "fuzzing"]
            }),
            "gan_config": json.dumps({
                "enabled": False,
                "max_cases": 0
            }),
            "constraint_config": json.dumps({
                "rate_limit": 200.0,
                "crc_check": True,
                "dlc_check": True
            }),
            "baseline_log_path": None,
            "status": "active",
            "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": generate_id("TP"),
            "name": "边界条件验证",
            "description": "验证系统在各种边界条件下的表现",
            "test_mode": "both",
            "traditional_config": json.dumps({
                "enabled": True,
                "max_cases": 120,
                "strategies": ["boundary"]
            }),
            "gan_config": json.dumps({
                "enabled": True,
                "max_cases": 60,
                "temperature": 1.2,
                "model_path": "model_weights/vcu/vcu_gan_model.h5"
            }),
            "constraint_config": json.dumps({
                "rate_limit": 100.0,
                "crc_check": True,
                "dlc_check": True
            }),
            "baseline_log_path": None,
            "status": "active",
            "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": generate_id("TP"),
            "name": "异常恢复测试",
            "description": "测试系统在异常情况下的恢复能力",
            "test_mode": "both",
            "traditional_config": json.dumps({
                "enabled": True,
                "max_cases": 80,
                "strategies": ["mutation", "fuzzing"]
            }),
            "gan_config": json.dumps({
                "enabled": True,
                "max_cases": 40,
                "temperature": 1.5,
                "model_path": "model_weights/vcu/vcu_gan_model.h5"
            }),
            "constraint_config": json.dumps({
                "rate_limit": 80.0,
                "crc_check": True,
                "dlc_check": True
            }),
            "baseline_log_path": None,
            "status": "draft",
            "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    for plan in plans:
        cursor.execute("""
            INSERT OR REPLACE INTO test_plans 
            (id, name, description, test_mode, traditional_config, gan_config, 
             constraint_config, baseline_log_path, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan["id"],
            plan["name"],
            plan.get("description"),
            plan.get("test_mode"),
            plan.get("traditional_config"),
            plan.get("gan_config"),
            plan.get("constraint_config"),
            plan.get("baseline_log_path"),
            plan.get("created_at"),
            plan.get("updated_at"),
            plan.get("status", "draft")
        ))
        print(f"  ✅ 创建测试计划: {plan['name']} ({plan['id']})")
    
    conn.commit()
    
    # 2. 创建测试任务
    print("\n🔧 创建测试任务...")
    tasks = []
    
    # 任务1: 已完成的任务 - GAN效果优于传统
    task1 = {
        "id": generate_id("TT"),
        "plan_id": plans[0]["id"],
        "status": "completed",
        "traditional_stats": json.dumps({"cases": 85, "anomalies": 10, "coverage": 72}),
        "gan_stats": json.dumps({"cases": 45, "anomalies": 18, "coverage": 89}),
        "total_cases": 130,
        "total_anomalies": 28,
        "started_at": (datetime.now() - timedelta(days=7)).isoformat(),
        "paused_at": None,
        "completed_at": (datetime.now() - timedelta(days=6, hours=12)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=7)).isoformat()
    }
    cursor.execute("""
        INSERT OR REPLACE INTO test_tasks 
        (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
         total_anomalies, started_at, paused_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task1["id"], task1["plan_id"], task1["status"], task1["traditional_stats"],
        task1["gan_stats"], task1["total_cases"], task1["total_anomalies"],
        task1["started_at"], task1["paused_at"], task1["completed_at"], task1["created_at"]
    ))
    tasks.append(task1)
    print(f"  ✅ 创建任务: {task1['id']} (已完成)")
    
    # 任务2: 运行中的任务 - 纯GAN测试展示高效率
    task2 = {
        "id": generate_id("TT"),
        "plan_id": plans[1]["id"],
        "status": "running",
        "traditional_stats": json.dumps({"cases": 0, "anomalies": 0, "coverage": 0}),
        "gan_stats": json.dumps({"cases": 58, "anomalies": 15, "coverage": 82}),
        "total_cases": 58,
        "total_anomalies": 15,
        "started_at": (datetime.now() - timedelta(hours=3)).isoformat(),
        "paused_at": None,
        "completed_at": None,
        "created_at": (datetime.now() - timedelta(hours=3)).isoformat()
    }
    cursor.execute("""
        INSERT OR REPLACE INTO test_tasks 
        (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
         total_anomalies, started_at, paused_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task2["id"], task2["plan_id"], task2["status"], task2["traditional_stats"],
        task2["gan_stats"], task2["total_cases"], task2["total_anomalies"],
        task2["started_at"], task2["paused_at"], task2["completed_at"], task2["created_at"]
    ))
    tasks.append(task2)
    print(f"  ✅ 创建任务: {task2['id']} (运行中)")
    
    # 任务3: 已完成的任务 - 纯传统测试对比（用例多但效率低）
    task3 = {
        "id": generate_id("TT"),
        "plan_id": plans[2]["id"],
        "status": "completed",
        "traditional_stats": json.dumps({"cases": 175, "anomalies": 22, "coverage": 75}),
        "gan_stats": json.dumps({"cases": 0, "anomalies": 0, "coverage": 0}),
        "total_cases": 175,
        "total_anomalies": 22,
        "started_at": (datetime.now() - timedelta(days=4)).isoformat(),
        "paused_at": None,
        "completed_at": (datetime.now() - timedelta(days=3, hours=8)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=4)).isoformat()
    }
    cursor.execute("""
        INSERT OR REPLACE INTO test_tasks 
        (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
         total_anomalies, started_at, paused_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task3["id"], task3["plan_id"], task3["status"], task3["traditional_stats"],
        task3["gan_stats"], task3["total_cases"], task3["total_anomalies"],
        task3["started_at"], task3["paused_at"], task3["completed_at"], task3["created_at"]
    ))
    tasks.append(task3)
    print(f"  ✅ 创建任务: {task3['id']} (已完成)")
    
    # 任务4: 暂停的任务 - GAN用更少用例发现更多问题
    task4 = {
        "id": generate_id("TT"),
        "plan_id": plans[3]["id"],
        "status": "paused",
        "traditional_stats": json.dumps({"cases": 45, "anomalies": 5, "coverage": 48}),
        "gan_stats": json.dumps({"cases": 28, "anomalies": 11, "coverage": 65}),
        "total_cases": 73,
        "total_anomalies": 16,
        "started_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "paused_at": (datetime.now() - timedelta(hours=6)).isoformat(),
        "completed_at": None,
        "created_at": (datetime.now() - timedelta(days=2)).isoformat()
    }
    cursor.execute("""
        INSERT OR REPLACE INTO test_tasks 
        (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
         total_anomalies, started_at, paused_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task4["id"], task4["plan_id"], task4["status"], task4["traditional_stats"],
        task4["gan_stats"], task4["total_cases"], task4["total_anomalies"],
        task4["started_at"], task4["paused_at"], task4["completed_at"], task4["created_at"]
    ))
    tasks.append(task4)
    print(f"  ✅ 创建任务: {task4['id']} (已暂停)")
    
    # 任务5: 已完成的任务 - GAN智能测试优势显著
    task5 = {
        "id": generate_id("TT"),
        "plan_id": plans[0]["id"],
        "status": "completed",
        "traditional_stats": json.dumps({"cases": 92, "anomalies": 11, "coverage": 68}),
        "gan_stats": json.dumps({"cases": 48, "anomalies": 20, "coverage": 91}),
        "total_cases": 140,
        "total_anomalies": 31,
        "started_at": (datetime.now() - timedelta(days=1, hours=10)).isoformat(),
        "paused_at": None,
        "completed_at": (datetime.now() - timedelta(hours=18)).isoformat(),
        "created_at": (datetime.now() - timedelta(days=1, hours=10)).isoformat()
    }
    cursor.execute("""
        INSERT OR REPLACE INTO test_tasks 
        (id, plan_id, status, traditional_stats, gan_stats, total_cases, 
         total_anomalies, started_at, paused_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task5["id"], task5["plan_id"], task5["status"], task5["traditional_stats"],
        task5["gan_stats"], task5["total_cases"], task5["total_anomalies"],
        task5["started_at"], task5["paused_at"], task5["completed_at"], task5["created_at"]
    ))
    tasks.append(task5)
    print(f"  ✅ 创建任务: {task5['id']} (已完成)")
    
    conn.commit()
    
    # 3. 创建异常记录
    print("\n⚠️  创建异常记录...")
    anomaly_types = [
        "state_follow_mismatch",
        "error", 
        "stuck",
        "ready_flag_mismatch",
        "normal"
    ]
    severities = [1, 2, 3, 4, 5]
    sources = ["traditional", "gan"]
    
    anomaly_count = 0
    for task in tasks:
        task_anomalies = task["total_anomalies"]
        task_start = datetime.fromisoformat(task["started_at"])
        
        for i in range(task_anomalies):
            anomaly_time = task_start + timedelta(minutes=random.randint(5, 180))
            
            anomaly_id = generate_id("AN")
            cursor.execute("""
                INSERT OR REPLACE INTO anomalies 
                (id, task_id, anomaly_type, severity, test_case, context, 
                 detected_at, source, reproducible, min_reproduce_script)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                anomaly_id,
                task["id"],
                random.choice(anomaly_types),
                random.choice(severities),
                json.dumps({
                    "signal_id": f"SIG_{random.randint(100, 999)}",
                    "value": random.randint(0, 255),
                    "expected": random.randint(0, 255)
                }),
                json.dumps({
                    "phase": random.choice(["wake", "sleep", "charging", "driving"]),
                    "location": f"frame_{random.randint(1, 100)}",
                    "conditions": {
                        "temperature": random.randint(-20, 60),
                        "voltage": round(random.uniform(10.0, 14.5), 2)
                    }
                }),
                anomaly_time.isoformat(),
                random.choice(sources),
                random.choice([0, 1]),
                None
            ))
            anomaly_count += 1
    
    conn.commit()
    print(f"  ✅ 创建了 {anomaly_count} 条异常记录")
    
    # 4. 创建测试日志
    print("\n📝 创建测试日志...")
    log_templates = {
        "traditional": [
            "开始执行传统模糊测试用例",
            "生成变异测试数据: 信号 {} 值 {}",
            "执行测试用例 #{}: {} 通过",
            "检测到潜在异常: {}",
            "完成 {} 个测试用例的执行",
            "传统引擎覆盖率: {}%",
        ],
        "gan": [
            "GAN引擎初始化完成",
            "加载模型权重: vcu_gan_model.h5",
            "生成智能测试用例: 序列长度 {}",
            "GAN引擎生成高质量用例: 置信度 {}%",
            "执行GAN生成的测试用例 #{}: {} 发现异常",
            "GAN模型温度参数: {}",
            "智能采样完成: 生成 {} 个高价值用例",
        ],
        "system": [
            "测试任务启动: {}",
            "连接HIL设备成功",
            "加载DBC配置文件",
            "应用约束规则: {} 条",
            "WebSocket连接建立",
            "实时监控启动",
            "数据采集频率: {} Hz",
        ]
    }
    
    log_count = 0
    for task in tasks:
        # 为每个任务创建30-50条日志
        num_logs = random.randint(30, 50)
        task_start = datetime.fromisoformat(task["started_at"])
        
        for i in range(num_logs):
            log_time = task_start + timedelta(minutes=random.randint(1, 120), seconds=random.randint(0, 59))
            
            # 根据任务配置选择日志来源
            sources_pool = []
            if task.get("traditional_stats"):
                stats = json.loads(task["traditional_stats"])
                if stats.get("cases", 0) > 0:
                    sources_pool.append("traditional")
            if task.get("gan_stats"):
                stats = json.loads(task["gan_stats"])
                if stats.get("cases", 0) > 0:
                    sources_pool.append("gan")
            sources_pool.append("system")
            
            source = random.choice(sources_pool)
            level = random.choice(["INFO", "INFO", "INFO", "WARNING", "DEBUG"])
            
            # 生成日志消息
            if source == "traditional":
                template = random.choice(log_templates["traditional"])
                if "{}" in template:
                    if "信号" in template:
                        message = template.format(f"SIG_{random.randint(100, 999)}", random.randint(0, 255))
                    elif "用例" in template:
                        message = template.format(random.randint(1, 200), random.choice(["正常", "异常", "边界"]))
                    elif "个测试" in template:
                        message = template.format(random.randint(10, 50))
                    elif "覆盖率" in template:
                        message = template.format(random.randint(60, 95))
                    else:
                        message = template.format("未知异常")
                else:
                    message = template
                source_name = "传统引擎"
            elif source == "gan":
                template = random.choice(log_templates["gan"])
                if "{}" in template:
                    if "序列长度" in template:
                        message = template.format(random.randint(50, 200))
                    elif "置信度" in template:
                        message = template.format(random.randint(85, 99))
                    elif "用例 #" in template:
                        message = template.format(random.randint(1, 100), random.choice(["成功", "完成", "检测异常"]))
                    elif "温度参数" in template:
                        message = template.format(round(random.uniform(0.8, 1.5), 2))
                    elif "生成" in template:
                        message = template.format(random.randint(20, 60))
                    else:
                        message = template
                else:
                    message = template
                source_name = "GAN引擎"
            else:
                template = random.choice(log_templates["system"])
                if "{}" in template:
                    if "任务启动" in template:
                        message = template.format(task["id"])
                    elif "约束规则" in template:
                        message = template.format(random.randint(5, 15))
                    elif "频率" in template:
                        message = template.format(random.choice([10, 50, 100]))
                    else:
                        message = template
                else:
                    message = template
                source_name = "系统"
            
            log_id = generate_id("LOG")
            cursor.execute("""
                INSERT INTO test_logs 
                (id, task_id, timestamp, source, level, message, details)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                log_id,
                task["id"],
                log_time.isoformat(),
                source_name,
                level,
                message,
                json.dumps({"index": i + 1, "task_status": task["status"]})
            ))
            log_count += 1
    
    conn.commit()
    print(f"  ✅ 创建了 {log_count} 条测试日志")
    
    # 5. 统计信息
    print("\n📈 数据统计:")
    print(f"  • 测试计划: {len(plans)} 个")
    print(f"  • 测试任务: {len(tasks)} 个")
    print(f"    - 已完成: {len([t for t in tasks if t['status'] == 'completed'])} 个")
    print(f"    - 运行中: {len([t for t in tasks if t['status'] == 'running'])} 个")
    print(f"    - 已暂停: {len([t for t in tasks if t['status'] == 'paused'])} 个")
    print(f"  • 异常记录: {anomaly_count} 条")
    print(f"  • 测试日志: {log_count} 条")
    
    conn.close()
    
    print("\n✅ 演示数据初始化完成！")
    print("\n🎯 现在可以启动系统查看效果:")
    print("  1. 后端: cd backend && python3 run_server.py")
    print("  2. 前端: cd frontend && npm run dev")

if __name__ == "__main__":
    init_demo_data()
