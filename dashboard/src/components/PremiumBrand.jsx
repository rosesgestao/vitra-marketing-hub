export function PremiumIcon({ className = '', size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 110 103"
      className={className}
      role="img"
      aria-label="Vitra Premium"
    >
      <polygon points="55,8 94,30.5 94,72.5 55,95 16,72.5 16,30.5" fill="#000000" stroke="#C4942A" strokeWidth="2.3" />
      <polygon points="55,13 90,33 90,70 55,90 20,70 20,33" fill="none" stroke="rgba(212,168,74,0.15)" strokeWidth="0.7" />
      <polygon points="25,37 39,37 32,54" fill="#FFE08A" />
      <polygon points="25,37 32,54 55,76" fill="#8B6914" />
      <polygon points="39,37 32,54 55,76" fill="#C4942A" />
      <polygon points="85,37 71,37 78,54" fill="#F0C95C" />
      <polygon points="85,37 78,54 55,76" fill="#7A5C10" />
      <polygon points="71,37 78,54 55,76" fill="#D4A84A" />
    </svg>
  )
}

export function PremiumV({ className = '', size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Vitra Premium V isolado"
    >
      <g transform="translate(50 50) scale(1.28) translate(-50 -52.5)">
        <polygon points="20,33 34,33 27,50" fill="#FFE08A" />
        <polygon points="20,33 27,50 50,72" fill="#8B6914" />
        <polygon points="34,33 27,50 50,72" fill="#C4942A" />
        <polygon points="80,33 66,33 73,50" fill="#F0C95C" />
        <polygon points="80,33 73,50 50,72" fill="#7A5C10" />
        <polygon points="66,33 73,50 50,72" fill="#D4A84A" />
      </g>
    </svg>
  )
}

export function PremiumWordmark({ className = '' }) {
  return (
    <svg
      viewBox="-16 0 194 54"
      className={className}
      role="img"
      aria-label="Vitra Premium"
    >
      <text x="0" y="29" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="27" letterSpacing="12" fill="#FFFFFF">
        VITR
      </text>
      <path
        d="M119.99,9.56 L129.98,29.54 L110,29.54 Z M119.99,18.551 L123.4865,25.544 L116.4935,25.544 Z"
        fill="#FFFFFF"
        fillRule="evenodd"
      />
      <text x="-12.5" y="52" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="10.5" letterSpacing="17.6108" fill="#C4942A">
        PREMIUM
      </text>
    </svg>
  )
}

export function PremiumHorizontalLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PremiumIcon size={56} className="shrink-0" />
      <div className="h-12 w-px bg-gold-500/30" />
      <PremiumWordmark className="h-12 w-[165px]" />
    </div>
  )
}

export function VitraIcon({ className = '', size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Vitra Imobiliária"
    >
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="#07111F" stroke="#C4942A" strokeWidth="2.5" />
      <polygon points="50,9 86,29.5 86,70.5 50,91 14,70.5 14,29.5" fill="none" stroke="rgba(212,168,74,0.18)" strokeWidth="0.8" />
      <polygon points="20,33 34,33 27,50" fill="#8EC4F0" />
      <polygon points="20,33 27,50 50,72" fill="#1B3A6B" />
      <polygon points="34,33 27,50 50,72" fill="#2E6BB5" />
      <polygon points="80,33 66,33 73,50" fill="#F0C95C" />
      <polygon points="80,33 73,50 50,72" fill="#9B7A1C" />
      <polygon points="66,33 73,50 50,72" fill="#D4A84A" />
    </svg>
  )
}

export function VitraV({ className = '', size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Vitra Imobiliária V isolado"
    >
      <g transform="translate(50 50) scale(1.22) translate(-50 -52)">
        <polygon points="20,33 34,33 27,50" fill="#8EC4F0" />
        <polygon points="20,33 27,50 50,72" fill="#1B3A6B" />
        <polygon points="34,33 27,50 50,72" fill="#2E6BB5" />
        <polygon points="80,33 66,33 73,50" fill="#F0C95C" />
        <polygon points="80,33 73,50 50,72" fill="#9B7A1C" />
        <polygon points="66,33 73,50 50,72" fill="#D4A84A" />
      </g>
    </svg>
  )
}

export function VitraWordmark({ className = '' }) {
  return (
    <svg
      viewBox="-16 0 232 56"
      className={className}
      role="img"
      aria-label="Vitra Imobiliária"
    >
      <text x="0" y="29" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="27" letterSpacing="12" fill="#FFFFFF">
        VITR
      </text>
      <path
        d="M119.99,9.56 L129.98,29.54 L110,29.54 Z M119.99,18.551 L123.4865,25.544 L116.4935,25.544 Z"
        fill="#FFFFFF"
        fillRule="evenodd"
      />
      <text x="-12" y="53" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="8.5" letterSpacing="11.1" fill="#C4942A">
        IMOBILIÁRIA
      </text>
    </svg>
  )
}

export function VitraHorizontalLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VitraIcon size={56} className="shrink-0" />
      <div className="h-12 w-px bg-gold-500/30" />
      <VitraWordmark className="h-12 w-[195px]" />
    </div>
  )
}

export function BrandHorizontalLogo({ brandScope = 'vitra_premium', className = '' }) {
  if (brandScope === 'vitra_imobiliaria') return <VitraHorizontalLogo className={className} />
  return <PremiumHorizontalLogo className={className} />
}

export function BrandV({ brandScope = 'vitra_premium', className = '', size = 42 }) {
  if (brandScope === 'vitra_imobiliaria') return <VitraV className={className} size={size} />
  return <PremiumV className={className} size={size} />
}
