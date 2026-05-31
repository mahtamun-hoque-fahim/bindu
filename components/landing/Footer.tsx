export function Footer() {
  const cols = [
    { h: 'Product', l: ['Features', 'Privacy', 'Bindu+', 'Status', 'Changelog'] },
    { h: 'Company', l: ['About', 'Press', 'Jobs', 'Contact', 'Brand kit'] },
    {
      h: 'Safety',
      l: [
        'Trust & safety',
        'School portal',
        'Parent guide',
        'Crisis resources',
        'Report abuse',
      ],
    },
    {
      h: 'Legal',
      l: ['Terms', 'Privacy policy', 'Cookies', 'Security paper', 'Bug bounty'],
    },
  ]
  return (
    <footer
      style={{
        background: 'var(--bg-2)',
        borderTop: '1px solid var(--line)',
        padding: '60px 0 30px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr)',
            gap: 40,
            marginBottom: 50,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
              />
              bindu
            </div>
            <p
              style={{
                color: 'var(--ink-2)',
                fontSize: 14,
                lineHeight: 1.5,
                maxWidth: 280,
              }}
            >
              An anonymous inbox the size of a dot. End-to-end encrypted. Made
              with care in Chittagong and Brooklyn.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                {c.h}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {c.l.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      style={{
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        fontSize: 14,
                      }}
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-2)',
          }}
        >
          <span>© 2026 Bindu Labs · all whispers reserved</span>
          <span>● status: building · phase 1 of 9</span>
        </div>
      </div>
    </footer>
  )
}
