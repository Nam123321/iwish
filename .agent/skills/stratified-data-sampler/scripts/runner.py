import argparse
import sys
import pandas as pd

def main():
    parser = argparse.ArgumentParser(description="Stratified Data Sampler")
    parser.add_argument("--input", required=True, help="Input CSV")
    parser.add_argument("--output", required=True, help="Output CSV")
    parser.add_argument("--frac", type=float, default=0.1, help="Sampling fraction")
    args = parser.parse_args()

    try:
        df = pd.read_csv(args.input)
        
        # Check required columns
        if 'language' not in df.columns or 'intent' not in df.columns:
            print("ERROR: Dataset must contain 'language' and 'intent' columns.")
            sys.exit(1)
            
        # Handle nulls explicitly to avoid silent drops
        if df[['language', 'intent']].isnull().any().any():
            print("WARNING: Null values found in stratification keys. Imputing with 'unknown'.")
            df['language'] = df['language'].fillna('unknown')
            df['intent'] = df['intent'].fillna('unknown')
            
        # Stratified sampling
        # Using random_state for reproducibility
        sampled = df.groupby(['language', 'intent'], group_keys=False).apply(
            lambda x: x.sample(frac=args.frac, random_state=42)
        )
        
        # Save output
        sampled.to_csv(args.output, index=False)
        print(f"SUCCESS: Sampled {len(sampled)} rows from {len(df)} original rows.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
