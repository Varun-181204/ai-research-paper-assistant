import os
import re
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiLLMService:
    """Manages prompt execution with Google Gemini models."""

    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY or os.environ.get("GOOGLE_API_KEY", "")
        self.model_name = settings.GEMINI_MODEL
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("Could not initialize google.genai Client: %s", str(e))
        return self._client

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> str:
        """Executes text generation with Gemini."""
        client = self._get_client()

        if not client or not self.api_key:
            # Fallback message explaining API key is needed for live generation
            return (
                "[Notice: Google Gemini API Key is not configured yet. "
                "Please configure your GOOGLE_API_KEY in backend/.env or the Settings page "
                "to generate live LLM responses. Retrieved context and citations are verified below.]"
            )

        try:
            config = {
                "temperature": temperature,
            }
            if system_instruction:
                config["system_instruction"] = system_instruction

            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            return response.text or ""
        except Exception as exc:
            logger.error("Gemini text generation failed: %s", str(exc))
            raise RuntimeError(f"Gemini API error: {str(exc)}")

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates structured JSON output from Gemini."""
        enforced_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. Do not wrap in markdown or add commentary outside JSON."
        raw_output = self.generate_text(enforced_prompt, system_instruction=system_instruction, temperature=0.1)

        # Parse JSON
        try:
            # First try direct parse
            return json.loads(raw_output)
        except Exception:
            # Strip potential ```json ... ``` markdown fences
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_output, re.DOTALL)
            if match:
                return json.loads(match.group(1))

            # Find first { and last }
            start = raw_output.find("{")
            end = raw_output.rfind("}")
            if start != -1 and end != -1:
                return json.loads(raw_output[start:end+1])

            logger.warning("Failed to parse JSON from LLM output. Returning raw text wrapped.")
            return {"raw_response": raw_output}


llm_service = GeminiLLMService()
