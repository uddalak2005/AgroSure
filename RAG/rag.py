import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from flask import Flask, request, jsonify
from flask_cors import CORS
from datasets import load_dataset
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes and origins

def load_documents_from_file(filepath):
    """Load documents from a text file, one per line, trimmed."""
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            docs = [line.strip() for line in f if line.strip()]
        if docs:
            logger.info(f"Loaded {len(docs)} documents from {filepath}")
            return docs
    return None

# Load the agricultural dataset or documents from output.txt
documents = load_documents_from_file("output.txt")
if documents is None:
    try:
        ds = load_dataset("KisanVaani/agriculture-qa-english-only")
        logger.info(f"Dataset splits: {list(ds.keys())}")
        logger.info(f"Train columns: {ds['train'].column_names}")
        logger.info(f"First example: {ds['train'][0]}")
        
        documents = [item['answers'] for item in ds['train'] if 'answers' in item and item['answers'] and isinstance(item['answers'], str)]
        print('documents: ', documents)
        if not documents:
            raise ValueError("No valid non-empty answers found in dataset")
        
        logger.info(f"Loaded {len(documents)} documents from 'answers' column in 'train' split")
    except Exception as e:
        logger.error(f"Failed to load dataset: {str(e)}")
        documents = [
            "Crop rotation improves soil health by alternating crops each season, reducing pest buildup and nutrient depletion. For example, rotate legumes with cereals.",
            "Drip irrigation saves water by delivering it directly to plant roots. Ideal for dry regions, it reduces evaporation and runoff.",
            "Common pests like aphids can be controlled with neem oil, a natural pesticide. Apply early morning for best results.",
            "Compost enriches soil with organic matter. Mix kitchen scraps and crop residue, turning the pile every few weeks.",
            "Planting cover crops like clover prevents soil erosion and adds nitrogen to the soil, benefiting subsequent crops."
        ]
        logger.info(f"Using fallback hardcoded documents (count: {len(documents)})")

# Initialize the sentence transformer model for embeddings
try:
    retriever_model = SentenceTransformer('all-MiniLM-L6-v2')
    document_embeddings = retriever_model.encode(documents, show_progress_bar=True)
except Exception as e:
    logger.error(f"Error encoding documents: {str(e)}")
    raise

# Load AgriQBot model and tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained("mrSoul7766/AgriQBot")
    model = AutoModelForSeq2SeqLM.from_pretrained("mrSoul7766/AgriQBot")
except Exception as e:
    logger.error(f"Failed to load AgriQBot: {str(e)}")
    tokenizer = AutoTokenizer.from_pretrained("t5-small")
    model = AutoModelForSeq2SeqLM.from_pretrained("t5-small")
    logger.info("Using fallback model t5-small")

def retrieve_relevant_documents(query, top_k=2):
    """Retrieve top_k most relevant documents for the query."""
    try:
        query_embedding = retriever_model.encode([query])[0]
        similarities = cosine_similarity([query_embedding], document_embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [documents[i] for i in top_indices], similarities[top_indices]
    except Exception as e:
        logger.error(f"Error in document retrieval: {str(e)}")
        raise

def generate_response(query, retrieved_docs):
    """Generate a response using retrieved documents and AgriQBot."""
    try:
        context = "\n".join(retrieved_docs)
        prompt = f"""
        You are AgriQBot, an agricultural assistant helping farmers. Using the following information, provide a clear, practical, and concise answer to the query. Avoid technical jargon and focus on actionable advice.
        Query: {query}
        Relevant Information: {context}
        Answer:
        """
        input_ids = tokenizer.encode(f"Q: {prompt}", return_tensors="pt")
        output_ids = model.generate(input_ids, max_length=256, num_beams=5, no_repeat_ngram_size=2)
        response = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return response
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return f"Error generating response: {str(e)}"

def rag_system(query):
    """Main RAG function to process farmer queries."""
    try:
        retrieved_docs, scores = retrieve_relevant_documents(query)
        response = generate_response(query, retrieved_docs)
        return response
    except Exception as e:
        logger.error(f"Error in RAG system: {str(e)}")
        return f"Error in RAG system: {str(e)}"

@app.route('/', methods=['GET'])
def health_check():
    """Default route to check if the Flask backend is running."""
    return jsonify({
        'status': 'success',
        'message': 'AgriQBot API is running successfully!',
        'version': '1.0.0',
        'endpoints': {
            'query': '/query (GET/POST)',
            'health': '/ (GET)'
        }
    }), 200

@app.route('/query', methods=['POST', 'GET'])
def handle_query():
    """API endpoint to handle farmer queries via POST (JSON) or GET (query param)."""
    try:
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'query' not in data:
                return jsonify({'error': 'Missing query in request body'}), 400
            query = data['query']
        else:  # GET
            query = request.args.get('query')
            if not query:
                return jsonify({'error': 'Missing query parameter'}), 400

        logger.info(f"Received query: {query}")
        print('Loaded documents:', documents)  # Print loaded documents on each HTTP request
        response = rag_system(query)
        return jsonify({
            'query': query,
            'answer': response
        }), 200
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    logger.info("Starting AgriQBot API on port 8000...")
    app.run(host="0.0.0.0", port=8000, debug=False)