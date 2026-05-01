import dns.resolver
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Apply the DNS fix 
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1']

mongo_uri = os.getenv("MONGO_URI")

print(f"Testing connection to: {mongo_uri}")
print("Using serverSelectionTimeoutMS=20000")

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=20000)
    print("Pinging...")
    client.admin.command('ping')
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
