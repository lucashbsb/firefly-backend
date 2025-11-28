import json
import uuid
from pathlib import Path

def generate_uuid():
    return str(uuid.uuid4())

def read_json_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def escape_sql_string(text):
    if text is None:
        return 'NULL'
    return "'" + text.replace("'", "''") + "'"

def classify_skill_for_tracks(skill):
    tracks = []
    code = skill['code']
    category = skill['category']
    level = skill['level_min']
    
    tracks.append('a1_to_c1_365_days')
    
    interview_keywords = ['job', 'work', 'career', 'interview', 'employment', 'professional', 'business', 'cv', 'resume']
    dev_keywords = ['tech', 'computer', 'software', 'code', 'programming', 'debug', 'developer', 'engineer']
    
    skill_text = (skill['name'] + ' ' + skill['description'] + ' ' + code).lower()
    
    is_interview = any(kw in skill_text for kw in interview_keywords)
    is_dev = any(kw in skill_text for kw in dev_keywords)
    
    if skill['track'] == 'business':
        is_interview = True
    
    essential_categories = ['grammar', 'vocabulary', 'speaking', 'writing']
    essential_for_interview = category in essential_categories or 'question' in skill_text or 'talk' in skill_text or 'express' in skill_text
    essential_for_dev = category in essential_categories or 'read' in skill_text or 'email' in skill_text or 'document' in skill_text
    
    if is_interview or (essential_for_interview and level in ['a1', 'a2', 'b1']):
        tracks.append('interview_90_days')
    
    if is_dev or (essential_for_dev and level in ['a1', 'a2', 'b1']):
        tracks.append('dev_daily_90_days')
    
    return tracks

def distribute_skills_in_tracks(all_skills):
    track_skills = {
        'a1_to_c1_365_days': [],
        'interview_90_days': [],
        'dev_daily_90_days': []
    }
    
    for skill in all_skills:
        tracks = classify_skill_for_tracks(skill)
        for track in tracks:
            track_skills[track].append(skill)
    
    return track_skills

def generate_skill_inserts():
    refs_dir = Path('/Users/lucashelio/developer/firefly-group/firefly-backend/refs/skills')
    
    skill_files = {
        'a1': refs_dir / 'a1.json',
        'a2': refs_dir / 'a2.json',
        'b1': refs_dir / 'b1.json',
        'b2': refs_dir / 'b2.json',
        'c1': refs_dir / 'c1.json'
    }
    
    category_map = {}
    level_map = {}
    skill_map = {}
    
    all_skills = []
    for level, filepath in skill_files.items():
        skills = read_json_file(filepath)
        all_skills.extend(skills)
    
    track_skills_distribution = distribute_skills_in_tracks(all_skills)
    
    sql_output = []
    sql_output.append("-- =========================================================")
    sql_output.append("-- Seed Data: Skills System")
    sql_output.append("-- =========================================================\n")
    
    sql_output.append("-- 1) CEFR Levels (using schema IDs 1-5)")
    level_map = {'a1': 1, 'a2': 2, 'b1': 3, 'b2': 4, 'c1': 5}
    
    sql_output.append("\n-- 2) Skill Categories (using schema IDs)")
    categories = sorted(set(skill['category'] for skill in all_skills))
    for idx, category in enumerate(categories, 1):
        category_map[category] = idx
    
    sql_output.append("\n-- 3) Skills")
    for skill in all_skills:
        skill_id = generate_uuid()
        skill_map[skill['code']] = skill_id
        
        category_id = category_map[skill['category']]
        level_min_id = level_map[skill['level_min']]
        level_max_id = level_map[skill['level_max']]
        
        name = escape_sql_string(skill['name'])
        description = escape_sql_string(skill['description'])
        
        track_code = 'general'
        if skill.get('track'):
            track_code = skill['track']
        
        sql_output.append(f"INSERT INTO tb_skills (id, code, name, description, category_id, level_min_id, level_max_id, importance_weight, difficulty_weight, created_at, updated_at) VALUES")
        sql_output.append(f"  ('{skill_id}', '{skill['code']}', {name}, {description}, {category_id}, {level_min_id}, {level_max_id}, {skill['importance_weight']}, {skill['difficulty_weight']}, NOW(), NOW());")
    
    sql_output.append("\n-- 4) Skill Examples")
    for skill in all_skills:
        skill_id = skill_map[skill['code']]
        for idx, example in enumerate(skill['examples'], 1):
            example_text = escape_sql_string(example)
            sql_output.append(f"INSERT INTO tb_skill_examples (skill_id, example, sort_order, created_at, updated_at) VALUES")
            sql_output.append(f"  ('{skill_id}', {example_text}, {idx}, NOW(), NOW());")
    
    sql_output.append("\n-- 5) Skill Dependencies")
    for skill in all_skills:
        skill_id = skill_map[skill['code']]
        for dep_code in skill['dependencies']:
            if dep_code in skill_map:
                dep_id = skill_map[dep_code]
                sql_output.append(f"INSERT INTO tb_skill_dependencies (skill_id, dependency_skill_id, created_at, updated_at) VALUES")
                sql_output.append(f"  ('{skill_id}', '{dep_id}', NOW(), NOW());")
    
    sql_output.append("\n-- =========================================================")
    sql_output.append("-- Learning Tracks")
    sql_output.append("-- =========================================================\n")
    
    track_365_id = generate_uuid()
    track_interview_id = generate_uuid()
    track_dev_id = generate_uuid()
    
    sql_output.append("-- Track 1: A1 to C1 in 365 days")
    sql_output.append(f"INSERT INTO tb_learning_tracks (id, code, name, description, target_min_level_id, target_max_level_id, created_at, updated_at) VALUES")
    sql_output.append(f"  ('{track_365_id}', 'a1_to_c1_365_days', 'A1 to C1 in 365 Days', 'Complete English proficiency journey from beginner to advanced in one year', 1, 5, NOW(), NOW());")
    
    sql_output.append("\n-- Track 2: English for Interviews in 90 days")
    sql_output.append(f"INSERT INTO tb_learning_tracks (id, code, name, description, target_min_level_id, target_max_level_id, created_at, updated_at) VALUES")
    sql_output.append(f"  ('{track_interview_id}', 'interview_90_days', 'English for Interviews in 90 Days', 'Master essential English skills for job interviews and professional communication', 1, 3, NOW(), NOW());")
    
    sql_output.append("\n-- Track 3: English for Dev Daily in 90 days")
    sql_output.append(f"INSERT INTO tb_learning_tracks (id, code, name, description, target_min_level_id, target_max_level_id, created_at, updated_at) VALUES")
    sql_output.append(f"  ('{track_dev_id}', 'dev_daily_90_days', 'English for Dev Daily in 90 Days', 'Essential English for daily developer tasks: reading docs, emails, code reviews, and team communication', 1, 3, NOW(), NOW());")
    
    sql_output.append("\n-- =========================================================")
    sql_output.append("-- Learning Track Skills Distribution")
    sql_output.append("-- =========================================================\n")
    
    sql_output.append(f"-- Track 1: A1 to C1 (365 days) - {len(track_skills_distribution['a1_to_c1_365_days'])} skills")
    for idx, skill in enumerate(track_skills_distribution['a1_to_c1_365_days'], 1):
        skill_id = skill_map[skill['code']]
        weight = skill['importance_weight'] / 5.0
        sql_output.append(f"INSERT INTO tb_learning_track_skills (learning_track_id, skill_id, sort_order, is_required, track_weight, created_at, updated_at) VALUES")
        sql_output.append(f"  ('{track_365_id}', '{skill_id}', {idx}, true, {weight:.2f}, NOW(), NOW());")
    
    sql_output.append(f"\n-- Track 2: Interview (90 days) - {len(track_skills_distribution['interview_90_days'])} skills")
    for idx, skill in enumerate(track_skills_distribution['interview_90_days'], 1):
        skill_id = skill_map[skill['code']]
        weight = skill['importance_weight'] / 5.0
        is_required = skill['importance_weight'] >= 4
        sql_output.append(f"INSERT INTO tb_learning_track_skills (learning_track_id, skill_id, sort_order, is_required, track_weight, created_at, updated_at) VALUES")
        sql_output.append(f"  ('{track_interview_id}', '{skill_id}', {idx}, {str(is_required).lower()}, {weight:.2f}, NOW(), NOW());")
    
    sql_output.append(f"\n-- Track 3: Dev Daily (90 days) - {len(track_skills_distribution['dev_daily_90_days'])} skills")
    for idx, skill in enumerate(track_skills_distribution['dev_daily_90_days'], 1):
        skill_id = skill_map[skill['code']]
        weight = skill['importance_weight'] / 5.0
        is_required = skill['importance_weight'] >= 4
        sql_output.append(f"INSERT INTO tb_learning_track_skills (learning_track_id, skill_id, sort_order, is_required, track_weight, created_at, updated_at) VALUES")
        sql_output.append(f"  ('{track_dev_id}', '{skill_id}', {idx}, {str(is_required).lower()}, {weight:.2f}, NOW(), NOW());")
    
    output_file = Path('/Users/lucashelio/developer/firefly-group/firefly-backend/database/seed_skills.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_output))
    
    print(f"SQL file generated: {output_file}")
    print(f"\nTotal skills: {len(all_skills)}")
    print(f"Total categories: {len(categories)}")
    print(f"Total examples: {sum(len(s['examples']) for s in all_skills)}")
    print(f"Total dependencies: {sum(len(s['dependencies']) for s in all_skills)}")
    print(f"\nLearning Tracks Distribution:")
    print(f"  - A1 to C1 (365 days): {len(track_skills_distribution['a1_to_c1_365_days'])} skills")
    print(f"  - Interview (90 days): {len(track_skills_distribution['interview_90_days'])} skills")
    print(f"  - Dev Daily (90 days): {len(track_skills_distribution['dev_daily_90_days'])} skills")

if __name__ == '__main__':
    generate_skill_inserts()
