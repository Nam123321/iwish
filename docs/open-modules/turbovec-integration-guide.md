# I-Wish Integration Guide: turbovec
> Generated on: 2026-06-08T01:56:00+07:00

---

## 1. What is it
- **Repo Name**: turbovec
- **Source**: [https://github.com/RyanCodrai/turbovec](https://github.com/RyanCodrai/turbovec)
- **Current Registration State**: Draft Registered (`SYSTEM_SKILL` - Bundle)
- **Shape Classification**: `skill` (for the index engine) / `skill-attachment` (for framework connectors)
- **Role Classification**: `supportive`

---

## 2. Why it exists
- **What job it solves**: Compresses float32 embeddings up to 16x (using 2-bit or 4-bit quantization with Householder rotations) and runs high-speed vector search directly on CPU registers using handwritten NEON and AVX-512 SIMD lookup table (LUT) kernels.
- **Why I-Wish wants it**: To support offline or local RAG pipelines on consumer-grade hardware or edge devices without requiring high-memory GPU resources or external VDB dependencies.
- **What gap it fills**: I-Wish has no native local compressed vector search or SIMD indexing.

---

## 3. Delivery framework placement
- **Which phases it helps**: Phase 4 (Implementation / Coding) and Phase 0 (Pre-flight Context Loading / RAG memory retrieval).
- **Which stages/tasks it serves**: Offline RAG context retrieval, agent local memory persistence, and low-footprint vector storage.
- **Role**: `supportive` (accelerates and de-risks agent memory management).

---

## 4. Input -> Process -> Output
- **Inputs**:
  - Insert: Flat list of float32 embeddings (`&[f32]`), dimensions, and unique 64-bit unsigned integer handles (or string IDs in `IdMapIndex`).
  - Search: Query float32 embedding (`&[f32]`), number of results `k`, and optional boolean selection mask.
- **Process**:
  1. Rotate input query/vector via deterministic Householder matrix.
  2. Map to Lloyd-Max centroids for coordinate quantization.
  3. Run SIMD LUT instructions over repacked byte blocks to accumulate scores.
- **Outputs**:
  - Struct `SearchResults` carrying `scores: Vec<f32>` and `indices: Vec<i64>`.

---

## 5. Use cases
- **Core use cases**:
  - Memory-constrained, CPU-local vector search (e.g. keeping 10M embeddings in 4 GB memory).
  - Streaming, online ingestion of new vectors (no training phase or offline codebook retraining).
  - Integration with Agno, LangChain, LlamaIndex, or Haystack local RAG pipelines.
- **Adjacent use cases**:
  - Storing and retrieving historical agent interaction traces (short/long-term memory).
  - Semantic code search inside agent helper tools.
- **Do-not-use cases**:
  - High-dimensional indexing requiring Max-Marginal Relevance (MMR) search (cannot compute pairwise diversity without full-precision vectors).
  - Indexes requiring Euclidean (L2) or Inner Product distance scoring (only Cosine distance is supported).
  - Billion-scale distributed vector databases (use Milvus, Qdrant, or FAISS cluster).

---

## 6. Edge cases / Stress cases / Constraints
- **Edge cases**:
  - Coordinate NaNs/Infs: Checked and rejected at entry to prevent index scale poisoning.
  - v2-loaded files: Correctly initialized with identity TQ+ calibration to avoid wrong scores on subsequent adds.
- **Stress cases**:
  - CPU without AVX2/AVX-512BW: Dispatches to a scalar fallback kernel, preventing silent empty search returns.
  - Large non-contiguous NumPy arrays: Copied to C-contiguous layout at bindings boundaries (potential transient memory spikes).
- **Constraints**:
  - Deleting elements (`swap_remove`) rearranges vector slot slots internally.
  - Dimension size must be a positive multiple of 8.

---

## 7. Agent / Workflow / Skill coordination
- **Which canonical agents should use it**: `dev-agent`, `research-agent`, and `capability-agent`.
- **Which workflows should call it**: RAG workflows, codebase indexers, and local memory managers.
- **Which supportive skills pair well with it**: `code-search`, `repo-absorption`.
- **Direct vs Parent**: Can be used directly as a database class or inside a parent retrieval workflow.

---

## 8. Orch routing hints
- **Trigger phrases**: "local RAG", "offline vector store", "compress embeddings", "low-memory vector search", "memory-efficient embeddings".
- **Anti-triggers**: "distributed vector database", "MMR search", "Euclidean distance index", "billion-scale search".
- **Preferred routing stage**: Discover / Implement.
- **Proposal style**: Proposed automatically when offline storage or low-memory retrieval is needed.

---

## 9. Review questions for the user
- **Desired use cases**: Are you planning to use this for local RAG, or agent short-term memory?
- **Risky edge cases**: Are you aware that MMR (Max-Marginal Relevance) and L2 distance are not supported?
- **Approval boundaries**: Should turbovec be promoted to a core I-Wish dependency or kept as an optional plugin?

---

## 9.5. Connector Bug Fixes (Boilerplates)
To address known integration issues safely, all wrappers must apply the following patterns:

### Fix for Issue #89: Transactional Upsert (Validate First, Delete Second)
Always run formatting, bounds, and dimension checks on input vectors *before* purging old records from memory.
```python
def upsert_safe(self, content_hash: str, documents: List[Document]):
    # 1. Embed and pre-validate embeddings first
    self._embed_missing(documents)
    missing = [d for d in documents if not d.embedding]
    if missing:
        raise ValueError("Missing embeddings")
    
    # Check shapes
    for doc in documents:
        qvec = np.asarray(doc.embedding, dtype=np.float32)
        if qvec.shape[-1] != self.dimensions:
            raise ValueError(f"Dim mismatch: got {qvec.shape[-1]}, expected {self.dimensions}")
            
    # 2. Deletions happen safely only after validation passes
    if self.content_hash_exists(content_hash):
        self._delete_by_content_hash(content_hash)
        
    # 3. Final insert
    self.insert_validated(content_hash, documents)
```

### Fix for Issue #90: Intra-batch Duplicate ID Guard
Ensure a single batch does not contain duplicate document IDs, preventing orphaned vectors in the C-index.
```python
def check_duplicate_ids(self, documents: List[Document]):
    seen = set()
    for doc in documents:
        if not doc.id:
            continue
        if doc.id in seen:
            raise ValueError(f"Duplicate document ID '{doc.id}' detected in the same batch")
        seen.add(doc.id)
```

---

## 10. Example scenarios
- **Scenario 1: Local RAG agent memory**
  ```python
  from turbovec.agno import TurboQuantVectorDb
  from agno.knowledge.embedder.openai import OpenAIEmbedder
  
  db = TurboQuantVectorDb(embedder=OpenAIEmbedder(), path="./memory")
  db.create()
  ```
- **Scenario 2: Low-memory vector storage**
  ```python
  import numpy as np
  from turbovec import TurboQuantIndex
  
  index = TurboQuantIndex(dim=1536, bit_width=4)
  vectors = np.random.randn(1000, 1536).astype(np.float32)
  index.add(vectors)
  ```
