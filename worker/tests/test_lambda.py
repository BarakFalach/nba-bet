import json
from src.db_connect.lambda_function import lambda_handler

def test_lambda_handler():
    event = {}
    context = None
    response = lambda_handler(event, context)
    assert response['statusCode'] == 200
    assert json.loads(response['body']) == 'Hello from Lambda!'

