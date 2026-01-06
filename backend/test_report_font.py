#!/usr/bin/env python3
"""测试报告生成和中文字体"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from api.services.report_service import ReportService
from api.models.schemas import TestReportRequest
import asyncio

async def test():
    print("=" * 50)
    print("测试报告生成和中文字体支持")
    print("=" * 50)
    
    service = ReportService()
    request = TestReportRequest(
        task_id='1f62d38d-1f6e-4aa3-8d5c-6ec0a2720e11',
        format='pdf',
        include_comparison=True
    )
    
    try:
        print("\n📝 正在生成PDF报告...")
        report = await service.generate_report(request)
        
        print(f"\n✅ 报告生成成功！")
        print(f"   路径: {report.report_path}")
        print(f"   格式: {report.format}")
        print(f"   时间: {report.generated_at}")
        
        if os.path.exists(report.report_path):
            size = os.path.getsize(report.report_path)
            print(f"   大小: {size:,} 字节 ({size/1024:.1f} KB)")
            print(f"\n✅ 报告文件已生成")
            print(f"   可以访问报告中心下载查看")
            print(f"   文件路径: {os.path.abspath(report.report_path)}")
        else:
            print('❌ 报告文件不存在')
            
    except Exception as e:
        print(f'\n❌ 生成失败: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

