/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: '#030712',
                    card: '#0b0f1a',
                    border: '#1f2937',
                    text: '#f3f4f6',
                    accent: '#3b82f6',
                }
            }
        },
    },
    plugins: [],
}
