/** Même langage que l'outil Loseless (papier, encre, grain), avec un accent à nous : le Cobalt.
 *  Cobalt réservé aux boutons principaux, au repère « à toi de jouer » et aux alertes. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        encre: '#121212',
        papier: '#F4F2EE',
        craie: '#E6E2DA',
        pierre: '#6B6660',
        accent: '#2B44E0',
        vert: '#1F7A4D',
        ambre: '#B7791F',
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
