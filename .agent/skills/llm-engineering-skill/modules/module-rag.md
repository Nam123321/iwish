# Module: RAG & Information Retrieval

## Purpose
Establishes the architecture for Retrieval-Augmented Generation. Extends LLM knowledge beyond its training cutoff using external corpora.

## Core Principles
1. RAG is a search problem, not a generation problem.
2. Context density is more important than context volume.
3. Garbage in, Garbage out: The generator can only be as good as the retriever.
4. Multimodal RAG handles structured, unstructured, and visual data.
5. RAG scales from Naive to Advanced to Modular.

## Mental Models & Frameworks
- **The RAG Pipeline**: Indexing (Parse, Chunk, Embed, Store) -> Retrieval (Query rewrite, Search, Rerank) -> Generation.
- **Chunking Strategies**: Fixed-size, Semantic, Recursive Character, Document-based.
- **Advanced Retrieval**: Hybrid Search (BM25 + Vector), Reciprocal Rank Fusion (RRF), Query Expansion, Hypothetical Document Embeddings (HyDE).
- **RAG Assessment**: RAGAS metrics (Faithfulness, Answer Relevance, Context Precision, Context Recall).

## Decision Trees
- If data is highly structured (Tables) -> Use Text-to-SQL or GraphRAG, not Vector RAG.
- If queries are keyword heavy (Acronyms) -> Use BM25/Lexical Search.
- If queries are conceptual -> Use Dense Vector Search.
- If context window is full -> Implement a Cross-Encoder Reranker.
- If query is ambiguous -> Implement Query Rewrite/Expansion step.

## Anti-patterns
````text
[Anti-Pattern] Blind Vector Search
- Consequence: Retrieving irrelevant chunks just because they are semantically close in latent space.
- Solution: Hybrid Search + Reranking.

[Anti-Pattern] Over-Chunking
- Consequence: Loss of surrounding context, leading to inaccurate answers.
- Solution: Semantic chunking with overlap; Parent Document Retrieval.

[Anti-Pattern] Lost in the Middle
- Consequence: LLM ignores context placed in the middle of a large prompt.
- Solution: Rerank and place the most relevant chunks at the very beginning and end of the prompt.
````

## Reusable Patterns
````text
[Pattern] HybridSearchRetriever
Implementation combining BM25 and Vector search with RRF weighting.

[Pattern] ParentDocumentRetriever
Embeds small chunks but retrieves the larger parent document for context.

[Pattern] QueryRewriter
LLM prompt to expand a user query before sending to the vector database.
````

## References
- Source playbook references stored in .

## References
- Source playbook references stored in lineage.jsonl.
