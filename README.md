# Melville

A templating engine for [twee/twine](http://gimcrackd.com/etc/src/).

Fork of [tweecode/jonah](https://github.com/tweecode/jonah) with the following adjustments:

* Uses [grunt](https://github.com/cowboy/grunt) to build header.html
* Javascript: [linted](http://www.jshint.com/) and [strict mode](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/Strict_mode)
* [Waits for first image to load before showing passage](https://github.com/monospaced/melville/blob/c6de78e1fc2613a05facb24930439b15f0f17ee2/history.js#L156)
* CSS: [normalize](http://necolas.github.com/normalize.css/) + custom theme

## Usage

### Twee

Copy [header.html](https://github.com/monospaced/melville/blob/master/header.html) to a new folder called `melville` in `twee/targets/`, then use the following syntax:

    twee -t melville source.tw > target.html

### Twine

Twine doesn't allow new Story Formats to be plugged in (yet), but you can try out Melville in Twine by overwriting `header.html` in `/targets/jonah/` with [melville/header.html](https://github.com/monospaced/melville/blob/master/header.html). The Jonah Story Format option will then output to Melville. In case you need to restore to Jonah, here’s the original [jonah/header.html](https://github.com/tweecode/jonah/blob/master/header.html).
