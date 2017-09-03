/* Modules */

var through = require('through2');
var pandoc = require('./pandoc');
var gutil = require('gulp-util');

/* Plugin */

var PluginError = gutil.PluginError;
var PluginName = 'gulp-pp-pandoc';

/* Exports */

module.exports = function (opts) {
  var macro = opts.macro;
  var from = opts.from;
  var to = opts.to;
  var ext = opts.ext;
  var args = opts.args || [];

  if (!from) {
    throw new PluginError(PluginName, '"from" is not defined');
  }
  if (!to) {
    throw new PluginError(PluginName, '"to" is not defined');
  }
  if (!ext) {
    throw new PluginError(PluginName, '"ext" is not defined');
  }

  return through.obj(function (file, enc, cb) {
    var input = file.contents;
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PluginName, 'Streaming not supported'));
      return cb();
    }
    var pdcProcess = pandoc(from, to, args);
    pdcProcess.stdin.end(input);
    var chunks = [];
    var size = 0;

    pdcProcess.stdout.on('data', function (data) {
      chunks.push(data);
      size += data.length;
    });
    // listen on exit
    pdcProcess.on('close', (code) => {
      if (code !== 0) {
        this.emit('error', 'Error: pandoc exited with code ' + code);
        return cb();
      }
      var result = Buffer.concat(chunks, size);
      file.contents = result;
      file.path = gutil.replaceExtension(file.path, opts.ext);
      this.push(file);
      return cb();
    })
    pdcProcess.on('error', function (err) {
      this.emit('error', err.toString());
      return cb();
    });
  });
};