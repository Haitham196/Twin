from openai import AsyncOpenAI
from backend.config import settings
from backend.conversation.context_builder import ContextBuilder
from backend.memory.sqlite_store import SQLiteStore


class ConversationEngine:
    def __init__(self, context_builder: ContextBuilder, sqlite_store: SQLiteStore):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.ctx = context_builder
        self.sqlite = sqlite_store

    async def respond(
        self,
        user_message: str,
        session_id: int,
        user_name: str = "Unknown",
    ) -> str:
        system_prompt = self.ctx.build(user_message, session_id, user_name)

        # Save user message
        self.sqlite.add_message(session_id, "user", user_message)

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=512,
        )

        answer = response.choices[0].message.content.strip()
        self.sqlite.add_message(session_id, "assistant", answer)
        return answer

    async def respond_stream(
        self,
        user_message: str,
        session_id: int,
        user_name: str = "Unknown",
    ):
        """Async generator that yields text chunks as they stream from GPT-4o."""
        system_prompt = self.ctx.build(user_message, session_id, user_name)
        self.sqlite.add_message(session_id, "user", user_message)

        full_response = []
        async with await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=512,
            stream=True,
        ) as stream:
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response.append(delta)
                    yield delta

        self.sqlite.add_message(session_id, "assistant", "".join(full_response))
