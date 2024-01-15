export default defineAppConfig({
  ui: {
    

    button: {
      base: 'leading-6',
      rounded: 'rounded-[10px]',
      size: {
        md: 'text-md',
      },
      padding: {
        md: 'px-6 py-2'
      },
      gap: {
        md: 'gap-x-1'
      },
      color: {
        'tamer-grey': {
          solid: 'bg-tamer-grey-100 text-white hover:bg-tamer-grey-90 disabled:bg-tamer-grey-80 active:bg-tamer-grey-100'
        }
      },
      default: {
        size: 'md',
        color: 'tamer-grey'
      },
      icon: {
        size: {
          md: 'w-6 h-6'
        }
      }
    }
  }
})
