# mBART Model - Known Issues and Solutions

## Issue: English Output in Vietnamese Translations

### Problem Description
The current mBART model sometimes outputs English text instead of Vietnamese, even when the target language is explicitly set to Vietnamese (`vi_VN`). This occurs for certain input phrases.

**Examples:**
- Input: "不要放手" → Output: "Don't let go" (Expected: Vietnamese)
- Input: "等等" → Output: "Wait" (Expected: Vietnamese)  
- Input: "你好，世界！" → Output: "Hello, thế giới!" (Expected: fully Vietnamese)

### Root Cause
This is **NOT a CTranslate2 conversion issue** or a configuration problem. Testing with the original HuggingFace model (before conversion) shows the same behavior. The model was trained this way and has learned to output English for certain Chinese inputs.

### Why This Happens
1. The model's training data likely contained Chinese-English translation pairs
2. The model learned patterns where certain Chinese phrases map to English
3. Even with `forced_bos_token_id=250024` (vi_VN token), the model's learned weights override this for some inputs

### Solutions

#### Option 1: Retrain/Fine-tune the Model (Recommended for Production)
**Best long-term solution:**
- Fine-tune the mBART model on a Chinese-Vietnamese parallel corpus
- Ensure training data contains ONLY Vietnamese outputs
- Use data augmentation to cover edge cases
- Set `forced_bos_token_id` during training

**Steps:**
1. Prepare a clean Chinese-Vietnamese dataset
2. Fine-tune using the Hugging Face Trainer
3. Validate that all outputs are Vietnamese
4. Reconvert to CTranslate2 format

#### Option 2: Use NLLB Model Instead (Quick Fix)
**Immediate workaround:**
- The NLLB (No Language Left Behind) model may have better Vietnamese consistency
- Already available in your system at `models/nllb_ct2`
- Switch to NLLB in the Settings page

#### Option 3: Hybrid Approach (Current Implementation)
**What we've implemented:**
- English detection logging to identify problematic translations
- Diagnostic warnings in the console
- Users can manually identify and correct English outputs

### Current Configuration

The service is configured with optimal parameters for Vietnamese output:
```python
- forced_bos_token_id: 250024 (vi_VN token)
- beam_size: 5 (higher quality)
- target_prefix: [["vi_VN"]]
- repetition_penalty: 1.2
- length_penalty: 1.0
```

However, these parameters cannot fully override the model's learned behavior.

### Recommendations

1. **For immediate use**: Switch to the NLLB model
2. **For best quality**: Retrain the mBART model with Vietnamese-only training data
3. **For monitoring**: Check console logs for English detection warnings

### Technical Details

- Model path: `./models/mbart/final_model`
- Vietnamese token ID: `250024`
- Tokenizer: mBART-50 multilingual
- Source language: `zh_CN` (Chinese)
- Target language: `vi_VN` (Vietnamese)

---

**Last Updated:** 2026-01-19
**Status:** Known limitation - requires model retraining for complete fix
