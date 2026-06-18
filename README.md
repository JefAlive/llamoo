# GGUF TUI

Terminal UI para gerenciar e rodar modelos `.gguf` com `llama-server`.

## Instalação

```bash
# Instalar dependências
npm install

# Rodar em modo dev (com tsx)
npm run dev

# Build TypeScript
npm run build

# Rodar build
npm start
```

## Pré-requisitos

- Node.js 18+
- `llama-server` no PATH (do [llama.cpp](https://github.com/ggerganov/llama.cpp))
- Modelos `.gguf` em algum diretório local

Você pode configurar o binário do `llama-server` via variável de ambiente:

```bash
LLAMA_SERVER_BIN=/caminho/para/llama-server npm start
```

## Navegação

### Tela Principal (Profiles)

| Tecla | Ação |
|-------|------|
| `↑↓` | Navegar pela lista |
| `PgUp / PgDn` | Navegar em blocos |
| `Home / End` | Início / fim da lista |
| `/` | Buscar profile por nome |
| `a` | Adicionar novo profile |
| `e` ou `↵` | Editar profile selecionado |
| `r` | Rodar profile selecionado |
| `x` | Deletar profile (pede confirmação) |
| `t` | Trocar tema |
| `d` | Gerenciar diretórios de scan |
| `s` | Sincronizar modelos (re-escaneia diretórios) |

### Editor de Profile

| Tecla | Ação |
|-------|------|
| `↑↓` | Navegar entre campos |
| `↵` ou `SPACE` | Editar campo / toggle boolean |
| `←→` | Ajustar valores numéricos |
| `Ctrl+S` | Salvar |
| `ESC` | Cancelar |

### Runner (llama-server)

| Tecla | Ação |
|-------|------|
| `↑↓ PgUp PgDn` | Scroll no output |
| `g / G` | Ir pro topo / fim |
| `q` ou `ESC` | Parar servidor (SIGTERM) |
| `Q` | Matar forçado (SIGKILL) + sair |

## Temas disponíveis

- `default` — Cores do terminal
- `catppuccin` — Catppuccin Mocha
- `gruvbox` — Gruvbox Dark
- `tokyonight` — Tokyo Night
- `synthwave84` — Synthwave '84
- `solarized` — Solarized Dark
- `matrix` — Matrix
- `tron-legacy` — Tron Legacy (azul)
- `tron-ares` — Tron Ares (roxo)
- `orng` — ORNG (laranja)
- `fnaf` — FNaF (vermelho)

## Parâmetros do Profile

### Contexto & Threads
- **Context Size** — `--ctx-size`
- **Threads (CPU)** — `--threads`
- **Threads (HTTP)** — `--threads-http`

### GPU
- **GPU Layers** — `--n-gpu-layers` (0 = só CPU)
- **Main GPU** — `--main-gpu`
- **Tensor Split** — `--tensor-split` (ex: `3,1` para 75%/25%)

### KV Cache (Quantização de Memória)
- **KV Cache Type K/V** — `--cache-type-k` / `--cache-type-v`
- Opções: `f32`, `f16`, `bf16`, `q8_0`, `q4_0`, `q4_1`, `iq4_nl`, `q5_0`, `q5_1`

### Atenção & Memória
- **Flash Attention** — `--flash-attn`
- **No Memory Map** — `--no-mmap`
- **mlock** — `--mlock`

### Sampling
- **Temperature** — `--temp`
- **Top-K** — `--top-k`
- **Top-P** — `--top-p`
- **Min-P** — `--min-p`
- **Repetition Penalty** — `--repeat-penalty`
- **Frequency Penalty** — `--frequency-penalty`
- **Presence Penalty** — `--presence-penalty`

### Multi-Token Prediction / Speculative Decoding
- **Draft Max** — `--draft-max`
- **Draft Min** — `--draft-min`
- **Draft P-Min** — `--draft-p-min`

### Servidor
- **Host** — `--host`
- **Port** — `--port`
- **API Key** — `--api-key`

### LoRA
- **LoRA Path** — `--lora`
- **LoRA Scale** — `--lora-scale`

### Prompt
- **Chat Template** — `--chat-template`
- **System Prompt** — `--system-prompt`

### Flags Customizadas
Campo de texto livre para adicionar qualquer flag extra ao `llama-server`.

## Config

As configurações são salvas automaticamente em:
- Linux: `~/.config/llamoo/config.json`
- macOS: `~/Library/Preferences/llamoo/config.json`
