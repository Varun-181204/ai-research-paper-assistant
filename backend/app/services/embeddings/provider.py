import os
import math
import hashlib
import logging
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)


def generate_fallback_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Generates a deterministic normalized dense embedding vector using multi-hash n-grams.
    Ensures the vector database and RAG search work reliably even when offline or before
    a Gemini API key is configured.
    """
    vector = [0.0] * dim
    words = text.lower().split()
    if not words:
        return [0.0] * dim

    for i, word in enumerate(words):
        # Hash word tokens across dimensions
        h1 = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        h2 = int(hashlib.sha256((word + str(i % 5)).encode("utf-8")).hexdigest(), 16)

        idx1 = h1 % dim
        idx2 = h2 % dim

        vector[idx1] += 1.0
        vector[idx2] += 0.5

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [x / norm for x in vector]

    return vector


class EmbeddingService:
    """Handles text embedding generation with Google Gemini API & offline fallback."""

    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY or os.environ.get("GOOGLE_API_KEY", "")
        self.model_name = settings.GEMINI_EMBEDDING_MODEL
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("Could not initialize google.genai Client: %s", str(e))
        return self._client

    def embed_texts(self, texts: List[str], batch_size: int = 20) -> List[List[float]]:
        """Generates embeddings for a batch of strings."""
        if not texts:
            return []

        client = self._get_client()
        embeddings: List[List[float]] = []

        if client and self.api_key:
            try:
                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    # Call Google GenAI Embeddings
                    resp = client.models.embed_content(
                        model=self.model_name,
                        contents=batch
                    )
                    for emb in resp.embeddings:
                        embeddings.append(emb.values)
                return embeddings
            except Exception as exc:
                logger.warning("Gemini embedding API call failed: %s. Using local fallback vector.", str(exc))

        # Fallback to deterministic dense embeddings
        for text in texts:
            embeddings.append(generate_fallback_embedding(text))

        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embeds a single search query."""
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * 768


embedding_service = EmbeddingService()
