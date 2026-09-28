import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
    CitationItem,
)
from app.services.rag.pipeline import rag_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Research Chat"])


@router.post("/chat", response_model=ChatResponse)
def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Asks a question grounded in the selected papers using the RAG pipeline.
    Preserves multi-turn conversation history and generates verifiable citations.
    """
    conversation = None
    if payload.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found.")

    if not conversation:
        # Create a new conversation
        short_title = payload.question[:45] + ("..." if len(payload.question) > 45 else "")
        conversation = Conversation(
            title=short_title,
            selected_paper_ids=payload.paper_ids
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 1. Record User Message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=payload.question
    )
    db.add(user_msg)
    db.commit()

    # 2. Execute RAG Pipeline
    target_papers = payload.paper_ids or conversation.selected_paper_ids
    rag_result = rag_pipeline.answer_question(
        question=payload.question,
        paper_ids=target_papers,
        top_k=payload.top_k
    )

    # 3. Record Assistant Message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=rag_result["answer"],
        citations=rag_result["citations"]
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        question=payload.question,
        answer=rag_result["answer"],
        citations=[CitationItem(**c) for c in rag_result["citations"]]
    )


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(db: Session = Depends(get_db)):
    """Lists all active research chat conversations."""
    convs = db.query(Conversation).order_by(desc(Conversation.updated_at)).all()
    return convs


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Retrieves conversation details and full message history."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Deletes a conversation and its messages."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    db.delete(conv)
    db.commit()
    return {"status": "success", "message": f"Conversation #{conversation_id} deleted."}
