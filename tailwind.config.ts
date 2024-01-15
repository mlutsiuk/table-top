import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        'tamer-grey': {
          100: '#141416',
          90: '#484660',
          80: '#67606E',
          70: '#D4D2ED',
          60: '#E7E5F6',
          50: '#EFECF8',
          40: '#F6F6FF',
        }
      }
    }
  }
}
