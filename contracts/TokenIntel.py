# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json

class TokenIntel(gl.Contract):
    # Persistent state variable to store token analysis results as JSON strings
    token_analysis: TreeMap[str, str]
    # New state variable for on-chain utility (Autonomous Whitelisting)
    whitelisted_tokens: TreeMap[str, bool]

    def __init__(self):
        self.token_analysis = TreeMap()
        self.whitelisted_tokens = TreeMap()

    @gl.public.write
    def analyze_token(self, ticker: str) -> typing.Any:
        
        def get_input() -> str:
            # 1. Fetch market data directly on-chain!
            # This proves the validators are fetching the data themselves, not trusting the frontend.
            url = f"https://api.coingecko.com/api/v3/search?query={ticker}"
            try:
                web_data = gl.get_webpage(url)
            except Exception:
                web_data = "Web fetch failed."

            task_prompt = f"""
            You are a cryptocurrency analyst. Your task is to analyze the cryptocurrency with the ticker '{ticker}'.
            
            CRITICAL INSTRUCTION: You MUST base your analysis on the following raw market data fetched directly on-chain by the contract:
            {web_data}
            
            Use your web search capabilities and general knowledge to fill in any missing details (current price, sentiment, news, etc).
            
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
            
            result = gl.nondet.exec_prompt(task_prompt)
            result = result.replace("```json", "").replace("```", "").strip()
            return result
        
        # 2. Strict Equivalence Principle
        # We enforce that validators MUST agree on the critical subjective metrics.
        eq_prompt = """
        You are a strict consensus judge. You have two JSON outputs containing a cryptocurrency analysis.
        You must return 'true' ONLY IF ALL of the following conditions are met:
        1. Both are valid JSON objects.
        2. The 'bullish_bearish' sentiment matches EXACTLY (case-insensitive).
        3. The 'risk_score' values differ by NO MORE THAN 1 point (e.g. 5 and 6 is okay, 5 and 7 is false).
        
        If ANY of these conditions fail, you MUST return 'false'.
        """
        
        result = gl.eq_principle.prompt_comparative(get_input, eq_prompt)
        
        # 3. On-chain Consequence (Whitelisting)
        # We take the decentralized consensus and use it to update an on-chain state variable
        if result and len(result) > 10:
            self.token_analysis[ticker.upper()] = result
            
            try:
                data = json.loads(result)
                sentiment = data.get("bullish_bearish", "").upper()
                risk = float(data.get("risk_score", 10))
                
                # The token is whitelisted for our hypothetical protocol if it is safe
                if sentiment == "BULLISH" and risk <= 5:
                    self.whitelisted_tokens[ticker.upper()] = True
                else:
                    self.whitelisted_tokens[ticker.upper()] = False
            except Exception:
                pass
                
        return result

    @gl.public.view
    def get_token_analysis(self, ticker: str) -> str:
        ticker = ticker.upper()
        if ticker in self.token_analysis:
            return self.token_analysis[ticker]
        return "{}"
        
    @gl.public.view
    def is_whitelisted(self, ticker: str) -> bool:
        ticker = ticker.upper()
        if ticker in self.whitelisted_tokens:
            return self.whitelisted_tokens[ticker]
        return False
