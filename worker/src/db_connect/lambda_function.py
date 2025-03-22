import os
import supabase

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

def lambda_handler(event, context):
    response = supabase_client.table('expenses').select('*').execute()
    return {
        'statusCode': 200,
        'body': response.data
    }
