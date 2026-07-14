import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Custom canvas to calculate total page count and add headers/footers dynamically.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Draw running header (skip first page if needed, but here we add it generally)
        self.drawString(54, 750, "Voice-Based Concept Understanding Analyser (VBCUA) - Assessment Report")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, letter[0] - 54, 742)
        
        # Draw running footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_text)
        self.drawString(54, 36, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.line(54, 48, letter[0] - 54, 48)
        
        self.restoreState()

def build_assessment_pdf(scorecard, semantic_results, audio_results, nlp_results, ai_feedback, topic_name, waveform_img_path, radar_img_path, output_path):
    """
    Compiles assessment results into a premium ReportLab PDF document.
    """
    # Page setup - 0.75 in (54 pt) margins
    margin = 54
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=72, # Leave room for header
        bottomMargin=72 # Leave room for footer
    )
    
    # Styles Setup
    styles = getSampleStyleSheet()
    
    # Modify normal body text
    styles['Normal'].textColor = colors.HexColor("#334155")
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    
    # Custom unique styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#7C3AED"),
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )
    
    meta_style = ParagraphStyle(
        'MetadataText',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748B")
    )
    
    transcript_style = ParagraphStyle(
        'TranscriptText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#1E293B")
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    story = []
    
    # ------------------ 1. TITLE & METADATA SECTION ------------------
    story.append(Paragraph("Assessment Performance Report", title_style))
    
    meta_data = [
        [Paragraph(f"<b>Assessment Topic:</b> {topic_name}", meta_style), 
         Paragraph(f"<b>Speech Duration:</b> {round(audio_results.get('duration', 0), 1)}s", meta_style)],
        [Paragraph(f"<b>Speaking Rate:</b> {round(audio_results.get('speaking_speed_wpm', 0), 1)} WPM", meta_style), 
         Paragraph(f"<b>Filler Words:</b> {audio_results.get('filler_count', 0)} instances", meta_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 250])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # ------------------ 2. OVERALL SCORECARD ------------------
    # Scorecard Box
    grade = scorecard.get("grade", "C")
    score = scorecard.get("overall_score", 0.0)
    label = scorecard.get("classification", "Average")
    
    score_p = Paragraph(f"<font size='14'>Overall Score</font><br/><font size='36'><b>{score}</b></font><font size='16'>/100</font>", ParagraphStyle('ScoreP', parent=styles['Normal'], alignment=1, leading=40, textColor=colors.HexColor("#7C3AED")))
    grade_p = Paragraph(f"<font size='14'>Performance Grade</font><br/><font size='36'><b>{grade}</b></font><br/><font size='10' color='#64748B'>{label}</font>", ParagraphStyle('GradeP', parent=styles['Normal'], alignment=1, leading=20, textColor=colors.HexColor("#06B6D4")))
    
    scorecard_data = [[score_p, grade_p]]
    scorecard_table = Table(scorecard_data, colWidths=[250, 250])
    scorecard_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(scorecard_table)
    story.append(Spacer(1, 20))
    
    # ------------------ 3. DETAILED SCORES TABLE ------------------
    story.append(Paragraph("Category Metrics Breakdown", section_heading))
    
    metrics_header = [
        Paragraph("<b>Category</b>", ParagraphStyle('HCol', parent=styles['Normal'], textColor=colors.white)),
        Paragraph("<b>Weight</b>", ParagraphStyle('HCol', parent=styles['Normal'], textColor=colors.white, alignment=1)),
        Paragraph("<b>Score</b>", ParagraphStyle('HCol', parent=styles['Normal'], textColor=colors.white, alignment=1)),
        Paragraph("<b>Status Assessment</b>", ParagraphStyle('HCol', parent=styles['Normal'], textColor=colors.white))
    ]
    
    metrics_data = [metrics_header]
    for key, val in scorecard["metrics"].items():
        metrics_data.append([
            Paragraph(val["name"], styles['Normal']),
            Paragraph(f"{val['weight']}%", ParagraphStyle('CCol', parent=styles['Normal'], alignment=1)),
            Paragraph(f"{val['score']}/100", ParagraphStyle('CCol', parent=styles['Normal'], alignment=1)),
            Paragraph(val["status"], styles['Normal'])
        ])
        
    metrics_table = Table(metrics_data, colWidths=[180, 70, 70, 180])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#7C3AED")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 20))
    
    # ------------------ 4. SPEECH TRANSCRIPT ------------------
    story.append(Paragraph("Speech Transcription", section_heading))
    transcript = nlp_results.get("readability", {}).get("word_count", 0) > 0
    transcript_text = semantic_results.get("transcript", "")
    if not transcript_text:
        # Fallback if transcript was not placed in semantic_results
        transcript_text = "No speech captured or transcript is empty."
        
    transcript_box = Table([[Paragraph(transcript_text, transcript_style)]], colWidths=[500])
    transcript_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(transcript_box)
    
    story.append(PageBreak()) # Move visualizations to Page 2 to keep layout neat
    
    # ------------------ 5. VISUALIZATIONS SECTION ------------------
    story.append(Paragraph("Acoustic & Analytics Visualizations", section_heading))
    
    chart_data = []
    if os.path.exists(waveform_img_path):
        # Resize to fit in column
        chart_data.append([Image(waveform_img_path, width=280, height=100)])
    if os.path.exists(radar_img_path):
        chart_data.append([Image(radar_img_path, width=200, height=200)])
        
    if len(chart_data) == 2:
        # Side-by-side or stacked. Radar chart has circular dimensions, layout neatly.
        vis_table = Table([[chart_data[0][0], chart_data[1][0]]], colWidths=[300, 200])
        vis_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(vis_table)
    elif len(chart_data) == 1:
        story.append(chart_data[0][0])
        
    story.append(Spacer(1, 15))
    
    # ------------------ 6. AI COACHING FEEDBACK ------------------
    story.append(Paragraph("AI Coaching & Pedagogical Feedback", section_heading))
    
    # Concept Summary
    concept_summary = ai_feedback.get("concept_summary", "")
    if concept_summary:
        story.append(Paragraph(f"<b>Concept Summary:</b> {concept_summary}", styles['Normal']))
        story.append(Spacer(1, 8))
        
    # Strengths (Bullet Points)
    story.append(Paragraph("<b>Key Strengths:</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=11, leading=14, spaceBefore=4, spaceAfter=4)))
    for s in ai_feedback.get("strengths", []):
        story.append(Paragraph(f"• {s}", bullet_style))
    story.append(Spacer(1, 8))
        
    # Weaknesses
    story.append(Paragraph("<b>Areas for Development:</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=11, leading=14, spaceBefore=4, spaceAfter=4)))
    for w in ai_feedback.get("weaknesses", []):
        story.append(Paragraph(f"• {w}", bullet_style))
    story.append(Spacer(1, 8))
        
    # Suggestions
    story.append(Paragraph("<b>Actionable Improvements:</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=11, leading=14, spaceBefore=4, spaceAfter=4)))
    for sug in ai_feedback.get("suggestions", []):
        story.append(Paragraph(f"• {sug}", bullet_style))
    story.append(Spacer(1, 8))
        
    # Interview Readiness
    readiness = ai_feedback.get("interview_readiness", "")
    if readiness:
        story.append(Paragraph("<b>Interview Readiness:</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=11, leading=14, spaceBefore=4, spaceAfter=4)))
        story.append(Paragraph(readiness, styles['Normal']))
        story.append(Spacer(1, 10))
        
    # Resources List
    resources_p = []
    for r in ai_feedback.get("resources", []):
        resources_p.append(f"<font color='#7C3AED'><u><a href='{r.get('url', '#')}'>{r.get('name', 'Learning Resource')}</a></u></font>")
        
    if resources_p:
        story.append(Paragraph("<b>Recommended Resources:</b> " + "  |  ".join(resources_p), styles['Normal']))
        
    # Build Document using our custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
