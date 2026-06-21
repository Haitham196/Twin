from backend.memory.chroma_store import ChromaStore
from backend.memory.sqlite_store import SQLiteStore
from backend.agent.system_prompt import build_prompt


class ContextBuilder:
    def __init__(self, chroma_store: ChromaStore, sqlite_store: SQLiteStore):
        self.chroma = chroma_store
        self.sqlite = sqlite_store

    def build(self, user_message: str, session_id: int, user_name: str = "Unknown") -> str:
        # Retrieve relevant knowledge chunks
        china_chunks = self.chroma.query("china_knowledge", user_message, n_results=3)
        memory_chunks = self.chroma.query("conversation_memory", user_message, n_results=2)
        knowledge_context = "\n\n---\n\n".join(china_chunks + memory_chunks)

        # Retrieve recent messages from this session
        messages = self.sqlite.get_session_messages(session_id, limit=8)
        history_lines = []
        for m in messages:
            role_label = "You" if m["role"] == "user" else "Haitham AI"
            history_lines.append(f"{role_label}: {m['content']}")
        conversation_history = "\n".join(history_lines)

        return build_prompt(
            knowledge_context=knowledge_context,
            conversation_history=conversation_history,
            user_name=user_name,
        )
