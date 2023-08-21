/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    colors:{
      background1: '#34222E',
      background2: '#76362C',
      alertred1: '#C33030',

      prime1: '#FF6F2F',
      prime2: '#DBB874',
      prime3: '#366ED8',

      palered: '#E2434B',
      darkbeige: '#F9BF8F',
      lightbeige: '#FEE9D7',
      goldyellow: '#F0D96C',
      whitegreen: '#B8F5CB',
      palegreen: '#53C576',
      weakgreen: '#79A386',
      greygreen: '#7C847C',
      darkgreen: '#2D6A4F',
      gameblue: '#064ACB',
      greyness: '#7C7474',
      purpgrey: '#79789C',





    },
    extend: {
      fontFamily: {
        knife: ['knife'],
      },

    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}

