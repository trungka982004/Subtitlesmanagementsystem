import os
import argparse
import ctranslate2
import transformers

def convert_model(model_id, quantization="int8", force=False):
    """
    Converts a HuggingFace model to CTranslate2 format.
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
        print(f"Error: Input model {model_id} found at {input_dir}")
        return False
        
    if os.path.exists(output_dir) and not force:
        print(f"Output directory {output_dir} already exists. Use --force to overwrite.")
        return True

    # Check for nested 'final_model' directory
    nested_path = os.path.join(input_dir, "final_model")
    if os.path.exists(nested_path) and os.path.isdir(nested_path):
        print(f"Found nested 'final_model' directory. Using {nested_path}")
        input_dir = nested_path

    print(f"Converting {model_id} from {input_dir} to {output_dir} with quantization={quantization}...")
    
    try:
        files_to_check = ["tokenizer.json", "vocab.json", "source.spm", "target.spm", "tokenizer_config.json", "special_tokens_map.json", "sentencepiece.bpe.model"]
        files_to_copy = [f for f in files_to_check if os.path.exists(os.path.join(input_dir, f))]
        print(f"Copying files: {files_to_copy}")

        converter = ctranslate2.converters.TransformersConverter(
            model_name_or_path=input_dir,
            copy_files=files_to_copy
        )
        converter.convert(
            output_dir=output_dir,
            quantization=quantization,
            force=True
        )
        print("Conversion successful!")
        return True
    except Exception as e:
        print(f"Conversion failed: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_id", required=True, help="Folder name of the model in /models")
    parser.add_argument("--quantization", default="int8", help="Quantization type: int8, int8_float16, float16, int16")
    parser.add_argument("--force", action="store_true", help="Overwrite existing output path")
    
    args = parser.parse_args()
    convert_model(args.model_id, args.quantization, args.force)
