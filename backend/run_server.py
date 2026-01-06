#!/usr/bin/env python3
"""
启动FastAPI服务器
"""
import uvicorn
import os
import sys
import subprocess

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def init_demo_data_if_needed():
    """如果需要，初始化演示数据"""
    init_script = os.path.join(os.path.dirname(__file__), "init_demo_data.py")
    if os.path.exists(init_script):
        print("=" * 50)
        print("  初始化演示数据...")
        print("=" * 50)
        try:
            result = subprocess.run(
                [sys.executable, init_script],
                cwd=os.path.dirname(__file__),
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
            if result.stderr:
                print(result.stderr)
            print("✓ 演示数据初始化完成\n")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  初始化演示数据时出错: {e}")
            print(f"错误输出: {e.stderr}")
            print("继续启动服务器...\n")
    else:
        print("⚠️  init_demo_data.py 文件不存在，跳过数据初始化\n")

if __name__ == "__main__":
    # 在启动服务器之前初始化演示数据
    init_demo_data_if_needed()
    
    # 从环境变量读取配置，或使用默认值
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "true").lower() == "true"
    
    print(f"启动VCU智能模糊测试系统API服务器...")
    print(f"访问地址: http://{host}:{port}")
    print(f"API文档: http://{host}:{port}/docs")
    print(f"自动重载: {reload}")
    
    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
