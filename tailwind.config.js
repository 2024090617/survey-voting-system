
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: { 
        extend: {
            fontFamily: {
                'fangsong': ['FangSong', 'STFangSong', 'FangSong_GB2312', '仿宋', 'serif'],
            }
        } 
    },
    plugins: [require('@tailwindcss/typography')],
  };
