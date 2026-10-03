import socket
import json
import fcntl
import os

def log_fallback(query):
    try:
        with open("ucg-pending-writes.jsonl", "a") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            f.write(json.dumps({"query": query}) + "\n")
            fcntl.flock(f, fcntl.LOCK_UN)
    except Exception as e:
        print(f"Failed to write fallback log: {e}")

FALKORDB_HOST = os.environ.get("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.environ.get("FALKORDB_PORT", "6379"))  # Cowok-ai uses 6379 (Distro uses 6379)

def execute_query(query, params=None):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0)
        sock.connect((FALKORDB_HOST, FALKORDB_PORT))
        
        graph_name = "UCG"
        redis_cmd = f"*3\r\n$11\r\nGRAPH.QUERY\r\n${len(graph_name)}\r\n{graph_name}\r\n${len(query)}\r\n{query}\r\n"
        sock.sendall(redis_cmd.encode('utf-8'))
        
        response = sock.recv(4096)
        # print(f"Executed: {query}, Response: {response.decode('utf-8').strip()}")
        sock.close()
        return True
    except (socket.timeout, ConnectionRefusedError, Exception) as e:
        print(f"[Adapter Error] Query failed: {e}. Writing to fallback buffer.")
        log_fallback(query)
        return False

def execute_queries(queries, batch_size=10):
    """
    Executes multiple queries in batches to prevent socket timeout (FMEA-14).
    Reuses connection per batch.
    """
    success_count = 0
    graph_name = "UCG"
    
    for i in range(0, len(queries), batch_size):
        batch = queries[i:i + batch_size]
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2.0)
            sock.connect((FALKORDB_HOST, FALKORDB_PORT))
            
            for query in batch:
                redis_cmd = f"*3\r\n$11\r\nGRAPH.QUERY\r\n${len(graph_name)}\r\n{graph_name}\r\n${len(query)}\r\n{query}\r\n"
                sock.sendall(redis_cmd.encode('utf-8'))
                sock.recv(4096)
                success_count += 1
                
            sock.close()
        except (socket.timeout, ConnectionRefusedError, Exception) as e:
            print(f"[Adapter Error] Batch failed: {e}. Writing remaining {len(batch)} queries to fallback buffer.")
            for query in batch:
                log_fallback(query)
                
    return success_count
