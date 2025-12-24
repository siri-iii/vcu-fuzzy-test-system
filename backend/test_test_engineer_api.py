#!/usr/bin/env python3
"""
测试工程师接口测试脚本
测试所有测试工程师相关的后端接口功能
"""
import asyncio
import sys
import json
from datetime import datetime

# 添加项目路径
sys.path.insert(0, '/Users/linqi/Desktop/vcu-fuzzy-test-system/backend')

from api.services.test_plan_service import TestPlanService
from api.services.test_task_service import TestTaskService
from api.services.monitoring_service import MonitoringService
from api.services.report_service import ReportService
from api.models.schemas import (
    TestPlanCreate, TestMode, TraditionalTestConfig, 
    GANTestConfig, ConstraintConfig, TestReportRequest
)

def print_section(title: str):
    """打印章节标题"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def print_result(name: str, result: any):
    """打印测试结果"""
    print(f"✓ {name}")
    if isinstance(result, (dict, list)):
        print(json.dumps(result, indent=2, ensure_ascii=False, default=str)[:500])
    else:
        print(str(result)[:500])
    print()

async def test_test_plan_service():
    """测试测试计划服务"""
    print_section("测试测试计划服务")
    
    service = TestPlanService()
    
    # 1. 创建测试计划
    print("1. 创建测试计划...")
    plan_create = TestPlanCreate(
        name="API测试-VCU基础测试",
        description="用于API测试的测试计划",
        test_mode=TestMode.BOTH,
        traditional_config=TraditionalTestConfig(
            enabled=True,
            intensity=5,
            max_cases=50
        ),
        gan_config=GANTestConfig(
            enabled=True,
            model_version="v1.0",
            sampling_temperature=1.0,
            max_cases=30
        ),
        constraint_config=ConstraintConfig(
            rate_limit=100.0,
            crc_check=True,
            dlc_check=True
        )
    )
    
    plan = await service.create_test_plan(plan_create)
    print_result("创建测试计划", plan.dict())
    
    plan_id = plan.id
    
    # 2. 获取单个测试计划
    print("2. 获取单个测试计划...")
    retrieved_plan = await service.get_test_plan(plan_id)
    print_result("获取测试计划", retrieved_plan.dict() if retrieved_plan else None)
    
    # 3. 获取测试计划列表
    print("3. 获取测试计划列表...")
    plans = await service.get_test_plans()
    print_result("测试计划列表", [p.dict() for p in plans])
    
    # 4. 更新测试计划
    print("4. 更新测试计划...")
    plan_create.description = "更新后的描述"
    updated_plan = await service.update_test_plan(plan_id, plan_create)
    print_result("更新测试计划", updated_plan.dict() if updated_plan else None)
    
    return plan_id

async def test_test_task_service(plan_id: str):
    """测试测试任务服务"""
    print_section("测试测试任务服务")
    
    service = TestTaskService()
    
    # 1. 创建测试任务
    print("1. 创建测试任务...")
    task = await service.create_task(plan_id)
    print_result("创建测试任务", task.dict())
    
    task_id = task.id
    
    # 2. 获取单个测试任务
    print("2. 获取单个测试任务...")
    retrieved_task = await service.get_task(task_id)
    print_result("获取测试任务", retrieved_task.dict() if retrieved_task else None)
    
    # 3. 获取测试任务列表
    print("3. 获取测试任务列表...")
    tasks = await service.get_tasks()
    print_result("测试任务列表", [t.dict() for t in tasks])
    
    # 4. 启动测试任务
    print("4. 启动测试任务...")
    started_task = await service.start_task(task_id)
    print_result("启动测试任务", started_task.dict() if started_task else None)
    
    # 5. 让任务运行一小段时间（模拟测试执行）
    print("5. 运行测试任务（10秒）...")
    # 在后台启动任务执行
    execute_task = asyncio.create_task(service.execute_test_task(task_id))
    
    # 等待一段时间
    await asyncio.sleep(10)
    
    # 6. 暂停测试任务
    print("6. 暂停测试任务...")
    paused_task = await service.pause_task(task_id)
    print_result("暂停测试任务", paused_task.dict() if paused_task else None)
    
    # 7. 获取任务异常列表
    print("7. 获取任务异常列表...")
    anomalies = await service.get_task_anomalies(task_id, top_n=5)
    print_result("异常列表", [a.dict() for a in anomalies])
    
    # 8. 停止测试任务
    print("8. 停止测试任务...")
    stopped_task = await service.stop_task(task_id)
    print_result("停止测试任务", stopped_task.dict() if stopped_task else None)
    
    # 取消后台任务
    execute_task.cancel()
    try:
        await execute_task
    except asyncio.CancelledError:
        pass
    
    return task_id

async def test_monitoring_service(task_id: str):
    """测试监控服务"""
    print_section("测试监控服务")
    
    service = MonitoringService()
    
    # 1. 获取任务监控指标
    print("1. 获取任务监控指标...")
    metrics = await service.get_task_metrics(task_id, limit=10)
    print_result("监控指标", [m.dict() for m in metrics])

async def test_report_service(task_id: str):
    """测试报告服务"""
    print_section("测试报告服务")
    
    service = ReportService()
    
    # 1. 生成测试报告
    print("1. 生成测试报告（Markdown格式）...")
    request = TestReportRequest(
        task_id=task_id,
        format="markdown",
        include_comparison=True
    )
    report = await service.generate_report(request)
    print_result("生成报告", report.dict())
    
    # 2. 获取方法对比
    print("2. 获取方法对比...")
    comparison = await service.get_method_comparison(task_id)
    print_result("方法对比", comparison.dict())
    
    # 3. 获取报告文件路径
    print("3. 获取报告文件路径...")
    file_path = await service.get_report_file_path(task_id, "markdown")
    print_result("报告文件路径", file_path)

async def main():
    """主测试函数"""
    print("\n" + "="*60)
    print("  测试工程师接口功能测试")
    print("  开始时间:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    try:
        # 测试测试计划服务
        plan_id = await test_test_plan_service()
        
        # 测试测试任务服务
        task_id = await test_test_task_service(plan_id)
        
        # 测试监控服务
        await test_monitoring_service(task_id)
        
        # 测试报告服务
        await test_report_service(task_id)
        
        print_section("所有测试完成")
        print("✅ 所有接口测试通过！")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
