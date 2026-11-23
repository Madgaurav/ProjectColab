import React from 'react'

export function HoneycombBackground() {
  return (
    <div className="honeycomb-backdrop" aria-hidden="true">
      {/* Ambient Radial Illumination Spots */}
      <div className="honeycomb-glow-spot glow-top-left" />
      <div className="honeycomb-glow-spot glow-center-right" />
      <div className="honeycomb-glow-spot glow-bottom-left" />

      <svg
        className="honeycomb-svg-layer"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Subtle Repeating Hexagon Pattern for Ambient Background */}
          <pattern
            id="ambient-honeycomb-pattern"
            width="62.35"
            height="108"
            patternUnits="userSpaceOnUse"
          >
            {/* Hexagon radius ~ 20.78, w = 36, h = 36 */}
            <path
              d="M 31.18 0 L 62.35 18 L 62.35 54 L 31.18 72 L 0 54 L 0 18 Z
                 M 0 54 L 31.18 72 L 31.18 108 L 0 126
                 M 62.35 54 L 31.18 72 L 31.18 108 L 62.35 126
                 M 31.18 108 L 62.35 126
                 M 31.18 0 L 31.18 -36"
              fill="none"
              stroke="var(--hex-ambient-stroke)"
              strokeWidth="1"
            />
          </pattern>

          {/* Gradients for Featured Hexagon Clusters */}
          <linearGradient id="hero-hex-glow-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--hex-glow-start)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--hex-glow-end)" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="hero-hex-glow-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--hex-glow-start)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--hex-glow-end)" stopOpacity="0.02" />
          </linearGradient>

          <radialGradient id="hex-radial-accent" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--hex-glow-start)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--hex-glow-end)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Full-viewport ambient repeating honeycomb mesh */}
        <rect width="100%" height="100%" fill="url(#ambient-honeycomb-pattern)" className="ambient-mesh-rect" />

        {/* 2. Primary Hero Hexagon Cluster (Upper Left - exactly matching uploaded images) */}
        <g className="hero-cluster hero-cluster-left">
          {/* Hexagon R=42, W=72.7, H=84. dx=72.7, dy=63, offset=36.35 */}
          {/* Row 1 */}
          <polygon
            points="126.3,39.0 162.7,60.0 162.7,102.0 126.3,123.0 90.0,102.0 90.0,60.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.4"
          />
          <polygon
            points="199.0,39.0 235.4,60.0 235.4,102.0 199.0,123.0 162.7,102.0 162.7,60.0"
            fill="url(#hero-hex-glow-1)"
            stroke="var(--hex-stroke-highlight)"
            strokeWidth="1.6"
          />

          {/* Row 2 (offset) */}
          <polygon
            points="90.0,102.0 126.3,123.0 126.3,165.0 90.0,186.0 53.6,165.0 53.6,123.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <polygon
            points="162.7,102.0 199.0,123.0 199.0,165.0 162.7,186.0 126.3,165.0 126.3,123.0"
            fill="url(#hero-hex-glow-2)"
            stroke="var(--hex-stroke-highlight)"
            strokeWidth="1.8"
          />
          <polygon
            points="235.4,102.0 271.7,123.0 271.7,165.0 235.4,186.0 199.0,165.0 199.0,123.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.4"
          />

          {/* Row 3 */}
          <polygon
            points="53.6,165.0 90.0,186.0 90.0,228.0 53.6,249.0 17.3,228.0 17.3,186.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <polygon
            points="126.3,165.0 162.7,186.0 162.7,228.0 126.3,249.0 90.0,228.0 90.0,186.0"
            fill="url(#hero-hex-glow-1)"
            stroke="var(--hex-stroke-highlight)"
            strokeWidth="1.5"
          />
          <polygon
            points="199.0,165.0 235.4,186.0 235.4,228.0 199.0,249.0 162.7,228.0 162.7,186.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.3"
          />

          {/* Row 4 (Lower trail) */}
          <polygon
            points="90.0,228.0 126.3,249.0 126.3,291.0 90.0,312.0 53.6,291.0 53.6,249.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <polygon
            points="162.7,228.0 199.0,249.0 199.0,291.0 162.7,312.0 126.3,291.0 126.3,249.0"
            fill="url(#hero-hex-glow-2)"
            stroke="var(--hex-stroke)"
            strokeWidth="1.2"
            opacity="0.75"
          />

          {/* Inner accent ring inside highlighted cell */}
          <polygon
            points="162.7,114.0 188.7,129.0 188.7,159.0 162.7,174.0 136.7,159.0 136.7,129.0"
            fill="none"
            stroke="var(--hex-stroke-inner)"
            strokeWidth="1"
            opacity="0.65"
          />
        </g>

        {/* 3. Secondary Subtle Hexagon Cluster (Mid/Right Side - as in Image 3) */}
        <g className="hero-cluster hero-cluster-right">
          <polygon
            points="106.3,39.0 142.7,60.0 142.7,102.0 106.3,123.0 70.0,102.0 70.0,60.0"
            fill="url(#hero-hex-glow-2)"
            stroke="var(--hex-stroke)"
            strokeWidth="1.3"
            opacity="0.7"
          />
          <polygon
            points="179.0,39.0 215.4,60.0 215.4,102.0 179.0,123.0 142.7,102.0 142.7,60.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <polygon
            points="142.7,102.0 179.0,123.0 179.0,165.0 142.7,186.0 106.3,165.0 106.3,123.0"
            fill="url(#hero-hex-glow-1)"
            stroke="var(--hex-stroke-highlight)"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <polygon
            points="215.4,102.0 251.7,123.0 251.7,165.0 215.4,186.0 179.0,165.0 179.0,123.0"
            fill="none"
            stroke="var(--hex-stroke)"
            strokeWidth="1.1"
            opacity="0.45"
          />
        </g>
      </svg>
    </div>
  )
}

export default HoneycombBackground
