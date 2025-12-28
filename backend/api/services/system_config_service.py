"""
系统配置服务
负责系统配置、引擎配置和GAN模型配置管理
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
from api.database.db import Database
from api.models.schemas import (
    SystemConfig, SystemConfigUpdate, EngineConfig, GANModelConfig
)


class SystemConfigService:
    """系统配置服务类"""
    
    def __init__(self):
        self.db = Database()
        self._config_file = "data/system_config.json"
        self._init_default_config()
    
    def _init_default_config(self):
        """初始化默认配置"""
        if not os.path.exists(self._config_file):
            default_config = {
                "system": {
                    "name": "VCU智能模糊测试系统",
                    "version": "1.0.0",
                    "debug": False,
                    "log_level": "INFO"
                },
                "api": {
                    "host": "0.0.0.0",
                    "port": 8000,
                    "cors_origins": ["*"]
                },
                "database": {
                    "path": "data/test_system.db"
                }
            }
            os.makedirs(os.path.dirname(self._config_file), exist_ok=True)
            with open(self._config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置"""
        if os.path.exists(self._config_file):
            with open(self._config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _save_config(self, config: Dict[str, Any]):
        """保存配置"""
        os.makedirs(os.path.dirname(self._config_file), exist_ok=True)
        with open(self._config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
    
    async def get_config(self) -> SystemConfig:
        """获取系统配置"""
        config = self._load_config()
        return SystemConfig(config=config)
    
    async def update_config(self, config_update: SystemConfigUpdate) -> SystemConfig:
        """更新系统配置"""
        current_config = self._load_config()
        # 合并配置
        current_config.update(config_update.config)
        self._save_config(current_config)
        return SystemConfig(config=current_config)
    
    async def get_engines(self) -> List[EngineConfig]:
        """获取引擎配置"""
        # 实际实现中应该从配置或数据库获取
        engines = [
            EngineConfig(
                name="传统模糊测试引擎",
                enabled=True,
                config={
                    "mutation_rules": ["single_param", "multi_param", "timing_perturb"],
                    "intensity": 5,
                    "max_cases": None
                }
            ),
            EngineConfig(
                name="GAN智能测试引擎",
                enabled=True,
                config={
                    "model_version": "v1.0",
                    "sampling_temperature": 1.0,
                    "max_cases": None
                }
            ),
        ]
        return engines
    
    async def update_engines(self, engines: List[EngineConfig]) -> List[EngineConfig]:
        """更新引擎配置"""
        # 实际实现中应该保存到配置或数据库
        # 这里直接返回更新后的配置
        return engines
    
    async def get_gan_models(self) -> List[GANModelConfig]:
        """获取GAN模型列表"""
        # 实际实现中应该从配置或数据库获取
        models = [
            GANModelConfig(
                id="gan-model-001",
                name="VCU唤醒-休眠场景模型",
                version="v1.0",
                enabled=True,
                config={
                    "model_path": "data/vcu/gan_model.pth",
                    "input_dim": 10,
                    "output_dim": 8,
                    "hidden_dim": 64
                }
            ),
            GANModelConfig(
                id="gan-model-002",
                name="域控制器场景模型",
                version="v1.0",
                enabled=False,
                config={
                    "model_path": "data/domain/gan_model.pth",
                    "input_dim": 12,
                    "output_dim": 10,
                    "hidden_dim": 128
                }
            ),
        ]
        return models
    
    async def update_gan_model(self, model_id: str, model_config: GANModelConfig) -> GANModelConfig:
        """更新GAN模型配置"""
        # 实际实现中应该保存到配置或数据库
        # 这里直接返回更新后的配置
        return model_config

