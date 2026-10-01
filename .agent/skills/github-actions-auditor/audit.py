import os
import re

workflows_dir = '.github/workflows'

def secure_workflows():
    for filename in os.listdir(workflows_dir):
        if not filename.endswith('.yml'):
            continue
        filepath = os.path.join(workflows_dir, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Add permissions if not present at the top level
        if 'permissions:' not in content:
            # Add after 'on:' block
            content = re.sub(r'^(jobs:)', r'permissions:\n  contents: read\n\n\1', content, flags=re.MULTILINE)
            
            with open(filepath, 'w') as f:
                f.write(content)
                
def fix_race_condition():
    ci_path = os.path.join(workflows_dir, 'ci.yml')
    with open(ci_path, 'r') as f:
        content = f.read()
        
    # Fix the race condition by combining seed and test, or adding wait
    # If Prisma DB Seed is a step, let's change it so it's guaranteed to be awaited
    content = content.replace(
        "      - name: Prisma DB Seed\n        run: npx prisma db seed\n\n",
        ""
    )
    content = content.replace(
        "      - name: Run Integration Tests\n        run: npm run test:integration",
        "      - name: Run Integration Tests\n        run: |\n          npx prisma db seed\n          npm run test:integration"
    )
    
    with open(ci_path, 'w') as f:
        f.write(content)

if __name__ == '__main__':
    secure_workflows()
    fix_race_condition()
    print("Workflows secured and race condition fixed.")
