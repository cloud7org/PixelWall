'use client'

import Navbar from '@/components/Navbar'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const CONTACT_EMAIL = 'alex.mleczkomt@gmail.com'
const UPDATED_AT = '1 lipca 2025'

export default function PrivacyPage() {
  const { isMobile } = useBreakpoint()
  const pad = isMobile ? '32px 16px 64px' : '56px 48px 80px'

  const h2Style: React.CSSProperties = {
    fontFamily: 'var(--font-space-grotesk), sans-serif',
    fontWeight: 700,
    fontSize: isMobile ? 18 : 21,
    color: '#F5F0E6',
    marginTop: 48,
    marginBottom: 14,
    letterSpacing: '-0.01em',
  }

  const h3Style: React.CSSProperties = {
    fontFamily: 'var(--font-space-grotesk), sans-serif',
    fontWeight: 600,
    fontSize: 15,
    color: '#F5F0E6',
    marginTop: 24,
    marginBottom: 8,
  }

  const pStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter), sans-serif',
    fontSize: 14,
    lineHeight: 1.75,
    color: '#B7B2A4',
    marginBottom: 14,
  }

  const liStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter), sans-serif',
    fontSize: 14,
    lineHeight: 1.75,
    color: '#B7B2A4',
    marginBottom: 6,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 11,
    letterSpacing: '0.08em',
    color: '#2EE6A6',
    textTransform: 'uppercase',
  }

  const boxStyle: React.CSSProperties = {
    background: 'rgba(255,77,46,0.07)',
    border: '1px solid rgba(255,77,46,0.25)',
    borderRadius: 8,
    padding: '16px 20px',
    marginTop: 20,
    marginBottom: 20,
  }

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid #1F212B',
    marginTop: 48,
  }

  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: pad }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 12 }}>
            Dokument prawny
          </span>
          <h1 style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(26px, 4vw, 40px)',
            letterSpacing: '-0.02em',
            color: '#F5F0E6',
            marginBottom: 16,
          }}>
            Polityka prywatności
          </h1>
          <p style={{ ...pStyle, color: '#5A5C66', marginBottom: 0 }}>
            Ostatnia aktualizacja: {UPDATED_AT}
          </p>
        </div>

        {/* 1. Wstęp */}
        <h2 style={h2Style}>1. Wstęp i administrator danych</h2>
        <p style={pStyle}>
          Pixelverse to strona internetowa, która umożliwia zakup fragmentów cyfrowej siatki pikseli
          jako przestrzeni reklamowej. Każdy zakupiony fragment wyświetla Twoją grafikę i link
          na stronie pixelverse.pl bezterminowo — to istota produktu. Po wysprzedaniu centralnego
          obszaru siatki (1&nbsp;000&nbsp;×&nbsp;1&nbsp;000 pikseli, wyraźnie oznaczonego na mapie),
          grafiki wszystkich właścicieli z tego obszaru zostaną zaprezentowane publicznie na ekranie
          reklamowym na Times Square, Manhattan, Nowy Jork.
        </p>
        <p style={pStyle}>
          Administratorem Twoich danych osobowych jest właściciel serwisu Pixelverse.
          We wszystkich sprawach dotyczących danych osobowych możesz się z nami skontaktować
          pod adresem: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a>.
          Odpowiadamy w ciągu 30 dni od otrzymania wiadomości.
        </p>

        <div style={dividerStyle} />

        {/* 2. Jakie dane zbieramy */}
        <h2 style={h2Style}>2. Jakie dane zbieramy i skąd</h2>
        <p style={pStyle}>Przy zakupie pikseli zbieramy następujące dane:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Adres e-mail</strong> — podawany w formularzu zakupu; służy do ewentualnego kontaktu w sprawie transakcji.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Nazwa właściciela</strong> — nazwa firmy, pseudonim lub imię; wyświetlana publicznie jako etykieta zakupionego bloku.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>URL strony docelowej</strong> — opcjonalny adres, do którego prowadzi kliknięcie w Twoją grafikę.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Grafika / zdjęcie</strong> — plik obrazu wgrywany przez użytkownika i wyświetlany na siatce pikseli.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Dane transakcji</strong> — zakup obsługuje Stripe. Pixelverse <em>nie</em> przechowuje numerów kart płatniczych ani danych BLIK — te dane trafiają wyłącznie do Stripe.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Dane techniczne</strong> — standardowe logi serwera (adres IP, czas dostępu) generowane automatycznie przez Netlify (hosting).</li>
        </ul>

        <div style={dividerStyle} />

        {/* 3. Cel i podstawa prawna */}
        <h2 style={h2Style}>3. Cel i podstawa prawna przetwarzania</h2>
        <p style={pStyle}>Przetwarzamy Twoje dane w dwóch odrębnych celach, z różną podstawą prawną:</p>

        <h3 style={h3Style}>Cel 1 — wyświetlanie reklamy na stronie internetowej</h3>
        <p style={pStyle}>
          Dane (nazwa, grafika, link, email) przetwarzamy po to, żeby zrealizować zakupioną przez
          Ciebie usługę — wyświetlić Twoją reklamę na siatce pikseli na pixelverse.pl.
          Podstawa prawna: <strong style={{ color: '#F5F0E6' }}>art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;b RODO</strong> (wykonanie umowy).
        </p>

        <h3 style={h3Style}>Cel 2 — wyświetlenie grafiki na Times Square</h3>
        <p style={pStyle}>
          Jeśli kupujesz piksele w centralnym obszarze siatki (1&nbsp;000&nbsp;×&nbsp;1&nbsp;000 px,
          oznaczonym widoczną granicą na mapie), Twoja grafika może zostać wyświetlona publicznie
          na ekranie reklamowym na Times Square. To wykracza poza zwykłe „wyświetlanie na stronie
          internetowej" i wymaga Twojej wyraźnej zgody.
          Podstawa prawna: <strong style={{ color: '#F5F0E6' }}>art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;a RODO</strong> (zgoda).
          Zgoda wyrażana jest przez zaznaczenie checkboxa w formularzu zakupu.
        </p>
        <p style={pStyle}>
          Zakup pikseli <em>poza</em> centralnym obszarem nie wiąże się z celem Times Square
          i nie jest objęty tą zgodą.
        </p>

        <div style={dividerStyle} />

        {/* 4. Jak długo przechowujemy */}
        <h2 style={h2Style}>4. Jak długo przechowujemy dane</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Grafika i zajęty obszar na siatce</strong> — bezterminowo. To wynika z istoty produktu: obiecujemy, że Twoja reklama zostaje na zawsze. Usunięcie grafiki z siatki naruszyłoby tę obietnicę i integralność całej mapy.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Adres e-mail i nazwa</strong> — przechowywane do czasu, gdy złożysz żądanie ich usunięcia (patrz sekcja 7), lub dłużej, jeśli jest to niezbędne do obsługi ewentualnych roszczeń.</li>
          <li style={liStyle}><strong style={{ color: '#F5F0E6' }}>Logi serwera (Netlify)</strong> — zgodnie z polityką prywatności Netlify.</li>
        </ul>

        <div style={dividerStyle} />

        {/* 5. Times Square */}
        <div style={{
          background: 'rgba(255,210,63,0.05)',
          border: '1px solid rgba(255,210,63,0.2)',
          borderRadius: 10,
          padding: '24px 28px',
          marginTop: 48,
          marginBottom: 8,
        }}>
          <span style={{ ...labelStyle, color: '#FFD23F', display: 'block', marginBottom: 12 }}>
            Ważna informacja
          </span>
          <h2 style={{ ...h2Style, marginTop: 0, color: '#FFD23F' }}>
            5. Wyświetlenie grafiki na Times Square
          </h2>

          <p style={pStyle}>
            Po wysprzedaniu <strong style={{ color: '#F5F0E6' }}>wszystkich</strong> pikseli
            w centralnym obszarze siatki (dokładnie 1&nbsp;000&nbsp;000 pikseli w kwadracie
            1&nbsp;000&nbsp;×&nbsp;1&nbsp;000 px — nie chodzi o całą nieskończoną siatkę, tylko
            o ten wyraźnie oznaczony fragment), grafiki wszystkich właścicieli z tego obszaru
            zostaną wyświetlone na ekranie reklamowym na Times Square, Manhattan, Nowy Jork.
          </p>

          <p style={pStyle}>
            Wyświetlenie ma formę animacji: każda grafika pojawi się na ekranie przez kilka sekund
            w kolejności. Całość zostanie nagrana i udostępniona właścicielom.
          </p>

          <div style={boxStyle}>
            <p style={{ ...pStyle, marginBottom: 0, color: '#FF4D2E' }}>
              <strong>Wyświetlenie jest jednorazowe i nieodwracalne.</strong> Po tym, jak Twoja grafika
              pojawi się na ekranie w Nowym Jorku, nie ma możliwości cofnięcia tej ekspozycji
              w przestrzeni fizycznej — niezależnie od późniejszych decyzji czy żądań.
            </p>
          </div>

          <h3 style={h3Style}>Zgoda i prawo jej wycofania</h3>
          <p style={pStyle}>
            Wyrażasz zgodę na wyświetlenie grafiki na Times Square przez zaznaczenie checkboxa
            w formularzu zakupu. Możesz wycofać tę zgodę w dowolnym momencie, pisząc na adres
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}> {CONTACT_EMAIL}</a> —
            <strong style={{ color: '#F5F0E6' }}> ale tylko do momentu, gdy wyświetlenie jeszcze
            nie nastąpiło</strong>. Po jego dokonaniu wycofanie zgody nie jest możliwe z przyczyn
            technicznych i faktycznych (ekspozycja w przestrzeni fizycznej jest nieodwracalna).
            Piszemy o tym wprost, żebyś mógł/mogła podjąć świadomą decyzję przed zakupem.
          </p>

          <h3 style={h3Style}>Czego ta sekcja nie dotyczy</h3>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Piksele kupione <strong style={{ color: '#F5F0E6' }}>poza</strong> centralnym obszarem
            1&nbsp;000&nbsp;×&nbsp;1&nbsp;000 px <strong style={{ color: '#F5F0E6' }}>nie</strong> będą
            wyświetlone na Times Square. Ich grafiki są przetwarzane wyłącznie w celu wyświetlania
            na stronie internetowej (Cel 1 powyżej).
          </p>
        </div>

        <div style={dividerStyle} />

        {/* 6. Komu przekazujemy dane */}
        <h2 style={h2Style}>6. Komu przekazujemy Twoje dane</h2>
        <p style={pStyle}>Korzystamy z trzech zewnętrznych dostawców, którym przekazujemy dane niezbędne do działania serwisu:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {[
            {
              name: 'Stripe',
              desc: 'Operator płatności. Przetwarza dane transakcji (karta, BLIK). Pixelverse nie przechowuje danych karty — trafiają one bezpośrednio do Stripe.',
              url: 'https://stripe.com/en-pl/privacy',
              label: 'Polityka prywatności Stripe',
            },
            {
              name: 'Supabase',
              desc: 'Baza danych. Przechowuje dane zakupu: nazwę właściciela, email, URL, adres grafiki, współrzędne zajętego obszaru.',
              url: 'https://supabase.com/privacy',
              label: 'Polityka prywatności Supabase',
            },
            {
              name: 'Netlify',
              desc: 'Hosting. Serwuje stronę internetową i generuje standardowe logi serwera (IP, czas dostępu).',
              url: 'https://www.netlify.com/privacy/',
              label: 'Polityka prywatności Netlify',
            },
          ].map(({ name, desc, url, label }) => (
            <div key={name} style={{ background: '#14151B', border: '1px solid #1F212B', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <strong style={{ color: '#F5F0E6', fontSize: 14, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{name}</strong>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#2EE6A6', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono), monospace', textDecoration: 'none' }}>
                  {label} ↗
                </a>
              </div>
              <p style={{ ...pStyle, marginBottom: 0, fontSize: 13 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={dividerStyle} />

        {/* 7. Twoje prawa */}
        <h2 style={h2Style}>7. Twoje prawa</h2>

        <h3 style={h3Style}>Prawo do usunięcia danych</h3>
        <p style={pStyle}>
          Możesz zażądać usunięcia swojego adresu e-mail i nazwy z naszej bazy — napisz do nas
          na <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a>.
          Usuniemy te dane w ciągu 30 dni.
        </p>
        <p style={pStyle}>
          Wyjątek: sama grafika i zajęty przez Ciebie obszar na siatce <strong style={{ color: '#F5F0E6' }}>pozostają</strong>.
          Usunięcie bloku z siatki oznaczałoby naruszenie obietnicy „Twoja reklama zostaje na zawsze"
          i wpłynęłoby na integralność mapy widzianej przez wszystkich. Jeśli Twój blok jest
          w centralnym obszarze i wyświetlenie na Times Square już nastąpiło — usunięcie grafiki
          z bazy danych nie cofa ekspozycji w przestrzeni fizycznej.
        </p>

        <h3 style={h3Style}>Prawo do sprzeciwu (Times Square)</h3>
        <p style={pStyle}>
          Możesz wnieść sprzeciw wobec wyświetlenia swojej grafiki na Times Square — napisz do nas
          przed dokonaniem wyświetlenia. Sprzeciw jest równoznaczny z wycofaniem zgody i uwzględnimy go,
          o ile wyświetlenie jeszcze nie nastąpiło. Po wyświetleniu sprzeciw nie przyniesie skutku
          z przyczyn faktycznych opisanych w sekcji 5.
        </p>

        <h3 style={h3Style}>Prawo do skargi</h3>
        <p style={pStyle}>
          Jeśli uważasz, że przetwarzamy Twoje dane niezgodnie z prawem, masz prawo złożyć skargę
          do Urzędu Ochrony Danych Osobowych:{' '}
          <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer" style={{ color: '#2EE6A6' }}>
            uodo.gov.pl
          </a>.
        </p>

        <p style={{ ...pStyle, color: '#5A5C66', fontSize: 12, marginTop: 8 }}>
          Podstawy prawne powyższych praw: art. 17, 21 i 77 RODO.
        </p>

        <div style={dividerStyle} />

        {/* 8. Cookies */}
        <h2 style={h2Style}>8. Pliki cookies</h2>
        <p style={pStyle}>
          Pixelverse nie używa własnych plików cookies analitycznych ani marketingowych.
          Nie śledzamy Cię między stronami i nie profilujemy.
        </p>
        <p style={pStyle}>
          Stripe — operator płatności — może ustawiać własne cookies podczas realizacji transakcji
          w celu weryfikacji płatności i zapobiegania oszustwom. Ich zasady znajdziesz
          w <a href="https://stripe.com/en-pl/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2EE6A6' }}>polityce prywatności Stripe</a>.
        </p>

        <div style={dividerStyle} />

        {/* 9. Kontakt */}
        <h2 style={h2Style}>9. Kontakt</h2>
        <p style={pStyle}>
          W sprawach dotyczących danych osobowych, żądań usunięcia danych lub wycofania zgody
          pisz na adres:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a>.
          Odpowiadamy w ciągu 30 dni.
        </p>

        <div style={dividerStyle} />

        {/* 10. Data */}
        <p style={{ ...pStyle, color: '#5A5C66', marginTop: 32, fontSize: 12 }}>
          Polityka prywatności obowiązuje od {UPDATED_AT}. O istotnych zmianach będziemy informować
          przez aktualizację tej strony.
        </p>

      </div>
    </div>
  )
}
