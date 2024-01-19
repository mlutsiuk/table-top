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
  }
}, ...compat.config({
  extends: ['plugin:tailwindcss/recommended'],
  rules: {
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/migration-from-tailwind-2': 'off'
  }
})) 