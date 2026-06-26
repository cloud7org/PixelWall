const steps = [
  {
    num: '01',
    title: 'Wybierz obszar',
    desc: 'Przeciągnij na siatce prostokąt o wymiarach minimum 10×10 pixeli. Cena liczy się sama, w czasie rzeczywistym.',
    color: '#FF4D2E',
  },
  {
    num: '02',
    title: 'Dodaj grafikę i link',
    desc: 'Wstaw obrazek dopasowany do rozmiaru bloku oraz adres, do którego mają prowadzić Twoje pixele.',
    color: '#2EE6A6',
  },
  {
    num: '03',
    title: 'Zajmij miejsce na zawsze',
    desc: 'Po zakupie blok jest trwale Twój. Nikt go nie odkupi, nie nadpisze, nie usunie. Na zawsze.',
    color: '#FFD23F',
  },
]

export default function HowItWorks() {
  return (
    <section style={{ padding: '80px 48px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 12,
            letterSpacing: '0.1em',
            color: '#FF4D2E',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 14,
          }}
        >
          Mechanika
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(26px, 3vw, 36px)',
            letterSpacing: '-0.02em',
            color: '#F5F0E6',
          }}
        >
          Trzy kroki do nieśmiertelności reklamowej
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {steps.map(s => (
          <div
            key={s.num}
            style={{
              background: '#1A1C24',
              border: '1px solid #2A2C36',
              borderRadius: 12,
              padding: '32px 28px',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: s.color,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontWeight: 700,
                fontSize: 14,
                color: '#0B0C10',
                marginBottom: 20,
              }}
            >
              {s.num}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 600,
                fontSize: 20,
                color: '#F5F0E6',
                marginBottom: 12,
              }}
            >
              {s.title}
            </h3>
            <p style={{ fontSize: 15, color: '#B7B2A4', lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
