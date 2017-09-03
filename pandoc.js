var spawn = require('child_process').spawn;

// pdcStream(from, to, [args,] [opts])
function pdcStream(from, to, args, opts) {
  var defaultArgs = ['-f', from, '-t', to];

  // sanitize arguments
  // no args, no opts
  if (arguments.length == 2) {
    args = defaultArgs;
  } else {
    // concatenate arguments
    args = defaultArgs.concat(args);
  }

  // start pandoc (with or without options)
  var pandoc;
  if (typeof opts == 'undefined')
    pandoc = spawn('pandoc', args);
  else
    pandoc = spawn('pandoc', args, opts);

  return pandoc;
}

module.exports = pdcStream;