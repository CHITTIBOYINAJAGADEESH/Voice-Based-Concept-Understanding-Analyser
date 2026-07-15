import os
import json
import re

try:
    import torch
    from sentence_transformers import SentenceTransformer, util
    SBERT_AVAILABLE = True
except ImportError:
    torch = None
    SentenceTransformer = None
    util = None
    SBERT_AVAILABLE = False

# Global cache for the SBERT model
_SBERT_MODEL = None

def get_sbert_model():
    """
    Loads and caches the Sentence-Transformer model.
    Using 'all-MiniLM-L6-v2' which is lightweight, fast, and runs efficiently on CPU.
    """
    global _SBERT_MODEL
    if not SBERT_AVAILABLE:
        return None
    if _SBERT_MODEL is None:
        # Load the model locally/from cache
        _SBERT_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    return _SBERT_MODEL

def calculate_cosine_similarity(text1, text2):
    """
    Computes SBERT cosine similarity between two texts if available.
    Otherwise, returns word overlap similarity.
    """
    if not text1.strip() or not text2.strip():
        return 0.0
        
    if SBERT_AVAILABLE:
        model = get_sbert_model()
        if model is not None:
            embeddings1 = model.encode(text1, convert_to_tensor=True)
            embeddings2 = model.encode(text2, convert_to_tensor=True)
            similarity = util.cos_sim(embeddings1, embeddings2)
            return float(similarity.item())
            
    # Simple fallback similarity
    words1 = set(re.findall(r'\b\w+\b', text1.lower()))
    words2 = set(re.findall(r'\b\w+\b', text2.lower()))
    if not words1 or not words2:
        return 0.0
    return len(words1.intersection(words2)) / float(max(len(words1), len(words2)))

def simple_local_analyze(transcript, reference_data):
    """
    Zero-dependency keyword match fallback that requires no heavy packages or API keys.
    """
    ref_text = reference_data.get("reference_explanation", "")
    sub_concepts = reference_data.get("sub_concepts", [])
    
    # Calculate simple word overlap score
    words1 = set(re.findall(r'\b\w+\b', transcript.lower()))
    words2 = set(re.findall(r'\b\w+\b', ref_text.lower()))
    
    # Filter common stopwords
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 
        'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
        'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 
        'in', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'this',
        'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'our', 'we', 'you'
    }
    words1 = words1 - stopwords
    words2 = words2 - stopwords
    
    overlap = words1.intersection(words2)
    semantic_score = (len(overlap) / max(1, len(words2))) * 100.0
    # Boost overlap to represent overall technical coverage
    semantic_score = min(100.0, semantic_score * 1.6)
    
    covered_concepts = []
    missing_concepts = []
    
    for concept in sub_concepts:
        concept_words = set(re.findall(r'\b\w+\b', concept.lower())) - stopwords
        if concept_words.intersection(words1):
            covered_concepts.append(concept)
        else:
            missing_concepts.append(concept)
            
    return {
        "semantic_score": float(round(semantic_score, 1)),
        "overall_cosine_similarity": float(round(semantic_score / 100.0, 3)),
        "covered_concepts": covered_concepts,
        "missing_concepts": missing_concepts,
        "incorrect_statements": [],
        "concept_alignments": []
    }

def analyze_concept_understanding_via_api(transcript, reference_data, api_key, provider="Gemini"):
    """
    Performs precise semantic analysis using LLM APIs when local PyTorch/SBERT is disabled.
    """
    topic_name = reference_data.get("name", "selected topic")
    ref_explanation = reference_data.get("reference_explanation", "")
    sub_concepts = reference_data.get("sub_concepts", [])
    
    prompt = f"""
    Evaluate the user's transcript explanation of a technical concept against the reference explanation and the required sub-concepts.
    
    Topic Name: {topic_name}
    Reference Explanation: "{ref_explanation}"
    Sub-concepts to check: {json.dumps(sub_concepts)}
    
    User Transcript: "{transcript}"
    
    Perform the following semantic evaluations:
    1. Calculate a semantic score between 0.0 and 100.0 representing how accurately and comprehensively the user explained the reference explanation.
    2. Determine which of the required sub-concepts were covered by the user explanation and which were missing (evaluate semantically, not just matching exact words).
    3. Identify any sentences in the user transcript that represent incorrect statements, factual deviations, or are completely off-topic.
    
    Return a JSON response (strictly format as valid JSON ONLY, no markdown formatting, no backticks, no code blocks or other characters) containing exactly:
    {{
      "semantic_score": 85.5,
      "covered_concepts": ["sub-concept 1", "sub-concept 2"],
      "missing_concepts": ["sub-concept 3"],
      "incorrect_statements": [
        {{
          "sentence": "incorrect sentence from user transcript",
          "relevance_score": 0.15,
          "reason": "explanation of why it is incorrect or off-topic"
        }}
      ]
    }}
    """
    
    try:
        if provider == "Gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
            response = model.generate_content(prompt)
            result = json.loads(response.text.strip())
        else:
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional technical speech examiner who returns JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content.strip())
            
        return {
            "semantic_score": float(result.get("semantic_score", 0.0)),
            "overall_cosine_similarity": float(result.get("semantic_score", 0.0) / 100.0),
            "covered_concepts": result.get("covered_concepts", []),
            "missing_concepts": result.get("missing_concepts", []),
            "incorrect_statements": result.get("incorrect_statements", []),
            "concept_alignments": []
        }
    except Exception as e:
        print(f"API Semantic Analysis failed: {e}. Falling back to local simple analysis.")
        return simple_local_analyze(transcript, reference_data)

def analyze_concept_understanding(transcript, reference_data, api_key=None, provider="Gemini"):
    """
    Main router for semantic concept evaluation.
    - If Sentence-Transformers is available, runs local SBERT.
    - Otherwise, routes to Cloud APIs (Gemini/OpenAI) for evaluation.
    - Falls back to basic local keyword similarity as a last resort.
    """
    if not transcript.strip():
        return {
            "semantic_score": 0.0,
            "covered_concepts": [],
            "missing_concepts": reference_data.get("sub_concepts", []),
            "incorrect_statements": [],
            "concept_alignments": []
        }

    # 1. Local SBERT Model Path (if installed)
    if SBERT_AVAILABLE:
        model = get_sbert_model()
        if model is not None:
            try:
                reference_text = reference_data.get("reference_explanation", "")
                sub_concepts = reference_data.get("sub_concepts", [])
                
                # Compute Overall Semantic Similarity using cached embeddings if available
                ref_emb = reference_data.get("explanation_embedding")
                if ref_emb is None:
                    ref_emb = model.encode(reference_text, convert_to_tensor=True)
                    
                trans_emb = model.encode(transcript, convert_to_tensor=True)
                overall_sim = float(util.cos_sim(trans_emb, ref_emb).item())
                
                # Normalize cosine similarity
                semantic_score = max(0.0, min(100.0, (overall_sim - 0.2) / 0.7 * 100.0))
                if overall_sim > 0.9:
                    semantic_score = 100.0

                # Sub-concept Coverage Analysis
                sentences = [s.strip() for s in transcript.replace("?", ".").replace("!", ".").split(".") if s.strip()]
                
                covered_concepts = []
                missing_concepts = []
                concept_alignments = []
                
                if len(sentences) > 0 and len(sub_concepts) > 0:
                    sentence_embeddings = model.encode(sentences, convert_to_tensor=True)
                    
                    sub_concept_embs = reference_data.get("sub_concepts_embeddings")
                    if sub_concept_embs is None:
                        sub_concept_embs = model.encode(sub_concepts, convert_to_tensor=True)
                    
                    sim_matrix = util.cos_sim(sub_concept_embs, sentence_embeddings)
                    coverage_threshold = 0.50
                    
                    for i, sub_concept in enumerate(sub_concepts):
                        max_sim_idx = int(torch.argmax(sim_matrix[i]))
                        max_sim_val = float(sim_matrix[i][max_sim_idx].item())
                        
                        alignment_info = {
                            "sub_concept": sub_concept,
                            "best_match_sentence": sentences[max_sim_idx],
                            "similarity": max_sim_val,
                            "covered": max_sim_val >= coverage_threshold
                        }
                        concept_alignments.append(alignment_info)
                        
                        if max_sim_val >= coverage_threshold:
                            covered_concepts.append(sub_concept)
                        else:
                            missing_concepts.append(sub_concept)
                            
                    # factual deviations
                    ref_sims = util.cos_sim(sentence_embeddings, ref_emb)
                    if len(ref_sims.shape) > 1:
                        ref_sims = ref_sims.squeeze(-1)
                        
                    incorrect_statements = []
                    for idx, sentence in enumerate(sentences):
                        ref_sim = float(ref_sims[idx].item()) if len(ref_sims.shape) > 0 else float(ref_sims.item())
                        max_sub_sim = float(torch.max(sim_matrix[:, idx]).item())
                        best_sim = max(ref_sim, max_sub_sim)
                        
                        if best_sim < 0.32 and len(sentence.split()) > 4:
                            incorrect_statements.append({
                                "sentence": sentence,
                                "relevance_score": best_sim,
                                "reason": "Low relevance to the selected topic explanation (factual deviation or off-topic explanation)"
                            })
                else:
                    missing_concepts = list(sub_concepts)
                    incorrect_statements = []

                return {
                    "semantic_score": float(semantic_score),
                    "overall_cosine_similarity": float(overall_sim),
                    "covered_concepts": covered_concepts,
                    "missing_concepts": missing_concepts,
                    "incorrect_statements": incorrect_statements,
                    "concept_alignments": concept_alignments
                }
            except Exception as local_err:
                print(f"Local SBERT analysis failed: {local_err}. Falling back to API/Simple.")

    # 2. Cloud API Evaluation Path
    active_key = api_key if api_key and api_key.strip() else os.environ.get("GEMINI_API_KEY", "")
    if active_key:
        return analyze_concept_understanding_via_api(transcript, reference_data, active_key, provider)

    # 3. Simple Keyword overlap Fallback
    return simple_local_analyze(transcript, reference_data)
