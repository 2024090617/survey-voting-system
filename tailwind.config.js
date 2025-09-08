
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: { 
        extend: {
            fontFamily: {
                'fangsong': ['FangSong', 'STFangSong', 'FangSong_GB2312', '仿宋', 'AR PL UKai CN', 'Noto Serif CJK SC', 'serif'],
                'kaiti': ['AR PL UKai CN', 'AR PL UKai TW', 'KaiTi', 'serif'],
                'noto-serif': ['Noto Serif CJK SC', 'Noto Serif CJK TC', 'serif']
            }
        } 
    },
    plugins: [require('@tailwindcss/typography')],
  };
