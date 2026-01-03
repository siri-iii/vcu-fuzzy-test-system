"""
测试报告服务
"""
import os
from typing import Optional
from datetime import datetime
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

from api.models.schemas import TestReportRequest, TestReportResponse, MethodComparison
from api.database.db import Database
from api.services.test_task_service import TestTaskService

class ReportService:
    def __init__(self):
        self.db = Database()
        self.task_service = TestTaskService()
        self.reports_dir = "data/reports"
        os.makedirs(self.reports_dir, exist_ok=True)
    
    async def generate_report(self, request: TestReportRequest) -> TestReportResponse:
        """生成测试报告"""
        task = await self.task_service.get_task(request.task_id)
        if not task:
            raise ValueError(f"测试任务 {request.task_id} 不存在")
        
        # 生成报告内容
        report_content = await self._generate_report_content(task, request.include_comparison)
        
        # 保存报告文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{request.task_id}_{timestamp}.{request.format}"
        file_path = os.path.join(self.reports_dir, filename)
        
        if request.format == "json":
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(report_content, f, ensure_ascii=False, indent=2)
        elif request.format == "markdown":
            markdown_content = self._dict_to_markdown(report_content)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(markdown_content)
        else:  # pdf
            # 生成真正的PDF文件
            self._generate_pdf(report_content, file_path)
        
        return TestReportResponse(
            task_id=request.task_id,
            report_path=file_path,
            format=request.format,
            generated_at=datetime.now(),
            comparison=report_content.get("comparison")
        )
    
    def _dict_to_markdown(self, data: dict) -> str:
        """将字典转换为Markdown格式"""
        lines = []
        lines.append("# 测试报告\n")
        
        if "task_id" in data:
            lines.append(f"**任务ID**: {data['task_id']}\n")
        if "generated_at" in data:
            lines.append(f"**生成时间**: {data['generated_at']}\n")
        lines.append("\n")
        
        if "comparison" in data:
            lines.append("## 方法对比\n")
            comp = data["comparison"]
            if "traditional" in comp:
                lines.append("### 传统测试\n")
                lines.append(f"- 用例数: {comp['traditional'].get('cases', 0)}\n")
                lines.append(f"- 异常数: {comp['traditional'].get('anomalies', 0)}\n")
                lines.append(f"- 异常率: {comp['traditional'].get('anomaly_rate', 0)*100:.2f}%\n")
            if "gan" in comp:
                lines.append("### GAN测试\n")
                lines.append(f"- 用例数: {comp['gan'].get('cases', 0)}\n")
                lines.append(f"- 异常数: {comp['gan'].get('anomalies', 0)}\n")
                lines.append(f"- 异常率: {comp['gan'].get('anomaly_rate', 0)*100:.2f}%\n")
        
        return "\n".join(lines)
    
    def _generate_pdf(self, data: dict, file_path: str):
        """生成PDF报告"""
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # 标题
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
        )
        story.append(Paragraph("Test Report", title_style))
        story.append(Spacer(1, 0.5*cm))
        
        # 基本信息
        info_data = [
            ['Task ID:', str(data.get('task_id', 'N/A'))],
            ['Plan ID:', str(data.get('plan_id', 'N/A'))],
            ['Status:', str(data.get('status', 'N/A'))],
            ['Total Cases:', str(data.get('total_cases', 0))],
            ['Total Anomalies:', str(data.get('total_anomalies', 0))],
            ['Started At:', str(data.get('started_at', 'N/A'))],
            ['Completed At:', str(data.get('completed_at', 'N/A'))],
        ]
        
        info_table = Table(info_data, colWidths=[5*cm, 10*cm])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db'))
        ]))
        story.append(info_table)
        story.append(Spacer(1, 1*cm))
        
        # 统计信息
        if 'traditional_stats' in data or 'gan_stats' in data:
            story.append(Paragraph("Test Statistics", styles['Heading2']))
            story.append(Spacer(1, 0.3*cm))
            
            stats_data = [['Method', 'Cases', 'Anomalies', 'Coverage']]
            
            if 'traditional_stats' in data and data['traditional_stats']:
                trad = data['traditional_stats']
                stats_data.append([
                    'Traditional',
                    str(trad.get('cases', 0)),
                    str(trad.get('anomalies', 0)),
                    f"{trad.get('coverage', 0)}%"
                ])
            
            if 'gan_stats' in data and data['gan_stats']:
                gan = data['gan_stats']
                stats_data.append([
                    'GAN',
                    str(gan.get('cases', 0)),
                    str(gan.get('anomalies', 0)),
                    f"{gan.get('coverage', 0)}%"
                ])
            
            stats_table = Table(stats_data, colWidths=[4*cm, 3*cm, 3*cm, 3*cm])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db'))
            ]))
            story.append(stats_table)
        
        # 生成PDF
        doc.build(story)
    
    async def _generate_report_content(self, task, include_comparison: bool) -> dict:
        """生成报告内容"""
        content = {
            "task_id": task.id,
            "plan_id": task.plan_id,
            "status": task.status,
            "total_cases": task.total_cases,
            "total_anomalies": task.total_anomalies,
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "traditional_stats": task.traditional_stats,
            "gan_stats": task.gan_stats
        }
        
        if include_comparison:
            content["comparison"] = await self._generate_comparison(task)
        
        return content
    
    async def _generate_comparison(self, task) -> MethodComparison:
        """生成方法对比"""
        traditional = task.traditional_stats
        gan = task.gan_stats
        
        summary = f"""
传统测试方法: 生成{traditional.get('cases', 0)}个用例，发现{traditional.get('anomalies', 0)}个异常，异常率{traditional.get('anomaly_rate', 0.0):.2%}
GAN测试方法: 生成{gan.get('cases', 0)}个用例，发现{gan.get('anomalies', 0)}个异常，异常率{gan.get('anomaly_rate', 0.0):.2%}
        """.strip()
        
        return MethodComparison(
            traditional=traditional,
            gan=gan,
            summary=summary
        )
    
    async def get_report_file_path(self, task_id: str, format: str) -> Optional[str]:
        """获取报告文件路径"""
        # 查找最新的报告文件
        if not os.path.exists(self.reports_dir):
            return None
        
        pattern = f"report_{task_id}_*.{format}"
        import glob
        files = glob.glob(os.path.join(self.reports_dir, pattern))
        
        if files:
            # 返回最新的文件
            return max(files, key=os.path.getmtime)
        
        return None
    
    async def get_method_comparison(self, task_id: str) -> MethodComparison:
        """获取方法对比数据"""
        task = await self.task_service.get_task(task_id)
        if not task:
            raise ValueError(f"测试任务 {task_id} 不存在")
        
        return await self._generate_comparison(task)



