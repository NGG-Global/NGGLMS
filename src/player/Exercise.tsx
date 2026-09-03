import { useMemo, useState } from 'react';
import type { Exercise as ExerciseData } from '../content/types';
import './exercise.css';

export interface ExerciseResult {
  /** Correct answers, on the scale the exercise defines. */
  score: number;
  outOf: number;
  /** Selections that were not part of the answer, for multi-select kinds. */
  noise: number;
}

interface Props {
  exercise: ExerciseData;
  nuggetNumber: number;
  /** Label of the primary button once the exercise has been checked. */
  nextLabel: string;
  onNext: () => void;
  onChecked: (result: ExerciseResult) => void;
}

type Answers = Record<string, number | boolean>;
type Mark = 'ok' | 'bad' | 'miss' | undefined;

function rowsOf(exercise: ExerciseData): { label: string; correct: number }[] {
  if (exercise.kind === 'sort' || exercise.kind === 'assign') {
    return exercise.items.map(([label, correct]) => ({ label, correct }));
  }
  return [];
}

function optionsOf(exercise: ExerciseData): string[] {
  if (exercise.kind === 'sort') return exercise.cols;
  if (exercise.kind === 'assign') return exercise.levels;
  return [];
}

function selectableOf(exercise: ExerciseData): { label: string; correct: boolean }[] {
  if (exercise.kind === 'multi') return exercise.items.map(([label, correct]) => ({ label, correct }));
  if (exercise.kind === 'builder') return exercise.chips.map(([label, , correct]) => ({ label, correct }));
  return [];
}

/**
 * The practice beat that closes each nugget.
 *
 * Five shapes share one shell: pick-a-column (sort), pick-a-level (assign),
 * two judgement axes (sliders), multi-select (multi) and prompt building (builder).
 * Answers stay editable until "לבדוק"; after that the marking is shown and the
 * primary button advances.
 */
export function Exercise({ exercise, nuggetNumber, nextLabel, onNext, onChecked }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState(false);

  const rows = useMemo(() => rowsOf(exercise), [exercise]);
  const options = useMemo(() => optionsOf(exercise), [exercise]);
  const selectable = useMemo(() => selectableOf(exercise), [exercise]);

  const isStacked = exercise.kind === 'assign';
  const axes = exercise.kind === 'sliders' ? exercise.axes : [];

  const answeredRows = rows.filter((_, i) => answers[`r${i}`] != null).length;
  const answeredAxes = axes.filter((_, i) => answers[`r${i}`] != null).length;
  const selectedCount = selectable.filter((_, i) => answers[`c${i}`]).length;

  let canCheck = false;
  let progress = '';
  if (rows.length) {
    canCheck = answeredRows === rows.length;
    progress = `${answeredRows} / ${rows.length}`;
  } else if (axes.length) {
    canCheck = answeredAxes === axes.length;
    progress = `${answeredAxes} / ${axes.length}`;
  } else {
    canCheck = selectedCount > 0;
    progress = `${selectedCount} נבחרו`;
  }

  const pick = (key: string, value: number) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };
  const toggle = (key: string) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const check = () => {
    if (checked || !canCheck) return;
    setChecked(true);
    if (rows.length) {
      const score = rows.filter((r, i) => answers[`r${i}`] === r.correct).length;
      onChecked({ score, outOf: rows.length, noise: 0 });
    } else if (axes.length) {
      // Judgement calibration: there is no single right answer, so completing it scores full.
      onChecked({ score: axes.length, outOf: axes.length, noise: 0 });
    } else {
      const total = selectable.filter((s) => s.correct).length;
      const hit = selectable.filter((s, i) => answers[`c${i}`] && s.correct).length;
      const noise = selectable.filter((s, i) => answers[`c${i}`] && !s.correct).length;
      onChecked({ score: hit, outOf: total, noise });
    }
  };

  const reset = () => {
    setAnswers({});
    setChecked(false);
  };

  const markRow = (rowIndex: number, optionIndex: number, correct: number): Mark => {
    if (!checked) return undefined;
    const chosen = answers[`r${rowIndex}`] === optionIndex;
    if (chosen) return optionIndex === correct ? 'ok' : 'bad';
    return optionIndex === correct ? 'miss' : undefined;
  };

  let verdict = '';
  if (checked) {
    if (rows.length) {
      const good = rows.filter((r, i) => answers[`r${i}`] === r.correct).length;
      verdict = good === rows.length ? 'הכול נכון' : `${good} מתוך ${rows.length} נכון`;
    } else if (exercise.kind === 'sliders') {
      const sum = axes.reduce((acc, _, i) => acc + (Number(answers[`r${i}`]) || 0), 0);
      verdict = exercise.levels[sum <= 1 ? 0 : sum === 2 ? 1 : 2];
    } else {
      const total = selectable.filter((s) => s.correct).length;
      const hit = selectable.filter((s, i) => answers[`c${i}`] && s.correct).length;
      const noise = selectable.filter((s, i) => answers[`c${i}`] && !s.correct).length;
      verdict = `${hit} מתוך ${total} נכונות${noise ? ` · ${noise} מיותרות` : ''}`;
    }
  }

  const preview =
    exercise.kind === 'builder'
      ? [exercise.prompt, ...selectable.filter((_, i) => answers[`c${i}`]).map((s) => `· ${s.label}`)].join('\n')
      : '';

  const touched = Object.keys(answers).length > 0;

  return (
    <section className="card ex" aria-label="תרגיל המקטע">
      <div className="ex__top">
        <span className="eyebrow eyebrow--pink">תרגיל · נאגט {nuggetNumber}</span>
        <span className="spacer" />
        <span className="ex__prog">{checked ? 'נבדק' : progress}</span>
      </div>

      <div className="stack" style={{ gap: 4 }}>
        <p className="ex__head">{exercise.head}</p>
        <p className="ex__sub">{exercise.sub}</p>
      </div>

      {rows.length > 0 && (
        <div className="ex__rows">
          {rows.map((row, i) => (
            <div key={i} className={`ex__row${isStacked ? ' ex__row--stacked' : ''}`}>
              <span className="ex__label">{row.label}</span>
              <span className="ex__opts">
                {options.map((option, j) => (
                  <button
                    key={j}
                    type="button"
                    className="ex__opt"
                    aria-pressed={answers[`r${i}`] === j}
                    data-mark={markRow(i, j, row.correct)}
                    disabled={checked}
                    onClick={() => pick(`r${i}`, j)}
                  >
                    {option}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {axes.length > 0 && (
        <div className="ex__rows">
          {axes.map((axis, i) => (
            <div key={i} className="ex__row">
              <span className="ex__label">{axis.label}</span>
              <span className="ex__opts">
                {axis.opts.map((option, j) => (
                  <button
                    key={j}
                    type="button"
                    className="ex__opt"
                    aria-pressed={answers[`r${i}`] === j}
                    disabled={checked}
                    onClick={() => pick(`r${i}`, j)}
                  >
                    {option}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectable.length > 0 && (
        <div className="chipset">
          {selectable.map((item, i) => (
            <button
              key={i}
              type="button"
              className="ex__opt"
              aria-pressed={Boolean(answers[`c${i}`])}
              data-mark={
                checked
                  ? answers[`c${i}`]
                    ? item.correct
                      ? 'ok'
                      : 'bad'
                    : item.correct
                      ? 'miss'
                      : undefined
                  : undefined
              }
              disabled={checked}
              onClick={() => toggle(`c${i}`)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {exercise.kind === 'builder' && (
        <div className="ex__preview">
          <b>הבקשה שתישלח</b>
          <p>{preview}</p>
        </div>
      )}

      {checked && (
        <div className="ex__result">
          <b>{verdict}</b>
          <p>{exercise.after}</p>
        </div>
      )}

      <div className="ex__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!checked && !canCheck}
          onClick={checked ? onNext : check}
        >
          {checked ? nextLabel : 'לבדוק'}
        </button>
        {touched && !checked && (
          <button type="button" className="btn btn--ghost" onClick={reset}>
            להתחיל מחדש
          </button>
        )}
        {checked && (
          <button type="button" className="btn btn--ghost" onClick={reset}>
            לנסות שוב
          </button>
        )}
      </div>
    </section>
  );
}
