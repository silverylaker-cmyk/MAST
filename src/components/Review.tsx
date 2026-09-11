import { useMemo, useState } from 'react';
import { ALLERGENS, byNo } from '../lib/allergens';
import { summarize } from '../lib/classify';
import { CLASS_COLOR } from '../slides/theme';
import type { Finding } from '../lib/types';

interface Props {
  image: string;
  findings: Finding[];
  totalIgE: number | null;
  patientLabel: string;
  onChange: (f: Finding[]) => void;
  onPatient: (s: string) => void;
  onTotalIgE: (n: number | null) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function Review(p: Props) {
  const [addQuery, setAddQuery] = useState('');
  const [addCls, setAddCls] = useState(2);
  const unmatched = p.findings.filter((f) => f.no === null);
  const lowConf = p.findings.filter((f) => f.no !== null && f.score < 0.8);
  const fams = useMemo(() => summarize(p.findings), [p.findings]);

  const candidates = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return [];
    return ALLERGENS.filter(
      (a) => a.name_ko.toLowerCase().includes(q) || a.name_en.toLowerCase().includes(q) || a.family.includes(q),
    ).slice(0, 8);
  }, [addQuery]);

  function update(i: number, patch: Partial<Finding>) {
    const next = p.findings.map((f, j) => (j === i ? { ...f, ...patch } : f));
    p.onChange(next);
  }
  function remove(i: number) {
    p.onChange(p.findings.filter((_, j) => j !== i));
  }
  function add(no: number) {
    const a = byNo.get(no)!;
    p.onChange([...p.findings, { raw: a.name_ko, cls: addCls, no, score: 1 }]);
    setAddQuery('');
  }

  return (
    <div className="review">
      <div className="review-left">
        <img src={p.image} alt="결과지" />
        <div className="patient-row">
          <label>
            환자 표기(선택)
            <input value={p.patientLabel} onChange={(e) => p.onPatient(e.target.value)} placeholder="예: 홍길동 / 김OO" />
          </label>
          <label>
            총 IgE
            <input
              type="number"
              value={p.totalIgE ?? ''}
              onChange={(e) => p.onTotalIgE(e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
        </div>
      </div>
      <div className="review-right">
        <h2>판독 결과 확인</h2>
        <p className="muted">
          결과지와 비교해서 틀린 항목은 고치거나 지우세요. 슬라이드에는 Class 1 이상만, 같은 항원(주항원·조항원)은 하나로 묶여
          표시됩니다.
        </p>
        {unmatched.length > 0 && (
          <div className="warn">
            목록에 없는 항목 {unmatched.length}개 (약물 등은 무시해도 됩니다): {unmatched.map((f) => f.raw).join(', ')}
          </div>
        )}
        {lowConf.length > 0 && <div className="warn soft">확신이 낮은 매칭 {lowConf.length}개 — 노란 표시를 확인해 주세요.</div>}

        <table>
          <thead>
            <tr>
              <th>결과지 원문</th>
              <th>매칭된 항원</th>
              <th>Class</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {p.findings.map((f, i) => {
              const a = f.no !== null ? byNo.get(f.no) : null;
              return (
                <tr key={i} className={f.no === null ? 'unmatched' : f.score < 0.8 ? 'lowconf' : ''}>
                  <td>{f.raw}</td>
                  <td>
                    <select
                      value={f.no ?? ''}
                      onChange={(e) => update(i, { no: e.target.value === '' ? null : Number(e.target.value), score: 1 })}
                    >
                      <option value="">— 해당 없음 —</option>
                      {ALLERGENS.map((x) => (
                        <option key={x.no} value={x.no}>
                          {x.name_ko} ({x.name_en})
                        </option>
                      ))}
                    </select>
                    {a && <span className="fam">→ {a.family}</span>}
                  </td>
                  <td>
                    <select
                      value={f.cls}
                      style={{ color: CLASS_COLOR[f.cls], fontWeight: 700 }}
                      onChange={(e) => update(i, { cls: Number(e.target.value) })}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="x" onClick={() => remove(i)} title="삭제">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="add-row">
          <input placeholder="빠진 항원 추가 (이름 검색)" value={addQuery} onChange={(e) => setAddQuery(e.target.value)} />
          <select value={addCls} onChange={(e) => setAddCls(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          {candidates.length > 0 && (
            <div className="candidates">
              {candidates.map((a) => (
                <button key={a.no} onClick={() => add(a.no)}>
                  {a.name_ko} <small>{a.name_en}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="summary">
          <b>슬라이드에 표시될 양성 항원 ({fams.length})</b>
          <div className="chips">
            {fams.map((f) => (
              <span key={`${f.group}${f.family}`} style={{ color: CLASS_COLOR[f.cls], borderColor: CLASS_COLOR[f.cls] }}>
                {f.family} {f.cls}
              </span>
            ))}
          </div>
        </div>

        <div className="actions">
          <button onClick={p.onBack}>← 다시 붙여넣기</button>
          <button className="primary" onClick={p.onConfirm}>
            슬라이드 만들기 →
          </button>
        </div>
      </div>
    </div>
  );
}
