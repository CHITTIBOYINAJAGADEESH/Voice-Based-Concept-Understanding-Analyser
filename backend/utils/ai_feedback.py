import os
import json
import google.generativeai as genai
import openai

# Default API Keys provided by the user (leave blank for local-only)
DEFAULT_GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
DEFAULT_OPENAI_KEY = ""

def generate_local_feedback(topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results):
    """
    Local rule-based generator that runs when AI API is unavailable or disabled.
    Generates structured, highly personalized pedagogical assessments.
    """
    overall_score = scorecard.get("overall_score", 0.0)
    grade = scorecard.get("grade", "C")
    classification = scorecard.get("classification", "Average")
    
    covered = semantic_results.get("covered_concepts", [])
    missing = semantic_results.get("missing_concepts", [])
    incorrect = semantic_results.get("incorrect_statements", [])
    
    wpm = audio_results.get("speaking_speed_wpm", 0.0)
    pause_ratio = audio_results.get("pause_ratio", 0.0)
    filler_count = audio_results.get("filler_count", 0)
    clarity = audio_results.get("clarity_score", 100.0)
    
    strengths = []
    weaknesses = []
    suggestions = []
    
    # 1. Evaluate Strengths
    if overall_score >= 80:
        strengths.append(f"Demonstrated a strong, comprehensive understanding of the core principles of {topic_name}.")
    elif len(covered) > 0:
        strengths.append(f"Successfully discussed critical facets of {topic_name}, particularly: {', '.join(covered[:2])}.")
        
    if wpm >= 110 and wpm <= 160:
        strengths.append("Maintained an optimal speaking pace (110-160 WPM), allowing for clear absorption of concepts.")
    
    if pause_ratio >= 0.08 and pause_ratio <= 0.22:
        strengths.append("Used natural structural pauses effectively to organize thoughts without creating hesitation.")
        
    if filler_count <= 2:
        strengths.append("Exhibited high verbal fluency with minimal filler word usage ('um', 'like', etc.).")
        
    if clarity >= 80:
        strengths.append("Spoke with clear articulation, ensuring consonants and vowel structures are easily decodable.")
        
    if not strengths:
        strengths.append("Successfully attempted to speak and record explanation for the concept.")

    # 2. Evaluate Weaknesses & Missing Areas
    if len(missing) > 0:
        weaknesses.append(f"Omitted crucial sub-concepts, notably: {', '.join(missing[:3])}.")
    if len(incorrect) > 0:
        weaknesses.append(f"Introduced potential factual deviations or off-topic phrases: '{incorrect[0]['sentence']}'.")
        
    if wpm < 100:
        weaknesses.append(f"Pacing was slow ({round(wpm, 1)} WPM), which can affect engagement and energy levels.")
    elif wpm > 170:
        weaknesses.append(f"Pacing was too rapid ({round(wpm, 1)} WPM), which may lead to listener fatigue.")
        
    if pause_ratio > 0.28:
        weaknesses.append("Frequent or prolonged pauses created a sense of hesitation and interrupted flow.")
        
    if filler_count > 4:
        weaknesses.append(f"Relied on vocal fillers ({filler_count} instances), which dilutes professional presence.")

    if not weaknesses:
        weaknesses.append("No major structural or delivery weaknesses identified.")

    # 3. Create Recommendations & Suggestions
    if len(missing) > 0:
        suggestions.append(f"Elaborate more on: {missing[0]}. Try explaining how it integrates with the rest of the topic.")
    suggestions.append("Practice summarizing the topic in a 60-second elevator pitch focusing on structural clarity.")
    
    if filler_count > 3:
        suggestions.append("Incorporate deliberate 1-second silences instead of filling the space with vocal fillers like 'uh' or 'um'.")
    if wpm < 100 or wpm > 170:
        suggestions.append("Practice speaking with a metronome or timer, aiming for a consistent pace of around 130 WPM.")

    # 4. Resources Selection
    resources = [
        {"name": f"Introductory Guide to {topic_name}", "url": f"https://en.wikipedia.org/wiki/{topic_name.replace(' ', '_')}"},
        {"name": f"Roadmap.sh - {topic_name} Learning Paths", "url": "https://roadmap.sh"}
    ]
    if missing:
        resources.append({
            "name": f"Deep Dive: {missing[0]}", 
            "url": f"https://www.google.com/search?q={missing[0].replace(' ', '+')}"
        })

    # 5. Interview Readiness
    if overall_score >= 85:
        readiness = f"Highly competitive! You demonstrated structured technical command and excellent delivery of {topic_name}. You are ready to present this in technical interviews."
    elif overall_score >= 70:
        readiness = f"Good foundational knowledge. Your explanation of {topic_name} is solid, but strengthening delivery fluency and covering key sub-concepts like {', '.join(missing[:1])} will secure your presentation in professional settings."
    else:
        readiness = f"Need preparation. Re-read the reference guides for {topic_name}, reduce hesitations, and focus on speaking cleanly. Retake this assessment after reviewing the core concepts."

    concept_summary = f"An overview of {topic_name} covering its key paradigms, architectural features, and practical applications in standard engineering environments."

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "resources": resources,
        "concept_summary": concept_summary,
        "interview_readiness": readiness,
        "is_ai_simulated": True
    }

def generate_ai_coaching_feedback(topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results, provider="Gemini", api_key=""):
    """
    Dispatches to OpenAI or Gemini model to generate premium, nuanced coaching reviews.
    Falls back to `generate_local_feedback` if API call fails.
    """
    if provider == "Local":
        return generate_local_feedback(topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results)

    if not api_key:
        api_key = DEFAULT_GEMINI_KEY if provider == "Gemini" else DEFAULT_OPENAI_KEY

    # If no key is set at all (including default), use local logic immediately
    if not api_key:
        return generate_local_feedback(topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results)

    prompt = f"""
    You are an elite Technical Recruiter and Speaking Coach. Review the user's spoken response on the topic: '{topic_name}'.
    
    User Transcript: "{transcript}"
    
    Overall Score: {scorecard['overall_score']}/100 (Grade {scorecard['grade']}, Status: {scorecard['classification']})
    
    Speech Metrics:
    - Speed: {round(audio_results['speaking_speed_wpm'], 1)} Words Per Minute
    - Silence/Pause Ratio: {round(audio_results['pause_ratio']*100, 1)}%
    - Filler Words Count: {audio_results['filler_count']}
    - Articulation/Clarity: {round(audio_results['clarity_score'], 1)}/100
    
    Semantic Evaluation:
    - Covered Sub-Concepts: {json.dumps(semantic_results['covered_concepts'])}
    - Missing Sub-Concepts: {json.dumps(semantic_results['missing_concepts'])}
    - Factually Deviated/Incorrect Sentences: {json.dumps([x['sentence'] for x in semantic_results['incorrect_statements']])}
    
    Return a JSON response (strictly format as valid JSON ONLY, no code blocks, markdown wrapper or other characters) containing exactly:
    {{
      "strengths": ["list of 2-3 specific content or delivery strengths"],
      "weaknesses": ["list of 2-3 content gaps or speaking issues"],
      "suggestions": ["list of 2-3 concrete steps to improve score"],
      "resources": [
        {{"name": "Suggested article or video name", "url": "https://url-link"}}
      ],
      "concept_summary": "1-2 sentence professional overview of the core topic",
      "interview_readiness": "A 2-3 sentence assessment on how this explanation would hold up in a technical FAANG interview."
    }}
    """

    try:
        if provider == "Gemini":
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
            response = model.generate_content(prompt)
            result = json.loads(response.text.strip())
            result["is_ai_simulated"] = False
            return result
        else: # OpenAI
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
            result["is_ai_simulated"] = False
            return result
            
    except Exception as e:
        print(f"AI API Feedback Error: {e}. Falling back to local generation.")
        # Return local rule-based feedback
        feedback = generate_local_feedback(topic_name, transcript, scorecard, semantic_results, audio_results, nlp_results)
        feedback["ai_error"] = str(e)
        return feedback
