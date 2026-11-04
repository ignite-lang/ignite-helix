(function_declaration
  body: (_) @function.inside) @function.around

(closure_expression
  body: (_) @function.inside) @function.around

(test_declaration
  body: (_) @test.inside) @test.around

(type_declaration
  body: (_) @class.inside) @class.around

(enum_declaration
  body: (_) @class.inside) @class.around

(alias_declaration) @class.around

(system_declaration) @class.around

(protocol_declaration) @class.around

(parameters
  ((_) @parameter.inside . ","? @parameter.around) @parameter.around)

(arguments
  ((_) @parameter.inside . ","? @parameter.around) @parameter.around)

(type_parameters
  ((_) @parameter.inside . ","? @parameter.around) @parameter.around)

(type_arguments
  ((_) @parameter.inside . ","? @parameter.around) @parameter.around)

(closure_parameter) @parameter.around

(comment) @comment.inside

(comment)+ @comment.around

(match_arm) @entry.around

(field_declaration) @entry.around

(field_initializer) @entry.around

(brace_entry) @entry.around
