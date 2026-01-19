#!/usr/bin/env python3
"""
Batch optimization script for all translation models.
Converts models to CTranslate2 format with optimal quantization settings.
"""

import os
import sys
import argparse
import json
from convert import convert_model, validate_model

# Optimal quantization settings for each model
MODEL_CONFIGS = {
    "mbart": {
        "quantization": "int8_float16",
        "description": "mBART-50 Chinese-Vietnamese (balanced quality/speed)"
    },
    "nllb": {
        "quantization": "int8_float16", 
        "description": "NLLB-200 (balanced quality/speed)"
    },
    "opus": {
        "quantization": "int8",
        "description": "Opus MT (aggressive optimization)"
    },
    "custom": {
        "quantization": "float16",
        "description": "Custom trained model (preserve quality)"
    }
}

def optimize_all_models(force=False, validate=False, models=None):
    """
    Convert all models to optimized CTranslate2 format.
    
    Args:
        force: Overwrite existing conversions
        validate: Run validation after each conversion
        models: List of specific models to convert (None = all)
    """
    results = {}
    
    # Determine which models to process
    models_to_process = models if models else list(MODEL_CONFIGS.keys())
    
    print(f"\n{'='*70}")
    print(f"  Model Optimization Suite")
    print(f"{'='*70}")
    print(f"\nModels to optimize: {', '.join(models_to_process)}")
    print(f"Force overwrite: {force}")
    print(f"Validation: {validate}")
    print(f"\n{'='*70}\n")
    
    for model_id in models_to_process:
        if model_id not in MODEL_CONFIGS:
            print(f"⚠ Warning: Unknown model '{model_id}', skipping...")
            continue
            
        config = MODEL_CONFIGS[model_id]
        print(f"\n{'─'*70}")
        print(f"Processing: {model_id}")
        print(f"Description: {config['description']}")
        print(f"Quantization: {config['quantization']}")
        print(f"{'─'*70}\n")
        
        success = convert_model(
            model_id=model_id,
            quantization=config['quantization'],
            force=force,
            validate=validate
        )
        
        results[model_id] = {
            "success": success,
            "quantization": config['quantization']
        }
        
        if success:
            print(f"\n✓ {model_id} optimization completed successfully\n")
        else:
            print(f"\n✗ {model_id} optimization failed\n")
    
    # Print summary
    print(f"\n{'='*70}")
    print(f"  Optimization Summary")
    print(f"{'='*70}\n")
    
    for model_id, result in results.items():
        status = "✓ SUCCESS" if result['success'] else "✗ FAILED"
        print(f"{status:12} | {model_id:10} | {result['quantization']}")
    
    print(f"\n{'='*70}\n")
    
    # Save results
    results_file = "optimization_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to: {results_file}\n")
    
    return results

def list_models():
    """List all available models and their configurations."""
    print(f"\n{'='*70}")
    print(f"  Available Models")
    print(f"{'='*70}\n")
    
    for model_id, config in MODEL_CONFIGS.items():
        print(f"Model: {model_id}")
        print(f"  Description: {config['description']}")
        print(f"  Quantization: {config['quantization']}")
        print()

def check_models_status():
    """Check which models are already converted."""
    print(f"\n{'='*70}")
    print(f"  Model Conversion Status")
    print(f"{'='*70}\n")
    
    base_path = "./models"
    if not os.path.exists(base_path):
        base_path = "../../models"
    
    for model_id in MODEL_CONFIGS.keys():
        original_path = os.path.join(base_path, model_id)
        ct2_path = os.path.join(base_path, f"{model_id}_ct2")
        
        original_exists = os.path.exists(original_path)
        ct2_exists = os.path.exists(ct2_path)
        
        status = "✓ Converted" if ct2_exists else ("○ Not converted" if original_exists else "✗ Missing")
        
        print(f"{status:20} | {model_id}")
        
        if ct2_exists:
            # Check for metadata
            metadata_path = os.path.join(ct2_path, "conversion_metadata.json")
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                print(f"{'':20} | Quantization: {metadata.get('quantization', 'unknown')}")
                print(f"{'':20} | Size: {metadata.get('converted_size_mb', 0):.2f} MB")
                print(f"{'':20} | Converted: {metadata.get('timestamp', 'unknown')}")
        print()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Batch optimization for all translation models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Optimize all models
  python optimize_models.py --all
  
  # Optimize specific models
  python optimize_models.py --models mbart nllb
  
  # Force re-conversion with validation
  python optimize_models.py --all --force --validate
  
  # Check conversion status
  python optimize_models.py --status
  
  # List available models
  python optimize_models.py --list
        """
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Optimize all models"
    )
    parser.add_argument(
        "--models",
        nargs="+",
        help="Specific models to optimize (e.g., mbart nllb)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-conversion even if already exists"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate models after conversion"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available models and their configurations"
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Check conversion status of all models"
    )
    
    args = parser.parse_args()
    
    # Handle different modes
    if args.list:
        list_models()
    elif args.status:
        check_models_status()
    elif args.all or args.models:
        optimize_all_models(
            force=args.force,
            validate=args.validate,
            models=args.models
        )
    else:
        parser.print_help()
        sys.exit(1)
