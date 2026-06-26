export default function TimesSquare() {
  return (
    <section
      style={{
        background: '#14151B',
        borderTop: '1px solid #1F212B',
        borderBottom: '1px solid #1F212B',
        padding: '80px 48px',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        {/* Text */}
        <div>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              letterSpacing: '0.1em',
              color: '#FFD23F',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 20,
            }}
          >
            Finał
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 2.5vw, 34px)',
              letterSpacing: '-0.025em',
              color: '#F5F0E6',
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            Kupujesz pixel teraz.
            <br />
            <span style={{ color: '#FFD23F' }}>Po wysprzedaniu wszystkich</span>
            <br />
            — dostajesz reklamę na Times Square.
          </h2>
          <p style={{ fontSize: 16, color: '#B7B2A4', lineHeight: 1.7, maxWidth: 440 }}>
            Każdy właściciel bloku zobaczy swoje logo na gigantycznym ekranie w sercu Manhattanu, w Nowym Jorku.
            Animacja przejdzie przez całą ścianę — nawet małe obrazy będą widoczne!
          </p>
        </div>

        {/* Billboard illustration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 280,
              height: 200,
              background: '#0B0C10',
              border: '3px solid #2A2C36',
              borderRadius: 8,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(255,210,63,0.15)',
            }}
          >
            {/* Grid of pixel dots */}
            <div
              style={{
                position: 'absolute',
                inset: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(14, 1fr)',
                gridTemplateRows: 'repeat(10, 1fr)',
                gap: 2,
              }}
            >
              {Array.from({ length: 140 }).map((_, i) => {
                const colors = ['#FF4D2E', '#2EE6A6', '#FFD23F', '#0B0C10', '#1A1C24']
                const col = colors[i % colors.length]
                return (
                  <div
                    key={i}
                    style={{
                      background: col,
                      borderRadius: 1,
                      animation: `pulse ${1.5 + (i % 7) * 0.3}s infinite`,
                      animationDelay: `${(i % 5) * 0.2}s`,
                    }}
                  />
                )
              })}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.1em',
              }}
            >
              TIMES SQUARE · NYC
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
