from database import NodeStore
import os
from dotenv import load_dotenv

load_dotenv()
node_store = NodeStore()
nodes = node_store.get_all()
print(f"Found {len(nodes)} nodes")
for node in nodes:
    print(f"Node ID: {node['node_id']}, Name: {node['node_name']}, Status: {node['status']}, Stream URL: {node.get('stream_url')}, RTSP URL: {node.get('rtsp_url')}")
