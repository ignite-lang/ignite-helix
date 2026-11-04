; Ignite highlights with standard tree-sitter capture names (the Helix set is helix/queries/ignite).
; Specific patterns come before general ones.

(comment) @comment

; ------------------------------------------------------------------ literals
(escape_sequence) @string.escape
(brace_escape) @string.escape
(interpolation
  "{" @punctuation.special
  "}" @punctuation.special)
(string_content) @string
(string_literal "\"" @string)
(raw_string_literal) @string
(byte_string_literal) @string
(byte_literal) @character
(integer_literal) @number
(decimal_literal) @number
(unit) @number
(boolean_literal) @constant.builtin

; ------------------------------------------------------------------ keywords
[
  "if"
  "else"
  "match"
] @keyword

[
  "while"
  "loop"
  "for"
  "in"
] @keyword

[
  "return"
] @keyword
(break_expression) @keyword
(continue_expression) @keyword

[
  "package"
  "import"
] @keyword

"fn" @keyword

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
] @keyword

[
  "let"
  "var"
  "const"
] @keyword

[
  "requires"
  "satisfies"
  "verifies"
  "conforms"
  "scope"
  "unsupported"
  "not_applicable"
] @keyword

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
(resource_declaration name: (identifier) @property)
(component_declaration name: (identifier) @property)
(contract_declaration name: (identifier) @property)
(policy_declaration name: (identifier) @property)
(assembly_declaration name: (identifier) @property)
(requirement_reference spec: (identifier) @type id: (identifier) @constant)
(conforms_clause (identifier) @type)
(package_declaration (path (identifier) @namespace))
(import_path (identifier) @namespace)
(import_list (identifier) @type
  (#match? @type "^[A-Z]"))
(import_list (identifier) @function)
(effect (identifier) @property)

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
(field_identifier) @property

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
