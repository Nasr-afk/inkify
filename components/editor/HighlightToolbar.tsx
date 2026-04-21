'use client'

const COLORS = [
  { value: '#fef08a', label: 'Yellow' },
  { value: '#bbf7d0', label: 'Green' },
  { value: '#fecdd3', label: 'Pink' },
  { value: '#bfdbfe', label: 'Blue' },
]

interface HighlightToolbarProps {
  top:     number
  left:    number
  onColor: (color: string) => void
  onClear: () => void
}

export function HighlightToolbar({ top, left, onColor, onClear }: HighlightToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Highlight text"
      style={{
        position:       'absolute',
        top,
        left,
        transform:      'translateX(-50%)',
        zIndex:         60,
        display:        'flex',
        alignItems:     'center',
        gap:            4,
        padding:        '5px 8px',
        background:     '#ffffff',
        border:         '1px solid rgba(0,0,0,0.10)',
        borderRadius:   10,
        boxShadow:      '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
        userSelect:     'none',
        pointerEvents:  'auto',
      }}
    >
      {COLORS.map(({ value, label }) => (
        <button
          key={value}
          suppressHydrationWarning
          aria-label={`Highlight ${label}`}
          onMouseDown={(e) => {
            e.preventDefault()   // keep selection alive
            onColor(value)
          }}
          style={{
            width:        20,
            height:       20,
            borderRadius: '50%',
            background:   value,
            border:       '1.5px solid rgba(0,0,0,0.15)',
            cursor:       'pointer',
            padding:      0,
            flexShrink:   0,
            transition:   'transform 0.1s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        />
      ))}

      <div style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.10)', margin: '0 2px', flexShrink: 0 }} />

      <button
        suppressHydrationWarning
        aria-label="Remove highlight"
        onMouseDown={(e) => {
          e.preventDefault()
          onClear()
        }}
        style={{
          width:          20,
          height:         20,
          borderRadius:   '50%',
          background:     '#f3f4f6',
          border:         '1.5px solid rgba(0,0,0,0.10)',
          cursor:         'pointer',
          padding:        0,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       10,
          color:          '#6b7280',
        }}
      >
        ✕
      </button>
    </div>
  )
}
