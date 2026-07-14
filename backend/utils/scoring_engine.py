def calculate_sentiment_score(sentiment_details):
    """
    Translates VADER sentiment compound score into a 0-100 rating.
    A neutral/factual explanation (compound around 0) starts at 80/100.
    A positive presentation increases it up to 100, and negative drops it to 50.
    """
    compound = sentiment_details.get("compound", 0.0)
    # Map -1.0 to 1.0 -> 50.0 to 100.0
    score = 80.0 + (compound * 20.0)
    return max(0.0, min(100.0, score))

def determine_grade_and_label(score):
    """
    Maps a 0-100 score to a letter grade and formal proficiency label.
    """
    if score >= 95.0:
        return "A+", "Outstanding"
    elif score >= 90.0:
        return "A", "Outstanding"
    elif score >= 80.0:
        return "B", "Excellent"
    elif score >= 70.0:
        return "C", "Good"
    elif score >= 60.0:
        return "D", "Average"
    elif score >= 50.0:
        return "E", "Needs Improvement"
    else:
        return "F", "Poor"

def compile_scorecard(semantic_results, audio_results, nlp_results):
    """
    Compiles individual assessment scores into a weighted scorecard.
    Weights:
    - Semantic (40%)
    - Fluency (25%)
    - Keywords (15%)
    - Confidence (10%)
    - Sentiment (10%)
    """
    # 1. Individual metrics
    semantic_score = semantic_results.get("semantic_score", 0.0)
    fluency_score = audio_results.get("fluency_score", 0.0)
    keyword_score = nlp_results.get("keyword_score", 0.0)
    confidence_score = audio_results.get("confidence_score", 0.0)
    
    sentiment_details = nlp_results.get("sentiment_details", {})
    sentiment_score = calculate_sentiment_score(sentiment_details)

    # 2. Weighted Sum
    overall_score = (
        (semantic_score * 0.40) +
        (fluency_score * 0.25) +
        (keyword_score * 0.15) +
        (confidence_score * 0.10) +
        (sentiment_score * 0.10)
    )
    
    # Cap between 0 and 100
    overall_score = round(max(0.0, min(100.0, overall_score)), 1)
    
    letter_grade, proficiency_label = determine_grade_and_label(overall_score)
    
    # Build scorecard structure
    scorecard = {
        "overall_score": overall_score,
        "grade": letter_grade,
        "classification": proficiency_label,
        "metrics": {
            "semantic": {
                "name": "Semantic Alignment",
                "score": round(semantic_score, 1),
                "weight": 40,
                "status": "Excellent" if semantic_score >= 80 else "Good" if semantic_score >= 60 else "Review Needed"
            },
            "fluency": {
                "name": "Speech Fluency",
                "score": round(fluency_score, 1),
                "weight": 25,
                "status": "Excellent" if fluency_score >= 80 else "Good" if fluency_score >= 60 else "Review Needed"
            },
            "keywords": {
                "name": "Keyword Coverage",
                "score": round(keyword_score, 1),
                "weight": 15,
                "status": "High" if keyword_score >= 75 else "Medium" if keyword_score >= 40 else "Low"
            },
            "confidence": {
                "name": "Vocal Confidence",
                "score": round(confidence_score, 1),
                "weight": 10,
                "status": "High" if confidence_score >= 80 else "Medium" if confidence_score >= 60 else "Low"
            },
            "sentiment": {
                "name": "Sentiment/Delivery",
                "score": round(sentiment_score, 1),
                "weight": 10,
                "status": "Positive" if sentiment_score >= 85 else "Neutral" if sentiment_score >= 70 else "Tense"
            }
        }
    }
    
    return scorecard
