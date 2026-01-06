# VCU智能模糊测试系统 - 服务信息

## 服务状态

### 后端服务 (FastAPI)
- **端口**: 6006
- **访问地址**: 
  - 本地: http://localhost:6006
  - 公网: https://u838508-86fd-41c3868c.bjb1.seetacloud.com:8443
- **API文档**: http://localhost:6006/docs
- **日志文件**: /root/vcu-fuzzy-test-system/backend/backend.log
- **启动命令**: 
  ```bash
  cd /root/vcu-fuzzy-test-system/backend
  API_PORT=6006 API_RELOAD=false nohup python3 run_server.py > backend.log 2>&1 &
  ```

### 前端服务 (Vite)
- **端口**: 6008
- **访问地址**: 
  - 本地: http://localhost:6008
  - 公网: https://uu838508-86fd-41c3868c.bjb1.seetacloud.com:8443
- **日志文件**: /root/vcu-fuzzy-test-system/frontend.log
- **启动命令**: 
  ```bash
  cd /root/vcu-fuzzy-test-system/frontend
  nohup npm run dev > ../frontend.log 2>&1 &
  ```

## 快速检查命令

```bash
# 检查服务状态
cd /root/vcu-fuzzy-test-system
./check_services.sh

# 查看后端日志
tail -f backend/backend.log

# 查看前端日志
tail -f frontend.log

# 检查端口占用
netstat -tlnp | grep -E "6006|6008" || ss -tlnp | grep -E "6006|6008"
```

## 重启服务（如需要）

### 重启后端
```bash
cd /root/vcu-fuzzy-test-system/backend
pkill -f "run_server.py"
API_PORT=6006 API_RELOAD=false nohup python3 run_server.py > backend.log 2>&1 &
```

### 重启前端
```bash
cd /root/vcu-fuzzy-test-system/frontend
pkill -f "vite"
nohup npm run dev > ../frontend.log 2>&1 &
```

## 注意事项

1. **服务已使用 nohup 后台运行**，即使关闭终端也会继续运行
2. **如果服务器重启**，需要重新启动服务（可以使用上面的重启命令）
3. **演示前建议**：
   - 运行 `./check_services.sh` 确认服务正常
   - 访问公网地址测试是否能正常访问
   - 检查浏览器控制台是否有错误

## 演示访问地址

- **前端界面**: https://uu838508-86fd-41c3868c.bjb1.seetacloud.com:8443
- **后端API文档**: https://u838508-86fd-41c3868c.bjb1.seetacloud.com:8443/docs
