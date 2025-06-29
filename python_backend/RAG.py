# ```python
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Simulated document store (replace with real agricultural texts or database)
documents = [
    "Crop rotation improves soil health by alternating crops each season, reducing pest buildup and nutrient depletion. For example, rotate legumes with cereals.",
    "Drip irrigation saves water by delivering it directly to plant roots. Ideal for dry regions, it reduces evaporation and runoff.",
    "Common pests like aphids can be controlled with neem oil, a natural pesticide. Apply early morning for best results.",
    "Compost enriches soil with organic matter. Mix kitchen scraps and crop residue, turning the pile every few weeks.",
    "Planting cover crops like clover prevents soil erosion and adds nitrogen to the soil, benefiting subsequent crops."
]

# Initialize the sentence transformer model for embeddings
retriever_model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings for the document store
document_embeddings = retriever_model.encode(documents)

# Load AgriQBot model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("mrSoul7766/AgriQBot")
model = AutoModelForSeq2SeqLM.from_pretrained("mrSoul7766/AgriQBot")

def retrieve_relevant_documents(query, top_k=2):
    """Retrieve top_k most relevant documents for the query."""
    query_embedding = retriever_model.encode([query])[0]
    similarities = cosine_similarity([query_embedding], document_embeddings)[0]
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    return [documents[i] for i in top_indices], similarities[top_indices]

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
        # Encode input and generate response
        input_ids = tokenizer.encode(f"Q: {prompt}", return_tensors="pt")
        output_ids = model.generate(input_ids, max_length=256, num_beams=5, no_repeat_ngram_size=2)
        response = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return response
    except Exception as e:
        return f"Error generating response: {str(e)}"

def rag_system(query):
    """Main RAG function to process farmer queries."""
    retrieved_docs, scores = retrieve_relevant_documents(query)
    response = generate_response(query, retrieved_docs)
    return response

# Example usage
if __name__ == "__main__":
    farmer_query = "How can I improve my soil health?"
    answer = rag_system(farmer_query)
    print(f"Query: {farmer_query}")
    print(f"Answer: {answer}")
# ```