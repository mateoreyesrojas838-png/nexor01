export default function PrismLoader({ small }: { small?: boolean }) {
  if (small) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 32 }}>
        <div className="prism-container" style={{ width: 80, height: 80 }}>
          <div className="prism-aura" />
          <div className="prism-echo" style={{ width: 56, height: 56 }} />
          <div className="prism-ring" style={{ width: 56, height: 56 }} />
        </div>
        <span className="prism-text__main">Cargando</span>
      </div>
    )
  }

  return (
    <div className="prism-loader">
      <div className="prism-container">
        <div className="prism-aura" />
        <div className="prism-echo" />
        <div className="prism-ring" />
      </div>
      <div className="prism-text">
        <span className="prism-text__main">Cargando</span>
        <span className="prism-text__sub">Procesando Datos</span>
      </div>
    </div>
  )
}
