# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json

class TokenIntel(gl.Contract):
    # Persistent state variable to store token analysis results as JSON strings
    token_analysis: dict

    def __init__(self):
        self.token_analysis = {}

    @gl.public.write
    def analyze_token(self, ticker: str) -> typing.Any:
        # Non-deterministic function to fetch raw data using GenVM's web module
        def get_input() -> str:
            # We fetch data from a public aggregator or search endpoints
            # To avoid needing an API key, we fetch the CoinGecko search endpoint 
            # and then fetch the coin data. 
            # Wait, since Genlayer LLM validators are powerful, we can also instruct them 
            # to search the web for the given ticker directly if the input is just the ticker.
            return f"Analyze the cryptocurrency: {ticker}"
        
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
        
        criteria_prompt = """
        The response MUST be a valid, parseable JSON object.
        It must contain all 26 keys exactly as specified in the task.
        The data must be plausible and reflect the most current public information available on the web for this ticker.
        There must be no extra text outside the JSON object.
        """

        # Ask validators to run the task, judge results, and reach consensus
        result = gl.eq_principle.prompt_non_comparative(
            get_input,
            task=task_prompt,
            criteria=criteria_prompt,
        )
        
        # Save to persistent state
        self.token_analysis[ticker.upper()] = result
        return result

    @gl.public.view
    def get_token_analysis(self, ticker: str) -> str:
        # Retrieve the analyzed data if it exists, else return empty JSON
        return self.token_analysis.get(ticker.upper(), "{}")
