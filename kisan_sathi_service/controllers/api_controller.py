from flask import Blueprint, request, jsonify
from models.rag_model import rag_system

def create_api_blueprint(retriever_model, document_embeddings, documents, tokenizer, model, logger):
    api = Blueprint('api', __name__)

    @api.route('/', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok'}), 200

    @api.route('/query', methods=['POST', 'GET'])
    def handle_query():
        try:
            query = request.get_json().get('query') if request.method == 'POST' else request.args.get('query')
            if not query:
                return jsonify({'error': 'Missing query'}), 400

            logger.info(f"Received query: {query}")
            answer = rag_system(query, retriever_model, document_embeddings, documents, tokenizer, model)
            return jsonify({'query': query, 'answer': answer}), 200
        except Exception as e:
            logger.exception("API error")
            return jsonify({'error': str(e)}), 500

    return api 