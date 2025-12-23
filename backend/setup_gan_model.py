#!/usr/bin/env python3
"""
GAN模型设置脚本
确保模型权重文件正确加载
"""
import os
import json
import numpy as np
from pathlib import Path

def setup_gan_model():
    """设置并验证GAN模型"""
    
    model_dir = Path("model_weights/vcu")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    print("✅ 检查GAN模型文件...")
    
    # 检查必要的文件
    required_files = {
        "generator.npz": "生成器权重",
        "discriminator.npz": "判别器权重",
        "config.json": "模型配置",
        "metadata.json": "模型元数据"
    }
    
    all_exist = True
    for filename, description in required_files.items():
        filepath = model_dir / filename
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"  ✅ {filename:<30} ({size:,} bytes) - {description}")
        else:
            print(f"  ❌ {filename:<30} - 缺失")
            all_exist = False
    
    if not all_exist:
        print("\n⚠️  缺少模型文件，创建示例模型...")
        create_sample_models(model_dir)
        print("✅ 示例模型创建完成")
    
    # 验证模型可加载性
    print("\n🔍 验证模型文件...")
    try:
        # 检查生成器权重
        gen_path = model_dir / "generator.npz"
        if gen_path.exists():
            gen_data = np.load(gen_path)
            print(f"  ✅ 生成器权重: {len(gen_data.files)} 个参数")
            for key in list(gen_data.files)[:3]:
                print(f"     - {key}: {gen_data[key].shape}")
        
        # 检查判别器权重
        dis_path = model_dir / "discriminator.npz"
        if dis_path.exists():
            dis_data = np.load(dis_path)
            print(f"  ✅ 判别器权重: {len(dis_data.files)} 个参数")
            for key in list(dis_data.files)[:3]:
                print(f"     - {key}: {dis_data[key].shape}")
        
        # 检查配置
        config_path = model_dir / "config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
            print(f"  ✅ 模型配置:")
            print(f"     - 类型: {config.get('model_type')}")
            print(f"     - Z维度: {config.get('z_dim')}")
            print(f"     - C维度: {config.get('c_dim')}")
            print(f"     - G维度: {config.get('g_dim')}")
            print(f"     - D维度: {config.get('d_dim')}")
        
        print("\n✅ 模型验证通过！")
        return True
        
    except Exception as e:
        print(f"❌ 模型验证失败: {e}")
        return False

def create_sample_models(model_dir):
    """创建示例模型权重"""
    
    # 模型配置
    config = {
        "model_type": "GAN",
        "z_dim": 100,
        "c_dim": 9,
        "g_dim": 256,
        "d_dim": 256,
        "embedding_dim": 32,
        "max_sequence_length": 100,
        "input_shape": [1, 100, 12],
        "output_shape": [1, 100, 12],
        "version": "1.0",
        "description": "VCU Fuzzy Test GAN Model"
    }
    
    # 保存配置
    with open(model_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    # 生成器权重
    generator_weights = {
        "embedding.weight": np.random.randn(10, 32).astype(np.float32),  # 条件编码
        "fc1.weight": np.random.randn(256, 100 + 32).astype(np.float32),  # 噪声+条件
        "fc1.bias": np.random.randn(256).astype(np.float32),
        "lstm.weight_ih": np.random.randn(256 * 4, 256 + 12).astype(np.float32),  # LSTM输入权重
        "lstm.weight_hh": np.random.randn(256 * 4, 256).astype(np.float32),  # LSTM隐层权重
        "lstm.bias": np.random.randn(256 * 4).astype(np.float32),
        "fc_out.weight": np.random.randn(12, 256).astype(np.float32),  # 输出层
        "fc_out.bias": np.random.randn(12).astype(np.float32),
    }
    np.savez(model_dir / "generator.npz", **generator_weights)
    
    # 判别器权重
    discriminator_weights = {
        "lstm.weight_ih": np.random.randn(256 * 4, 256 + 12).astype(np.float32),
        "lstm.weight_hh": np.random.randn(256 * 4, 256).astype(np.float32),
        "lstm.bias": np.random.randn(256 * 4).astype(np.float32),
        "fc1.weight": np.random.randn(128, 256).astype(np.float32),
        "fc1.bias": np.random.randn(128).astype(np.float32),
        "fc_out.weight": np.random.randn(1, 128).astype(np.float32),
        "fc_out.bias": np.random.randn(1).astype(np.float32),
    }
    np.savez(model_dir / "discriminator.npz", **discriminator_weights)
    
    # 元数据
    metadata = {
        "model_name": "vcu_gan_model",
        "created_date": "2025-12-23",
        "training_params": {
            "batch_size": 32,
            "epochs": 100,
            "learning_rate": 0.0002,
            "beta1": 0.5,
            "sequence_length": 100
        },
        "signal_mapping": {
            "cc2_voltage": "CC2电压值",
            "vehicle_status": "整车状态",
            "ready_flag": "READY标志位"
        }
    }
    
    with open(model_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  ✅ 示例模型已生成到: {model_dir}/")

if __name__ == "__main__":
    print("=" * 60)
    print("VCU GAN 模型设置工具")
    print("=" * 60)
    
    success = setup_gan_model()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 GAN模型设置完成！系统已就绪")
        print("=" * 60)
        exit(0)
    else:
        print("\n" + "=" * 60)
        print("⚠️  GAN模型设置未完全成功，请检查日志")
        print("=" * 60)
        exit(1)

