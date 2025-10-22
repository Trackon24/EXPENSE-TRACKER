import React from 'react';

const ThemeStyles = () => (
    <style>{`
        :root {
            --color-background: #111827;
            --color-card-bg: #1f2937;
            --color-card-bg-light: #374151;
            --color-text-primary: #f9fafb;
            --color-text-secondary: #9ca3af;
            --color-primary: #4f46e5;
            --color-border: #374151;
        }
        .theme-light {
            --color-background: #f3f4f6;
            --color-card-bg: #ffffff;
            --color-card-bg-light: #f9fafb;
            --color-text-primary: #111827;
            --color-text-secondary: #6b7280;
            --color-primary: #4f46e5;
            --color-border: #e5e7eb;
        }
        .theme-minimal {
            --color-background: #e0f2fe;
            --color-card-bg: #ffffff;
            --color-card-bg-light: #f0f9ff;
            --color-text-primary: #0c4a6e;
            --color-text-secondary: #38bdf8;
            --color-primary: #0ea5e9;
            --color-border: #bae6fd;
        }
        .bg-background { background-color: var(--color-background); }
        .bg-card-bg { background-color: var(--color-card-bg); }
        .bg-card-bg-light { background-color: var(--color-card-bg-light); }
        .text-text-primary { color: var(--color-text-primary); }
        .text-text-secondary { color: var(--color-text-secondary); }
        .bg-primary { background-color: var(--color-primary); }
        .text-primary { color: var(--color-primary); }
        .border-border { border-color: var(--color-border); }
        .fill-text-primary { fill: var(--color-text-primary); }
    `}</style>
);

export default ThemeStyles;
