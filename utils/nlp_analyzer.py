import os
import re
import nltk
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Secure download of required NLTK datasets
def download_nltk_resources():
    resources = {
        'tokenizers/punkt': 'punkt',
        'corpora/stopwords': 'stopwords',
        'sentiment/vader_lexicon': 'vader_lexicon'
    }
    for path, name in resources.items():
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(name, quiet=True)

# Run downloader on module import
download_nltk_resources()

from nltk.sentiment.vader import SentimentIntensityAnalyzer

def count_syllables(word):
    """
    Approximates the number of syllables in an English word.
    """
    word = word.lower().strip()
    if not word:
        return 0
    # Remove punctuation
    word = re.sub(r'[^\w]', '', word)
    vowels = "aeiouy"
    count = 0
    
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
            
    if word.endswith("e"):
        count -= 1
    # Adjust for common suffixes
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        count += 1
        
    if count <= 0:
        count = 1
    return count

def calculate_readability(text):
    """
    Computes standard readability stats:
    - Words count
    - Sentences count
    - Flesch Readability Ease (FRES) score
    - Readability grade category
    """
    sentences = sent_tokenize(text)
    words = [w for w in word_tokenize(text) if w.isalnum()]
    
    num_sentences = len(sentences)
    num_words = len(words)
    
    if num_words == 0 or num_sentences == 0:
        return {
            "word_count": 0,
            "sentence_count": 0,
            "flesch_score": 0.0,
            "readability_label": "N/A"
        }
        
    total_syllables = sum(count_syllables(w) for w in words)
    
    # Flesch Reading Ease Formula:
    # 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
    asl = num_words / num_sentences
    asw = total_syllables / num_words
    
    flesch_score = 206.835 - (1.015 * asl) - (84.6 * asw)
    flesch_score = max(0.0, min(100.0, flesch_score))
    
    # Label mapping
    if flesch_score >= 90:
        label = "Very Easy (5th Grade)"
    elif flesch_score >= 80:
        label = "Easy (6th Grade)"
    elif flesch_score >= 70:
        label = "Fairly Easy (7th Grade)"
    elif flesch_score >= 60:
        label = "Standard (8th-9th Grade)"
    elif flesch_score >= 50:
        label = "Fairly Difficult (High School)"
    elif flesch_score >= 30:
        label = "Difficult (College)"
    else:
        label = "Very Confusing (Graduate Level)"
        
    return {
        "word_count": num_words,
        "sentence_count": num_sentences,
        "flesch_score": round(flesch_score, 1),
        "readability_label": label,
        "avg_sentence_length": round(asl, 1)
    }

def analyze_nlp_text(transcript, target_keywords):
    """
    Runs text processing pipeline:
    - Sentiment analysis (positive, neutral, negative, composite)
    - Key terms / word frequencies (excluding stopwords)
    - Keyword coverage matching
    - Readability metrics
    """
    if not transcript.strip():
        return {
            "sentiment": "Neutral",
            "sentiment_details": {"pos": 0, "neu": 0, "neg": 0, "compound": 0},
            "word_frequencies": [],
            "keyword_matches": {},
            "keyword_score": 0.0,
            "readability": {
                "word_count": 0,
                "sentence_count": 0,
                "flesch_score": 0.0,
                "readability_label": "N/A"
            }
        }

    # 1. Sentiment analysis (VADER)
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = sia.polarity_scores(transcript)
    compound = sentiment_scores['compound']
    
    if compound >= 0.05:
        sentiment = "Positive"
    elif compound <= -0.05:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    # 2. Tokenize and filter stopwords
    stop_words = set(stopwords.words('english'))
    words = [w.lower() for w in word_tokenize(transcript) if w.isalnum()]
    filtered_words = [w for w in words if w not in stop_words and len(w) > 2]
    
    # Calculate word frequency counts
    word_counts = Counter(filtered_words)
    word_frequencies = [{"word": word, "count": count} for word, count in word_counts.most_common(12)]

    # 3. Keyword Coverage Calculation
    keyword_matches = {}
    matched_count = 0
    transcript_lower = transcript.lower()
    
    for kw in target_keywords:
        # Check if keyword matches (handle sub-phrases too)
        # Use word boundaries for exact match
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        match = re.search(pattern, transcript_lower) is not None
        keyword_matches[kw] = match
        if match:
            matched_count += 1
            
    keyword_score = (matched_count / len(target_keywords) * 100.0) if target_keywords else 0.0

    # 4. Readability stats
    readability = calculate_readability(transcript)

    return {
        "sentiment": sentiment,
        "sentiment_details": sentiment_scores,
        "word_frequencies": word_frequencies,
        "keyword_matches": keyword_matches,
        "keyword_score": float(keyword_score),
        "readability": readability
    }
