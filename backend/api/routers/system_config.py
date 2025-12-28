"""
系统配置路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from api.models.schemas import (
    SystemConfig, SystemConfigUpdate, EngineConfig, GANModelConfig
)
from api.services.system_config_service import SystemConfigService

router = APIRouter()
service = SystemConfigService()

@router.get("/system/config", response_model=SystemConfig)
async def get_config():
    """获取系统配置"""
    try:
        config = await service.get_config()
        return config
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取系统配置失败: {str(e)}"
        )

@router.put("/system/config", response_model=SystemConfig)
async def update_config(config_update: SystemConfigUpdate):
    """更新系统配置"""
    try:
        config = await service.update_config(config_update)
        return config
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新系统配置失败: {str(e)}"
        )

@router.get("/system/config/engines", response_model=List[EngineConfig])
async def get_engines():
    """获取引擎配置"""
    try:
        engines = await service.get_engines()
        return engines
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取引擎配置失败: {str(e)}"
        )

@router.put("/system/config/engines", response_model=List[EngineConfig])
async def update_engines(engines: List[EngineConfig]):
    """更新引擎配置"""
    try:
        updated_engines = await service.update_engines(engines)
        return updated_engines
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新引擎配置失败: {str(e)}"
        )

@router.get("/system/config/gan-models", response_model=List[GANModelConfig])
async def get_gan_models():
    """获取GAN模型列表"""
    try:
        models = await service.get_gan_models()
        return models
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取GAN模型列表失败: {str(e)}"
        )

@router.put("/system/config/gan-models/{model_id}", response_model=GANModelConfig)
async def update_gan_model(model_id: str, model_config: GANModelConfig):
    """更新GAN模型配置"""
    try:
        if model_config.id != model_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="模型ID不匹配"
            )
        updated_model = await service.update_gan_model(model_id, model_config)
        return updated_model
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新GAN模型配置失败: {str(e)}"
        )

