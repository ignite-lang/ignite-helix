#include "tree_sitter/parser.h"

// Two external tokens.
//
// `_newline`: a run of line breaks, emitted only when the parser accepts a separator
// there. Everywhere else a line break stays whitespace (`extras`). This reproduces the
// newline rules of the Ignite parser: a statement, arm, field or declaration ends at a
// line break, but a line break after a binary operator, `=`, `,` or inside `( )` and
// `[ ]` is insignificant, and a postfix `(`, `[`, `.`, `?` or `else` on the next line
// does not attach to the previous line.
//
// `raw_string_literal`: `r"..."`, `r#"..."#` (any number of `#`) and `br"..."`, with no
// escapes and possibly spanning lines.

enum TokenType {
  NEWLINE,
  RAW_STRING,
  ERROR_SENTINEL,
};

void *tree_sitter_ignite_external_scanner_create(void) { return NULL; }
void tree_sitter_ignite_external_scanner_destroy(void *payload) { (void)payload; }
unsigned tree_sitter_ignite_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}
void tree_sitter_ignite_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

static bool scan_raw_string(TSLexer *lexer) {
  if (lexer->lookahead == 'b') {
    lexer->advance(lexer, false);
  }
  if (lexer->lookahead != 'r') {
    return false;
  }
  lexer->advance(lexer, false);
  unsigned hashes = 0;
  while (lexer->lookahead == '#') {
    hashes++;
    lexer->advance(lexer, false);
  }
  if (lexer->lookahead != '"') {
    return false;
  }
  lexer->advance(lexer, false);
  for (;;) {
    if (lexer->eof(lexer)) {
      return false;
    }
    if (lexer->lookahead == '"') {
      lexer->advance(lexer, false);
      unsigned closing = 0;
      while (closing < hashes && lexer->lookahead == '#') {
        closing++;
        lexer->advance(lexer, false);
      }
      if (closing == hashes) {
        lexer->mark_end(lexer);
        lexer->result_symbol = RAW_STRING;
        return true;
      }
      continue;
    }
    lexer->advance(lexer, false);
  }
}

bool tree_sitter_ignite_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;
  if (valid_symbols[ERROR_SENTINEL]) {
    return false;
  }
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' || lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }
  if (valid_symbols[NEWLINE] && lexer->lookahead == '\n') {
    while (lexer->lookahead == '\n' || lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
           lexer->lookahead == '\r') {
      bool line_break = lexer->lookahead == '\n';
      lexer->advance(lexer, false);
      if (line_break) {
        lexer->mark_end(lexer);
      }
    }
    lexer->result_symbol = NEWLINE;
    return true;
  }
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' || lexer->lookahead == '\r' ||
         lexer->lookahead == '\n') {
    lexer->advance(lexer, true);
  }
  if (valid_symbols[RAW_STRING] && (lexer->lookahead == 'r' || lexer->lookahead == 'b')) {
    return scan_raw_string(lexer);
  }
  return false;
}
