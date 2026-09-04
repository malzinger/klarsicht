import type { Grade } from '../core/score'

const COLORS: Record<Grade, string> = { A: '#12b76a', B: '#84cc16', C: '#f79009', D: '#d92d20' }

export function ScoreRing({ score, grade, label }: { score: number; grade: Grade; label: string }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  return (
    <div className="ring" role="img" aria-label={`${label}: ${score} / 100`}>
      <svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="#e6e2db" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke={COLORS[grade]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 42 42)"
        />
      </svg>
      <div className="ring__value">
        <strong>{score}</strong>
        <span>{grade}</span>
      </div>
      <p className="ring__label">{label}</p>
    </div>
  )
}
