import logging

def get_logger(name="rag_api"):
    logging.basicConfig(level=logging.INFO)
    return logging.getLogger(name) 