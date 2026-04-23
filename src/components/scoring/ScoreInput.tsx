// src/components/scoring/ScoreInput.tsx
import { TextField } from '@radix-ui/themes'
import { type ChangeEvent } from 'react'

interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
  par: number
  disabled?: boolean
}

function getScoreColor(score: number | null, par: number): string | undefined {
  if (score === null) return undefined
  if (score < par) return 'var(--grass-9)' // Under par (birdie or better)
  if (score === par) return undefined // Par
  if (score === par + 1) return 'var(--amber-9)' // Bogey
  return 'var(--red-9)' // Double bogey or worse
}

export function ScoreInput({ value, onChange, par, disabled = false }: ScoreInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange(null)
    } else {
      const num = parseInt(val, 10)
      if (!isNaN(num) && num >= 1 && num <= 20) {
        onChange(num)
      }
    }
  }

  const borderColor = getScoreColor(value, par)

  return (
    <TextField.Root
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value ?? ''}
      onChange={handleChange}
      disabled={disabled}
      size="3"
      style={{
        width: '64px',
        textAlign: 'center',
        borderColor: borderColor,
      }}
    />
  )
}
