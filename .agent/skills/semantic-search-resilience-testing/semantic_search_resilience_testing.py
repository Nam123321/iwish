import argparse
import json
import sys
import time
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

def test_graceful_degradation(base_url, query, token, tenant_id, output_file):
    url = f"{base_url}/api/v1/search"
    params = {'q': query, 'simulateOutage': 'true'}
    query_string = urllib_parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    
    req = urllib_request.Request(full_url)
    req.add_header('Accept', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    if tenant_id:
        req.add_header('x-tenant-id', tenant_id)
        
    result = {
        "success": False,
        "status_code": None,
        "metadata_degraded": False,
        "error": None,
        "results_count": 0
    }
    
    try:
        with urllib_request.urlopen(req, timeout=30) as response:
            result["status_code"] = response.getcode()
            body = response.read().decode('utf-8')
            data = json.loads(body)
            
            metadata = data.get("metadata", {})
            result["metadata_degraded"] = metadata.get("degraded", False)
            result["results_count"] = len(data.get("results", []))
            
            if result["status_code"] == 200 and result["metadata_degraded"]:
                result["success"] = True
                
    except urllib_error.HTTPError as e:
        result["status_code"] = e.code
        try:
            result["error"] = e.read().decode('utf-8', errors='replace')[:1000]
        except OSError:
            result["error"] = e.reason
    except Exception as e:
        result["error"] = str(e)
        
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        print(f"Success! Data written to: {output_file}")
    except OSError as e:
        print(f"Error writing to file {output_file}: {e}", file=sys.stderr)
        sys.exit(1)
        
    if not result["success"]:
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Test semantic search resilience and graceful degradation to FTS.")
    subparsers = parser.add_subparsers(dest='command', required=True)
    
    p_test = subparsers.add_parser('test', help='Run the outage simulation test')
    p_test.add_argument('--url', required=True, help='Base URL of the API (e.g., http://localhost:3000)')
    p_test.add_argument('--query', required=True, help='Search query string')
    p_test.add_argument('--token', required=False, help='Bearer token for authentication')
    p_test.add_argument('--tenant-id', required=False, help='Tenant ID header value')
    p_test.add_argument('--output', required=True, help='Output JSON file path')
    
    args = parser.parse_args()
    
    if args.command == 'test':
        test_graceful_degradation(args.url, args.query, args.token, args.tenant_id, args.output)
    else:
        print(f"Unknown command: {args.command}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
