"""This will handle GitHub OAuth authentication flow"""

import httpx
from typing import Optional, Dict, Any
from urllib.parse import urlencode
from .config import settings


# GitHub OAuth Endpoints
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails"


class GitHubOAuthClient:
    """Client for handling GitHub OAuth 2.0 authentication"""
    
    def __init__(
        self,
        client_id: str = settings.GITHUB_CLIENT_ID,
        client_secret: str = settings.GITHUB_CLIENT_SECRET,
        redirect_uri: str = settings.GITHUB_REDIRECT_URI,
    ):
        """Create GitHub oAuth client"""
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    def get_authorization_url(self, state: Optional[str] = None, scope: str = "user:email") -> str:
        """
        Create a GitHub authorization URL for the user and creates an Authorization URL to redirect user to"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scope,
            "allow_signup": "true",
        }
        
        if state:
            params["state"] = state 
        
        return f"{GITHUB_AUTH_URL}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GITHUB_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to exchange code for token: {response.text}")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Fetch GitHub user information
       
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GITHUB_USER_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch user info: {response.text}")
            
            return response.json()
    
    async def get_user_emails(self, access_token: str) -> list:
        """
        Fetch GitHub user email addresses
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GITHUB_USER_EMAILS_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch user emails: {response.text}")
            
            return response.json()
    
    async def authenticate_user(self, code: str) -> Dict[str, Any]:
        """
        Complete authentication flow: exchange code and fetch user info
        """
        # Exchange code for access token
        token_data = await self.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise Exception("No access token returned from GitHub")
        
        # Fetch user information
        user_info = await self.get_user_info(access_token)
        
        # Fetch user emails
        emails = await self.get_user_emails(access_token)
        
        return {
            "access_token": access_token,
            "token_type": token_data.get("token_type", "bearer"),
            "scope": token_data.get("scope", ""),
            "user_info": user_info,
            "emails": emails,
        }


# Initialize default OAuth client
oauth_client = GitHubOAuthClient()
