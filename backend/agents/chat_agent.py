import os
from google import genai
from google.genai import types

class ChatAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def ask(self, prompt: str, context: dict = None) -> str:
        if not self.client:
            return "Gemini API key not configured."

        system_instruction = (
            "You are an expert AI energy forecaster assistant. Keep answers concise, "
            "helpful, and refer strictly to the provided context when applicable."
        )

        context_str = ""
        if context:
            context_str = f"Current System Context:\n{context}\n\n"

        full_prompt = f"{context_str}User Question: {prompt}"

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7
                )
            )
            return response.text
        except Exception as e:
            return f"Error connecting to Gemini: {str(e)}"
