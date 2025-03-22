import json
import asyncio
import httpx

async def handler(event, context):
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.github.com")
    print("Hello World from Python Lambda!")
    return {"statusCode": 200, "body": json.dumps("Hello World")}
