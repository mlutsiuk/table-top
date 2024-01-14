import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: {
    prettierOptions: {
      trailingComma: 'none'
    }
  }
}) 
