# ignite-helix

Syntax highlighting, indentation and text objects for [Ignite](https://github.com/ignite-lang/ignite)
(`.ignite` files) in [Helix](https://helix-editor.com/), from a tree-sitter grammar.

| path | what |
|---|---|
| `tree-sitter-ignite/` | the tree-sitter grammar: `grammar.js`, the external scanner and the generated parser in `src/`, `queries/highlights.scm` with standard capture names |
| `helix/languages.toml` | the language, grammar and language-server entries for Helix |
| `helix/queries/ignite/` | `highlights.scm`, `indents.scm`, `textobjects.scm` with Helix capture names |

## Install into Helix

1. Append `helix/languages.toml` to `~/.config/helix/languages.toml`, with `rev` set to a commit of
   this repository.
2. Fetch and build the grammar:

   ```sh
   hx --grammar fetch
   hx --grammar build
   ```

3. Copy the queries:

   ```sh
   mkdir -p ~/.config/helix/runtime/queries
   cp -r helix/queries/ignite ~/.config/helix/runtime/queries/
   ```

4. Check: `hx --health ignite` lists the parser and the highlight, textobject and indent queries.

The language server entry expects an `ignite-lsp` binary on `PATH`; without it Helix still
highlights.

## Diagnostics: the ignite-lsp server

`ignite-lsp` is a language server written in Ignite; until it has its own repository it is
`examples/lsp/server.ignite` in the Ignite repository. It publishes the diagnostics of
`ignite check` for the open buffer. Build it from an Ignite checkout and put it on `PATH`:

```sh
ignite build examples/lsp/server.ignite --out ~/.local/ignite-lsp
export PATH="$HOME/.local/ignite-lsp/bin:$PATH"
```

It runs `ignite` from `PATH`; `--ignite /path/to/ignite` in `args` of
`[language-server.ignite-lsp]` picks another build. Check: `hx --health ignite` lists `ignite-lsp`
with a path, and a type error in an open `.ignite` file is underlined.

## Hand-copied lists

These lists are copied by hand from the Ignite compiler sources and go stale when the language
changes. A follow-up generates them from a formal language definition.

| list | where here | copied from (`github.com/ignite-lang/ignite`) |
|---|---|---|
| keywords | `KEYWORDS` in `tree-sitter-ignite/grammar.js`; keyword captures in both `highlights.scm` | `TokenKind::keyword` in `crates/ignite-syntax/src/lexer.rs` |
| clause words (`satisfies`, `verifies`, `conforms`, `scope`, `unsupported`, `not_applicable`) | rules in `grammar.js`; keyword captures in both `highlights.scm` | the `at_word` calls in `crates/ignite-syntax/src/parser.rs` |
| quantity units (`ns` … `GB`, `%`) | `UNITS` and `unit` in `grammar.js` | `QUANTITY_UNITS` in `crates/ignite-syntax/src/ast.rs` |
| operators and punctuation | `binary_expression`, `unary_expression` and the other rules in `grammar.js`; operator captures in both `highlights.scm` | the operator `match` in `lex_into`, `crates/ignite-syntax/src/lexer.rs` |
| operator precedence | `PREC` in `grammar.js` | `or` … `unary`, `postfix` in `crates/ignite-syntax/src/parser.rs` |
| escape sequences | `escape_sequence` in `grammar.js` | `escape` in `crates/ignite-syntax/src/lexer.rs` |
| std vocabulary word `interface` | `highlights.scm` | the former `telos` Helix stand-in query (`runtime/queries/telos/highlights.scm`); it is not an Ignite keyword |

## Development

See [`AGENTS.md`](AGENTS.md).
