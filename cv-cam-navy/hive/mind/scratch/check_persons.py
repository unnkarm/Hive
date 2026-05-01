from database import PersonStore
import os
from dotenv import load_dotenv

load_dotenv()
person_store = PersonStore()
persons = person_store.get_all_persons()
print(f"Found {len(persons)} persons")
for p in persons:
    print(f"Person ID: {p['person_id']}, Name: {p['name']}, Registered: {p['registered_at']}")
