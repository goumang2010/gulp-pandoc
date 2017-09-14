/* Modules */

var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');
var crypto = require('crypto');
var pandoc = require('./pandoc');



/* Plugin */

var PluginError = gutil.PluginError;
var PluginName = 'gulp-pdc';

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
  var write = /pdf/.test(ext);

  var normalHandler = function (file, enc, cb) {
    var input = file.contents;
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PluginName, 'Streaming not supported'));
      return cb();
    }
    var spawnOpts = { cwd: file.dirname };
    var pdcProcess = pandoc({ from, to, args, opts: spawnOpts });
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
  }
  var binaryHandler = function (file, enc, cb) {
    var input = file.contents;
    var tempfolder = path.join(file.dirname || '', './_temp');
    if (!fs.existsSync(tempfolder)) fs.mkdirSync(tempfolder);
    var tempfile = crypto.createHash('sha1').update(file.path).digest('hex').substr(0, 10) + '.' + to;
    var target = path.join(tempfolder, tempfile);

    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PluginName, 'Streaming not supported'));
      return cb();
    }
    var spawnOpts = { cwd: file.dirname };
    // https://github.com/tzengyuxio/pages
    // https://afoo.me/posts/2013-07-10-how-to-transform-chinese-pdf-with-pandoc.html
    var pandocArgs = ['-o', target, '--latex-engine=xelatex', '-V', 'mainfont=Hei', `--template=${__dirname}/pm-template`];
    [].push.apply(pandocArgs, args);
    var pdcProcess = pandoc({ from, to, args: pandocArgs, opts: spawnOpts });
    pdcProcess.stdin.end(input);
    // listen on exit
    pdcProcess.on('close', (code) => {
      if (fs.existsSync(target)) {
        file.contents = fs.createReadStream(target);
        file.path = gutil.replaceExtension(file.path, opts.ext);
        this.push(file);
      }
      return cb();
    })
    pdcProcess.on('error', function (err) {
      this.emit('error', err.toString());
      return cb();
    });
  }

  return through.obj(write ? binaryHandler : normalHandler);
};