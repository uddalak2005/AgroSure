
# Crop Health Assistant API

A FastAPI-based application designed to assist farmers with crop health queries using a Retrieval-Augmented Generation (RAG) pipeline powered by LangChain, HuggingFace embeddings, Chroma vector store, and Google's Gemini LLM.

## Prerequisites

* Python 3.8+
* Required packages: `fastapi`, `pydantic`, `langchain`, `langchain-huggingface`, `langchain-community`, `langchain-google-genai`, `sentence-transformers`, `chromadb`
* A `config.py` file with `GEMINI_API_KEY` set to a valid Google API key
* A `crop_disease_qa.json` file containing the knowledge base in JSON format with `question` and `answer` fields

## Setup

1. Install dependencies:
   ```bash
   pip install fastapi pydantic langchain langchain-huggingface langchain-community langchain-google-genai sentence-transformers chromadb
   ```
2. Ensure `config.py` contains your `GEMINI_API_KEY`.
3. Place the `crop_disease_qa.json` file in the project root.
4. Run the API:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### 1. Query Crop Health

* **Endpoint** : `POST /query`
* **Description** : Accepts a crop health query and returns a conversational response based on the RAG pipeline. Supports follow-up questions by maintaining session state (e.g., references to the last discussed disease).
* **Request Body** :

```json
  {
    "query": "string",
    "session_id": "string" // Optional, defaults to "default"
  }
```

* `query`: The user's question about crop health (e.g., "What is Early blight in Potato?" or "How to treat them?").
* `session_id`: A unique identifier for the session to track context for follow-up questions.
* **Example Request** :

```bash
  curl -X POST "http://localhost:8000/query" -H "Content-Type: application/json" -d '{"query": "What is Early blight in Potato?", "session_id": "user123"}'
```

* **Example Response** :

```json
  {
    "question": "What is Early blight in Potato?",
    "answer": "Early blight is a common fungal disease affecting potatoes, caused by Alternaria solani. It shows up as dark brown or black spots with concentric rings on leaves, often starting on older, lower leaves. ..."
  }
```

* **Special Cases** :
* If `query` is `"exit"`, the session is terminated, and the response is:
  ```json
  {"message": "Session ended"}
  ```
* Follow-up queries like "how to treat them?" or "what medicines should I use?" reference the last disease discussed in the session (e.g., "Early blight in Potato").

### 2. Reset Session

* **Endpoint** : `DELETE /reset-session/{session_id}`
* **Description** : Clears the session state for the specified `session_id`, removing any stored context (e.g., last discussed disease).
* **Path Parameter** :
* `session_id`: The session identifier to reset.
* **Example Request** :

```bash
  curl -X DELETE "http://localhost:8000/reset-session/user123"
```

* **Example Response** :

```json
  {"message": "Session user123 reset"}
```

## Notes

* The API initializes a RAG pipeline on startup, loading the knowledge base from `crop_disease_qa.json`, splitting documents, creating embeddings with `sentence-transformers/all-mpnet-base-v2`, and storing them in a Chroma vector store.
* The Chroma database is persisted in `./chroma_crop_rag` and cleared on startup to ensure fresh data.
* Follow-up questions are handled by maintaining a `session_states` dictionary, which stores the last discussed disease for each `session_id`.
* Logs are generated at the DEBUG level for troubleshooting, including initialization and query processing steps.
* The API uses a conversational prompt template to ensure friendly, farmer-focused responses.
