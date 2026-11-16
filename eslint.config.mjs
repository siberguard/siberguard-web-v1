import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      // Logo & ikon adalah SVG statis/berkas CMS; next/image tidak menambah manfaat di sini.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: [
      '.next/',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'docs/',
      'test-results/',
      'playwright-report/',
    ],
  },
]

export default eslintConfig
