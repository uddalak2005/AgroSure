import os
from dotenv import load_dotenv
import torch

load_dotenv()

MODEL_NAME = os.getenv("RAG_MODEL_NAME", "all-MiniLM-L6-v2")
GEN_MODEL_NAME = os.getenv("GEN_MODEL_NAME", "mrSoul7766/AgriQBot")
FALLBACK_MODEL = "t5-small"
PORT = int(os.getenv("PORT", 5000))

print(torch.cuda.is_available())