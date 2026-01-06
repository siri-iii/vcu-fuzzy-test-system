=== 服务状态检查脚本 ===
#!/bin/bash
echo '=== 后端服务 ==='
ps aux | grep 'run_server.py' | grep -v grep || echo '后端服务未运行'
curl -s http://localhost:6006/docs > /dev/null && echo '后端API: ✅ 正常' || echo '后端API: ❌ 异常'

echo '=== 前端服务 ==='
ps aux | grep 'vite' | grep -v grep || echo '前端服务未运行'
curl -s http://localhost:6008 > /dev/null && echo '前端服务: ✅ 正常' || echo '前端服务: ❌ 异常'
