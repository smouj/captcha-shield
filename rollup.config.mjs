/**
 * CAPTCHA Shield v4.0 "Fortress" — Rollup Build Configuration
 *
 * Produces a minified, obfuscated IIFE bundle for the production
 * widget.js that can be embedded on any website.
 *
 * ## Build Pipeline
 *
 * ```
 * src/lib/v4/widget-entry.ts
 *   → Rollup (tree-shaking, bundling)
 *   → terser (minification: mangle, compress)
 *   → javascript-obfuscator (control-flow flattening, string encryption)
 *   → public/v4/widget.js (production output)
 * ```
 *
 * ## Usage
 *
 * ```bash
 * # Build the production widget
 * bunx rollup -c rollup.config.mjs
 *
 # Or use the convenience script:
 * bash scripts/obfuscate.sh
 * ```
 *
 * ## Output Characteristics
 *
 * - Format: IIFE (Immediately Invoked Function Expression)
 * - Source maps: Disabled for production (security)
 * - Minification: Variable mangling, dead code elimination
 * - Obfuscation: String array rotation, control flow flattening
 * - Target: ES2015+ (broad browser compatibility)
 * - Size target: <50KB gzipped
 */

import terser from '@rollup/plugin-terser';
import { obfuscator } from 'rollup-obfuscator';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // Entry point: widget wrapper that bootstraps CaptchaWidgetV4
  input: 'src/lib/v4/widget-entry.ts',

  output: {
    // Output as self-executing IIFE for embedding
    file: 'public/v4/widget.js',
    format: 'iife',

    // No external imports — everything bundled inline
    inlineDynamicImports: true,

    // Wrap in a function scope to avoid global pollution
    // IIFE format already does this, but we add extra hardening
    name: 'CaptchaShieldV4',

    // No exports — everything is internal
    exports: 'none',

    // Disable source maps for production (security: don't expose source structure)
    sourcemap: false,

    // Compact output
    compact: true,

    // Add a banner with version info
    banner: [
      '/*!',
      ' * CAPTCHA Shield v4.0 "Fortress" — Widget',
      ' * https://github.com/smouj/captcha-shield',
      ' * License: MIT',
      ' * Built: ' + new Date().toISOString().split('T')[0],
      ' */',
    ].join('\n'),
  },

  plugins: [
    // 1. Resolve node_modules imports
    resolve({
      browser: true,
      preferBuiltins: false,
    }),

    // 2. Compile TypeScript
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      sourceMap: false,
      outDir: undefined,
      // Only compile the widget entry and its dependencies
      include: ['src/lib/v4/**/*', 'src/lib/types.ts', 'src/lib/behavioral-analyzer-v4.ts'],
    }),

    // 3. Obfuscate the code for anti-tampering protection
    obfuscator({
      // Obfuscator options — see https://github.com/javascript-obfuscator/javascript-obfuscator
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      debugProtection: false, // Don't block DevTools (breaks debugging for legit users)
      debugProtectionInterval: 0,
      disableConsoleOutput: false, // Don't disable console (breaks debugging)
      identifierNamesGenerator: 'hexadecimal',
      identifiersPrefix: '_cs4', // Prefix all identifiers for collision safety
      inputFileName: 'widget.js',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false, // Don't rename window/document etc.
      rotateStringArray: true,
      seed: 42, // Deterministic obfuscation for reproducible builds
      selfDefending: true, // Prevent formatting/re-beautification
      shuffleStringArray: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 0.5,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      target: 'browser',
      transformObjectKeys: true,
      unicodeEscapeSequence: false, // Keep ASCII for compatibility
    }),

    // 4. Minify with terser (applied AFTER obfuscation for maximum compression)
    terser({
      compress: {
        // Aggressive compression options
        defaults: true,
        arrows: true,
        arguments: false,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        drop_console: false, // Keep console for error reporting
        drop_debugger: true,
        evaluate: true,
        expression: false,
        hoist_funs: true,
        hoist_vars: false,
        if_return: true,
        inline: 2,
        join_vars: true,
        keep_classnames: false,
        keep_fnames: false,
        loops: true,
        negate_iife: true,
        properties: true,
        reduce_funcs: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        typeofs: true,
        unsafe: false,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: true,
        warnings: false,
      },
      mangle: {
        // Variable name mangling
        eval: true,
        keep_classnames: false,
        keep_fnames: false,
        properties: false, // Don't mangle properties (breaks DOM access)
        reserved: [
          // Don't mangle these globals
          'window', 'document', 'navigator', 'location',
          'localStorage', 'sessionStorage', 'crypto',
          'postMessage', 'addEventListener', 'removeEventListener',
          'CaptchaShield', 'CaptchaShieldConfig',
        ],
        safari10: true,
        toplevel: true,
      },
      format: {
        comments: /^!/i, // Keep only banner comments
        beautify: false,
        ascii_only: true,
        indent_level: 0,
        width: 0, // No line wrapping
      },
      toplevel: true,
    }),
  ],

  // Don't bundle these as external — they're dev-only
  external: [],
};
