## ADDED Requirements

### Requirement: LlamaProfile data structure
The application SHALL represent Llama.cpp inference configuration as a TypeScript interface.

#### Scenario: Profile definition
- **WHEN** user creates a new profile
- **THEN** system SHALL generate a `LlamaProfile` object with:
  - `id`: UUID for uniqueness
  - `name`: Human-readable identifier
  - `modelPath`: Path to .gguf model file
  - `contextSize`: Maximum tokens (default: 64K)
  - `contextUnit`: "K", "M", or "B" for context size unit
  - `threads`: Number of CPU threads for inference
  - `threadsHttp`: Number of threads for HTTP handling
  - `gpuLayers`: Number of GPU layers (0=CPU only)
  - `mainGpu`: Primary GPU index for multi-GPU
  - `kvCacheTypeK`: Key cache quantization type
  - `kvCacheTypeV`: Value cache quantization type
  - `flashAttention`: Boolean flag
  - `noMmap`: Boolean flag
  - `mlock`: Boolean flag
  - `temperature`: Sampling temperature (0-1)
  - `topK`, `topP`: Sampling parameters
  - `repetitionPenalty`: Float for repetition penalty
  - `draftMin`, `draftMax`: Draft tokens for speculative decoding
  - `host`, `port`: Server address
  - `apiKey`: Optional API key
  - `loraPath`, `loraScale`: LoRA configuration
  - `systemPrompt`: System prompt string
  - `chatTemplate`: Chat format identifier
  - `customFlags`: Extra flags for llama-server

#### Scenario: Profile loading
- **WHEN** profile is loaded from config
- **THEN** all properties SHALL be deserialized from JSON
- **WHEN** profile is saved
- **THEN** all properties SHALL be serialized to JSON

#### Scenario: Default profile generation
- **WHEN** no models are found
- **THEN** makeDefaultProfile() SHALL create a profile with:
  - modelPath from first model in system
  - contextSize: 64K
  - threads: 4
  - gpuLayers: 0
  - sampling params: temp=0.8, topK=40, topP=0.95
  - kv cache: q8_0 quantization
  - server: localhost:8000