import json
import uuid
from collections.abc import Generator
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_workspace_or_404
from app.core.database import SessionLocal, get_db
from app.models.citation import Citation
from app.models.conversation import Conversation, Message
from app.models.document import Document
from app.schemas.chat import ChatRequest, CitationRead, ConversationRead, MessageRead
from app.workflows.router import rag_router
from app.workflows.state import RAGState

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(workspace_id: str, db: Session = Depends(get_db)):
    convos = (
        db.query(Conversation)
        .filter(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return convos

@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )
    return convo

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    db.delete(convo)
    db.commit()
    return None

@router.post("/stream")
def stream_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    get_workspace_or_404(workspace_id=payload.workspace_id, db=db)

    active_doc_ids = payload.document_ids
    if not active_doc_ids:
        docs = (
            db.query(Document)
            .filter(Document.workspace_id == payload.workspace_id, Document.status == "ready")
            .all()
        )
        active_doc_ids = [d.id for d in docs]

    convo_id = payload.conversation_id
    if convo_id:
        convo = db.query(Conversation).filter(Conversation.id == convo_id).first()
        if not convo:
            convo_id = None

    if not convo_id:
        convo_id = str(uuid.uuid4())
        short_title = payload.query[:45].strip()
        convo = Conversation(
            id=convo_id,
            workspace_id=payload.workspace_id,
            title=short_title or "Research Chat",
            rag_strategy=payload.rag_strategy,
            llm_model=payload.llm_model or "",
        )
        db.add(convo)
        db.commit()

    user_msg_id = str(uuid.uuid4())
    user_msg = Message(
        id=user_msg_id,
        conversation_id=convo_id,
        role="user",
        content=payload.query,
        rag_strategy=payload.rag_strategy,
        latency_ms=0.0,
    )
    db.add(user_msg)
    db.commit()

    def sse_event_stream() -> Generator[str, None, None]:
        try:
            state: RAGState = {
                "query": payload.query,
                "workspace_id": payload.workspace_id,
                "document_ids": active_doc_ids,
                "llm_model": payload.llm_model or "",
                "top_k": payload.top_k,
                "rrf_k": payload.rrf_k,
                "rag_strategy": payload.rag_strategy,
                "hypothetical_doc": "",
                "sub_queries": [],
                "retrieved_chunks": [],
                "final_answer": "",
                "citations": [],
                "latency_ms": 0.0,
            }

            full_text = ""
            final_citations: list[dict] = []
            latency = 0.0

            for event in rag_router.stream_strategy(state):
                ev_type = event.get("type")
                if ev_type == "token":
                    chunk_data = json.dumps({"event": "token", "content": event.get("content", "")})
                    yield f"data: {chunk_data}\n\n"
                elif ev_type == "done":
                    full_text = event.get("full_text", "")
                    final_citations = event.get("citations", [])
                    latency = event.get("latency_ms", 0.0)
                    done_payload = {
                        "event": "done",
                        "conversation_id": convo_id,
                        "full_text": full_text,
                        "citations": final_citations,
                        "latency_ms": latency,
                    }
                    yield f"data: {json.dumps(done_payload)}\n\n"

            asst_msg_id = str(uuid.uuid4())
            asst_msg = Message(
                id=asst_msg_id,
                conversation_id=convo_id,
                role="assistant",
                content=full_text,
                rag_strategy=payload.rag_strategy,
                latency_ms=latency,
            )
            db.add(asst_msg)

            for c in final_citations:
                cit_id = str(uuid.uuid4())
                cit = Citation(
                    id=cit_id,
                    message_id=asst_msg_id,
                    document_id=c.get("document_id", ""),
                    chunk_id=c.get("chunk_id", ""),
                    citation_index=c.get("citation_index", 1),
                    page_number=c.get("page_number", 1),
                    quoted_text=c.get("quoted_text", ""),
                    bounding_box=json.dumps(c.get("bounding_box", [0, 0, 0, 0])),
                )
                db.add(cit)

            db.commit()
        except Exception:
            db.rollback()
            raise

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
