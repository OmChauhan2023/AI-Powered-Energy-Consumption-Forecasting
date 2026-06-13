import os
from fpdf import FPDF
from google import genai
from google.genai import types

class ReportAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def generate_pdf_report(self, data: dict, output_path: str):
        # 1. Get reasoning from Gemini
        reasoning = "Gemini API key not configured. Cannot generate reasoning."
        if self.client:
            prompt = (
                f"Analyze this energy prediction data and provide a professional, detailed 2-paragraph executive summary explaining the reasoning behind the forecast. "
                f"Data: {data}"
            )
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.3)
                )
                reasoning = response.text
            except Exception as e:
                reasoning = f"Error generating reasoning: {str(e)}"

        # 2. Build PDF
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_font("Helvetica", style="B", size=18)
        pdf.cell(0, 10, "Detailed Forecast & Analysis Report", ln=True, align="C")
        pdf.ln(5)
        
        # Subheader
        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 10, f"Predicted Load: {data.get('prediction', 'N/A')} MWh", ln=True)
        pdf.cell(0, 10, f"Uncertainty: ±{data.get('uncertainty', 'N/A')} MWh", ln=True)
        pdf.ln(5)

        # AI Reasoning
        pdf.set_font("Helvetica", style="B", size=14)
        pdf.cell(0, 10, "AI Executive Summary & Reasoning", ln=True)
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 8, reasoning)
        pdf.ln(10)

        # Feature Breakdown
        pdf.set_font("Helvetica", style="B", size=14)
        pdf.cell(0, 10, "Key Factor Breakdown", ln=True)
        pdf.set_font("Helvetica", size=11)
        
        features = data.get("features", {})
        for k, v in features.items():
            pdf.cell(0, 8, f"- {k}: {v}", ln=True)
            
        pdf.output(output_path)
        return output_path
