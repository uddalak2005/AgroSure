from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import T5Tokenizer, AutoModelForSeq2SeqLM
from datasets import load_dataset
import numpy as np
import os
from utils.logger import get_logger
from config import MODEL_NAME, GEN_MODEL_NAME, FALLBACK_MODEL

logger = get_logger()

EMBEDDINGS_PATH = "embeddings.npy"
DOC_COUNT_PATH = "embeddings_doc_count.txt"

def load_documents():
    try:
        ds = load_dataset("KisanVaani/agriculture-qa-english-only")
        docs = [item['answers'] for item in ds['train'] if isinstance(item.get('answers'), str)]
        if not docs:
            raise ValueError("No valid 'answers' found in dataset.")
        logger.info(f"Loaded {len(docs)} documents from Hugging Face dataset.")
        return docs
    except Exception as e:
        logger.error(f"Dataset loading failed: {e}")
        return [
            "Crop rotation improves soil health by alternating crops each season, reducing pest buildup and nutrient depletion.",
            "Drip irrigation saves water by delivering it directly to plant roots. Ideal for dry regions.",
            "Common pests like aphids can be controlled with neem oil. Apply early morning for best results.",
            "Compost enriches soil with organic matter. Mix kitchen scraps and crop residue.",
            "Cover crops like clover prevent soil erosion and add nitrogen to the soil."
        ]

def load_retriever_model(documents):
    doc_count = len(documents)
    embeddings = None
    # Check for cached embeddings and doc count
    if os.path.exists(EMBEDDINGS_PATH) and os.path.exists(DOC_COUNT_PATH):
        with open(DOC_COUNT_PATH, 'r') as f:
            cached_count = int(f.read().strip())
        if cached_count == doc_count:
            try:
                embeddings = np.load(EMBEDDINGS_PATH)
                logger.info(f"Loaded cached embeddings from {EMBEDDINGS_PATH}.")
            except Exception as e:
                logger.warning(f"Failed to load cached embeddings: {e}. Will re-encode.")
    if embeddings is None:
        model = SentenceTransformer(MODEL_NAME)
        embeddings = model.encode(documents, show_progress_bar=True)
        np.save(EMBEDDINGS_PATH, embeddings)
        with open(DOC_COUNT_PATH, 'w') as f:
            f.write(str(doc_count))
        logger.info(f"Encoded and cached embeddings to {EMBEDDINGS_PATH}.")
    else:
        model = SentenceTransformer(MODEL_NAME)
    return model, embeddings

def load_generation_model():
    try:
        tokenizer = T5Tokenizer(vocab_file="spiece.model", tokenizer_file="spiece.model")
        model = AutoModelForSeq2SeqLM.from_pretrained(GEN_MODEL_NAME)
        logger.info("Loaded custom model and tokenizer.")
    except Exception as e:
        logger.error(f"Custom tokenizer load failed: {e}")
        tokenizer = T5Tokenizer.from_pretrained(FALLBACK_MODEL)
        model = AutoModelForSeq2SeqLM.from_pretrained(FALLBACK_MODEL)
        logger.info("Falling back to t5-small.")
    return tokenizer, model

def retrieve_relevant_documents(query, retriever_model, document_embeddings, documents, top_k=2):
    try:
        query_embedding = retriever_model.encode([query])[0]
        similarities = cosine_similarity([query_embedding], document_embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [documents[i] for i in top_indices]
    except Exception as e:
        logger.error(f"Document retrieval error: {e}")
        return []

def generate_response(query, retrieved_docs, tokenizer, model):
    try:
        context = "\n".join(retrieved_docs)
        prompt = (
            f"You are AgriQBot, an assistant helping farmers. Use the information below to answer clearly and practically.\n"
            f"Query: {query}\nRelevant Info: {context}\nAnswer:"
        )
        input_ids = tokenizer.encode(prompt, return_tensors="pt")
        output_ids = model.generate(input_ids, max_length=256, num_beams=5, no_repeat_ngram_size=2)
        response = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return response
    except Exception as e:
        logger.error(f"Response generation error: {e}")
        return "Sorry, I couldn’t generate a response."

def rag_system(query, retriever_model, document_embeddings, documents, tokenizer, model):
    try:
        docs = retrieve_relevant_documents(query, retriever_model, document_embeddings, documents)
        return generate_response(query, docs, tokenizer, model)
    except Exception as e:
        logger.error(f"RAG system error: {e}")
        return "Something went wrong while processing your query." 