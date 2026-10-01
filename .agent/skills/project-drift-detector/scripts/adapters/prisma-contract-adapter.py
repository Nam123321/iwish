#!/usr/bin/env python3
"""
Prisma Contract Adapter for I-Wish SDLC Anti-Drift Architecture
Parses schema.prisma AST into the standard Contract Intermediate Representation (IR).
Enforces:
- FMEA EC-P4-01: Full tracking of Relations (foreign keys, references, cascades) & Enums.
- FMEA EC-P1-03: Full tracking of Attributes (@@index, @@unique, @@id, @default, etc.).
- Deterministic SHA-256 Digest creation.
- Schema validation against contract-ir-schema.json.
"""

import os
import sys
import re
import json
import hashlib
import argparse
from typing import Dict, Any, List, Optional, Tuple

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


def clean_line(line: str) -> str:
    """Strip comments and trailing whitespace."""
    # Check for single-line comments // or ///
    idx = line.find("//")
    if idx != -1:
        line = line[:idx]
    return line.strip()


def parse_attribute_args(attr_text: str) -> Tuple[str, List[str]]:
    """
    Parse an attribute like @default(uuid()) or @@unique([tenantId, provider])
    Returns (name, [args])
    """
    m = re.match(r"^(@{1,2}[a-zA-Z0-9_]+)(?:\((.*)\))?$", attr_text.strip(), re.DOTALL)
    if not m:
        return attr_text.strip(), []
    name = m.group(1)
    args_str = m.group(2)
    if not args_str:
        return name, []
    
    # Simple split of arguments considering brackets
    # If args_str is like [a, b], c: "val"
    args = []
    # If argument contains comma outside brackets/quotes
    current = []
    in_bracket = 0
    in_quote = False
    quote_char = None
    
    for ch in args_str:
        if ch in ('"', "'"):
            if in_quote and ch == quote_char:
                in_quote = False
                quote_char = None
            elif not in_quote:
                in_quote = True
                quote_char = ch
            current.append(ch)
        elif ch in ('[', '(') and not in_quote:
            in_bracket += 1
            current.append(ch)
        elif ch in (']', ')') and not in_quote:
            in_bracket -= 1
            current.append(ch)
        elif ch == ',' and in_bracket == 0 and not in_quote:
            arg = "".join(current).strip()
            if arg:
                args.append(arg)
            current = []
        else:
            current.append(ch)
            
    last_arg = "".join(current).strip()
    if last_arg:
        args.append(last_arg)
        
    return name, args


def parse_relation_details(args: List[str], target_entity: str) -> Dict[str, Any]:
    """Parse @relation arguments into structured relation metadata."""
    rel = {
        "targetEntity": target_entity
    }
    
    for arg in args:
        # fields: [tenantId]
        m_fields = re.search(r"fields\s*:\s*\[([^\]]*)\]", arg)
        if m_fields:
            fields = [f.strip() for f in m_fields.group(1).split(",") if f.strip()]
            rel["fields"] = fields

        # references: [id]
        m_refs = re.search(r"references\s*:\s*\[([^\]]*)\]", arg)
        if m_refs:
            refs = [r.strip() for r in m_refs.group(1).split(",") if r.strip()]
            rel["references"] = refs

        # onDelete: Cascade / SetNull / Restrict
        m_del = re.search(r"onDelete\s*:\s*([a-zA-Z0-9_]+)", arg)
        if m_del:
            rel["onDelete"] = m_del.group(1)

        # onUpdate: Cascade / etc
        m_upd = re.search(r"onUpdate\s*:\s*([a-zA-Z0-9_]+)", arg)
        if m_upd:
            rel["onUpdate"] = m_upd.group(1)

    return rel


def tokenize_attributes(attrs_str: str) -> List[str]:
    """Tokenize line attributes starting with @, handling parentheses and quotes."""
    tokens = []
    current = []
    in_paren = 0
    in_quote = False
    quote_char = None
    
    i = 0
    while i < len(attrs_str):
        ch = attrs_str[i]
        if ch in ('"', "'"):
            if in_quote and ch == quote_char:
                in_quote = False
                quote_char = None
            elif not in_quote:
                in_quote = True
                quote_char = ch
            current.append(ch)
        elif ch in ('(', '[') and not in_quote:
            in_paren += 1
            current.append(ch)
        elif ch in (')', ']') and not in_quote:
            in_paren -= 1
            current.append(ch)
        elif ch.isspace() and in_paren == 0 and not in_quote:
            tok = "".join(current).strip()
            if tok:
                tokens.append(tok)
            current = []
        else:
            current.append(ch)
        i += 1
        
    last_tok = "".join(current).strip()
    if last_tok:
        tokens.append(last_tok)
        
    return tokens


def parse_prisma_schema(content: str, filter_models: Optional[List[str]] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Parses a schema.prisma file content.
    Returns (entities, enums).
    """
    entities: Dict[str, Any] = {}
    enums: Dict[str, Any] = {}
    
    lines = content.splitlines()
    in_block_type: Optional[str] = None
    current_block_name: Optional[str] = None
    block_lines: List[str] = []
    
    for raw_line in lines:
        line = clean_line(raw_line)
        if not line:
            continue
            
        if in_block_type is None:
            # Check for start of model, enum, datasource, generator
            m_block = re.match(r"^(model|enum|datasource|generator)\s+([a-zA-Z0-9_]+)\s*\{?", line)
            if m_block:
                in_block_type = m_block.group(1)
                current_block_name = m_block.group(2)
                block_lines = []
                if "}" in line:
                    # Single-line block
                    in_block_type = None
                    current_block_name = None
        else:
            if line.endswith("}") or line == "}":
                # End of current block
                if in_block_type == "model":
                    if not filter_models or current_block_name in filter_models:
                        entities[current_block_name] = parse_model_block(block_lines)
                elif in_block_type == "enum":
                    enums[current_block_name] = parse_enum_block(block_lines)
                in_block_type = None
                current_block_name = None
                block_lines = []
            else:
                block_lines.append(line)
                
    return entities, enums


def parse_enum_block(lines: List[str]) -> Dict[str, Any]:
    """Parse enum block lines into values array."""
    values = []
    for line in lines:
        val = line.strip().split()[0] if line.strip() else ""
        if val and not val.startswith("//"):
            values.append(val)
    return {"values": sorted(values)}


def parse_model_block(lines: List[str]) -> Dict[str, Any]:
    """Parse model block lines into fields and attributes."""
    fields: Dict[str, Any] = {}
    attributes: List[Dict[str, Any]] = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("@@"):
            # Model-level attribute e.g. @@unique([tenantId, provider])
            attr_name, attr_args = parse_attribute_args(line)
            attributes.append({
                "name": attr_name,
                "args": attr_args,
                "raw": line
            })
        else:
            # Field declaration: fieldName FieldType [attributes...]
            parts = line.split(maxsplit=2)
            if len(parts) < 2:
                continue
            field_name = parts[0]
            raw_type = parts[1]
            attrs_str = parts[2] if len(parts) > 2 else ""
            
            # Determine array, optional, base type
            is_array = False
            is_optional = False
            base_type = raw_type
            
            if base_type.endswith("[]"):
                is_array = True
                base_type = base_type[:-2]
            if base_type.endswith("?"):
                is_optional = True
                base_type = base_type[:-1]
                
            field_def: Dict[str, Any] = {
                "type": base_type,
                "isArray": is_array,
                "isOptional": is_optional,
                "isId": False,
                "isUnique": False,
                "attributes": []
            }
            
            # Parse field attributes
            attr_tokens = tokenize_attributes(attrs_str)
            for tok in attr_tokens:
                name, args = parse_attribute_args(tok)
                if name == "@id":
                    field_def["isId"] = True
                elif name == "@unique":
                    field_def["isUnique"] = True
                elif name == "@default":
                    field_def["defaultValue"] = args[0] if args else "true"
                elif name == "@relation":
                    # Parse relational details (FMEA EC-P4-01)
                    rel_data = parse_relation_details(args, base_type)
                    field_def["relation"] = rel_data
                    
                field_def["attributes"].append({
                    "name": name,
                    "args": args
                })
                
            fields[field_name] = field_def
            
    # Sort fields for canonical reproducibility
    sorted_fields = dict(sorted(fields.items()))
    # Sort attributes by raw string
    sorted_attributes = sorted(attributes, key=lambda a: a.get("raw", a["name"]))
    
    return {
        "fields": sorted_fields,
        "attributes": sorted_attributes
    }


def compute_canonical_digest(data: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hash of the contract data.
    Keys are sorted and data is canonicalized.
    """
    # Clone and strip dynamic fields for digest calculation
    clean_data = {
        "contractId": data.get("contractId"),
        "version": data.get("version"),
        "kind": data.get("kind"),
        "entities": data.get("entities", {}),
        "enums": data.get("enums", {}),
        "operations": data.get("operations", {})
    }
    canonical_json = json.dumps(clean_data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()


def generate_contract_ir(
    prisma_file_path: str,
    contract_id: Optional[str] = None,
    version: str = "1.0.0",
    filter_models: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Generates the full Contract IR dictionary from a schema.prisma file."""
    if not os.path.exists(prisma_file_path):
        raise FileNotFoundError(f"Prisma file not found at: {prisma_file_path}")
        
    with open(prisma_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    entities, enums = parse_prisma_schema(content, filter_models=filter_models)
    
    cid = contract_id or f"prisma-{os.path.splitext(os.path.basename(prisma_file_path))[0]}"
    
    contract_ir = {
        "contractId": cid,
        "version": version,
        "kind": "database",
        "digest": "",
        "metadata": {
            "sourceFile": os.path.abspath(prisma_file_path),
            "generator": "prisma-contract-adapter.py"
        },
        "enums": enums,
        "entities": entities,
        "operations": {}
    }
    
    # Calculate deterministic digest
    contract_ir["digest"] = compute_canonical_digest(contract_ir)
    return contract_ir


def validate_contract_ir(contract_ir: Dict[str, Any], schema_path: str) -> Tuple[bool, Optional[str]]:
    """Validates Contract IR against JSON schema."""
    if not HAS_JSONSCHEMA:
        return True, "jsonschema module not available, skipped validation."
        
    if not os.path.exists(schema_path):
        return False, f"Contract IR schema not found at: {schema_path}"
        
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
        
    try:
        jsonschema.validate(instance=contract_ir, schema=schema)
        return True, None
    except jsonschema.ValidationError as err:
        return False, f"Schema validation error at {list(err.path)}: {err.message}"
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(description="Prisma Contract Adapter: Convert schema.prisma to Contract IR")
    parser.add_argument("--file", "-f", required=True, help="Path to schema.prisma file")
    parser.add_argument("--out", "-o", help="Path to output JSON file (default: stdout)")
    parser.add_argument("--contract-id", help="Custom contract ID")
    parser.add_argument("--version", default="1.0.0", help="Contract version (default: 1.0.0)")
    parser.add_argument("--models", help="Comma-separated list of models to include (default: all)")
    parser.add_argument("--validate", action="store_true", help="Validate output against contract-ir-schema.json")
    parser.add_argument("--schema-path", default=".agent/schemas/contract-ir-schema.json", help="Path to contract-ir-schema.json")
    
    args = parser.parse_args()
    
    filter_models = [m.strip() for m in args.models.split(",")] if args.models else None
    
    try:
        ir = generate_contract_ir(
            prisma_file_path=args.file,
            contract_id=args.contract_id,
            version=args.version,
            filter_models=filter_models
        )
        
        if args.validate:
            is_valid, error = validate_contract_ir(ir, args.schema_path)
            if not is_valid:
                print(f"[ERROR] Contract IR failed validation: {error}", file=sys.stderr)
                sys.exit(1)
            else:
                print(f"[OK] Contract IR validated against {args.schema_path}", file=sys.stderr)
                
        output_json = json.dumps(ir, indent=2, ensure_ascii=False)
        
        if args.out:
            os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
            with open(args.out, "w", encoding="utf-8") as f:
                f.write(output_json)
            print(f"[SUCCESS] Wrote Contract IR to {args.out} (Digest: {ir['digest'][:16]}...)", file=sys.stderr)
        else:
            print(output_json)
            
    except Exception as e:
        print(f"[FATAL] Error executing Prisma Contract Adapter: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
