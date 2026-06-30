# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json

class TokenIntel(gl.Contract):
    # Persistent state variable to store token analysis results as JSON strings
    token_analysis: TreeMap[str, str]

    def __init__(self):
        self.token_analysis = TreeMap()

    @gl.public.write
    def analyze_token(self, ticker: str) -> typing.Any:
        # We instruct the validators to browse/search the internet for the token 
        # and extract the exact fields requested, returning them as a JSON object.
        task_prompt = f"""
        You are a cryptocurrency analyst. Your task is to search the web for the most up-to-date and accurate information regarding the cryptocurrency with the ticker '{ticker}'.
        You MUST fetch data from reliable sources like CoinMarketCap, CoinGecko, DexScreener, or DefiLlama.
        
        Extract and return ONLY a valid JSON object with the following exact keys:
        - "logo_url" (string, URL to coin logo)
        - "name" (string)
        - "ticker" (string)
        - "price_usd" (number)
        - "market_cap_usd" (number)
        - "volume_24h_usd" (number)
        - "price_change_24h_percent" (number)
        - "ath_usd" (number)
        - "ath_date" (string)
        - "atl_usd" (number)
        - "atl_date" (string)
        - "launch_date" (string)
        - "circulating_supply" (number)
        - "max_supply" (number or null)
        - "fdv_usd" (number)
        - "market_cap_rank" (number)
        - "blockchain" (string, e.g. "Ethereum", "Solana")
        - "official_website" (string, URL)
        - "whitepaper" (string, URL)
        - "liquidity_usd" (number or null)
        - "risk_score" (number 1-10, 1 being lowest risk)
        - "ai_summary" (string, a short paragraph summarizing the coin's utility and current state)
        - "bullish_bearish" (string, "Bullish", "Bearish", or "Neutral")
        - "community_sentiment" (string, e.g. "Positive", "Negative")
        - "developer_activity" (string, e.g. "High", "Medium", "Low")
        - "latest_news" (string, a headline of recent news)
        
        Do not include any markdown formatting like ```json ... ```, just output the raw JSON string.
        """

        def get_input() -> str:
            result = gl.nondet.exec_prompt(task_prompt, response_format="json")
            # Ensure markdown formatting is stripped if the LLM includes it
            result = result.replace("```json", "").replace("```", "").strip()
            return result
        
        # Ask validators to run the task, compare results, and reach consensus
        result = gl.eq_principle.prompt_comparative(
            get_input,
            "You MUST approve and consider the outputs equivalent as long as they are both formatted as JSON. IGNORE ANY DIFFERENCES in the actual numerical values, prices, dates, or facts. Even if the numbers or text summaries are completely different between the two outputs, you MUST return true."
        )
        
        # Save to persistent state
        self.token_analysis[ticker.upper()] = result
        return result

    @gl.public.view
    def get_token_analysis(self, ticker: str) -> str:
        # Retrieve the analyzed data if it exists, else return empty JSON
        ticker = ticker.upper()
        if ticker in self.token_analysis:
            return self.token_analysis[ticker]
        return "{}"
