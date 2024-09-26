export default function LoadingScreen() {
    const loadingSvg = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 50 50"
            style={{ margin: 'auto', background: 'none', display: 'block' }}
            width="50px"
            height="50px"
        >
            <circle
                cx="25"
                cy="25"
                r="20"
                stroke="#000"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                style={{
                    animation: 'spin 1s linear infinite',
                }}
            />
            <style>{`
        @keyframes spin {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
        </svg>
    );

    return <div style={{ height: '100vh', display: 'grid', placeContent: 'center' }}>{loadingSvg}</div>;
}
