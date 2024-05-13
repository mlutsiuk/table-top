import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default antfu({
  formatters: {
    prettierOptions: {
      trailingComma: 'none'
    }
  },
  overrides: {
    stylistic: {
      'style/comma-dangle': ['error', 'never']
    }
  },
  rules: {
    'antfu/top-level-function': 'off',
    'ts/consistent-type-definitions': 'off'
  }
}, ...compat.config({
  extends: ['plugin:tailwindcss/recommended'],
  rules: {
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/migration-from-tailwind-2': 'off'
  }
})) 
