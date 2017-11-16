/**
 * @fileoverview If you see some hbs`<h1>handlebars templates</h1>`, pass it through a linter.
 * @author Peter Banka
 */
'use strict'
const TemplateLinter = require('ember-template-lint')
const fs = require('fs')

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {

  meta: {
    docs: {
      description:
        'If you see some hbs`<h1>handlebars templates</h1>`, pass it through a linter.',
      category: 'Literal linting',
      recommended: false
    },
    fixable: null,
    schema: [
      {
        oneOf: [
          {
            enum: ['tab']
          },
          {
            type: 'integer',
            minimum: 0
          }
        ]
      },
      {
        type: 'object',
        properties: {
          'ConfigFile': {
            type: 'string'
          },
        },
        additionalProperties: false,
      },
    ]
  },

  create: function(context) {
    let config = {}
    let linter
    if (context.options.length > 1) {
      const extendedOptions = context.options[1]
      const filename = extendedOptions.ConfigFile
      if (filename && fs.existsSync(filename)) {
        config = JSON.parse(fs.readFileSync(filename))
        linter = new TemplateLinter({config})
      }
    }
    if (!linter) {
      linter = new TemplateLinter()
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      TaggedTemplateExpression: (node) => {
        if (node.tag.name === 'hbs') {
          if (node.quasi.type === 'TemplateLiteral') {
            let hbs = node.quasi.quasis[0].value.cooked
            let lines = hbs.split('\n')
            if (lines[0] === '') {
              lines = lines.slice(1)
            }
            let countSame = -1
            let testChar
            do {
              countSame++
              testChar = null
              for (let line of lines) {
                if (!testChar) {
                  testChar = line[countSame]
                }
                let curChar = line[countSame]
                let isBlankLine = !curChar
                let isWhitespace = curChar === ' ' || curChar === '\t'
                if (!isBlankLine && (!isWhitespace || curChar !== testChar)) {
                  testChar = null
                  break
                }
              }
            } while (testChar)
            lines = lines.map(line => {
              return line.substr(countSame)
            })
            if (lines[lines.length - 1] === '') {
              lines = lines.slice(0, lines.length - 1)
            }
            hbs = lines.join('\n')
            const results = linter.verify({source: hbs.toString(), moduleId: context.id})
            if (results.length !== 0) {
              const firstLine = results[0].message.split('\n')[0]
              const msg = `${results.length} error(s): ${firstLine}`
              context.report(node, msg)
            }
          }
        }
      },
    }
  }
}
