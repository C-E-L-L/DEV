"""Summarize k6 CSV without collecting request bodies, passwords or tokens."""
import csv
import json
import math
from collections import defaultdict
from pathlib import Path

root = Path('/work')
metrics = defaultdict(list)
by_endpoint = defaultdict(lambda: defaultdict(list))
with (root / 'results/metrics.csv').open(encoding='utf-8-sig', newline='') as stream:
    for row in csv.DictReader(stream):
        try:
            value = float(row['metric_value'])
        except (ValueError, TypeError):
            continue
        name = row['metric_name']
        if name in ('http_req_duration','http_req_failed','http_reqs','checks','submission_latency','answer_consistency','login_success','vus'):
            metrics[name].append(value)
            if row.get('name') and name in ('http_req_duration','http_req_failed','http_reqs'):
                by_endpoint[row['name']][name].append(value)

def percentile(values, fraction):
    if not values:
        return None
    values = sorted(values)
    at = (len(values)-1)*fraction
    low, high = math.floor(at), math.ceil(at)
    return round(values[low] + (values[high]-values[low])*(at-low), 3)

def trend(values):
    return {'samples':len(values),'avg_ms':round(sum(values)/len(values),3) if values else None,
            'p95_ms':percentile(values,.95),'p99_ms':percentile(values,.99),'max_ms':round(max(values),3) if values else None}

def rate(values):
    return sum(values)/len(values) if values else None

result = {
    'requests':int(sum(metrics['http_reqs'])),
    'http_failure_rate':rate(metrics['http_req_failed']),
    'check_success_rate':rate(metrics['checks']),
    'login_success_rate':rate(metrics['login_success']),
    'answer_consistency_rate':rate(metrics['answer_consistency']),
    'maximum_virtual_users':max(metrics['vus']) if metrics['vus'] else None,
    'response':trend(metrics['http_req_duration']),
    'submission':trend(metrics['submission_latency']),
    'endpoints':{name:{**trend(values['http_req_duration']),'failure_rate':rate(values['http_req_failed']),
                       'requests':int(sum(values['http_reqs']))} for name,values in sorted(by_endpoint.items())},
}
(root / 'results/interim-metrics.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k != 'endpoints'}, indent=2))
