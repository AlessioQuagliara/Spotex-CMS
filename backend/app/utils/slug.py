import re
import unicodedata

def create_slug(text: str) -> str:
    """
    Crea uno slug da un testo.
    """
    # Normalizza il testo (rimuove accenti)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Converti in minuscolo
    text = text.lower()
    
    # Sostituisci spazi e caratteri speciali con trattini
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    
    # Rimuovi trattini all'inizio e alla fine
    text = text.strip('-')
    
    return text