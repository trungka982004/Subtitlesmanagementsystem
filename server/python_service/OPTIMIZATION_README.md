# Model Optimization Guide

This directory contains tools for optimizing translation models for faster inference and lower memory usage.

## Quick Start

### 1. Check Current Model Status

```bash
python optimize_models.py --status
```

This shows which models are converted and their quantization settings.

### 2. Optimize All Models (Recommended)

```bash
python optimize_models.py --all --validate
```

This will:
- Convert all 4 models to CTranslate2 format
- Use optimal quantization for each model:
  - **mBART**: `int8_float16` (balanced quality/speed)
  - **NLLB**: `int8_float16` (balanced quality/speed)
  - **Opus MT**: `int8` (maximum speed)
  - **Custom**: `float16` (preserve quality)
- Validate each model after conversion

### 3. Start the Optimized Service

```bash
python main.py
```

The service will automatically use the optimized CTranslate2 models if available.

## Tools Overview

### optimize_models.py

Batch conversion script for all models.

**Usage:**
```bash
# Optimize all models
python optimize_models.py --all

# Optimize specific models
python optimize_models.py --models mbart nllb

# Force re-conversion
python optimize_models.py --all --force

# With validation
python optimize_models.py --all --validate

# List available models
python optimize_models.py --list

# Check status
python optimize_models.py --status
```

### convert.py

Convert individual models with custom settings.

**Usage:**
```bash
# Basic conversion
python convert.py --model_id mbart

# Custom quantization
python convert.py --model_id mbart --quantization float16

# With validation
python convert.py --model_id mbart --validate

# Force overwrite
python convert.py --model_id mbart --force
```

**Quantization Options:**
- `int8`: Fastest, smallest, lower quality (2-4x compression)
- `int8_float16`: Balanced quality/speed (recommended)
- `float16`: Better quality, still 2x faster than full precision
- `int16`: Minimal quality loss, moderate speedup

### benchmark.py

Performance testing and comparison.

**Usage:**
```bash
# Benchmark specific model
python benchmark.py --model mbart_ct2

# Benchmark all models
python benchmark.py --all-models

# Custom iterations
python benchmark.py --model mbart_ct2 --latency-iterations 200

# Save results to file
python benchmark.py --all-models --output results.json
```

**Metrics Measured:**
- **Latency**: Single request response time (ms)
- **Throughput**: Batch processing speed (sentences/second)
- **Memory**: RAM usage (MB)

## Optimization Features

### CPU Optimizations

The optimized `main.py` includes:

1. **Multi-threading**: Uses all available CPU cores
   - `inter_threads`: Parallelism across operations
   - `intra_threads`: Parallelism within operations

2. **Optimized Batching**:
   - `beam_size=1`: Greedy decoding for speed
   - `max_batch_size=32`: Process up to 32 sentences at once
   - `batch_type="tokens"`: More efficient batching strategy

3. **Performance Monitoring**:
   - Tracks request times
   - Memory usage monitoring
   - Available via `/health` endpoint

### Model Quantization

Quantization reduces model size and speeds up inference:

| Quantization | Speed | Quality | Size | Use Case |
|--------------|-------|---------|------|----------|
| int8 | ⚡⚡⚡⚡ | ⭐⭐ | 💾 | Maximum speed |
| int8_float16 | ⚡⚡⚡ | ⭐⭐⭐ | 💾💾 | **Recommended** |
| float16 | ⚡⚡ | ⭐⭐⭐⭐ | 💾💾💾 | Quality-critical |
| int16 | ⚡ | ⭐⭐⭐⭐⭐ | 💾💾💾💾 | Minimal loss |

## Expected Performance Improvements

After optimization, you should see:

- **2-5x faster** inference (500-1000ms → 100-200ms)
- **2-4x smaller** model size (2-4GB → 0.5-1GB)
- **4x higher** throughput (5 → 20 requests/second)
- **Lower memory** usage overall

## Troubleshooting

### Model Not Found

```bash
# Check if model exists
python optimize_models.py --status

# Verify model path
ls models/
```

### Conversion Failed

```bash
# Try with validation to see detailed errors
python convert.py --model_id mbart --validate

# Check if final_model directory exists
ls models/mbart/final_model/
```

### Quality Degradation

If translations are worse after optimization:

1. Try less aggressive quantization:
   ```bash
   python convert.py --model_id mbart --quantization float16 --force
   ```

2. Compare with benchmark:
   ```bash
   python benchmark.py --model mbart --model mbart_ct2
   ```

3. Adjust beam size in `main.py` (line ~217):
   ```python
   beam_size=4  # Better quality, slower
   ```

### Memory Issues

If running out of memory:

1. Reduce batch size in `main.py`:
   ```python
   max_batch_size=16  # Lower from 32
   ```

2. Unload unused models
3. Use more aggressive quantization (int8)

## API Changes

The optimized service adds performance metrics to responses:

```json
{
  "translated_texts": ["..."],
  "model_used": "mbart",
  "backend": "ctranslate2",
  "processing_time_ms": 145.23
}
```

Health endpoint now includes:

```json
{
  "status": "ok",
  "model_loaded": true,
  "backend": "ctranslate2",
  "current_version": "mbart",
  "cpu_threads": 8,
  "memory_mb": 1234.56,
  "avg_request_time_ms": 150.45,
  "total_requests": 42
}
```

## Next Steps

1. **Run optimization**: `python optimize_models.py --all --validate`
2. **Benchmark results**: `python benchmark.py --all-models --output results.json`
3. **Test in production**: Start service and monitor performance
4. **Fine-tune**: Adjust beam_size, batch_size based on your needs

## Advanced Configuration

### Custom Model Configs

Edit `optimize_models.py` to change quantization settings:

```python
MODEL_CONFIGS = {
    "mbart": {
        "quantization": "float16",  # Change from int8_float16
        "description": "..."
    },
    # ...
}
```

### CTranslate2 Settings

Edit `main.py` CPU optimization settings:

```python
# Adjust thread counts
INTER_THREADS = 4  # Change based on your CPU
INTRA_THREADS = 4

# Adjust batching
beam_size=2  # 1=fastest, 5=best quality
max_batch_size=64  # Higher for more throughput
```

## Support

For issues or questions:
1. Check conversion logs for errors
2. Run validation: `python convert.py --model_id <model> --validate`
3. Compare benchmarks before/after optimization
