from flask import Flask
from flask_cors import CORS
from config import MODEL_NAME, GEN_MODEL_NAME, FALLBACK_MODEL, PORT
from models.rag_model import load_documents, load_retriever_model, load_generation_model
from controllers.api_controller import create_api_blueprint
from utils.logger import get_logger

logger = get_logger()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/query": {"origins": "*"}})

    documents = load_documents()
    retriever_model, document_embeddings = load_retriever_model(documents)
    tokenizer, model = load_generation_model()

    api = create_api_blueprint(retriever_model, document_embeddings, documents, tokenizer, model, logger)
    app.register_blueprint(api)

    return app

if __name__ == "__main__":
    app = create_app()
    logger.info(f"Starting AgriQBot API on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False) 