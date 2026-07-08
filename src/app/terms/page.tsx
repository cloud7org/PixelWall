'use client'

import Navbar from '@/components/Navbar'
import BackToGridLink from '@/components/BackToGridLink'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const CONTACT_EMAIL = 'cloud7.org@gmail.com'
const SITE_ADDRESS = 'www.pixarium.pl'
const UPDATED_AT = '5 lipca 2026'

export default function TermsPage() {
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
      <BackToGridLink />

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
            Regulamin serwisu Pixarium
          </h1>
          <p style={{ ...pStyle, color: '#5A5C66', marginBottom: 0 }}>
            Ostatnia aktualizacja: {UPDATED_AT}
          </p>
        </div>

        {/* 1. Postanowienia ogólne */}
        <h2 style={h2Style}>1. Postanowienia ogólne</h2>
        <p style={pStyle}>
          1.1. Niniejszy regulamin określa zasady korzystania z serwisu Pixarium, dostępnego pod
          adresem {SITE_ADDRESS}, oraz warunki zakupu przestrzeni reklamowej na siatce pikseli.
        </p>
        <p style={pStyle}>
          1.2. Operatorem serwisu i sprzedawcą jest: [IMIĘ NAZWISKO / NAZWA FIRMY], adres: [ADRES],
          email: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a> (dalej: „Sprzedawca").
        </p>
        <p style={pStyle}>
          1.3. Pixarium to serwis internetowy umożliwiający zakup prostokątnych bloków pikseli na
          nieskończonej siatce graficznej. Zakup daje prawo do wyświetlania własnej grafiki i linku
          w zakupionym obszarze przez okres 10 lat. Po upływie tego okresu serwis w dotychczasowej
          formie zostaje zastąpiony stroną statyczną zawierającą zrzut ekranu całej mozaiki oraz
          zakładkę „Liga" z listą wszystkich uczestników.
        </p>
        <p style={pStyle}>
          1.4. Korzystanie z serwisu oznacza akceptację niniejszego regulaminu. Przed dokonaniem
          zakupu użytkownik potwierdza akceptację regulaminu poprzez zaznaczenie odpowiedniego pola
          wyboru (checkbox) w formularzu zakupu.
        </p>
        <p style={pStyle}>
          1.5. Regulamin jest dostępny bezpłatnie pod adresem {SITE_ADDRESS}/terms.
        </p>

        <div style={dividerStyle} />

        {/* 2. Przedmiot usługi */}
        <h2 style={h2Style}>2. Przedmiot usługi</h2>
        <p style={pStyle}>
          2.1. Użytkownik kupuje prostokątny blok pikseli na siatce graficznej serwisu Pixarium.
          Siatka jest nieskończona i podzielona na dwie strefy:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>
            <strong style={{ color: '#F5F0E6' }}>Strefa Time Square</strong> — centralny obszar
            siatki o wymiarach 1000×1000 pikseli, wyraźnie oznaczony granicą na mapie. Minimalne
            wymiary zakupionego bloku w tej strefie: 40×40 pikseli.
          </li>
          <li style={liStyle}>
            <strong style={{ color: '#F5F0E6' }}>Strefa Standard</strong> — cały obszar siatki poza
            strefą Time Square. Minimalne wymiary zakupionego bloku: dowolne ale kwota zamówienia
            nie mnijesza niż 15 zł. W przypadku wybrania obszaru po niżej wartości 15 zł kwota zostaje
            taka sama.
          </li>
        </ul>
        <p style={pStyle}>
          2.2. Po zakupie użytkownik wgrywa własną grafikę oraz podaje link URL.
        </p>
        <p style={pStyle}>
          2.3. Obrazy (grafiki) oraz przypisane do nich linki przechowywane są przez okres 10 lat od
          daty zakupu. Po upływie tego okresu serwis przechodzi w tryb statyczny — aktywna siatka
          zostaje zastąpiona zrzutem ekranu całej mozaiki dostępnym jako strona statyczna, wraz
          z zakładką „Liga" zawierającą listę wszystkich uczestników.
        </p>
        <p style={pStyle}>
          2.4. Każdy zakupiony blok pikseli jest unikalny i niepowtarzalny — po zakupie dany obszar
          jest trwale zajęty i nie może zostać sprzedany innemu użytkownikowi.
        </p>

        <div style={dividerStyle} />

        {/* 3. Cena i płatność */}
        <h2 style={h2Style}>3. Cena i płatność</h2>
        <p style={pStyle}>3.1. Ceny za piksel są następujące:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>
            Strefa Time Square (centralny obszar 1000×1000 px): 0,30 zł brutto za piksel
            (np. blok 40×40 px = 1600 pikseli = 480,00 zł)
          </li>
          <li style={liStyle}>
            Strefa Standard (poza strefą Time Square): 0,01 zł brutto za piksel
            (np. blok 100×100 px = 10 000 pikseli = 100,00 zł)
          </li>
        </ul>
        <p style={pStyle}>3.2. Minimalna kwota zamówienia:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>Strefa Time Square: 480,00 zł (blok 40×40 px)</li>
          <li style={liStyle}>
            Strefa Standard: 15,00 zł (ok. 1500 pikseli, np. blok 100×15 px lub inny prostokąt
            o powierzchni min. 1500 px)
          </li>
        </ul>
        <p style={pStyle}>
          3.3. Wszystkie ceny są cenami brutto i zawierają podatek VAT w wysokości
          [VAT: uzupełnij — np. 23% lub „zwolnienie z VAT na podstawie art. 113 ustawy o VAT"].
        </p>
        <p style={pStyle}>
          3.4. Płatność jest jednorazowa, realizowana z góry, za pośrednictwem operatora płatności
          Stripe (stripe.com). Dostępne metody płatności: karta płatnicza (Visa, Mastercard), BLIK.
        </p>
        <p style={pStyle}>
          3.5. Zamówienie jest realizowane po otrzymaniu przez Sprzedawcę potwierdzenia płatności od
          operatora Stripe.
        </p>
        <p style={pStyle}>
          3.6. Sprzedawca nie przechowuje danych kart płatniczych ani danych BLIK — są one
          przetwarzane wyłącznie przez Stripe.
        </p>

        <div style={dividerStyle} />

        {/* 4. Realizacja zamówienia */}
        <h2 style={h2Style}>4. Realizacja zamówienia</h2>
        <p style={pStyle}>
          4.1. Po potwierdzeniu płatności grafika użytkownika pojawia się na siatce w ciągu
          [X minut/godzin — uzupełnij po implementacji].
        </p>
        <p style={pStyle}>
          4.2. Użytkownik otrzymuje potwierdzenie zakupu emailem, jeżeli podał adres email
          w formularzu zakupu.
        </p>
        <p style={pStyle}>
          4.4. Sprzedawca zastrzega prawo do odrzucenia grafiki naruszającej zasady określone
          w sekcji 6 niniejszego regulaminu. W takim przypadku:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>
            jeśli grafika została odrzucona przed wyświetleniem — użytkownik otrzymuje pełen zwrot
            płatności albo możliwość wgrania nowej grafiki w ciągu 7 dni
          </li>
          <li style={liStyle}>
            jeśli grafika narusza zasady z winy użytkownika i była już wyświetlana — grafika zostaje
            usunięta bez zwrotu płatności (patrz sekcja 6)
          </li>
        </ul>

        <div style={dividerStyle} />

        {/* 5. Prawo odstąpienia */}
        <h2 style={h2Style}>5. Prawo odstąpienia od umowy</h2>
        <p style={pStyle}>
          5.1. Pixarium świadczy usługę dostarczania treści cyfrowej (reklamy graficznej wyświetlanej
          online). Zgodnie z art. 38 pkt 13 ustawy z dnia 30 maja 2014 r. o prawach konsumenta,
          prawo odstąpienia od umowy w ciągu 14 dni nie przysługuje, jeżeli spełnione są łącznie dwa
          warunki:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>użytkownik wyraźnie zgodził się na rozpoczęcie świadczenia przed upływem terminu odstąpienia, oraz</li>
          <li style={liStyle}>użytkownik został poinformowany o utracie prawa do odstąpienia.</li>
        </ul>
        <div style={boxStyle}>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            5.2. W formularzu zakupu użytkownik potwierdza oba powyższe warunki poprzez zaznaczenie
            obowiązkowego pola wyboru: „Akceptuję regulamin serwisu Pixarium i przyjmuję do wiadomości,
            że po potwierdzeniu płatności tracę prawo do odstąpienia od umowy zgodnie z art. 38 pkt
            13 ustawy o prawach konsumenta."
          </p>
        </div>
        <p style={pStyle}>
          5.3. Jeżeli z przyczyn leżących po stronie Sprzedawcy grafika nie zostanie wyświetlona
          mimo potwierdzenia płatności, użytkownikowi przysługuje pełen zwrot płatności lub ponowna
          realizacja usługi — według wyboru użytkownika.
        </p>

        <div style={dividerStyle} />

        {/* 6. Zasady dotyczące treści */}
        <h2 style={h2Style}>6. Zasady dotyczące treści — zabronione grafiki</h2>
        <p style={pStyle}>6.1. Użytkownik, wgrywając grafikę, oświadcza że:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>jest uprawniony do korzystania z grafiki i nie narusza ona praw osób trzecich</li>
          <li style={liStyle}>grafika jest zgodna z niniejszym regulaminem oraz obowiązującym prawem polskim i unijnym</li>
        </ul>
        <p style={pStyle}>6.2. Zabronione jest wgrywanie grafik zawierających:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>a) treści pornograficzne lub seksualne, w tym z udziałem osób niepełnoletnich (CSAM — Child Sexual Abuse Material, bezwzględnie nielegalne i podlegające zgłoszeniu do organów ścigania)</li>
          <li style={liStyle}>b) treści nawołujące do przemocy, nienawiści rasowej, etnicznej, religijnej lub ze względu na płeć, wiek, niepełnosprawność lub orientację seksualną</li>
          <li style={liStyle}>c) treści promujące terroryzm, ekstremizm lub organizacje zdelegalizowane</li>
          <li style={liStyle}>d) treści naruszające prawa autorskie, prawa pokrewne lub prawa własności intelektualnej osób trzecich (w tym logotypy, znaki towarowe, fotografie bez zgody autora)</li>
          <li style={liStyle}>e) treści podszywające się pod inne osoby, firmy lub instytucje (phishing, spoofing, kradzież tożsamości)</li>
          <li style={liStyle}>f) treści zawierające złośliwe oprogramowanie, wirusy lub linki prowadzące do stron z malware</li>
          <li style={liStyle}>g) treści reklamujące działalność nielegalną, w tym: sprzedaż narkotyków i substancji psychoaktywnych, handel bronią bez zezwolenia, hazard bez licencji, piractwo, pranie pieniędzy</li>
          <li style={liStyle}>h) treści wprowadzające w błąd konsumentów — fałszywe reklamy, dezinformacja, nieuczciwe praktyki handlowe w rozumieniu ustawy z dnia 23 sierpnia 2007 r. o przeciwdziałaniu nieuczciwym praktykom rynkowym</li>
          <li style={liStyle}>i) treści naruszające dobra osobiste osób trzecich (wizerunek, dobre imię, prywatność) bez ich wyraźnej zgody</li>
          <li style={liStyle}>j) treści o charakterze spamu — masowe, generyczne grafiki niemające żadnego realnego celu reklamowego, wgrywane wyłącznie w celu zajęcia obszaru na siatce</li>
          <li style={liStyle}>k) treści naruszające godność człowieka lub dobre obyczaje w sposób rażący</li>
        </ul>
        <p style={pStyle}>6.3. Konsekwencje naruszenia:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>Sprzedawca ma prawo usunąć grafikę naruszającą powyższe zasady bez zwrotu płatności, jeśli naruszenie wynikło z winy użytkownika (celowego lub niedbałego działania)</li>
          <li style={liStyle}>Sprzedawca powiadomi użytkownika o usunięciu grafiki emailem (jeśli podał adres email), podając podstawę usunięcia</li>
          <li style={liStyle}>
            Użytkownik ma prawo odwołać się od decyzji o usunięciu w ciągu 14 dni od otrzymania
            powiadomienia, przesyłając odwołanie na adres{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a>
          </li>
          <li style={liStyle}>
            W przypadku treści nielegalnych (pkt a, c, f, g) Sprzedawca ma obowiązek zgłoszenia ich
            do właściwych organów ścigania (Policja, CERT Polska) zgodnie z Rozporządzeniem DSA
            (Digital Services Act) obowiązującym od 17 lutego 2024 r.
          </li>
        </ul>

        <div style={dividerStyle} />

        {/* 7. Time Square */}
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
            7. Strefa Time Square — wyświetlenie na ekranie w Nowym Jorku
          </h2>

          <p style={pStyle}>
            7.1. Niniejsza sekcja dotyczy wyłącznie pikseli zakupionych w strefie Time Square
            (centralny obszar siatki 1000×1000 px, oznaczony granicą na mapie).
          </p>
          <p style={pStyle}>
            7.2. Po zapełnieniu centralnego obszaru w co najmniej 90% (tj. co najmniej 900 000
            z 1 000 000 pikseli strefy Time Square), grafiki wszystkich użytkowników ze strefy Time
            Square zostaną wyświetlone jako zbiorowy kolaż na jednym z dużych ekranów reklamowych na
            Times Square, Manhattan, Nowy Jork, USA.
          </p>
          <p style={pStyle}>
            7.3. Wyświetlenie jest jednorazowe i stanowi dodatkowy, warunkowy bonus — nie jest
            elementem podstawowej usługi (wyświetlania reklamy na stronie internetowej), za którą
            użytkownik płaci.
          </p>

          <div style={boxStyle}>
            <p style={{ ...pStyle, marginBottom: 0, color: '#FF4D2E' }}>
              7.4. Warunek wyświetlenia: zapełnienie co najmniej 90% centralnego obszaru. Jeżeli
              warunek ten nie zostanie spełniony, wyświetlenie na Times Square nie nastąpi. Nie
              stanowi to podstawy do reklamacji ani zwrotu płatności — zakup piksela gwarantuje
              wyświetlanie grafiki na stronie w centralnym obszarze siatki Pixarium.
            </p>
          </div>

          <p style={pStyle}>
            7.5. Siła wyższa: w przypadku gdy wyświetlenie na Times Square nie będzie możliwe
            z przyczyn niezależnych od Sprzedawcy (w szczególności: działania wojenne, epidemia,
            pandemia, klęski żywiołowe, decyzje administracyjne, niedostępność ekranów reklamowych
            z przyczyn technicznych lub organizacyjnych niezależnych od Sprzedawcy), wyświetlenie
            nie nastąpi. Nie stanowi to podstawy do reklamacji ani zwrotu płatności.
          </p>
          <p style={pStyle}>
            7.6. Termin wyświetlenia na Times Square nie jest z góry określony — jest uzależniony od
            tempa zapełniania strefy Time Square i dostępności ekranu reklamowego.
          </p>
          <p style={pStyle}>
            7.7. Po dokonaniu wyświetlenia na Times Square użytkownik (jeśli podał adres email)
            otrzyma powiadomienie emailem oraz dostęp do dokumentacji fotograficznej lub wideo
            z wydarzenia.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            7.8. Użytkownik, dokonując zakupu w strefie Time Square, wyraża zgodę na wyświetlenie
            swojej grafiki w sposób opisany w niniejszej sekcji, poprzez zaznaczenie odpowiedniego
            pola wyboru w formularzu zakupu (zgodnie z art. 6 ust. 1 lit. a RODO).
          </p>
        </div>

        <div style={dividerStyle} />

        {/* 8. Reklamacje */}
        <h2 style={h2Style}>8. Reklamacje</h2>
        <p style={pStyle}>
          8.1. Reklamację można złożyć w ciągu 2 lat od daty zakupu, wysyłając wiadomość na adres:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2EE6A6' }}>{CONTACT_EMAIL}</a>.
        </p>
        <p style={pStyle}>8.2. Reklamacja powinna zawierać:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>imię i nazwisko lub nazwę użytkownika</li>
          <li style={liStyle}>datę zakupu i numer transakcji (jeśli dostępny)</li>
          <li style={liStyle}>opis problemu</li>
          <li style={liStyle}>oczekiwane rozwiązanie (np. ponowne wyświetlenie grafiki, zwrot płatności)</li>
        </ul>
        <p style={pStyle}>
          8.3. Sprzedawca rozpatruje reklamację w ciągu 14 dni od dnia jej otrzymania. Brak
          odpowiedzi w tym terminie oznacza automatyczne uznanie reklamacji za zasadną (art. 7a ust.
          2 ustawy o prawach konsumenta).
        </p>
        <p style={pStyle}>8.4. Podstawą uzasadnionej reklamacji może być w szczególności:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>grafika niewyświetlona mimo potwierdzenia płatności i upływu zadeklarowanego czasu realizacji</li>
        </ul>
        <p style={pStyle}>
          8.5. Sprzedawca nie ponosi odpowiedzialności za niedostępność serwisu wynikającą
          z przyczyn niezależnych (awarie infrastruktury zewnętrznej, ataki DDoS, siła wyższa).
        </p>

        <div style={dividerStyle} />

        {/* 9. Pozasądowe rozwiązywanie sporów */}
        <h2 style={h2Style}>9. Pozasądowe rozwiązywanie sporów</h2>
        <p style={pStyle}>
          9.1. Konsument ma prawo skorzystać z pozasądowych metod rozwiązywania sporów,
          w szczególności:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={liStyle}>zwrócić się do Rzecznika Praw Konsumenta lub właściwego miejskiego/powiatowego rzecznika konsumentów</li>
          <li style={liStyle}>złożyć wniosek do Inspekcji Handlowej o wszczęcie postępowania mediacyjnego</li>
          <li style={liStyle}>skierować sprawę do Stałego Polubownego Sądu Konsumenckiego przy właściwym Wojewódzkim Inspektoracie Inspekcji Handlowej</li>
        </ul>
        <p style={pStyle}>
          9.2. Platforma ODR (Online Dispute Resolution) została wygaszona w 2025 roku i nie jest
          już dostępna.
        </p>

        <div style={dividerStyle} />

        {/* 10. Postanowienia końcowe */}
        <h2 style={h2Style}>10. Postanowienia końcowe</h2>
        <p style={pStyle}>
          10.1. W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa
          polskiego, w szczególności: ustawa z dnia 30 maja 2014 r. o prawach konsumenta, ustawa
          z dnia 23 kwietnia 1964 r. Kodeks cywilny, ustawa z dnia 18 lipca 2002 r. o świadczeniu
          usług drogą elektroniczną.
        </p>
        <p style={pStyle}>
          10.2. Sprzedawca zastrzega prawo do zmiany niniejszego regulaminu. Aktualizacja regulaminu
          będzie publikowana na tej stronie.
        </p>
        <p style={pStyle}>
          10.3. Regulamin obowiązuje od dnia: [DATA PUBLIKACJI].
        </p>

        <div style={dividerStyle} />

        <p style={{ ...pStyle, color: '#5A5C66', marginTop: 32, fontSize: 12 }}>
          Pixarium · <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#5A5C66' }}>{CONTACT_EMAIL}</a> · {SITE_ADDRESS}
        </p>

      </div>
    </div>
  )
}
