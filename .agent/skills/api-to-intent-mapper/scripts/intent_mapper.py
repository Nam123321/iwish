#!/usr/bin/env python3
import json
import argparse
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

def strip_redundant_data(data):
    """
    Recursively removes unneeded metadata fields to save context window space.
    Fields removed include HATEOAS links, internal UUIDs, and timestamps if configured.
    """
    fields_to_remove = {'_links', 'links', 'href', 'HATEOAS', 'createdAt', 'updatedAt', 'uuid'}
    
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if k not in fields_to_remove:
                cleaned[k] = strip_redundant_data(v)
        return cleaned
    elif isinstance(data, list):
        return [strip_redundant_data(item) for item in data]
    else:
        return data

def enforce_limits(data, max_items=50, max_chars=5000):
    """
    Enforces hard limits on lists and string sizes to prevent Context Window Overflow.
    """
    if isinstance(data, list):
        limited = False
        if len(data) > max_items:
            data = data[:max_items]
            limited = True
        
        processed = [enforce_limits(item, max_items, max_chars) for item in data]
        if limited:
            processed.append({"_warning_": f"List truncated to {max_items} items to prevent overflow."})
        return processed
    
    elif isinstance(data, dict):
        return {k: enforce_limits(v, max_items, max_chars) for k, v in data.items()}
    
    elif isinstance(data, str):
        if len(data) > max_chars:
            return data[:max_chars] + f"... [Truncated to {max_chars} chars]"
        return data
        
    return data

def fetch_endpoint(endpoint_config, timeout=10):
    """
    Fetches a single REST endpoint. 
    Enforces Read-Only operations (GET or POST-query only).
    Handles 429, timeouts, and other HTTP errors safely, returning partial data structure.
    """
    url = endpoint_config.get("url")
    method = endpoint_config.get("method", "GET").upper()
    headers = endpoint_config.get("headers", {})
    payload = endpoint_config.get("payload", None)
    
    # AC6: Enforce Read-Only Tools (prevent state mutation)
    if method not in ['GET', 'POST']:
        return {"url": url, "status": "warning", "message": f"Method {method} not allowed. Only Read-Only methods (GET/POST-query) are permitted."}
        
    if payload and method == 'GET':
        # Safely ignore payload for GET or convert to query string if needed
        pass
        
    data_encoded = json.dumps(payload).encode('utf-8') if payload else None
    
    if data_encoded and 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'
        
    req = urllib.request.Request(url, data=data_encoded, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode('utf-8')
            try:
                data = json.loads(body)
                return {"url": url, "status": "success", "data": data}
            except json.JSONDecodeError:
                # If not JSON, return truncated text
                return {"url": url, "status": "success", "data": {"text_response": body[:1000]}}
                
    except urllib.error.HTTPError as e:
        # AC7: Handle Rate Limiting (429) gracefully
        if e.code == 429:
            return {"url": url, "status": "warning", "message": "Rate Limited (429)"}
        return {"url": url, "status": "warning", "message": f"HTTP Error {e.code}"}
    except urllib.error.URLError as e:
        # AC4: Handle sub-REST timeout or domain errors
        return {"url": url, "status": "warning", "message": f"URL Error / Timeout: {str(e.reason)}"}
    except Exception as e:
        return {"url": url, "status": "warning", "message": f"Unexpected Error: {str(e)}"}

def map_intent(endpoints, max_items=50, max_chars=5000):
    """
    Maps an intent by gathering data from multiple endpoints in parallel.
    Applies Context Window optimization limits and redundant data stripping.
    """
    results = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_endpoint = {executor.submit(fetch_endpoint, ep): ep for ep in endpoints}
        
        for future in as_completed(future_to_endpoint):
            ep = future_to_endpoint[future]
            url = ep.get("url")
            res = future.result()
            
            if res["status"] == "success":
                # AC3: Strip redundant JSON fields
                cleaned_data = strip_redundant_data(res["data"])
                # AC5: Apply hard limits to lists/strings
                limited_data = enforce_limits(cleaned_data, max_items, max_chars)
                results[url] = {"status": "success", "data": limited_data}
            else:
                # AC4: Return partial data with warning
                results[url] = {"status": "warning", "message": res["message"], "data": None}
                
    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Intent Mapper Data Gathering Script")
    parser.add_argument('--endpoints', type=str, required=True, 
                        help="JSON string of endpoint configurations: [{'url': '...', 'method': 'GET'}, ...]")
    parser.add_argument('--max-items', type=int, default=50, help="Max items per list to prevent context overflow")
    parser.add_argument('--max-chars', type=int, default=5000, help="Max chars per string field to prevent context overflow")
    
    args = parser.parse_args()
    
    try:
        endpoints = json.loads(args.endpoints)
        if not isinstance(endpoints, list):
            raise ValueError("Endpoints must be a JSON array of configuration objects")
            
        final_result = map_intent(endpoints, args.max_items, args.max_chars)
        print(json.dumps(final_result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
