import os
import json
from fpdf import FPDF
from google import genai
from google.genai import types

class ReportAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def generate_pdf_report(self, data: dict, output_path: str):
        # 1. Get structured reasoning from Gemini
        ai_data = {
            "overview": "Gemini API key not configured. Cannot generate reasoning.",
            "risks": ["Unable to generate risks without API key."],
            "recommendations": ["Configure API key to enable AI insights."]
        }
        
        if self.client:
            prompt = (
                f"You are a Senior Energy Analyst. Analyze this energy prediction data. "
                f"If the data contains 'horizon' or 'growth_rate', treat this as a long-term MACRO decadal forecast. "
                f"If it contains 'hour' or 'lag_24h', treat this as a short-term MICRO operational forecast. "
                f"Return ONLY a valid JSON object with EXACTLY these three keys: "
                f"'overview' (a 2-3 sentence strategic executive summary), "
                f"'risks' (an array of 3 bullet-point strings highlighting key failure risks), "
                f"'recommendations' (an array of 3 bullet-point strings recommending actionable steps). "
                f"Do not use markdown formatting like asterisks or backticks in the text. "
                f"Data: {data}"
            )
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:-3]
                ai_data = json.loads(raw_text)
            except Exception as e:
                ai_data["overview"] = f"Error generating reasoning: {str(e)}"

        # 2. Build PDF
        pdf = FPDF()
        pdf.add_page()
        
        # Colors
        COLOR_PRIMARY = (15, 23, 42) # Slate 900
        COLOR_ACCENT = (37, 99, 235) # Blue 600
        COLOR_GRAY = (100, 116, 139) # Slate 500
        COLOR_BG = (248, 250, 252) # Slate 50
        
        # Header
        pdf.set_font("Helvetica", style="B", size=22)
        pdf.set_text_color(*COLOR_PRIMARY)
        pdf.cell(0, 15, "Executive Scenario Report", ln=True, align="L")
        
        # Extract metrics
        pred_val = data.get('prediction', 0)
        uncertainty = data.get('uncertainty', 0)
        financial_cost = pred_val * 134 # Synced with $134/MWh market rate
        
        if pred_val < 120:
            status = "OPTIMAL"
        elif pred_val <= 135:
            status = "ELEVATED"
        else:
            status = "CRITICAL"

        # Shaded Metrics Box
        pdf.ln(2)
        pdf.set_fill_color(*COLOR_BG)
        pdf.set_draw_color(226, 232, 240) # Slate 200
        pdf.cell(0, 25, "", border=1, ln=False, fill=True)
        
        # Position cursor back inside the box
        pdf.set_xy(15, 30)
        pdf.set_font("Helvetica", style="B", size=9)
        pdf.set_text_color(*COLOR_GRAY)
        pdf.cell(45, 6, "PREDICTED LOAD", ln=False)
        pdf.cell(45, 6, "UNCERTAINTY", ln=False)
        pdf.cell(50, 6, "FINANCIAL EXPOSURE", ln=False)
        pdf.cell(40, 6, "GRID STATUS", ln=True)
        
        pdf.set_xy(15, 36)
        pdf.set_font("Helvetica", style="B", size=12)
        pdf.set_text_color(*COLOR_PRIMARY)
        pdf.cell(45, 10, f"{pred_val:,.1f} MWh", ln=False)
        pdf.cell(45, 10, f"+/- {uncertainty:,.1f} MWh", ln=False)
        pdf.cell(50, 10, f"${financial_cost:,.0f}", ln=False)
        
        # Status Color
        if status == "OPTIMAL":
            pdf.set_text_color(22, 163, 74) # Green
        elif status == "ELEVATED":
            pdf.set_text_color(202, 138, 4) # Yellow
        else:
            pdf.set_text_color(220, 38, 38) # Red
            
        pdf.cell(40, 10, status, ln=True)
        
        # Reset Y below box
        pdf.set_xy(10, 60)
        pdf.ln(5)

        # Helper for Sections
        def print_section_header(title):
            pdf.set_font("Helvetica", style="B", size=14)
            pdf.set_text_color(*COLOR_ACCENT)
            pdf.cell(0, 10, title.upper(), ln=True)
            pdf.set_text_color(*COLOR_PRIMARY)
            pdf.ln(2)

        def print_bullet_point(text):
            pdf.set_font("Helvetica", size=11)
            pdf.set_text_color(*COLOR_PRIMARY)
            # Use a standard hyphen for bullets to avoid encoding issues
            pdf.cell(5, 6, "-", ln=False) 
            pdf.multi_cell(0, 6, text)
            pdf.ln(2)

        # Overview
        print_section_header("Strategic Overview")
        pdf.set_font("Helvetica", size=11)
        pdf.set_text_color(*COLOR_PRIMARY)
        pdf.multi_cell(0, 6, ai_data.get("overview", ""))
        pdf.ln(8)

        # Risks
        print_section_header("Critical Risk Factors")
        for risk in ai_data.get("risks", []):
            print_bullet_point(risk)
        pdf.ln(6)

        # Recommendations
        print_section_header("Actionable Recommendations")
        for rec in ai_data.get("recommendations", []):
            print_bullet_point(rec)
        pdf.ln(6)

        # Input Context
        print_section_header("Input Feature Context")
        features = data.get("features", {})
        for k, v in features.items():
            pdf.set_font("Helvetica", size=10)
            pdf.set_text_color(*COLOR_GRAY)
            pdf.cell(40, 6, str(k).replace('_', ' ').title() + ":", ln=False)
            pdf.set_text_color(*COLOR_PRIMARY)
            pdf.cell(0, 6, str(v), ln=True)
            
        pdf.output(output_path)
        return output_path
