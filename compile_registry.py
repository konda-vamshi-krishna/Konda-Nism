import os
import json

def compile_registry():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    content_dir = os.path.join(base_dir, 'content')
    registry_path = os.path.join(content_dir, 'registry.json')
    
    courses = []
    
    # Iterate through all subdirectories in content/
    for item in sorted(os.listdir(content_dir)):
        item_path = os.path.join(content_dir, item)
        if os.path.isdir(item_path):
            if item == 'ssc-10th-class':
                continue
            config_path = os.path.join(item_path, 'config.json')
            if os.path.exists(config_path):
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    
                    # Verify required keys for registry compilation
                    if all(k in config for k in ['id', 'title', 'description']):
                        courses.append({
                            "id": config["id"],
                            "title": config["title"],
                            "description": config["description"],
                            "folder": item
                        })
                        print(f"Registered course module: {config['id']} (folder: {item})")
                except Exception as e:
                    print(f"Error reading config for {item}: {e}")

    registry_data = { "courses": courses }
    
    with open(registry_path, 'w', encoding='utf-8') as f:
        json.dump(registry_data, f, indent=2)
        
    print(f"Successfully compiled registry.json with {len(courses)} courses.")

if __name__ == '__main__':
    compile_registry()
