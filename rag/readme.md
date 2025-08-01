A FastAPI-based Retrieval-Augmented Generation (RAG) application to answer crop health queries (e.g., diseases, treatments) using ChromaDB for vector storage and Google's Gemini LLM for natural language responses. The API provides human-like, conversational answers for farmers, maintaining context for follow-up questions (e.g., "how to fix it?" after asking about Early blight in Potato).

## Features

* **RESTful API** : Query via POST **/query** with a JSON payload containing the question and session ID.
* **Session Management** : Tracks context (e.g., last discussed disease) per session for follow-up queries.
* **Robust Retrieval** : Uses **sentence-transformers/all-mpnet-base-v2** for embeddings and ChromaDB for accurate document retrieval.
* **Error Handling** : Logs errors and clears ChromaDB to prevent issues like embedding dimension mismatches.
* **Conversational Responses** : Answers in a friendly, farmer-focused tone, avoiding technical jargon.
