# AGENTS.md

A tree-sitter grammar for Ignite and the Helix queries that use it. Humans: [`README.md`](README.md).

## Source of truth

The Ignite compiler, `github.com/ignite-lang/ignite`, defines the syntax:
`crates/ignite-syntax/src/lexer.rs` (tokens, keywords, literals, raw strings, escapes),
`crates/ignite-syntax/src/parser.rs` (grammar, newline rules) and `crates/ignite-syntax/src/ast.rs`
(`QUANTITY_UNITS`); `docs/slice.md` section 3 describes the grammar in prose. When they change, change
`tree-sitter-ignite/grammar.js` and the queries here. The hand-copied lists and their origins are in
[`README.md`](README.md#hand-copied-lists); keep that table current.

## Commands

| task | command |
|---|---|
| generate the parser | `task generate` (`tree-sitter generate --abi 14` in `tree-sitter-ignite/`) |
| generate and parse every `.ignite` file of std and examples | `task grammar` (`IGNITE=<checkout>`, default `../ignite-lang`; non-zero on any `ERROR` or `MISSING`) |
| check every query against the grammar | `task query` (same `IGNITE`) |
| build the shared library for a local Helix runtime | `tree-sitter build -o <dir>/ignite.so tree-sitter-ignite` |

## Conventions

- `tree-sitter-ignite/src/` is generated except `src/scanner.c`, and it is committed: Helix builds
  from `src/`. Never edit `parser.c`, `grammar.json`, `node-types.json` or `tree_sitter/` by hand;
  regenerate with `task generate` and commit the result with the `grammar.js` change.
- Generate with ABI 14: Helix 25.07 loads it.
- `src/scanner.c` emits `_newline` only where the parser accepts a separator; that is how the
  newline rules of the Ignite parser (no postfix or `else` across a line break, newlines
  insignificant inside `( )` and `[ ]` and after an operator) are expressed. It also lexes raw
  strings `r#"…"#`.
- The grammar is permissive: it accepts some programs the Ignite parser rejects (E001). It must
  accept every program the Ignite parser accepts.
- `helix/queries/ignite/` uses Helix capture names; `tree-sitter-ignite/queries/highlights.scm`
  uses standard names. Helix gives the first matching pattern priority: specific patterns first.
- No language bindings (npm, Python, Go, Swift, Rust); `grammar.js` is the only JavaScript.
- No comments in `Taskfile.yml` or other config files.
- Commits follow Conventional Commits with a body of bullets saying what changed and why.
