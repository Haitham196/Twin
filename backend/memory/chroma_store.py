import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path


class ChromaStore:
    def __init__(self, chroma_path: str):
        Path(chroma_path).mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.ef = embedding_functions.DefaultEmbeddingFunction()

        self.china_col = self.client.get_or_create_collection(
            "china_knowledge", embedding_function=self.ef
        )
        self.healthcare_col = self.client.get_or_create_collection(
            "healthcare_knowledge", embedding_function=self.ef
        )
        self.memory_col = self.client.get_or_create_collection(
            "conversation_memory", embedding_function=self.ef
        )

    def add_document(self, collection: str, doc_id: str, text: str, metadata: dict = None):
        col = self._get_col(collection)
        col.upsert(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata or {}],
        )

    def query(self, collection: str, query_text: str, n_results: int = 3) -> list[str]:
        col = self._get_col(collection)
        count = col.count()
        if count == 0:
            return []
        results = col.query(
            query_texts=[query_text],
            n_results=min(n_results, count),
        )
        return results["documents"][0] if results["documents"] else []

    def add_session_memory(self, session_id: str, summary: str):
        self.memory_col.upsert(
            ids=[f"session_{session_id}"],
            documents=[summary],
            metadatas=[{"session_id": session_id}],
        )

    def _get_col(self, name: str):
        mapping = {
            "china_knowledge": self.china_col,
            "healthcare_knowledge": self.healthcare_col,
            "conversation_memory": self.memory_col,
        }
        if name not in mapping:
            raise ValueError(f"Unknown collection: {name}")
        return mapping[name]
