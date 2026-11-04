; Ignite highlights for Helix. Helix gives the first matching pattern priority, so
; specific patterns come before general ones.

(comment) @comment.line

; ------------------------------------------------------------------ literals
(escape_sequence) @constant.character.escape
(brace_escape) @constant.character.escape
(interpolation
  "{" @punctuation.special
  "}" @punctuation.special)
(string_content) @string
(string_literal "\"" @string)
(raw_string_literal) @string
(byte_string_literal) @string
(byte_literal) @constant.character
(integer_literal) @constant.numeric.integer
(decimal_literal) @constant.numeric.float
(unit) @constant.numeric
(boolean_literal) @constant.builtin.boolean

; ------------------------------------------------------------------ keywords
[
  "if"
  "else"
  "match"
] @keyword.control.conditional

[
  "while"
  "loop"
  "for"
  "in"
] @keyword.control.repeat

[
  "return"
] @keyword.control.return
(break_expression) @keyword.control.return
(continue_expression) @keyword.control.return

[
  "package"
  "import"
] @keyword.control.import

"fn" @keyword.function

[
  "type"
  "enum"
  "system"
  "resource"
  "component"
  "contract"
  "policy"
  "assembly"
  "protocol"
] @keyword.storage.type

[
  "let"
  "var"
  "const"
] @keyword.storage

[
  "requires"
  "satisfies"
  "verifies"
  "conforms"
  "scope"
  "unsupported"
  "not_applicable"
] @keyword.storage.modifier

[
  "test"
  "assert"
  "await"
  "spawn"
] @keyword

((identifier) @keyword
  (#eq? @keyword "interface"))

; ------------------------------------------------------------------ declarations
(function_declaration
  owner: (type_identifier) @type
  name: (identifier) @function.method)
(function_declaration name: (identifier) @function)
(parameter name: (identifier) @variable.parameter)
(closure_parameter name: (identifier) @variable.parameter)
(function_type_parameter name: (identifier) @variable.parameter)
(const_declaration name: (identifier) @constant)
(variant name: (identifier) @constructor)
(test_declaration name: (string_literal) @string.special)
(resource_declaration name: (identifier) @variable.other.member)
(component_declaration name: (identifier) @variable.other.member)
(contract_declaration name: (identifier) @variable.other.member)
(policy_declaration name: (identifier) @variable.other.member)
(assembly_declaration name: (identifier) @variable.other.member)
(requirement_reference spec: (identifier) @type id: (identifier) @constant)
(conforms_clause (identifier) @type)
(package_declaration (path (identifier) @namespace))
(import_path (identifier) @namespace)
(import_list (identifier) @type
  (#match? @type "^[A-Z]"))
(import_list (identifier) @function)
(effect (identifier) @variable.other.member)

; ------------------------------------------------------------------ types
(type_identifier) @type

; ------------------------------------------------------------------ calls
(call_expression
  function: (field_expression
    field: (field_identifier) @function.method))
(call_expression
  function: (identifier) @constructor
  (#match? @constructor "^[A-Z]"))
(call_expression function: (identifier) @function)
(named_argument name: (identifier) @variable.parameter)

; ------------------------------------------------------------------ patterns
(variant_pattern (pattern_path (identifier) @constructor .))
(variant_pattern (pattern_path (identifier) @type))
(wildcard_pattern) @variable.builtin
"_" @variable.builtin

; ------------------------------------------------------------------ members
(field_identifier) @variable.other.member

; ------------------------------------------------------------------ identifiers
((identifier) @constructor
  (#match? @constructor "^[A-Z]"))
(identifier) @variable

; ------------------------------------------------------------------ operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<="
  ">="
  "&&"
  "||"
  "!"
  "="
  "=>"
  "->"
  "?"
  "|"
  ".."
  "..="
] @operator

(binary_expression operator: ["<" ">"] @operator)

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

(type_parameters ["<" ">"] @punctuation.bracket)
(type_arguments ["<" ">"] @punctuation.bracket)

[
  ","
  "."
  ":"
  ";"
] @punctuation.delimiter
