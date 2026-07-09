## ADDED Requirements

### Requirement: Parse Prometheus metrics from llama-server
The system SHALL parse Prometheus exposition-format text from `http://<host>:<port>/metrics` and extract `llamacpp:*` metric values.

#### Scenario: Successful parse of Prometheus response
- **WHEN** the server returns Prometheus-formatted text with `llamacpp:n_tokens_max`, `llamacpp:predicted_tokens_seconds`, `llamacpp:prompt_tokens_seconds`, and `llamacpp:n_decode_total`
- **THEN** the parser returns an object with `ctxSize`, `tokPerSec`, `promptTokPerSec`, and `nDecode` fields populated from the respective metric values

#### Scenario: Unknown metric names are skipped
- **WHEN** the Prometheus text contains non-`llamacpp:*` metrics
- **THEN** those lines SHALL be silently skipped without error

#### Scenario: Empty or malformed response
- **WHEN** the server returns empty body, non-UTF-8 text, or response.status !== 200
- **THEN** the parser SHALL return null

### Requirement: Merge Prometheus data with OS data
The system SHALL combine parsed Prometheus metrics with OS-derived metrics (RAM, CPU) into a single `Metrics` object.

#### Scenario: Full merge with all data sources
- **WHEN** both Prometheus fetch and OS sampling succeed
- **THEN** the merged result SHALL contain RAM/CPU from OS and TOK/CTX/TTFT from Prometheus

#### Scenario: Prometheus fetch fails
- **WHEN** the server is unreachable or /metrics returns non-200
- **THEN** the system SHALL produce metrics using OS data alone, with server-only fields set to 0
