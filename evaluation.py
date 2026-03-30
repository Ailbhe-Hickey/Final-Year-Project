import math
import random

import numpy as np

# Needs 

NEEDS = [
    {"id": "water", "label": "Water", "category": "drink"},
    {"id": "tea", "label": "Tea", "category": "drink"},
    {"id": "coffee", "label": "Coffee", "category": "drink"},

    {"id": "breakfast", "label": "Breakfast", "category": "food"},
    {"id": "lunch", "label": "Lunch", "category": "food"},
    {"id": "dinner", "label": "Dinner", "category": "food"},

    {"id": "mouth", "label": "Mouth", "category": "hygiene"},
    {"id": "toilet", "label": "Toilet", "category": "hygiene"},
    
    {"id": "chest", "label": "Chest", "category": "comfort"},
    {"id": "cold", "label": "Cold", "category": "comfort"},
    {"id": "warm", "label": "Warm", "category": "comfort"},
    {"id": "up", "label": "Up", "category": "comfort"},
    {"id": "down", "label": "Down", "category": "comfort"},
    {"id": "left", "label": "Left", "category": "comfort"},
    {"id": "right", "label": "Right", "category": "comfort"},
    {"id": "blanket", "label": "Blanket", "category": "comfort"},
    
    {"id": "pain", "label": "Pain Relief", "category": "pain"},
    {"id": "medication", "label": "Medication", "category": "medication"},
    {"id": "tv", "label": "TV", "category": "entertainment"},
    {"id": "physio", "label": "Physio", "category": "physio"},
    {"id": "hello", "label": "Hello", "category": "greeting"},
    {"id": "sleep", "label": "Sleep", "category": "sleep"},
    {"id": "music", "label": "Music", "category": "entertainment"},
    {"id": "help", "label": "Help", "category": "pain", "emergency": True},
]

TIME_CATEGORY_MAP = {
    "morning":   ["hygiene", "breakfast", "medication", "comfort"],
    "afternoon": ["food", "entertainment", "physio", "drink"],
    "evening":   ["dinner", "family", "comfort", "relaxation"],
    "night":     ["sleep", "pain", "bathroom", "medication"],
}

FOLLOW_UP_CATEGORY_MAP = {
    "greeting":      ["comfort", "entertainment", "family"],
    "pain":          ["medication", "bathroom", "comfort"],
    "food":          ["drink", "comfort"],
    "drink":         ["comfort", "bathroom"],
    "medication":    ["comfort", "sleep"],
    "physio":        ["comfort", "pain", "drink"],
    "bathroom":      ["hygiene", "comfort"],
    "entertainment": ["comfort", "family"],
    "hygiene":       ["comfort", "clothing"],
}

def frequency_score(stats):
    if not stats or stats["frequency"] <= 0:
        return 0
    return min(math.log1p(stats["frequency"]) / math.log1p(20), 1)

def recency_score(stats, now):
    if not stats or not stats["lastUsed"]:
        return 0
    return math.exp(-(now - stats["lastUsed"]) / (1000 * 60 * 60 * 24))

def context_score(need, context):
    score = 0
    if need.get("emergency"):
        score += 1
    if need.get("category") in TIME_CATEGORY_MAP.get(context["timeOfDay"], []):
        score += 0.5
    if context.get("lastSelectedNeedCategory"):
        if need.get("category") in FOLLOW_UP_CATEGORY_MAP.get(context["lastSelectedNeedCategory"], []):
            score += 0.4
    return min(score, 1)

def rank_needs(needs, user_stats, context, now):
    scored = []
    for need in needs:
        stats = user_stats.get(need["id"])
        score = (0.5 * frequency_score(stats) +
                 0.3 * recency_score(stats, now) +
                 0.2 * context_score(need, context))
        scored.append({**need, "score": score})
    return sorted(scored, key=lambda x: x["score"], reverse=True)

def get_time_of_day(hour):
    if 5 <= hour < 12:  return "morning"
    if 12 <= hour < 17: return "afternoon"
    if 17 <= hour < 21: return "evening"
    return "night"

# ------------------------------------------------------------------------------------------------------------------
USER_PATTERN = [
    ("mouth", "morning", 3), 
    ("breakfast", "morning", 3),
    ("medication", "morning", 3), 
    ("water", "morning", 2),
    ("water", "afternoon", 4), 
    ("tv", "afternoon", 2), 
    ("lunch", "afternoon", 3), 
    ("physio", "afternoon", 2),
    ("pain", "afternoon", 1), 
    ("dinner", "evening", 3),
    ("blanket", "evening", 2),
    ("medication", "night", 3), 
    ("pain", "night", 2),
    ("toilet", "night", 2), 
    ("sleep", "night", 3),
]

def pick_need_for_time(time_of_day):
    candidates = [(nid, w) for nid, t, w in USER_PATTERN if t == time_of_day]
    if not candidates:
        candidates = [(nid, w) for nid, t, w in USER_PATTERN]
    ids, weights = zip(*candidates)
    return random.choices(ids, weights=weights, k=1)[0]

# Simulation ---------------------------------------------------------------------------
random.seed(42)

milliseconds_in_hour = 1000 * 60 * 60
milliseconds_in_day  = milliseconds_in_hour * 24
time_of_day_hours  = {"morning": 8, "afternoon": 13, "evening": 18, "night": 22}
time_of_day  = ["morning", "afternoon", "evening", "night"]

user_stats = {}
results_adaptive = []
results_baseline = []
static_order = sorted(NEEDS, key=lambda n: n["label"])

selection_num = 0
last_category = None

for day in range(7):    # 7 days
    
    for slot in time_of_day: # each day has 4 time slots
        
        hour = time_of_day_hours[slot] 
        
        for s in range(random.randint(3, 5)): # each time slot has 3-5 selections
            now = s * milliseconds_in_hour // 2 + day * milliseconds_in_day + hour * milliseconds_in_hour    # moving time
            context = {"timeOfDay": slot, "lastSelectedNeedCategory": last_category}

            ranked = rank_needs(NEEDS, user_stats, context, now)   # gives ranked needs
            selected_id = pick_need_for_time(slot)      # picks a need based on the user pattern 
            
            # Find the need object for the selected_id
            selected_need = None
            for n in NEEDS:
                if n["id"] == selected_id:
                    selected_need = n
                    break


            # see where the selected need is in the adaptive ranking
            adaptive_pos = len(NEEDS)
            for i, n in enumerate(ranked):
                if n["id"] == selected_id:
                    adaptive_pos = i + 1
                    break    
                
                
            # see where the selected need is in the static ranking
            baseline_pos = len(NEEDS)
            for i, n in enumerate(static_order):
                if n["id"] == selected_id:
                    baseline_pos = i + 1
                    break    
 

            results_adaptive.append((selection_num, adaptive_pos, selected_need["label"], slot))    # store the results for adaptive
            results_baseline.append((selection_num, baseline_pos, selected_need["label"], slot))    # store the results for baseline



            # update stats
            if selected_id not in user_stats:
                user_stats[selected_id] = {"frequency": 0, "lastUsed": 0}
            user_stats[selected_id]["frequency"] += 1
            user_stats[selected_id]["lastUsed"] = now
            last_category = selected_need.get("category")
            selection_num += 1
            
            

# Results ---------------------------------------------------------------------------


# adaptive positions
adaptive_positions = []
for r in results_adaptive:
    adaptive_positions.append(r[1])

# baseline positions
baseline_positions = []
for r in results_baseline:
    baseline_positions.append(r[1])

# Metrics
adaptive_avg = np.mean(adaptive_positions)
baseline_avg = np.mean(baseline_positions)


# Count how many adaptive positions are in the top 5
count_top5 = 0
for p in adaptive_positions:
    if p <= 5:
        count_top5 += 1
top5_a = (count_top5 / len(adaptive_positions)) * 100


# Count how many baseline positions are in the top 5
count_top5_b = 0
for p in baseline_positions:
    if p <= 5:
        count_top5_b += 1
top5_b = (count_top5_b / len(baseline_positions)) * 100



# Output
print("\nTotal selections: " + str(selection_num))
print("Average rank position for baseline: " + str(baseline_avg))
print("Average rank position for adaptive: " + str(adaptive_avg))
print("% selected in top 5 for baseline: " + str(top5_b) + "%")
print("% selected in top 5 for adaptive: " + str(top5_a) + "%")