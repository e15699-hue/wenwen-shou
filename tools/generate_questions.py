#!/usr/bin/env python3
"""
問問獸題庫生成器：程式化產生數學題，0 API 成本、答案保證正確。
用法：python3 generate_questions.py [--per-type N] [--out DIR]
預設每種題型 50 題，輸出到 ../data/
"""
import json, random, argparse, os
from fractions import Fraction

random.seed(42)  # 可重現

# ============ 應用題模板 ============
WORD_PROBLEMS = {
    "低年級": [
        ("小明有 {a} 顆糖果，吃掉 {b} 顆，還剩幾顆？", lambda a, b: a - b, (10, 20), (1, 9)),
        ("媽媽買了 {a} 個蘋果，又買了 {b} 個，一共有幾個？", lambda a, b: a + b, (5, 15), (5, 10)),
        ("小華有 {a} 元，買鉛筆花了 {b} 元，還剩幾元？", lambda a, b: a - b, (10, 20), (1, 9)),
        ("公園裡有 {a} 隻小鳥，飛來 {b} 隻，現在有幾隻？", lambda a, b: a + b, (5, 12), (3, 8)),
        ("姐姐有 {a} 顆彈珠，給弟弟 {b} 顆，還剩幾顆？", lambda a, b: a - b, (10, 18), (2, 8)),
    ],
    "中年級": [
        ("一盒餅乾有 {a} 片，{b} 盒一共有幾片？", lambda a, b: a * b, (6, 12), (3, 9)),
        ("老師有 {a} 顆糖果，平分給 {b} 個小朋友，每人幾顆？", lambda a, b: a // b, None, None),  # 特殊處理
        ("操場一圈 {a} 公尺，小明跑了 {b} 圈，一共跑幾公尺？", lambda a, b: a * b, (50, 200), (2, 5)),
        ("文具店鉛筆一枝 {a} 元，買 {b} 枝要幾元？", lambda a, b: a * b, (5, 15), (3, 8)),
        ("農夫有 {a} 顆雞蛋，每 {b} 顆裝一盒，可以裝幾盒？", lambda a, b: a // b, None, None),
    ],
    "高年級": [
        ("一條繩子長 {a} 公尺，用掉 {b} 公尺，還剩幾公尺？", lambda a, b: round(a - b, 2), (10.5, 50.5), (1.5, 9.5)),
        ("長方形長 {a} 公分，寬 {b} 公分，面積是幾平方公分？", lambda a, b: a * b, (5, 20), (3, 15)),
        ("小美跑步每分鐘跑 {a} 公尺，{b} 分鐘跑幾公尺？", lambda a, b: a * b, (60, 120), (5, 15)),
        ("一瓶果汁 {a} 公升，倒掉 {b} 公升，還剩幾公升？", lambda a, b: round(a - b, 2), (2.5, 5.0), (0.5, 2.0)),
    ],
}

def gen_calculation(grade):
    """計算題：直接算式"""
    if grade == "低年級":
        a, b = random.randint(1, 20), random.randint(1, 20)
        op = random.choice(["+", "-"])
        if op == "-" and a < b: a, b = b, a
        ans = a + b if op == "+" else a - b
        return f"{a} {op} {b} = __", str(ans), f"先算個位數，再算十位數。{a} {op} {b} 等於多少？"
    elif grade == "中年級":
        op = random.choice(["+", "-", "×", "÷"])
        if op == "×":
            a, b = random.randint(2, 12), random.randint(2, 9)
            return f"{a} × {b} = __", str(a * b), f"想想乘法表，{a} × {b} 是多少？"
        elif op == "÷":
            b = random.randint(2, 9); ans = random.randint(2, 12); a = b * ans
            return f"{a} ÷ {b} = __", str(ans), f"{b} 的幾倍是 {a}？"
        else:
            a, b = random.randint(10, 99), random.randint(10, 99)
            if op == "-" and a < b: a, b = b, a
            ans = a + b if op == "+" else a - b
            return f"{a} {op} {b} = __", str(ans), f"先算個位數，再算十位數，別忘了進位或退位。"
    else:
        op = random.choice(["+", "-", "×", "÷", "frac"])
        if op == "frac":
            a, b = random.randint(1, 9), random.randint(2, 9)
            c = random.randint(1, 9)
            # a/b + c/b
            ans = Fraction(a + c, b)
            return f"{a}/{b} + {c}/{b} = __", f"{ans.numerator}/{ans.denominator}" if ans.denominator != 1 else str(ans.numerator), f"分母相同，分子相加就好。"
        elif op == "×":
            a = round(random.uniform(1.1, 9.9), 1); b = random.randint(2, 9)
            return f"{a} × {b} = __", str(round(a * b, 1)), f"先不看小數點算完，再點上小數點。"
        else:
            a = round(random.uniform(10, 99), 1); b = round(random.uniform(1, 20), 1)
            ans = round(a + b if op == "+" else a - b if op == "-" else a / b, 2)
            return f"{a} {op} {b} = __", str(ans), f"小數點要對齊再計算。"

def gen_fillblank(grade):
    """填充題：算式挖空"""
    if grade == "低年級":
        a = random.randint(5, 20); b = random.randint(1, a - 1); c = a - b
        pos = random.choice(["a", "b"])
        if pos == "a":
            return f"__ + {b} = {a}", str(c), f"什麼數加 {b} 會等於 {a}？用 {a} 減 {b} 試試。"
        else:
            return f"{c} + __ = {a}", str(b), f"{c} 再加多少會變成 {a}？"
    elif grade == "中年級":
        op = random.choice(["+", "×"])
        if op == "×":
            b = random.randint(2, 9); ans = random.randint(2, 9); a = b * ans
            return f"{b} × __ = {a}", str(ans), f"{b} 的幾倍是 {a}？想想乘法表。"
        else:
            a = random.randint(10, 50); b = random.randint(10, 50); c = a + b
            return f"__ + {b} = {c}", str(a), f"用 {c} 減 {b} 就能找到答案。"
    else:
        b = random.randint(2, 12); ans = random.randint(2, 12); a = b * ans
        return f"{b} × __ = {a}", str(ans), f"{a} ÷ {b} 等於多少？"

def gen_compare(grade):
    """比大小"""
    if grade == "低年級":
        a, b = random.randint(1, 20), random.randint(1, 20)
    elif grade == "中年級":
        a, b = random.randint(10, 999), random.randint(10, 999)
    else:
        a = round(random.uniform(1, 100), 1); b = round(random.uniform(1, 100), 1)
    ans = ">" if a > b else "<" if a < b else "="
    hint = f"先比整數部分，再比小數部分。" if grade == "高年級" else f"哪個數字比較大？"
    return f"{a} __ {b}", ans, hint

def gen_truefalse(grade):
    """是非題"""
    # 50% 出對的，50% 出錯的
    is_true = random.choice([True, False])
    if grade == "低年級":
        a, b = random.randint(1, 15), random.randint(1, 15)
        correct = a + b
        shown = correct if is_true else correct + random.choice([-2, -1, 1, 2])
        if shown < 0: shown = correct + 1
    elif grade == "中年級":
        a, b = random.randint(2, 9), random.randint(2, 9)
        correct = a * b
        shown = correct if is_true else correct + random.choice([-3, -2, 2, 3])
    else:
        a, b = random.randint(10, 50), random.randint(10, 50)
        correct = a + b
        shown = correct if is_true else correct + random.choice([-5, 5, 10])
    op = "+" if grade != "中年級" or random.choice([True, False]) else "×"
    if grade == "中年級" and op == "×":
        q = f"{a} × {b} = {shown}，對不對？"
    else:
        q = f"{a} + {b} = {shown}，對不對？"
        correct = a + b
        shown = correct if is_true else correct + random.choice([-2, 2, 5])
        q = f"{a} + {b} = {shown}，對不對？"
    ans = "對" if is_true else "不對"
    hint = f"自己算算看 {a} {'×' if '×' in q else '+'} {b} 等於多少，再比比看。"
    return q, ans, hint

def gen_choice(grade):
    """選擇題"""
    if grade == "低年級":
        a, b = random.randint(5, 15), random.randint(5, 15)
        correct = a + b; op = "+"
    elif grade == "中年級":
        a, b = random.randint(3, 12), random.randint(3, 9)
        correct = a * b; op = "×"
    else:
        a, b = random.randint(10, 99), random.randint(10, 50)
        correct = a + b; op = "+"
    # 生成干擾選項
    wrongs = set()
    while len(wrongs) < 2:
        w = correct + random.choice([-10, -5, -2, -1, 1, 2, 5, 10])
        if w != correct and w > 0: wrongs.add(w)
    options = [correct] + list(wrongs)
    random.shuffle(options)
    labels = ["A", "B", "C"]
    ans_label = labels[options.index(correct)]
    opt_str = " ".join(f"{l}.{v}" for l, v in zip(labels, options))
    q = f"{a} {op} {b} = ? {opt_str}"
    hint = f"先自己算出答案，再看看哪個選項最接近。"
    return q, ans_label, hint

def gen_word(grade):
    """應用題"""
    templates = WORD_PROBLEMS[grade]
    # 處理整除特殊情況
    for _ in range(10):
        t, fn, ra, rb = random.choice(templates)
        if ra is None:  # 需要整除
            b = random.randint(2, 9); ans = random.randint(3, 12); a = b * ans
            q = t.format(a=a, b=b)
            return q, str(ans), f"把 {a} 平均分成 {b} 份，每份是多少？"
        a = random.randint(*ra); b = random.randint(*rb)
        if "吃掉" in t or "花了" in t or "用掉" in t or "倒掉" in t:
            if a <= b: continue
        q = t.format(a=a, b=b)
        ans = fn(a, b)
        return q, str(ans), f"想想看這是變多還是變少，要用加法還是減法（乘法、除法）？"
    # 保底
    a, b = 15, 7
    return f"小明有 {a} 顆糖果，吃掉 {b} 顆，還剩幾顆？", str(a - b), "變少了，要用減法。"

GENERATORS = {
    "計算題": gen_calculation,
    "填充題": gen_fillblank,
    "應用題": gen_word,
    "比大小": gen_compare,
    "是非題": gen_truefalse,
    "選擇題": gen_choice,
}

def generate_bank(per_type=50):
    bank = {}
    qid = 0
    for grade in ["低年級", "中年級", "高年級"]:
        bank[grade] = []
        for qtype, gen_fn in GENERATORS.items():
            seen = set()
            count = 0
            tries = 0
            while count < per_type and tries < per_type * 10:
                tries += 1
                try:
                    q, ans, hint = gen_fn(grade)
                except Exception:
                    continue
                if q in seen: continue
                seen.add(q)
                qid += 1
                bank[grade].append({
                    "id": f"Q{qid:05d}",
                    "grade": grade,
                    "type": qtype,
                    "question": q,
                    "answer": ans,
                    "hint": hint,
                })
                count += 1
    return bank

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-type", type=int, default=50)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "data"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    bank = generate_bank(args.per_type)
    total = 0
    for grade, qs in bank.items():
        path = os.path.join(args.out, f"questions_{grade}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(qs, f, ensure_ascii=False, indent=1)
        print(f"{grade}: {len(qs)} 題 → {path}")
        total += len(qs)
    # 統計
    from collections import Counter
    c = Counter(q["type"] for qs in bank.values() for q in qs)
    print(f"總共 {total} 題，題型分佈：{dict(c)}")

if __name__ == "__main__":
    main()
