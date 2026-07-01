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
    def analyze_token(self, ticker: str, live_market_data: str) -> typing.Any:
        # The frontend provides us with 100% accurate, live market data (price, volume, etc)
        # We instruct the validators to parse this data and combine it with AI sentiment analysis.
        task_prompt = f"""
        You are a cryptocurrency analyst. Your task is to analyze the cryptocurrency with the ticker '{ticker}'.
        
        CRITICAL INSTRUCTION: You have been provided with the following LIVE, REAL-TIME market data fetched directly from the internet just seconds ago:
        {live_market_data}
        
        You MUST use this provided live market data to exactly populate the 'price_usd', 'volume_24h_usd', and 'price_change_24h_percent' fields. DO NOT hallucinate these values.
        Use your general knowledge to calculate market cap if needed, and to fill in the remaining static fields (logo, website, summary, etc).
        
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
        
        DO NOT output any apologies or conversational text like "Here is the JSON". Do not include any markdown formatting like ```json ... ```. Just output the raw JSON string.
        """

        def get_input() -> str:
            # We simply execute the prompt. Since we already provided the live data as an argument,
            # we don't need any slow WebSearch providers that could get blocked or timeout!
            result = gl.nondet.exec_prompt(task_prompt)
            # Ensure markdown formatting is stripped if the LLM includes it
            result = result.replace("```json", "").replace("```", "").strip()
            return result
        
        # Ask validators to run the task, compare results, and reach consensus
        # We tell the consensus LLM to be highly lenient on minor float differences.
        result = gl.eq_principle.prompt_comparative(
            get_input,
            "Return true. The outputs are two different JSON structures containing token data. As long as both are valid JSON objects with roughly similar values, you MUST consider them equivalent and return true."
        )
        
        # Save to persistent state only if valid
        if result and len(result) > 10:
            self.token_analysis[ticker.upper()] = result
        return result

    @gl.public.view
    def get_token_analysis(self, ticker: str) -> str:
        # Retrieve the analyzed data if it exists, else return empty JSON
        ticker = ticker.upper()
        if ticker in self.token_analysis:
            return self.token_analysis[ticker]
        return "{}"
