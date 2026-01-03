"""
测试PDF生成功能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from api.services.report_service import ReportService
from api.models.schemas import TestReportRequest
import asyncio

async def test_pdf_generation():
    """测试PDF生成"""
    service = ReportService()
    
    # 获取第一个已完成的任务ID
    from api.database.db import Database
    db = Database("data/test_system.db")
    
    tasks = await db.get_test_tasks()
    if not tasks:
        print("❌ 没有找到任务，请先运行 init_demo_data.py")
        return
    
    completed_task = next((t for t in tasks if t['status'] == 'completed'), None)
    if not completed_task:
        print("❌ 没有找到已完成的任务")
        return
    
    task_id = completed_task['id']
    print(f"📝 正在为任务 {task_id} 生成PDF报告...")
    
    try:
        # 生成PDF报告
        request = TestReportRequest(
            task_id=task_id,
            format="pdf",
            include_comparison=True
        )
        
        report = await service.generate_report(request)
        print(f"✅ PDF报告生成成功！")
        print(f"   文件路径: {report.report_path}")
        print(f"   生成时间: {report.generated_at}")
        
        # 检查文件是否存在
        if os.path.exists(report.report_path):
            file_size = os.path.getsize(report.report_path)
            print(f"   文件大小: {file_size} 字节")
            print(f"\n🎯 可以打开文件查看: {report.report_path}")
        else:
            print("⚠️  警告: 文件路径存在但文件未找到")
            
    except Exception as e:
        print(f"❌ 生成PDF失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_pdf_generation())
