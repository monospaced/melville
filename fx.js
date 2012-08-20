//
// Section: Effects
//

//
// Function: fade
// Fades a DOM element in or out.
//
// Parameters:
// el - the element to fade
// options - an object of options to use. This object must have a *fade*
//           property, which should be either the string 'in' or 'out',
//           corresponding to the direction of the fade. The second
//           property used here, *onComplete*, is a function that is called
//           once the fade is complete. This is optional.
//
// Returns:
// nothing
//

function fade(el, options){
  'use strict';
  var current,
      proxy = el.cloneNode(true),
      direction = (options.fade === 'in') ? 1 : -1,
      interval;
  el.parentNode.replaceChild(proxy, el);
  if (options.fade === 'in') {
    current = 0;
    proxy.style.visibility = 'visible';
  } else {
    current = 1;
  }
  function tick(){
    current += 0.05 * direction;
    setOpacity(proxy, Math.easeInOut(current));
    if ((direction === 1 && current >= 1) || (direction === -1 && current <= 0)) {
      console.log('swapping fader proxy out');
      el.style.visibility = (options.fade === 'in') ? 'visible' : 'hidden';
      proxy.parentNode.replaceChild(el, proxy);
      //delete proxy;
      window.clearInterval(interval);
      if (options.onComplete) {
        options.onComplete();
      }
    }
  }
  function setOpacity (el, opacity){
    var percent = Math.floor(opacity * 100);
    // IE
    el.style.zoom = 1;
    el.style.filter = 'alpha(opacity=' + percent + ')';
    // CSS 3
    el.style.opacity = opacity;
  }
  setOpacity(proxy, current);
  interval = window.setInterval(tick, 25);
}

//
// Function: scrollWindowTo
// This scrolls the browser window to ensure that a DOM element is
// in view. Make sure that the element has been added to the page
// before calling this function.
//
// Parameters:
// el - the element to scroll to.
//
// Returns:
// nothing
//

function scrollWindowTo(el){
  'use strict';
  var start = window.scrollY ? window.scrollY : document.body.scrollTop,
      progress = 0,
      end,
      distance,
      direction,
      interval;
  function tick(){
    progress += 0.1;
    window.scrollTo(0, start + direction * (distance * Math.easeInOut(progress)));
    if (progress >= 1) {
      window.clearInterval(interval);
    }
  }
  function ensureVisible(el){
    var posTop = findPosY(el),
        posBottom = posTop + el.offsetHeight,
        winTop = window.scrollY ? window.scrollY : document.body.scrollTop,
        winHeight = window.innerHeight ? window.innerHeight : document.body.clientHeight,
        winBottom = winTop + winHeight;
    if (posTop < winTop) {
      return posTop;
    } else if (posBottom > winBottom) {
      if (el.offsetHeight < winHeight) {
        return (posTop - (winHeight - el.offsetHeight) + 20);
      } else {
        return posTop;
      }
    } else {
      return posTop;
    }
  }
  function findPosY(el){
    var curtop = 0;
    while (el.offsetParent) {
      curtop += el.offsetTop;
      el = el.offsetParent;
    }
    return curtop;
  }
  end = ensureVisible(el);
  distance = Math.abs(start - end);
  direction = (start > end) ? -1 : 1;
  interval = window.setInterval(tick, 25);
}
