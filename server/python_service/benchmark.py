#!/usr/bin/env python3
"""
Benchmark script for testing model performance.
Measures inference speed, throughput, and memory usage.
"""

import os
import sys
import time
import argparse
import json
import psutil
import torch
import ctranslate2
from transformers import AutoTokenizer
from typing import List, Dict

class ModelBenchmark:
    def __init__(self, model_path: str, model_id: str):
        """Initialize benchmark for a specific model."""
        self.model_path = model_path
        self.model_id = model_id
        self.is_ct2 = model_path.endswith("_ct2")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load model
        print(f"Loading model from {model_path}...")
        if self.is_ct2:
            self.translator = ctranslate2.Translator(model_path, device=self.device)
            self.model = None
        else:
            from transformers import AutoModelForSeq2SeqLM
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_path, local_files_only=True)
            if self.device == "cuda":
                self.model = self.model.to("cuda")
            self.translator = None
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        
        # Test data (Chinese sentences)
        self.test_sentences = [
            "你好，世界！",
            "今天天气很好。",
            "我喜欢学习中文。",
            "这是一个测试句子。",
            "人工智能正在改变世界。",
            "机器学习是一个非常有趣的领域。",
            "深度学习模型需要大量的数据来训练。",
            "自然语言处理是人工智能的一个重要分支。",
            "翻译系统可以帮助人们跨越语言障碍进行交流。",
            "字幕管理系统可以自动翻译和同步字幕文件。"
        ]
    
    def translate_single(self, text: str) -> str:
        """Translate a single sentence."""
        if self.is_ct2:
            # CTranslate2 path
            input_ids = self.tokenizer.encode(text)
            source_tokens = self.tokenizer.convert_ids_to_tokens(input_ids)
            
            target_prefix = None
            if "mbart" in self.model_id.lower():
                target_prefix = [["vi_VN"]]
            
            results = self.translator.translate_batch(
                [source_tokens],
                target_prefix=target_prefix
            )
            
            output_text = self.tokenizer.decode(
                self.tokenizer.convert_tokens_to_ids(results[0].hypotheses[0]),
                skip_special_tokens=True
            )
            return output_text
        else:
            # Transformers path
            inputs = self.tokenizer(text, return_tensors="pt", padding=True).to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(**inputs, max_length=512)
            return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    def translate_batch(self, texts: List[str]) -> List[str]:
        """Translate a batch of sentences."""
        if self.is_ct2:
            # CTranslate2 batch path
            source_tokens = [
                self.tokenizer.convert_ids_to_tokens(self.tokenizer.encode(t)) 
                for t in texts
            ]
            
            target_prefix = None
            if "mbart" in self.model_id.lower():
                target_prefix = [["vi_VN"]] * len(texts)
            
            results = self.translator.translate_batch(
                source_tokens,
                target_prefix=target_prefix
            )
            
            return [
                self.tokenizer.decode(
                    self.tokenizer.convert_tokens_to_ids(res.hypotheses[0]),
                    skip_special_tokens=True
                )
                for res in results
            ]
        else:
            # Transformers batch path
            inputs = self.tokenizer(texts, return_tensors="pt", padding=True, truncation=True).to(self.device)
            with torch.no_grad():
                outputs = self.model.generate(**inputs, max_length=512)
            return self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
    
    def benchmark_latency(self, iterations: int = 100) -> Dict:
        """Measure single-request latency."""
        print(f"\nBenchmarking latency ({iterations} iterations)...")
        
        latencies = []
        test_text = self.test_sentences[0]
        
        # Warmup
        for _ in range(5):
            self.translate_single(test_text)
        
        # Measure
        for i in range(iterations):
            start = time.time()
            self.translate_single(test_text)
            latency = (time.time() - start) * 1000  # Convert to ms
            latencies.append(latency)
            
            if (i + 1) % 20 == 0:
                print(f"  Progress: {i + 1}/{iterations}")
        
        return {
            "mean_ms": sum(latencies) / len(latencies),
            "min_ms": min(latencies),
            "max_ms": max(latencies),
            "p50_ms": sorted(latencies)[len(latencies) // 2],
            "p95_ms": sorted(latencies)[int(len(latencies) * 0.95)],
            "p99_ms": sorted(latencies)[int(len(latencies) * 0.99)]
        }
    
    def benchmark_throughput(self, batch_size: int = 10, iterations: int = 20) -> Dict:
        """Measure batch throughput."""
        print(f"\nBenchmarking throughput (batch_size={batch_size}, {iterations} iterations)...")
        
        batch = self.test_sentences[:batch_size]
        total_sentences = 0
        total_time = 0
        
        # Warmup
        for _ in range(3):
            self.translate_batch(batch)
        
        # Measure
        for i in range(iterations):
            start = time.time()
            self.translate_batch(batch)
            elapsed = time.time() - start
            
            total_sentences += len(batch)
            total_time += elapsed
            
            if (i + 1) % 5 == 0:
                print(f"  Progress: {i + 1}/{iterations}")
        
        throughput = total_sentences / total_time
        
        return {
            "sentences_per_second": throughput,
            "batch_size": batch_size,
            "total_sentences": total_sentences,
            "total_time_s": total_time
        }
    
    def benchmark_memory(self) -> Dict:
        """Measure memory usage."""
        print(f"\nBenchmarking memory usage...")
        
        process = psutil.Process()
        
        # Baseline memory
        baseline_mb = process.memory_info().rss / (1024 ** 2)
        
        # Translate to load model fully
        self.translate_batch(self.test_sentences)
        
        # Peak memory
        peak_mb = process.memory_info().rss / (1024 ** 2)
        
        return {
            "baseline_mb": baseline_mb,
            "peak_mb": peak_mb,
            "model_memory_mb": peak_mb - baseline_mb
        }
    
    def run_full_benchmark(self, latency_iterations: int = 100, throughput_iterations: int = 20) -> Dict:
        """Run complete benchmark suite."""
        print(f"\n{'='*70}")
        print(f"  Benchmarking: {self.model_id}")
        print(f"  Backend: {'CTranslate2' if self.is_ct2 else 'Transformers'}")
        print(f"  Device: {self.device}")
        print(f"{'='*70}")
        
        results = {
            "model_id": self.model_id,
            "backend": "ctranslate2" if self.is_ct2 else "transformers",
            "device": self.device,
            "latency": self.benchmark_latency(latency_iterations),
            "throughput": self.benchmark_throughput(iterations=throughput_iterations),
            "memory": self.benchmark_memory()
        }
        
        return results

def print_results(results: Dict):
    """Pretty print benchmark results."""
    print(f"\n{'='*70}")
    print(f"  Benchmark Results: {results['model_id']}")
    print(f"{'='*70}\n")
    
    print(f"Backend: {results['backend']}")
    print(f"Device: {results['device']}\n")
    
    print("Latency (single request):")
    lat = results['latency']
    print(f"  Mean:  {lat['mean_ms']:.2f} ms")
    print(f"  P50:   {lat['p50_ms']:.2f} ms")
    print(f"  P95:   {lat['p95_ms']:.2f} ms")
    print(f"  P99:   {lat['p99_ms']:.2f} ms")
    print(f"  Range: {lat['min_ms']:.2f} - {lat['max_ms']:.2f} ms\n")
    
    print("Throughput (batch processing):")
    thr = results['throughput']
    print(f"  {thr['sentences_per_second']:.2f} sentences/second")
    print(f"  Batch size: {thr['batch_size']}\n")
    
    print("Memory Usage:")
    mem = results['memory']
    print(f"  Baseline: {mem['baseline_mb']:.2f} MB")
    print(f"  Peak:     {mem['peak_mb']:.2f} MB")
    print(f"  Model:    {mem['model_memory_mb']:.2f} MB\n")

def compare_models(results_list: List[Dict]):
    """Compare multiple model results."""
    print(f"\n{'='*70}")
    print(f"  Model Comparison")
    print(f"{'='*70}\n")
    
    print(f"{'Model':<15} {'Backend':<12} {'Latency (ms)':<15} {'Throughput':<15} {'Memory (MB)':<12}")
    print(f"{'-'*70}")
    
    for r in results_list:
        model = r['model_id']
        backend = r['backend']
        latency = f"{r['latency']['mean_ms']:.1f}"
        throughput = f"{r['throughput']['sentences_per_second']:.1f} s/s"
        memory = f"{r['memory']['model_memory_mb']:.0f}"
        
        print(f"{model:<15} {backend:<12} {latency:<15} {throughput:<15} {memory:<12}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark translation models")
    parser.add_argument(
        "--model",
        help="Specific model to benchmark (e.g., mbart_ct2)"
    )
    parser.add_argument(
        "--all-models",
        action="store_true",
        help="Benchmark all available models"
    )
    parser.add_argument(
        "--latency-iterations",
        type=int,
        default=100,
        help="Number of iterations for latency test (default: 100)"
    )
    parser.add_argument(
        "--throughput-iterations",
        type=int,
        default=20,
        help="Number of iterations for throughput test (default: 20)"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file for results"
    )
    
    args = parser.parse_args()
    
    base_path = "./models"
    if not os.path.exists(base_path):
        base_path = "../../models"
    
    all_results = []
    
    if args.all_models:
        # Find all available models
        models = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
        print(f"Found models: {models}")
        
        for model_id in models:
            model_path = os.path.join(base_path, model_id)
            try:
                benchmark = ModelBenchmark(model_path, model_id)
                results = benchmark.run_full_benchmark(
                    args.latency_iterations,
                    args.throughput_iterations
                )
                print_results(results)
                all_results.append(results)
            except Exception as e:
                print(f"Error benchmarking {model_id}: {e}")
                import traceback
                traceback.print_exc()
    
    elif args.model:
        model_path = os.path.join(base_path, args.model)
        if not os.path.exists(model_path):
            print(f"Error: Model not found at {model_path}")
            sys.exit(1)
        
        benchmark = ModelBenchmark(model_path, args.model)
        results = benchmark.run_full_benchmark(
            args.latency_iterations,
            args.throughput_iterations
        )
        print_results(results)
        all_results.append(results)
    
    else:
        parser.print_help()
        sys.exit(1)
    
    # Compare if multiple models
    if len(all_results) > 1:
        compare_models(all_results)
    
    # Save results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f"\nResults saved to: {args.output}")
