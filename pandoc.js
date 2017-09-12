var spawn = require('child_process').spawn;

// pdcStream(from, to, [args,] [opts])
function pdcStream({ from, to, args, opts }) {
  var defaultArgs = ['-f', from, '-t', to];
  if (Array.isArray(args)) args = defaultArgs.concat(args);

  // start pandoc (with or without options)
  var pandoc;
  if (typeof opts == 'undefined')
    pandoc = spawn('pandoc', args);
  else
    pandoc = spawn('pandoc', args, opts);

  return pandoc;
}

module.exports = pdcStream;