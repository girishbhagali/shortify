import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

res = sb.table('clips').update({
    'status': 'deleted'
}).eq('status', 'processing').eq(
    'user_id', 'ee1da211-9188-4008-8cfa-ed0c0fee5d3a'
).execute()

print(f"Marked {len(res.data)} stuck 'processing' clips as 'deleted'")
