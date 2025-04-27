
def lambda_handler(event, context):
    
    # sample lambda using AWS Lambda

    return {
        'statusCode': 200,
        'body': ":)"
    }

if __name__ == "__main__":
    # This is for local testing
    event = {}
    context = {}
    lambda_handler(event, context)
