export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="veexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
            </defs>

            {/* Industrial Hexagon */}
            <path
                d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                fill="none"
                stroke="url(#veexGradient)"
                strokeWidth="3"
                strokeLinejoin="miter"
            />

            {/* VX Monogram */}
            <g fill="url(#veexGradient)" fontFamily="monospace" fontWeight="700">
                <text x="50" y="60" fontSize="32" textAnchor="middle" dominantBaseline="middle">
                    VX
                </text>
            </g>

            {/* Corner Accents */}
            <circle cx="50" cy="5" r="2" fill="#10b981" />
            <circle cx="90" cy="27.5" r="2" fill="#10b981" />
            <circle cx="90" cy="72.5" r="2" fill="#10b981" />
            <circle cx="50" cy="95" r="2" fill="#10b981" />
            <circle cx="10" cy="72.5" r="2" fill="#10b981" />
            <circle cx="10" cy="27.5" r="2" fill="#10b981" />
        </svg>
    );
}
