import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "research_paper_chunks"


class ChromaVectorStore:
    """Manages persistent vector indexing and semantic retrieval using ChromaDB."""

    def __init__(self, persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIRECTORY
        os.makedirs(self.persist_dir, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "AI Research Paper Assistant chunk embeddings", "hnsw:space": "cosine"}
        )
        logger.info("ChromaDB initialized. Existing chunks in collection: %d", self.collection.count())

    def add_chunks(
        self,
        paper_id: int,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> int:
        """
        Stores chunks and their corresponding embeddings in ChromaDB.
        """
        if not chunks or not embeddings:
            return 0

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for idx, chunk in enumerate(chunks):
            chunk_id = f"paper_{paper_id}_chunk_{chunk['chunk_index']}"
            ids.append(chunk_id)
            documents.append(chunk["text"])

            meta = {
                "paper_id": int(paper_id),
                "page_number": int(chunk.get("page_number", 1)),
                "section": str(chunk.get("section", "Main Text")),
                "chunk_index": int(chunk.get("chunk_index", idx)),
                "source_filename": str(chunk.get("metadata", {}).get("source_filename", "")),
                "paper_title": str(chunk.get("metadata", {}).get("paper_title", "")),
            }
            metadatas.append(meta)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        logger.info("Indexed %d chunks for paper %d in ChromaDB.", len(ids), paper_id)
        return len(ids)

    def search(
        self,
        query_embedding: List[float],
        paper_ids: Optional[List[int]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic vector search.
        Can optionally filter by specific paper IDs.
        """
        if self.collection.count() == 0:
            return []

        where_filter = None
        if paper_ids:
            if len(paper_ids) == 1:
                where_filter = {"paper_id": int(paper_ids[0])}
            else:
                where_filter = {"paper_id": {"$in": [int(pid) for pid in paper_ids]}}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, self.collection.count())),
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        formatted_results: List[Dict[str, Any]] = []

        if results and results.get("ids") and len(results["ids"]) > 0:
            ids = results["ids"][0]
            docs = results["documents"][0] if results.get("documents") else []
            metas = results["metadatas"][0] if results.get("metadatas") else []
            dists = results["distances"][0] if results.get("distances") else []

            for i in range(len(ids)):
                # Convert cosine distance to similarity score
                dist = dists[i] if i < len(dists) else 1.0
                similarity = max(0.0, 1.0 - (dist / 2.0))

                meta = metas[i] if i < len(metas) else {}
                formatted_results.append({
                    "chunk_id": ids[i],
                    "text": docs[i] if i < len(docs) else "",
                    "paper_id": meta.get("paper_id"),
                    "page_number": meta.get("page_number", 1),
                    "section": meta.get("section", "Main Text"),
                    "chunk_index": meta.get("chunk_index", 0),
                    "paper_title": meta.get("paper_title", ""),
                    "source_filename": meta.get("source_filename", ""),
                    "similarity_score": round(similarity, 4),
                    "distance": round(dist, 4),
                })

        return formatted_results

    def delete_paper(self, paper_id: int) -> int:
        """Deletes all chunks associated with a specific paper from ChromaDB."""
        try:
            self.collection.delete(where={"paper_id": int(paper_id)})
            logger.info("Deleted chunks for paper %d from ChromaDB.", paper_id)
            return 1
        except Exception as e:
            logger.warning("Error deleting chunks for paper %d: %s", paper_id, str(e))
            return 0

    def delete_all_paper_chunks(self, paper_id: int) -> int:
        """Alias for delete_paper."""
        return self.delete_paper(paper_id)

    def get_collection_stats(self) -> Dict[str, Any]:
        """Returns statistics about the ChromaDB collection."""
        count = self.collection.count()
        return {
            "collection_name": COLLECTION_NAME,
            "total_chunks": count,
            "persist_directory": self.persist_dir,
            "status": "healthy"
        }


vector_store = ChromaVectorStore()
