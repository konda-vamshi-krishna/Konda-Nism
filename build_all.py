import os
import subprocess
import json

def build_all():
    content_dir = 'g:/mock text/content'
    
    # Iterate through all subdirectories in content/
    modules = []
    for item in sorted(os.listdir(content_dir)):
        item_path = os.path.join(content_dir, item)
        if os.path.isdir(item_path):
            config_path = os.path.join(item_path, 'config.json')
            if os.path.exists(config_path):
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    modules.append(item)
                except Exception as e:
                    print(f"Skipping {item} due to error reading config: {e}")

    print(f"Detected modules to build: {modules}")
    
    # Run build scripts for each module
    for module in modules:
        print(f"\n==========================================")
        print(f"Building Course Module: {module}")
        print(f"==========================================")
        
        if module == "nism-series-8":
            # 1. Rebuild and sanitize markdown and initial JSON
            rebuild_cmd = ["python", "rebuild_everything.py", "--module", module]
            print(f"Running: {' '.join(rebuild_cmd)}")
            subprocess.run(rebuild_cmd, check=True)
            
            # 2. Pad mock tests to 100 questions
            pad_cmd = ["python", "complete_all_tests.py", "--module", module]
            print(f"Running: {' '.join(pad_cmd)}")
            subprocess.run(pad_cmd, check=True)
            
            # 3. Audit question data and correct schemas
            audit_cmd = ["python", "audit_tests.py", "--module", module]
            print(f"Running: {' '.join(audit_cmd)}")
            subprocess.run(audit_cmd, check=True)
            
            # 4. Run semantic finance checks
            semantic_cmd = ["python", "semantic_audit.py", "--module", module]
            print(f"Running: {' '.join(semantic_cmd)}")
            subprocess.run(semantic_cmd, check=True)
        else:
            # For general non-finance or static contributor modules, only audit/correct IDs/answers
            audit_cmd = ["python", "audit_tests.py", "--module", module]
            print(f"Running: {' '.join(audit_cmd)}")
            subprocess.run(audit_cmd, check=True)

    # Compile the central registry
    print(f"\n==========================================")
    print("Compiling Central Registry")
    print(f"==========================================")
    compile_cmd = ["python", "compile_registry.py"]
    subprocess.run(compile_cmd, check=True)
    print("\n[SUCCESS] All course modules built and registry compiled successfully!")

if __name__ == '__main__':
    build_all()
