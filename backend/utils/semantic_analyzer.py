import os
import torch
import numpy as np
from sentence_transformers import SentenceTransformer, util

# Global cache for the SBERT model
_SBERT_MODEL = None

def get_sbert_model():
    """
    Loads and caches the Sentence-Transformer model.
    Using 'all-MiniLM-L6-v2' which is lightweight, fast, and runs efficiently on CPU.
    """
    global _SBERT_MODEL
    if _SBERT_MODEL is None:
        # Prevent downloading issues by setting environment variables if needed
        # Load the model locally/from cache
        _SBERT_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
    return _SBERT_MODEL

def calculate_cosine_similarity(text1, text2):
    """
    Computes SBERT cosine similarity between two texts.
    """
    if not text1.strip() or not text2.strip():
        return 0.0
        
    model = get_sbert_model()
    embeddings1 = model.encode(text1, convert_to_tensor=True)
    embeddings2 = model.encode(text2, convert_to_tensor=True)
    
    similarity = util.cos_sim(embeddings1, embeddings2)
    return float(similarity.item())

def analyze_concept_understanding(transcript, reference_data):
    """
    Performs semantic evaluation of the transcript.
    - Overall semantic similarity score (0 to 100).
    - Checks coverage of granular sub-concepts.
    - Identifies covered, missing, and potentially out-of-scope sentences.
    """
    if not transcript.strip():
        return {
            "semantic_score": 0.0,
            "covered_concepts": [],
            "missing_concepts": reference_data.get("sub_concepts", []),
            "incorrect_statements": [],
            "concept_alignments": []
        }

    reference_text = reference_data.get("reference_explanation", "")
    sub_concepts = reference_data.get("sub_concepts", [])
    
    model = get_sbert_model()
    
    # 1. Compute Overall Semantic Similarity using cached embeddings if available
    ref_emb = reference_data.get("explanation_embedding")
    if ref_emb is None:
        ref_emb = model.encode(reference_text, convert_to_tensor=True)
        
    trans_emb = model.encode(transcript, convert_to_tensor=True)
    overall_sim = float(util.cos_sim(trans_emb, ref_emb).item())
    
    # Normalize cosine similarity
    semantic_score = max(0.0, min(100.0, (overall_sim - 0.2) / 0.7 * 100.0))
    if overall_sim > 0.9:
        semantic_score = 100.0

    # 2. Sub-concept Coverage Analysis
    # Split transcript into sentences
    sentences = [s.strip() for s in transcript.replace("?", ".").replace("!", ".").split(".") if s.strip()]
    
    covered_concepts = []
    missing_concepts = []
    concept_alignments = []
    
    if len(sentences) > 0 and len(sub_concepts) > 0:
        # Encode all sentences at once
        sentence_embeddings = model.encode(sentences, convert_to_tensor=True)
        
        # Get cached sub-concepts embeddings if available
        sub_concept_embs = reference_data.get("sub_concepts_embeddings")
        if sub_concept_embs is None:
            sub_concept_embs = model.encode(sub_concepts, convert_to_tensor=True)
        
        # Calculate pairwise similarity matrix [num_sub_concepts, num_sentences]
        sim_matrix = util.cos_sim(sub_concept_embs, sentence_embeddings)
        
        # Threshold for marking a concept as covered
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
                
        # 3. Vectorized identification of Factual Deviations
        # Compare all sentence embeddings with the reference explanation embedding at once
        ref_sims = util.cos_sim(sentence_embeddings, ref_emb)
        if len(ref_sims.shape) > 1:
            ref_sims = ref_sims.squeeze(-1)
            
        incorrect_statements = []
        for idx, sentence in enumerate(sentences):
            ref_sim = float(ref_sims[idx].item()) if len(ref_sims.shape) > 0 else float(ref_sims.item())
            max_sub_sim = float(torch.max(sim_matrix[:, idx]).item())
            best_sim = max(ref_sim, max_sub_sim)
            
            # If the sentence has very low relevance (e.g. < 0.32), it is flagged
            if best_sim < 0.32 and len(sentence.split()) > 4:
                incorrect_statements.append({
                    "sentence": sentence,
                    "relevance_score": best_sim,
                    "reason": "Low relevance to the selected topic explanation (factual deviation or off-topic explanation)"
                })
    else:
        # Fallback if no sentences or sub-concepts
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
