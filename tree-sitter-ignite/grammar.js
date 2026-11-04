/**
 * @file Ignite grammar for tree-sitter
 *
 * Mirrors the hand-written parser of the Ignite compiler
 * (crates/ignite-syntax/src/lexer.rs and parser.rs in github.com/ignite-lang/ignite).
 *
 * Newlines: the external scanner (src/scanner.c) emits `_newline` only where the
 * parser accepts a separator; everywhere else a line break is whitespace. That gives
 * the rules of docs/slice.md section 3: a postfix `(`, `[`, `.`, `?` and `else` do not
 * attach across a line break, newlines are insignificant inside `( )` and `[ ]` and
 * after a binary operator, and `,` or a newline separates arms, fields and statements.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Copied from TokenKind::keyword in crates/ignite-syntax/src/lexer.rs.
const KEYWORDS = [
  'package', 'import', 'type', 'enum', 'fn', 'system', 'protocol', 'const',
  'resource', 'component', 'contract', 'policy', 'assembly', 'let', 'var',
  'return', 'match', 'if', 'else', 'while', 'loop', 'for', 'in', 'break',
  'continue', 'await', 'spawn', 'requires', 'test', 'assert', 'true', 'false',
];

// Copied from QUANTITY_UNITS in crates/ignite-syntax/src/ast.rs (without `%`).
const UNITS = [
  'ns', 'us', 'ms', 'second', 'seconds', 'minute', 'minutes', 'hour', 'hours',
  'day', 'days', 'byte', 'bytes', 'KiB', 'MiB', 'GiB', 'KB', 'MB', 'GB',
];

const PREC = {
  closure: -1,
  ret: 0,
  or: 1,
  and: 2,
  equality: 3,
  compare: 4,
  additive: 5,
  multiplicative: 6,
  unary: 7,
  postfix: 8,
};

const commaList = (item) => optional(seq(item, repeat(seq(',', item)), optional(',')));
const commaList1 = (item) => seq(item, repeat(seq(',', item)), optional(','));

module.exports = grammar({
  name: 'ignite',

  word: $ => $.identifier,

  externals: $ => [$._newline, $.raw_string_literal, $._error_sentinel],

  extras: $ => [/\s/, $.comment],

  conflicts: $ => [
    [$._primary, $.record_literal],
    [$._primary, $.brace_key],
  ],

  supertypes: $ => [$._declaration, $._expression, $._pattern, $._type],

  rules: {
    source_file: $ => repeat(choice($._declaration, $._newline)),

    comment: _ => token(seq('//', /[^\n]*/)),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    _name: $ => choice($.identifier, alias(choice(...KEYWORDS), $.identifier)),

    _stmt_seps: $ => repeat1(choice(';', $._newline)),
    _item_seps: $ => repeat1(choice(',', $._newline)),

    // ------------------------------------------------------------ declarations

    _declaration: $ => choice(
      $.package_declaration,
      $.import_declaration,
      $.type_declaration,
      $.alias_declaration,
      $.enum_declaration,
      $.function_declaration,
      $.const_declaration,
      $.system_declaration,
      $.protocol_declaration,
      $.assembly_declaration,
      $.test_declaration,
    ),

    package_declaration: $ => seq('package', field('path', $.path)),

    path: $ => prec.left(seq($._name, repeat(seq('.', $._name)))),

    import_declaration: $ => seq(
      'import',
      field('path', $.import_path),
    ),

    import_path: $ => seq(
      $._name,
      repeat(seq('.', choice($._name, $.wildcard_import, $.import_list))),
    ),

    wildcard_import: _ => '*',

    import_list: $ => seq('{', commaList1($.identifier), '}'),

    type_declaration: $ => seq(
      optional('test'),
      'type',
      field('name', alias($.identifier, $.type_identifier)),
      optional(field('type_parameters', $.type_parameters)),
      optional($.satisfies_clause),
      field('body', $.field_declaration_list),
    ),

    alias_declaration: $ => seq(
      'type',
      field('name', alias($.identifier, $.type_identifier)),
      optional(field('type_parameters', $.type_parameters)),
      '=',
      field('type', $._type),
    ),

    field_declaration_list: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        $.field_declaration,
        repeat(seq($._item_seps, $.field_declaration)),
        optional($._item_seps),
      )),
      '}',
    ),

    field_declaration: $ => seq(
      field('name', alias($._name, $.field_identifier)),
      ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression))),
      optional($.satisfies_clause),
    ),

    type_parameters: $ => seq('<', commaList1($.type_parameter), '>'),

    type_parameter: $ => seq(
      field('name', alias($.identifier, $.type_identifier)),
      optional(seq(':', $.bound)),
    ),

    bound: $ => seq(
      alias($.identifier, $.type_identifier),
      repeat(seq('+', alias($.identifier, $.type_identifier))),
    ),

    enum_declaration: $ => seq(
      optional('test'),
      'enum',
      field('name', alias($.identifier, $.type_identifier)),
      optional(field('type_parameters', $.type_parameters)),
      field('body', $.variant_list),
    ),

    variant_list: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        $.variant,
        repeat(seq($._item_seps, $.variant)),
        optional($._item_seps),
      )),
      '}',
    ),

    variant: $ => seq(
      field('name', $.identifier),
      optional(seq('(', commaList1($._type), ')')),
    ),

    function_declaration: $ => seq(
      optional('test'),
      'fn',
      optional(seq(field('owner', alias($.identifier, $.type_identifier)), '.')),
      field('name', $.identifier),
      optional(field('type_parameters', $.type_parameters)),
      field('parameters', $.parameters),
      optional(seq('->', field('return_type', $._type))),
      optional($.requires_clause),
      optional($.satisfies_clause),
      choice(field('body', $.block), seq('=', field('body', $._expression))),
    ),

    parameters: $ => seq('(', commaList($.parameter), ')'),

    parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $._type),
    ),

    requires_clause: $ => seq('requires', '[', commaList($.effect), ']'),

    effect: $ => seq($._name, repeat(seq('.', choice($._name, '*')))),

    satisfies_clause: $ => seq('satisfies', '[', commaList1($.requirement_reference), ']'),

    verifies_clause: $ => seq('verifies', '[', commaList1($.requirement_reference), ']'),

    requirement_reference: $ => seq(
      field('spec', $.identifier),
      '.',
      field('id', $.identifier),
    ),

    const_declaration: $ => seq(
      optional('test'),
      'const',
      field('name', $.identifier),
      ':',
      field('type', $._type),
      '=',
      field('value', $._expression),
    ),

    test_declaration: $ => seq(
      'test',
      field('name', $.string_literal),
      optional($.verifies_clause),
      field('body', $.block),
    ),

    system_declaration: $ => seq(
      'system',
      field('name', alias($.identifier, $.type_identifier)),
      '{',
      repeat($._newline),
      optional(seq(
        $._system_member,
        repeat(seq(repeat1($._newline), $._system_member)),
        repeat($._newline),
      )),
      '}',
    ),

    _system_member: $ => choice(
      $.resource_declaration,
      $.component_declaration,
      $.contract_declaration,
      $.policy_declaration,
    ),

    resource_declaration: $ => seq(
      'resource',
      field('name', $.identifier),
      ':',
      field('kind', alias($.identifier, $.type_identifier)),
      optional(field('type_arguments', $.type_arguments)),
      optional(field('properties', $.property_list)),
    ),

    component_declaration: $ => seq(
      'component',
      field('name', $.identifier),
      ':',
      field('kind', alias($.identifier, $.type_identifier)),
      field('properties', $.property_list),
    ),

    contract_declaration: $ => seq(
      'contract',
      field('name', $.identifier),
      ':',
      field('kind', alias($.identifier, $.type_identifier)),
      field('properties', $.property_list),
    ),

    policy_declaration: $ => seq(
      'policy',
      field('name', $.identifier),
      ':',
      field('kind', alias($.identifier, $.type_identifier)),
      field('properties', $.property_list),
    ),

    assembly_declaration: $ => seq(
      'assembly',
      field('name', $.identifier),
      ':',
      field('kind', alias($.identifier, $.type_identifier)),
      field('properties', $.property_list),
    ),

    property_list: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        $.field_initializer,
        repeat(seq($._item_seps, $.field_initializer)),
        optional($._item_seps),
      )),
      '}',
    ),

    protocol_declaration: $ => seq(
      'protocol',
      field('name', alias($.identifier, $.type_identifier)),
      optional($.conforms_clause),
      '{',
      repeat(choice($.function_declaration, $.status_declaration, $._newline)),
      '}',
    ),

    conforms_clause: $ => seq(
      'conforms',
      '[',
      commaList1($.identifier),
      ']',
      optional($.scope_clause),
    ),

    scope_clause: $ => seq('scope', $.brace_literal),

    status_declaration: $ => seq(
      field('kind', choice('unsupported', 'not_applicable')),
      field('requirement', $.requirement_reference),
      field('reason', $.string_literal),
    ),

    // ------------------------------------------------------------ types

    _type: $ => choice(
      $.named_type,
      $.function_type,
      $.unit_type,
      $.tuple_type,
      $.parenthesized_type,
    ),

    named_type: $ => prec.right(seq(
      field('name', alias($.identifier, $.type_identifier)),
      optional(field('type_arguments', $.type_arguments)),
    )),

    type_arguments: $ => seq('<', commaList1($._type), '>'),

    function_type: $ => prec.right(seq(
      'fn',
      '(',
      commaList($.function_type_parameter),
      ')',
      optional(seq('->', field('return_type', $._type))),
      optional($.requires_clause),
    )),

    function_type_parameter: $ => seq(
      optional(seq(field('name', $.identifier), ':')),
      field('type', $._type),
    ),

    unit_type: _ => seq('(', ')'),

    tuple_type: $ => seq('(', $._type, ',', commaList1($._type), ')'),

    parenthesized_type: $ => seq('(', $._type, ')'),

    // ------------------------------------------------------------ statements

    block: $ => prec(1, seq(
      '{',
      repeat($._newline),
      optional(seq(
        $._statement,
        repeat(seq($._stmt_seps, $._statement)),
        optional($._stmt_seps),
      )),
      '}',
    )),

    _statement: $ => choice(
      $.let_statement,
      $.discard_statement,
      $.assignment_statement,
      $.while_statement,
      $.loop_statement,
      $.for_statement,
      $.assert_statement,
      $.expression_statement,
    ),

    let_statement: $ => seq(
      choice('let', 'var'),
      field('pattern', $._pattern),
      optional(seq(':', field('type', $._type))),
      '=',
      field('value', $._expression),
    ),

    discard_statement: $ => seq('_', '=', field('value', $._expression)),

    assignment_statement: $ => seq(
      field('left', $._expression),
      '=',
      field('right', $._expression),
    ),

    while_statement: $ => seq('while', field('condition', $._expression), field('body', $.block)),

    loop_statement: $ => seq('loop', field('body', $.block)),

    for_statement: $ => seq(
      'for',
      field('pattern', $._pattern),
      'in',
      field('iterable', $._expression),
      field('body', $.block),
    ),

    assert_statement: $ => prec.right(seq(
      'assert',
      field('condition', $._expression),
      optional(seq(',', field('message', $._expression))),
    )),

    expression_statement: $ => $._expression,

    // ------------------------------------------------------------ expressions

    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.closure_expression,
      $.return_expression,
      $._postfix,
    ),

    _postfix: $ => choice(
      $.call_expression,
      $.field_expression,
      $.tuple_index_expression,
      $.index_expression,
      $.try_expression,
      $._primary,
    ),

    binary_expression: $ => {
      const table = [
        [PREC.or, '||'],
        [PREC.and, '&&'],
        [PREC.equality, choice('==', '!=')],
        [PREC.compare, choice('<', '>', '<=', '>=')],
        [PREC.additive, choice('+', '-')],
        [PREC.multiplicative, choice('*', '/', '%')],
      ];
      return choice(...table.map(([p, op]) => prec.left(p, seq(
        field('left', $._expression),
        field('operator', op),
        field('right', $._expression),
      ))));
    },

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('!', '-', 'await', 'spawn')),
      field('operand', $._expression),
    )),

    return_expression: $ => prec.right(PREC.ret, seq('return', optional($._expression))),

    closure_expression: $ => prec(PREC.closure, seq(
      choice('||', seq('|', commaList($.closure_parameter), '|')),
      field('body', choice($.block, $._expression)),
    )),

    closure_parameter: $ => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
    ),

    call_expression: $ => prec(PREC.postfix, seq(
      field('function', $._postfix),
      field('arguments', $.arguments),
    )),

    arguments: $ => seq('(', commaList(choice($._expression, $.named_argument)), ')'),

    named_argument: $ => seq(field('name', $.identifier), '=', field('value', $._expression)),

    field_expression: $ => prec(PREC.postfix, seq(
      field('value', $._postfix),
      '.',
      field('field', alias($._name, $.field_identifier)),
    )),

    tuple_index_expression: $ => prec(PREC.postfix, seq(
      field('value', $._postfix),
      '.',
      field('index', $.integer_literal),
    )),

    index_expression: $ => prec(PREC.postfix, seq(
      field('value', $._postfix),
      '[',
      field('index', $._expression),
      ']',
    )),

    try_expression: $ => prec(PREC.postfix, seq($._postfix, '?')),

    _primary: $ => choice(
      $.integer_literal,
      $.quantity_literal,
      $.string_literal,
      $.raw_string_literal,
      $.byte_string_literal,
      $.byte_literal,
      $.boolean_literal,
      $.identifier,
      $.record_literal,
      $.brace_literal,
      $.list_expression,
      $.match_expression,
      $.if_expression,
      $.break_expression,
      $.continue_expression,
      $.unit_expression,
      $.parenthesized_expression,
      $.tuple_expression,
    ),

    break_expression: _ => 'break',
    continue_expression: _ => 'continue',

    unit_expression: _ => seq('(', ')'),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    tuple_expression: $ => seq('(', $._expression, ',', commaList1($._expression), ')'),

    list_expression: $ => seq('[', commaList($._expression), ']'),

    record_literal: $ => seq(
      field('name', alias($.identifier, $.type_identifier)),
      field('body', $.record_body),
    ),

    record_body: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        choice($.field_initializer, $.base_expression),
        repeat(seq($._item_seps, choice($.field_initializer, $.base_expression))),
        optional($._item_seps),
      )),
      '}',
    ),

    base_expression: $ => seq('..', $._expression),

    field_initializer: $ => seq(
      field('name', alias($._name, $.field_identifier)),
      optional(seq('=', field('value', $._expression))),
    ),

    brace_literal: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        $.brace_entry,
        repeat(seq($._item_seps, $.brace_entry)),
        optional($._item_seps),
      )),
      '}',
    ),

    brace_entry: $ => seq(
      field('key', $.brace_key),
      '=',
      field('value', $._expression),
    ),

    brace_key: $ => seq(
      alias($.identifier, $.field_identifier),
      repeat(seq('.', alias($._name, $.field_identifier))),
    ),

    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', choice($.if_expression, $.block)))),
    )),

    match_expression: $ => seq(
      'match',
      field('value', $._expression),
      field('body', $.match_block),
    ),

    match_block: $ => seq(
      '{',
      repeat($._newline),
      optional(seq(
        $.match_arm,
        repeat(seq($._item_seps, $.match_arm)),
        optional($._item_seps),
      )),
      '}',
    ),

    match_arm: $ => seq(
      field('pattern', $._pattern),
      '=>',
      field('value', choice($.block, $._expression)),
    ),

    // ------------------------------------------------------------ patterns

    _pattern: $ => choice($.or_pattern, $._pattern_alternative),

    or_pattern: $ => prec.left(seq(
      $._pattern_alternative,
      repeat1(seq('|', $._pattern_alternative)),
    )),

    _pattern_alternative: $ => choice($.range_pattern, $._pattern_atom),

    range_pattern: $ => seq($._pattern_atom, '..=', $._pattern_atom),

    _pattern_atom: $ => choice(
      $.wildcard_pattern,
      $.integer_literal,
      $.negative_literal,
      $.byte_literal,
      $.string_literal,
      $.boolean_literal,
      $.unit_pattern,
      $.tuple_pattern,
      $.parenthesized_pattern,
      $.list_pattern,
      $.variant_pattern,
      $.identifier,
    ),

    wildcard_pattern: _ => '_',

    negative_literal: $ => seq('-', $.integer_literal),

    unit_pattern: _ => seq('(', ')'),

    tuple_pattern: $ => seq('(', $._pattern, ',', commaList1($._pattern), ')'),

    parenthesized_pattern: $ => seq('(', $._pattern, ')'),

    list_pattern: $ => seq('[', commaList($._pattern), ']'),

    variant_pattern: $ => choice(
      seq(
        field('path', $.pattern_path),
        '(',
        commaList1($._pattern),
        ')',
      ),
      field('path', alias($._dotted_pattern_path, $.pattern_path)),
    ),

    pattern_path: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    _dotted_pattern_path: $ => seq($.identifier, repeat1(seq('.', $.identifier))),

    // ------------------------------------------------------------ literals

    boolean_literal: _ => choice('true', 'false'),

    integer_literal: _ => token(choice(
      /0[xX][0-9a-fA-F_]+/,
      /[0-9][0-9_]*/,
    )),

    decimal_literal: _ => /[0-9][0-9_]*\.[0-9][0-9_]*/,

    quantity_literal: $ => seq(
      field('value', choice($.integer_literal, $.decimal_literal)),
      field('unit', $.unit),
    ),

    unit: _ => choice(...UNITS, token.immediate('%')),

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.brace_escape,
        $.interpolation,
      )),
      token.immediate('"'),
    ),

    string_content: _ => token.immediate(prec(1, /[^"\\{}\n]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[nrtvf0\\"']/,
        /x[0-9a-fA-F]{2}/,
        /u\{[0-9a-fA-F]{1,6}\}/,
      ),
    )),

    brace_escape: _ => token.immediate(choice('{{', '}}')),

    interpolation: $ => seq(token.immediate('{'), $._expression, '}'),

    byte_string_literal: _ => token(seq('b"', repeat(choice(/[^"\\\n]/, /\\./, /\\x[0-9a-fA-F]{2}/)), '"')),

    byte_literal: _ => token(seq("b'", choice(/[^'\\]/, /\\x[0-9a-fA-F]{2}/, /\\./), "'")),
  },
});
