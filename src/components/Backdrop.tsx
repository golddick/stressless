export default function Backdrop() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16473f" /><stop offset="1" stopColor="#041512" /></linearGradient>
            <linearGradient id="ce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#021210" /><stop offset="1" stopColor="#0d332c" /></linearGradient>
            <radialGradient id="gl" cx=".5" cy=".47" r=".5"><stop offset="0" stopColor="#ffe9b0" stopOpacity=".95" /><stop offset="1" stopColor="#ffe9b0" stopOpacity="0" /></radialGradient>
            <pattern id="pr" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#0b2a25" /><rect x="4" y="6" width="12" height="28" rx="2" fill="#e9c46a" /><rect x="20" y="12" width="14" height="22" rx="2" fill="#e76f51" /><rect x="38" y="4" width="16" height="30" rx="2" fill="#7fd8be" /><rect x="0" y="35" width="60" height="5" fill="#d9e8e3" opacity=".7" /></pattern>
            <filter id="b"><feGaussianBlur stdDeviation="7" /></filter>
            <filter id="bb"><feGaussianBlur stdDeviation="16" /></filter>
          </defs>
          <rect width="1600" height="900" fill="url(#ce)" />
          <g filter="url(#b)">
            <polygon points="0,420 1600,420 1600,900 0,900" fill="url(#fl)" />
            <polygon points="0,0 640,330 640,600 0,900" fill="url(#pr)" />
            <polygon points="1600,0 960,330 960,600 1600,900" fill="url(#pr)" />
            <rect x="640" y="330" width="320" height="270" fill="#0f3a33" />
            <rect x="650" y="345" width="300" height="60" fill="url(#pr)" /><rect x="650" y="420" width="300" height="60" fill="url(#pr)" /><rect x="650" y="495" width="300" height="60" fill="url(#pr)" />
            <polygon points="0,0 1600,0 960,330 640,330" fill="#031411" />
            <polygon points="640,600 960,600 1100,900 500,900" fill="#1c5a4f" opacity=".7" />
          </g>
          <rect width="1600" height="900" fill="url(#gl)" opacity=".55" />
          <g filter="url(#bb)" fill="#ffe3a0">
            <circle cx="300" cy="90" r="46" opacity=".7" /><circle cx="640" cy="130" r="38" opacity=".6" /><circle cx="980" cy="120" r="42" opacity=".6" /><circle cx="1320" cy="80" r="50" opacity=".7" />
            <circle cx="170" cy="560" r="30" opacity=".35" fill="#7fd8be" /><circle cx="1450" cy="600" r="36" opacity=".35" fill="#7fd8be" />
          </g>
        </svg>
      </div>
      <div className="veil" />
    </>
  )
}
