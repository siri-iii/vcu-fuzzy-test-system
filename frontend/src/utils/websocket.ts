/**
 * WebSocket工具类
 * 用于实时监控和消息推送
 */

// 在开发模式下使用相对路径（走vite代理），在生产模式下使用环境变量
const WS_BASE_URL = import.meta.env.DEV
  ? '' // 开发模式：使用相对路径，走vite代理
  : (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000');

class WebSocketManager {
  private ws: WebSocket | null = null;
  private taskId: string | null = null;
  private messageHandler: ((data: any) => void) | null = null;
  private errorHandler: ((error: any) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  /**
   * 连接到WebSocket服务器
   */
  connect(
    taskId: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void
  ) {
    this.taskId = taskId;
    this.messageHandler = onMessage;
    this.errorHandler = onError || (() => {});

    try {
      // 构建WebSocket URL
      let wsUrl: string;
      if (WS_BASE_URL) {
        // 生产模式：使用环境变量
        wsUrl = `${WS_BASE_URL}/ws/test-tasks/${taskId}`;
      } else {
        // 开发模式：使用相对路径，走vite代理
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/ws/test-tasks/${taskId}`;
      }
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.messageHandler) {
            this.messageHandler(data);
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        if (this.errorHandler) {
          this.errorHandler(error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            if (this.taskId) {
              this.connect(this.taskId, this.messageHandler!, this.errorHandler!);
            }
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    }
  }

  /**
   * 发送消息
   */
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.taskId = null;
      this.messageHandler = null;
      this.errorHandler = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 导出单例
const wsManager = new WebSocketManager();
export default wsManager;
