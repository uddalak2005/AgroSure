# RAG for Crop Health Detection using LangChain + ChromaDB + JSON KB

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain.chains import RetrievalQA
import config

from langchain_google_genai import ChatGoogleGenerativeAI
import json
import os

# ---- Step 1: Load JSON QA Knowledge Base ----
with open("./crop_disease_qa.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Convert each item to a LangChain Document
documents = [
    Document(page_content=item["answer"], metadata={"question": item["question"]})
    for item in data
]

# ---- Step 2: Chunk Documents ----
splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
docs = splitter.split_documents(documents)

# ---- Step 3: Embedding + Vectorstore ----
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = Chroma.from_documents(docs, embedding_model, persist_directory="./chroma_crop_rag")
retriever = db.as_retriever()

# ---- Step 4: Gemini LLM (ChatGoogleGenerativeAI) ----
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=config.GEMINI_API_KEY,
    temperature=0.3
)

# ---- Step 5: Setup RAG Chain ----
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff"
)

# ---- Step 6: Ask Question ----
query = "What is Early blight in Potato?"
response = rag_chain.run(query)

print("\nQUESTION:", query)
print("\nANSWER:", response)
