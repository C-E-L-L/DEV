"""Only generates synthetic fixture files; it never connects to a database."""
import json
import random
from pathlib import Path
from PIL import Image

root = Path('/work')
config = json.loads((root / 'runtime/test-config.json').read_text(encoding='utf-8-sig'))
if config.get('isolated') is not True or not config['marker'].startswith('cell-stability-'):
    raise SystemExit('Explicit isolation marker required')
for directory in ('originals', 'crops', 'thumbnails'):
    (root / 'runtime/data' / directory).mkdir(parents=True, exist_ok=True)
rng = random.Random(20261116)
for index in range(1, 201):
    image = Image.frombytes('RGB', (128, 128), rng.randbytes(128 * 128 * 3))
    image.save(root / 'runtime/data/crops' / f'stability-crop-{index:04}.png')
image.save(root / 'runtime/data/originals/stability-smear.png')
catalog = json.dumps({v: v for v in ['Band','Segment','Lymphocyte','Monocyte','Eosinophil','NucleatedRBC']})
sql = ["INSERT INTO animal_species(id,code,name,built_in,active,created_at,updated_at) VALUES(900000,'STABILITY','Synthetic species',0,1,NOW(6),NOW(6));"]
for index in range(1, config['users'] + 1):
    sql.append("INSERT INTO users(username,name,password,role,status,credential_version,created_at) "
               f"SELECT 'stability-{index:04}','Synthetic student {index}',password,'STUDENT','ACTIVE',0,NOW(6) FROM users WHERE username='stability-admin';")
tasks = []
for index in range(1, 4):
    task_id = 900000 + index
    sql.append("INSERT INTO tasks(id,created_at,original_filename,uploaded_filename,status,title,deadline_at,animal_species_id,kind,require_labels,results_after_deadline,revision,published_at,prepared_at,class_labels) "
               f"VALUES({task_id},NOW(6),'stability-smear.png','stability-smear.png','IN_PROGRESS','Synthetic task {index}',DATE_ADD(NOW(6),INTERVAL 7 DAY),900000,'PRACTICE',0,0,0,NOW(6),NOW(6),'{catalog}');")
    crop_ids = []
    for crop in range(1, 201):
        crop_id = 910000 + index * 1000 + crop
        crop_ids.append(crop_id)
        sql.append(f"INSERT INTO crops(id,task_id,crop_filename,bbox,excluded) VALUES({crop_id},{task_id},'stability-crop-{crop:04}.png','[0,0,128,128]',0);")
    tasks.append({'id': task_id, 'crops': crop_ids})
config['tasks'] = tasks
(root / 'runtime/test-config.json').write_text(json.dumps(config, indent=2), encoding='utf-8')
(root / 'runtime/fixture.sql').write_text('\n'.join(sql) + '\n', encoding='utf-8')
print(f'Synthetic fixture prepared: {config["users"]} students, 3 tasks, 600 crops; no production data copied.')
