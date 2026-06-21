"""
Ingest markdown documents into ChromaDB.

Usage:
    python backend/knowledge/ingest.py --dir knowledge_base/china_trip
    python backend/knowledge/ingest.py --dir knowledge_base/healthcare_it --collection healthcare_knowledge
"""

import argparse
import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import settings
from backend.memory.chroma_store import ChromaStore


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def ingest_directory(directory: str, collection: str = "china_knowledge"):
    store = ChromaStore(settings.chroma_path)
    path = Path(directory)
    files = list(path.glob("**/*.md")) + list(path.glob("**/*.txt"))

    if not files:
        print(f"No .md or .txt files found in {directory}")
        return

    total_chunks = 0
    for file in files:
        text = file.read_text(encoding="utf-8")
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            doc_id = hashlib.md5(f"{file.name}_{i}".encode()).hexdigest()
            store.add_document(
                collection=collection,
                doc_id=doc_id,
                text=chunk,
                metadata={"source": file.name, "chunk": i},
            )
        total_chunks += len(chunks)
        print(f"  ✓ {file.name} → {len(chunks)} chunks")

    print(f"\nIngested {len(files)} files → {total_chunks} total chunks into '{collection}'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", required=True, help="Directory containing documents")
    parser.add_argument(
        "--collection", default="china_knowledge", help="ChromaDB collection name"
    )
    args = parser.parse_args()
    ingest_directory(args.dir, args.collection)
