import os
import logging
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import T5Tokenizer, AutoModelForSeq2SeqLM
from datasets import load_dataset

# === Setup ===
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/query": {"origins": "*"}})

# === Load documents ===
def load_documents_from_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            docs = [line.strip() for line in f if line.strip()]
        logger.info(f"Loaded {len(docs)} documents from {filepath}")
        return docs
    return None

documents = load_documents_from_file("output.txt")

if documents is None:
    try:
        ds = load_dataset("KisanVaani/agriculture-qa-english-only")
        documents = [item['answers'] for item in ds['train'] if isinstance(item.get('answers'), str)]
        if not documents:
            raise ValueError("No valid 'answers' found in dataset.")
        logger.info(f"Loaded {len(documents)} documents from dataset.")
    except Exception as e:
        logger.error(f"Dataset loading failed: {e}")
        documents = [
            "Crop rotation improves soil health by alternating crops each season, reducing pest buildup and nutrient depletion.",
            "Drip irrigation saves water by delivering it directly to plant roots. Ideal for dry regions.",
            "Common pests like aphids can be controlled with neem oil. Apply early morning for best results.",
            "Compost enriches soil with organic matter. Mix kitchen scraps and crop residue.",
            "Cover crops like clover prevent soil erosion and add nitrogen to the soil."
        ]
        logger.info("Using hardcoded fallback documents.")

# === Load sentence-transformer for document retrieval ===
try:
    retriever_model = SentenceTransformer('all-MiniLM-L6-v2')
    document_embeddings = retriever_model.encode(documents, show_progress_bar=True)
except Exception as e:
    logger.error(f"Embedding model load failed: {e}")
    raise

# === Load tokenizer and model using spiece.model ===
try:
    tokenizer = T5Tokenizer(vocab_file="spiece.model", tokenizer_file="spiece.model")
    model = AutoModelForSeq2SeqLM.from_pretrained("mrSoul7766/AgriQBot")
    logger.info("Loaded model and tokenizer from spiece.model and mrSoul7766/AgriQBot")
except Exception as e:
    logger.error(f"Custom tokenizer load failed: {e}")
    tokenizer = T5Tokenizer.from_pretrained("t5-small")
    model = AutoModelForSeq2SeqLM.from_pretrained("t5-small")
    logger.info("Falling back to t5-small")

# === Helper Functions ===
def retrieve_relevant_documents(query, top_k=2):
    try:
        query_embedding = retriever_model.encode([query])[0]
        similarities = cosine_similarity([query_embedding], document_embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [documents[i] for i in top_indices], similarities[top_indices]
    except Exception as e:
        logger.error(f"Document retrieval error: {e}")
        return [], []

def generate_response(query, retrieved_docs):
    try:
        context = "\n".join(retrieved_docs)
        prompt = f"""
        You are AgriQBot, an assistant helping farmers. Use the information below to answer clearly and practically.
        Query: {query}
        Relevant Info: {context}
        Answer:
        """
        input_ids = tokenizer.encode(prompt, return_tensors="pt")
        output_ids = model.generate(input_ids, max_length=256, num_beams=5, no_repeat_ngram_size=2)
        response = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return response
    except Exception as e:
        logger.error(f"Response generation error: {e}")
        return "Sorry, I couldn’t generate a response."

def rag_system(query):
    try:
        docs, _ = retrieve_relevant_documents(query)
        return generate_response(query, docs)
    except Exception as e:
        logger.error(f"RAG system error: {e}")
        return "Something went wrong while processing your query."

# === API Route ===
@app.route('/query', methods=['POST', 'GET'])
def handle_query():
    try:
        if request.method == 'POST':
            data = request.get_json()
            query = data.get('query')
        else:
            query = request.args.get('query')

        if not query:
            return jsonify({'error': 'Missing query'}), 400

        logger.info(f"Received query: {query}")
        answer = rag_system(query)
        return jsonify({'query': query, 'answer': answer}), 200
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

# === Run Server ===
if __name__ == "__main__":
    logger.info("Starting AgriQBot API on port 6000...")
    app.run(host='0.0.0.0', port=6000, debug=False)
