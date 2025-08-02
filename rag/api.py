import collections
from collections.abc import MutableMapping
collections.MutableMapping = MutableMapping  # Patch for deprecated MutableMapping

import os
import shutil
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA

import config  # Ensure config.py has GROQ_API_KEY

# Set environment variable for Groq API key
os.environ["GROQ_API_KEY"] = config.GROQ_API_KEY

# Setup logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Global variables for RAG components
rag_chain = None
retriever = None
session_states: Dict[str, str] = {}  # Store last_disease per session_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_chain, retriever
    persist_directory = "./chroma_crop_rag"

    # Clear existing ChromaDB collection
    if os.path.exists(persist_directory):
        try:
            shutil.rmtree(persist_directory)
            logger.debug("Cleared existing ChromaDB directory: %s", persist_directory)
        except Exception as e:
            logger.error("Error clearing ChromaDB directory: %s", str(e))
            raise

    # Load JSON QA Knowledge Base
    try:
        with open("crop_disease_qa.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.debug("JSON loaded, length: %d", len(data))
    except Exception as e:
        logger.error("Error loading JSON: %s", str(e))
        raise

    # Convert to Documents
    documents = [
        Document(page_content=item["answer"], metadata={"question": item["question"]})
        for item in data
    ]
    logger.debug("Documents created: %d", len(documents))

    # Chunk Documents
    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=100)
    docs = splitter.split_documents(documents)
    logger.debug("Documents after splitting: %d", len(docs))

    # Embedding + Vectorstore
    try:
        embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
        logger.debug("Embedding model initialized")
        db = Chroma.from_documents(docs, embedding_model, persist_directory=persist_directory)
        retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 6})
        logger.debug("ChromaDB initialized")
    except Exception as e:
        logger.error("ChromaDB/Embedding error: %s", str(e))
        raise

    # Groq LLM
    try:
        llm = init_chat_model(
            "llama3-8b-8192",
            model_provider="groq",
            temperature=0.5
        )
        logger.debug("Groq LLM initialized")
    except Exception as e:
        logger.error("Groq LLM initialization error: %s", str(e))
        raise

    # Prompt Template
    prompt_template = PromptTemplate(
        input_variables=["context", "question"],
        template="""
        You're a friendly agricultural expert helping farmers with crop health.
        Answer in a warm, conversational tone, like you're chatting with a neighbor.
        Keep it clear, engaging, and avoid overly technical terms.
        Use the provided context from the knowledge base to ensure accuracy.
        If the question is a follow-up (e.g., 'how to treat them?', 'how to fix it?', 'what medicines should I use?'),
        assume it refers to the previously discussed disease or crop (e.g., Early blight in Potato) unless specified otherwise.
        If the context doesn't cover the question, provide a practical, general response with actionable tips.
        make sure the aize of the answer is not more than 100 words.
        Context: {context}

        Question: {question}

        Answer:
        """
    )

    # RAG Chain
    try:
        rag_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": prompt_template}
        )
        logger.debug("RAG chain initialized")
    except Exception as e:
        logger.error("RAG chain initialization error: %s", str(e))
        raise

    yield  # FastAPI is now running


# Initialize FastAPI with lifespan
app = FastAPI(title="Crop Health Assistant API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Pydantic request model
class QueryRequest(BaseModel):
    query: str
    session_id: str = "default"


# Query endpoint
@app.post("/query")
async def query_crop_health(request: QueryRequest):
    global session_states
    query = request.query
    session_id = request.session_id

    if query.lower() == "exit":
        session_states.pop(session_id, None)
        return JSONResponse(content={"message": "Session ended"})

    # Handle follow-up queries
    modified_query = query
    last_disease = session_states.get(session_id)
    if last_disease and query.lower() in [
        "how to treat them?", "how to fix it?",
        "how to manage it?", "what medicines should i use?"
    ]:
        modified_query = f"What medicines or treatments for {last_disease}?"

    try:
        response = rag_chain.invoke({"query": modified_query})["result"]
        # Simple heuristic to update last disease
        if "blight" in query.lower() or "potato" in query.lower():
            session_states[session_id] = "Early blight in Potato"

        return JSONResponse(content={"question": query, "answer": response})
    except Exception as e:
        logger.error("RAG chain execution error for query '%s': %s", query, str(e))
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


# Session reset endpoint
@app.delete("/reset-session/{session_id}")
async def reset_session(session_id: str):
    global session_states
    session_states.pop(session_id, None)
    return JSONResponse(content={"message": f"Session {session_id} reset"})


# Run FastAPI with Uvicorn
if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=5002)
