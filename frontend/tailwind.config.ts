
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // Include all your source files
  ],
  theme: {
    extend: {
      colors: {
        appBackground: '#000000', // Black background
        appGray: '#1A1A1A', // Dark gray for cards
        appText: '#B3B3B3', // Light gray for text
        appWhite: '#FFFFFF', // White for text
        appBlue: '#0077FF', // Accent blue (e.g., League Pass button)
        appYellow: '#FFD700', // Accent yellow (e.g., play icon)
      },
    },
  },
  plugins: [],
};