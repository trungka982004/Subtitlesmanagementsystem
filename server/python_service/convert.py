import os
import argparse
import ctranslate2
import transformers
import time
import json

def convert_model(model_id, quantization="int8", force=False, validate=False):
    """
    Converts a HuggingFace model to CTranslate2 format with enhanced options.
    
    Args:
        model_id: Model folder name
        quantization: Quantization type (int8, int8_float16, float16, int16)
        force: Overwrite existing output
        validate: Run validation after conversion
    """
    base_models_path = "./models"
    
    # Check alternate paths just like main.py
    if not os.path.exists(base_models_path):
        if os.path.exists("../../models"):
             base_models_path = "../../models"
        elif os.path.exists("../../../models"):
             base_models_path = "../../../models"
    
    input_dir = os.path.join(base_models_path, model_id)
    output_dir = os.path.join(base_models_path, f"{model_id}_ct2")
    
    if not os.path.exists(input_dir):
        print(f"Error: Input model {model_id} not found at {input_dir}")
        return False
        
    if os.path.exists(output_dir) and not force:
        print(f"Output directory {output_dir} already exists. Use --force to overwrite.")
        return True

    # Check for nested 'final_model' directory
    nested_path = os.path.join(input_dir, "final_model")
    if os.path.exists(nested_path) and os.path.isdir(nested_path):
        print(f"Found nested 'final_model' directory. Using {nested_path}")
        input_dir = nested_path

    print(f"\n{'='*60}")
    print(f"Converting {model_id}")
    print(f"  Input:  {input_dir}")
    print(f"  Output: {output_dir}")
    print(f"  Quantization: {quantization}")
    print(f"{'='*60}\n")
    
    start_time = time.time()
    
    try:
        # Load tokenizer to get language token IDs for mBART
        from transformers import AutoTokenizer, AutoConfig
        
        # Determine which tokenizer files to copy
        files_to_check = [
            "tokenizer.json", 
            "vocab.json", 
            "source.spm", 
            "target.spm", 
            "tokenizer_config.json", 
            "special_tokens_map.json", 
            "sentencepiece.bpe.model"
        ]
        files_to_copy = [f for f in files_to_check if os.path.exists(os.path.join(input_dir, f))]
        print(f"Copying tokenizer files: {files_to_copy}")

        # Special handling for mBART to force Vietnamese output
        if "mbart" in model_id.lower():
            print("Configuring mBART model for Vietnamese output...")
            try:
                # Load config and tokenizer
                config = AutoConfig.from_pretrained(input_dir, local_files_only=True)
                tokenizer = AutoTokenizer.from_pretrained(input_dir, local_files_only=True)
                
                # Get Vietnamese language token ID
                # For mBART-50, the language code is "vi_VN"
                vi_token_id = tokenizer.convert_tokens_to_ids("vi_VN")
                
                if vi_token_id != tokenizer.unk_token_id:
                    print(f"Setting forced_bos_token_id to {vi_token_id} (vi_VN)")
                    config.forced_bos_token_id = vi_token_id
                    
                    # Save modified config to input directory temporarily
                    config.save_pretrained(input_dir)
                else:
                    print("Warning: Could not find vi_VN token in tokenizer vocabulary")
            except Exception as e:
                print(f"Warning: Could not set forced_bos_token_id: {e}")

        # Convert model
        converter = ctranslate2.converters.TransformersConverter(
            model_name_or_path=input_dir,
            copy_files=files_to_copy
        )
        converter.convert(
            output_dir=output_dir,
            quantization=quantization,
            force=True
        )
        
        conversion_time = time.time() - start_time
        print(f"\n✓ Conversion successful in {conversion_time:.2f}s")
        
        # Get model size info
        original_size = get_dir_size(input_dir)
        converted_size = get_dir_size(output_dir)
        compression_ratio = original_size / converted_size if converted_size > 0 else 0
        
        print(f"\nModel Size:")
        print(f"  Original:  {original_size / (1024**2):.2f} MB")
        print(f"  Converted: {converted_size / (1024**2):.2f} MB")
        print(f"  Compression: {compression_ratio:.2f}x")
        
        # Save conversion metadata
        metadata = {
            "model_id": model_id,
            "quantization": quantization,
            "conversion_time": conversion_time,
            "original_size_mb": original_size / (1024**2),
            "converted_size_mb": converted_size / (1024**2),
            "compression_ratio": compression_ratio,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        metadata_path = os.path.join(output_dir, "conversion_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Validate if requested
        if validate:
            print("\nRunning validation...")
            validate_model(output_dir, model_id)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_dir_size(path):
    """Calculate total size of directory in bytes."""
    total = 0
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total += os.path.getsize(filepath)
    except Exception as e:
        print(f"Warning: Could not calculate size for {path}: {e}")
    return total

def validate_model(model_path, model_id):
    """
    Validate that the converted model can be loaded and used for inference.
    """
    try:
        import torch
        from transformers import AutoTokenizer
        
        # Try to load the model
        device = "cuda" if torch.cuda.is_available() else "cpu"
        translator = ctranslate2.Translator(model_path, device=device)
        
        # Try to load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        
        # Test translation
        test_text = "你好，世界！"  # Hello, world! in Chinese
        input_ids = tokenizer.encode(test_text)
        source_tokens = tokenizer.convert_ids_to_tokens(input_ids)
        
        # For mBART models, need target prefix
        target_prefix = None
        if "mbart" in model_id.lower():
            target_prefix = [["vi_VN"]]
        
        results = translator.translate_batch(
            [source_tokens],
            target_prefix=target_prefix
        )
        
        output_text = tokenizer.decode(
            tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]), 
            skip_special_tokens=True
        )
        
        print(f"✓ Validation passed")
        print(f"  Test input:  {test_text}")
        print(f"  Test output: {output_text}")
        
        return True
        
    except Exception as e:
        print(f"✗ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert HuggingFace models to CTranslate2 format with optimizations"
    )
    parser.add_argument(
        "--model_id", 
        required=True, 
        help="Folder name of the model in /models"
    )
    parser.add_argument(
        "--quantization", 
        default="int8", 
        choices=["int8", "int8_float16", "float16", "int16"],
        help="Quantization type (default: int8)"
    )
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="Overwrite existing output path"
    )
    parser.add_argument(
        "--validate", 
        action="store_true", 
        help="Validate model after conversion"
    )
    
    args = parser.parse_args()
    success = convert_model(args.model_id, args.quantization, args.force, args.validate)
    exit(0 if success else 1)
