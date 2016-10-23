/*
 * jBooklet jQuery Plugin
 * Copyright (c) 2014 Eugene Zlobin (http://zlobin.pro/zlobin_eng.html)
 *
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version : 2.4.6
 *
 * Originally based on the work of:
 *	1) Charles Mangin (http://clickheredammit.com/pageflip/)
 *	2) William Grauvogel (http://builtbywill.com/)
 */
(function (window, $, undefined) {
  'use strict';

  $.fn.booklet = function(options) {
    var $el = $(this),
        result = [],
        method,
        output,
        config,
        args = Array.prototype.slice.call(arguments, 1);

    // option type string - api call
    if (typeof options === 'string') {
      $el.each(function() {
        var obj = $el.data('jbooklet');

        if (obj) {
          method = options;
          if (obj[method]) {
            output = obj[method].apply(obj, args);
            if (output !== undefined || output) {
              result.push(obj[method].apply(obj, args));
            }
          } else {
            $.error('Method "' + method + '" does not exist on jQuery.booklet.');
          }
        } else {
          $.error('jQuery.booklet has not been initialized. Method "' + options + '" cannot be called.');
        }
      });

      if (result.length === 1) {
        return result[0];
      } else if (result.length > 0) {
        return result;
      } else {
        return $el;
      }
    } else if (typeof method === 'object' || !method) {
      // else build new booklet
      return $el.each(function() {
        var $element = $(this);
        var obj = $el.data('jbooklet');

        config = $.extend({}, $.fn.booklet.defaults, options);

        // destroy old booklet before creating new one
        if (obj) {
          obj.destroy();
        }

        // instantiate the booklet
        obj = new Booklet($element, config);
        obj.init();

        return this;
      });
    }
  };

  function Booklet(target, inOptions) {    
    var $wrapper = $('<div>', {
          'class': 'b-page'
        }),
        $underWrapper = $('<div>', {
          'class': 'b-wrap'
        });
    $underWrapper.appendTo($wrapper);
    var options = inOptions,
        isInit = false,
        isBusy = false,
        isPlaying = false,
        isHoveringRight = false,
        isHoveringLeft = false,
        templates = {
          //transparent item used with closed books
          blank: '<div class="b-page-blank"></div>'
        },
        css = {}, anim = {},
        hoverShadowWidth, hoverFullWidth, hoverCurlWidth,
        pages = [], diff,
        originalPageTotal, startingPageNumber,
        // page content vars
        pN, p0, p1, p2, p3, p4, pNwrap, p0wrap, p1wrap, p2wrap, p3wrap, p4wrap, wraps,
       // control vars
        p3drag, p0drag,
        wPercent, wOrig, hPercent, hOrig,
        pWidth, pWidthN, pWidthH, pHeight, speedH,

        Page = function ($contentNode, index) {
          var $el = $wrapper.clone();
          var $wrap = $el.find('.b-wrap');

          $el.addClass('b-page-' + index);
          if (!$contentNode.hasClass('b-page-empty')) {
            if (index % 2 !== 0) {
              $wrap.addClass('b-wrap-right');
            } else {
              $wrap.addClass('b-wrap-left');
            }
          }
          $contentNode.appendTo($wrap);

          return {
            index: index,
            contentNode: $contentNode[0],
            pageNode: $el[0]
          };
        },

        init = function () {
          target.addClass('booklet');
          // store data for api calls
          target.data('jbooklet', this);

          // save original number of pages
          originalPageTotal = target.children().length;
          options.currentIndex = 0;

          if (originalPageTotal > 1000) {
            options.manual = false;
          }

          // generate page markup
          initPages();
          // initialize options
          updateOptions();
          // update after initialized
          updatePages();

          isInit = true;
        },
        destroy = function () {
          // destroy all booklet items
          destroyControls();
          destroyPages();

          target.removeClass('booklet').removeData('booklet');

          isInit = false;
        },

        initPages = function () {
          var nodes = [], newPage, i,
              children = target.children(),
              length = target.children().length;

          pages = [];

          // fix for odd number of pages
          if ((length % 2) !== 0) {
            children.last().after(templates.blank);
          }

          // set total page count
          options.pageTotal = length;
          startingPageNumber = 0;

          if (!isInit) {
            options.currentIndex = 0;

            if (!isNaN(options.startingPage) && 
              options.startingPage <= options.pageTotal && 
              options.startingPage > 0) {

              if ((options.startingPage % 2) !== 0) {
                options.startingPage--;
              }
              options.currentIndex = options.startingPage;
            }
          }

          // load pages
          for (i = 0; i < length; i++) {
            newPage = new Page($(children[i]), i);

            nodes.push(newPage.pageNode);
            pages.push(newPage);
          }
          target.append(nodes);
        },
        updatePages = function () {
          updatePageStructure();
          updatePageCSS();
          updateManualControls();
        },
        updatePageStructure = function () {
          var currIndex = options.currentIndex;

          // reset all content
          target.find('.b-page').removeClass('b-pN b-p0 b-p1 b-p2 b-p3 b-p4').hide();

          // add page classes
          if (currIndex - 2 >= 0) {
            target.find('.b-page-' + (currIndex - 2)).addClass('b-pN').show();
            target.find('.b-page-' + (currIndex - 1)).addClass('b-p0').show();
          }

          target.find('.b-page-' + (currIndex)).addClass('b-p1').show();
          target.find('.b-page-' + (currIndex + 1)).addClass('b-p2').show();

          if (currIndex + 3 <= options.pageTotal) {
            target.find('.b-page-' + (currIndex + 2)).addClass('b-p3').show();
            target.find('.b-page-' + (currIndex + 3)).addClass('b-p4').show();
          }

          // save structure elems to vars
          pN = target.find('.b-pN');
          p0 = target.find('.b-p0');
          p1 = target.find('.b-p1');
          p2 = target.find('.b-p2');
          p3 = target.find('.b-p3');
          p4 = target.find('.b-p4');
          pNwrap = pN.find('.b-wrap');
          p0wrap = p0.find('.b-wrap');
          p1wrap = p1.find('.b-wrap');
          p2wrap = p2.find('.b-wrap');
          p3wrap = p3.find('.b-wrap');
          p4wrap = p4.find('.b-wrap');
          wraps = target.find('.b-wrap');
        },
        updatePageCSS = function () {
          wraps.css(css.wrap);
          p0wrap.css(css.p0wrap);
          p1.css(css.p1);
          p2.css(css.p2);
          pN.css(css.pN);
          p0.css(css.p0);
          p3.stop().css(css.p3);
          p4.css(css.p4);

          target.width(options.width);
        },
        destroyPages = function () {
          var bWrap = target.find('.b-wrap');

          // remove booklet markup
          bWrap.unwrap();
          bWrap.children().unwrap();
          target.find('.b-counter, .b-page-blank, .b-page-empty').remove();
        },
        setWidthAndHeight = function() {
          var parent = target.parent(),
              OpWidth = options.width,
              OpHeight = options.height;

          // Set width.
          if (OpWidth && typeof OpWidth === 'string') {
            if (OpWidth.indexOf('px') !== -1) {
              options.width = OpWidth.replace('px', '');
            } else if (OpWidth.indexOf('%') !== -1) {
              wPercent = true;
              wOrig = OpWidth;
              options.width = parseFloat((OpWidth.replace('%', '') / 100) * parent.width());
            }
          }

          // Set height.
          if (OpHeight && typeof OpHeight === 'string' && OpHeight !== '100%') {
            if (OpHeight.indexOf('px') !== -1) {
              options.height = OpHeight.replace('px', '');
            } else if (OpHeight.indexOf('%') !== -1) {
              hPercent = true;
              hOrig = OpHeight;
              options.height = parseFloat((OpHeight.replace('%', '') / 100) * parent.height());
            }
          }

          // save page sizes and other vars
          pWidth = options.width / 2;
          pWidthN = '-' + pWidth + 'px';
          pWidthH = pWidth / 2;
          pHeight = options.height;
        },
        updateOptions = function(newOptions) {
          var didUpdate = false;
          var targetWidth = 0;
          var targetHeight = 0;

          // update options if newOptions have been passed in
          if (newOptions !== null && newOptions !== undefined) {
            // remove page structure, revert to original order
            destroyPages();
            destroyControls();
            options = $.extend({}, options, newOptions);
            didUpdate = true;
            initPages();
          }

          setWidthAndHeight();

          speedH = options.speed / 2;

          // set total page count
          options.pageTotal = target.children('.b-page').length;

          // update all CSS, as sizes may have changed
          updateCSSandAnimations();
          if (isInit) {
            updatePages();
          }

          // percentage resizing
          target.on('resize', function() {
            var $target = $(target);
            var w = $target.width();
            var h = $target.height();

            if (options.autoSize && options.$containerW && options.$containerH) {
              if (targetWidth !== w || targetHeight !== h) {
                targetWidth = w;
                targetHeight = h;
                updateSize();
              }
            }
          });

          isPlaying = false;

          // if options were updated force pages, controls and menu to update
          if (didUpdate) {
            updatePages();
          }
        },
        updateCSSandAnimations = function() {
          // init base css
          css = {
            'wrap': {
              'left': 0,
              'width': pWidth - (options.pagePadding * 2),
              //'height': pHeight - (options.pagePadding * 2),
              'height': pHeight,
              'padding': options.pagePadding,
              'overflow-y': 'auto',
              'opacity': 1
            },
            'p0wrap': {
              'right': 0,
              'left': 'auto'
            },
            'p1': {
              'left': 0,
              'width': pWidth,
              'height': pHeight
            },
            'p2': {
              'left': pWidth - 20,
              'width': pWidth,
              'opacity': 1,
              'height': pHeight
            },
            'pN': {
              'left': 0,
              'width': pWidth,
              'height': pHeight
            },
            'p0': {
              'left': 0,
              'width': 0,
              'height': pHeight
            },
            'p3': {
              'left': pWidth * 2,
              'width': 0,
              'height': pHeight,
              'padding-left': 0
            },
            'p4': {
              'left': pWidth - 20,
              'width': pWidth,
              'height': pHeight
            },
            'pwrap': {
              'hover': {
                'opacity': 0.1,
                'overflow-y': 'hidden'
              }
            }
          };

          hoverShadowWidth = 10;
          hoverFullWidth = options.hoverWidth + hoverShadowWidth;
          hoverCurlWidth = (options.hoverWidth / 2) + hoverShadowWidth;

          // init animation params
          anim = {
            'hover': {
              'speed': options.hoverSpeed,
              'size': options.hoverWidth,
              'p2': {
                'width': pWidth - hoverCurlWidth
              },
              'p3': {
                'left': options.width - hoverFullWidth,
                'width': hoverCurlWidth
              },
              'p3closed': {
                'left': pWidth - options.hoverWidth,
                'width': hoverCurlWidth
              },
              'p3wrap': {
                'left': hoverShadowWidth
              },
              'p2end': {
                'width': pWidth
              },
              'p2closedEnd': {
                'width': pWidth,
                'left': 0
              },
              'p3end': {
                'left': options.width,
                'width': 0
              },
              'p3closedEnd': {
                'left': pWidth,
                'width': 0
              },
              'p3wrapEnd': {
                'left': 10
              },
              'p1': {
                'left': hoverCurlWidth,
                'width': pWidth - hoverCurlWidth
              },
              'p1wrap': {
                'left': '-' + hoverCurlWidth + 'px'
              },
              'p0': {
                'left': hoverCurlWidth,
                'width': hoverCurlWidth
              },
              'p0wrap': {
                'right': hoverShadowWidth
              },
              'p1end': {
                'left': 0,
                'width': pWidth
              },
              'p1wrapEnd': {
                'left': 0
              },
              'p0end': {
                'left': 0,
                'width': 0
              },
              'p0wrapEnd': {
                'right': 0
              }
            },
            // Forward.
            'p2': {
              'width': 0
            },
            'p2closed': {
              'width': 0,
              'left': pWidth
            },
            'p4closed': {
              'left': pWidth
            },
            'p3in': {
              'left': pWidthH,
              'width': pWidthH,
              'padding-left': options.shadowBtmWidth
            },
            'p3inDrag': {
              'left': pWidth / 4,
              'width': pWidth * 0.75,
              'padding-left': options.shadowBtmWidth
            },
            'p3out': {
              'left': 0,
              'width': pWidth,
              'padding-left': 0
            },
            'p3wrapIn': {
              'left': options.shadowBtmWidth
            },
            'p3wrapOut': {
              'left': 0
            },
            // Backwards.
            'p1': {
              'left': pWidth,
              'width': 0
            },
            'p1wrap': {
              'left': pWidthN
            },
            'p0': {
              'left': pWidth,
              'width': pWidth
            },
            'p0in': {
              'left': pWidthH,
              'width': pWidthH
            },
            'p0out': {
              'left': pWidth,
              'width': pWidth
            },
            'p0outClosed': {
              'left': 0,
              'width': pWidth
            },
            'p2back': {
              'left': 0
            },
            'p0wrapDrag': {
              'right': 0
            },
            'p0wrapIn': {
              'right': options.shadowBtmWidth
            },
            'p0wrapOut': {
              'right': 0
            }
          };
        },
        updateSize = function () {
          var height = options.$containerH.outerHeight(true),
              width = options.$containerW.outerWidth(true);

          if (target.hasClass('booklet')) {
            options.width = width + 'px';
            if (options.height !== '100%') {
              options.height = height + 'px';
            }

            setWidthAndHeight();
            updateCSSandAnimations();
            updatePageCSS();
          }
        },
        updateManualControls = function () {
          var origX, newX, diff, fullPercent, shadowPercent, shadowW, curlW, 
              underW, curlLeft, p1wrapLeft, bPage = target.find('.b-page');
          isHoveringRight = isHoveringLeft = p3drag = p0drag = false;

          if ($.ui && options.manual) {
            // manual page turning, check if jQuery UI is loaded
            if (bPage.draggable()) {
              bPage.draggable('destroy').removeClass('b-grab b-grabbing');
            }

            // implement draggable forward
            p3.draggable({
              axis: 'x',
              containment: [
                target.offset().left, 0,
                (p2.offset() !== undefined ? p2.offset().left : 0) + pWidth - hoverFullWidth,
                pHeight
              ],
              drag: function (event, ui) {
                p3drag = true;
                p3.removeClass('b-grab').addClass('b-grabbing');

                // calculate positions
                origX = ui.originalPosition.left;
                newX = ui.position.left;
                diff = origX - newX;
                fullPercent = diff / origX;
                shadowPercent = fullPercent < 0.5 ? fullPercent : (1 - fullPercent);
                shadowW = (shadowPercent * options.shadowBtmWidth * 2) + hoverShadowWidth;
                shadowW = diff / origX >= 0.5 ? shadowW -= hoverShadowWidth : shadowW;

                // set top page curl width
                curlW = hoverCurlWidth + diff / 2;
                curlW = curlW > pWidth ? pWidth : curlW; // constrain max width
                // set bottom page width, hide
                underW = pWidth - curlW;

                // set values
                p3.width(curlW);
                p3wrap.css({
                  'left': shadowW
                });
                p2.width(underW);
              },
              stop: function () {
                endHoverAnimation(false);
                if (fullPercent > options.hoverThreshold) {
                  next();
                  p3.removeClass('b-grab b-grabbing');
                } else {
                  p3drag = false;
                  p3.removeClass('b-grabbing').addClass('b-grab');
                }
              }
            });

            // implement draggable backwards
            p0.draggable({
              'axis': 'x',
              //containment: 'parent',
              'containment': [
                target.offset().left + hoverCurlWidth,
                0,
                target.offset().left + options.width,
                pHeight
              ],
              'drag': function (event, ui) {
                p0drag = true;
                p0.removeClass('b-grab').addClass('b-grabbing');

                // calculate positions
                origX = ui.originalPosition.left;
                newX = ui.position.left;
                diff = newX - origX;
                fullPercent = diff / (options.width - origX);
                if (fullPercent > 1) {
                    fullPercent = 1;
                }

                shadowPercent = fullPercent < 0.5 ? fullPercent : (1 - fullPercent);
                shadowW = (shadowPercent * options.shadowBtmWidth * 2) + hoverShadowWidth;
                shadowW = diff / origX >= 0.5 ? shadowW -= hoverShadowWidth : shadowW;

                curlW = fullPercent * (pWidth - hoverCurlWidth) + hoverCurlWidth + shadowW;
                curlLeft = curlW - shadowW;
                p1wrapLeft = -curlLeft;

                // set values
                ui.position.left = curlLeft;
                p0.css({width: curlW});
                p0wrap.css({right: shadowW});
                p1.css({left: curlLeft, width: pWidth - curlLeft});
                p1wrap.css({left: p1wrapLeft});
              },
              'stop': function () {
                endHoverAnimation(true);
                if (fullPercent > options.hoverThreshold) {
                  prev();
                  p0.removeClass('b-grab b-grabbing');
                } else {
                  p0drag = false;
                  p0.removeClass('b-grabbing').addClass('b-grab');
                }
              }
            });

            bPage.off('click.booklet');

            if (options.hoverClick) {
              target.find('.b-pN, .b-p0').on('click.booklet', prev).css({cursor: 'pointer'});
              target.find('.b-p3, .b-p4').on('click.booklet', next).css({cursor: 'pointer'});
            }

            // mouse tracking for page movement
            target.off('mousemove.booklet').on('mousemove.booklet', function (e) {
              diff = e.pageX - target.offset().left;
              diff += e.pageX > 300 ? options.scrollWidth : options.scrollWidth*-1;
              if (diff < anim.hover.size) {
                startHoverAnimation(false);
              } else if (diff > anim.hover.size && diff <= options.width - anim.hover.size) {
                endHoverAnimation(false);
                endHoverAnimation(true);
              } else if (diff > options.width - anim.hover.size) {
                startHoverAnimation(true);
              }
            }).off('mouseleave.booklet').on('mouseleave.booklet', function () {
              endHoverAnimation(false);
              endHoverAnimation(true);
            });
          } else {
            bPage.off('click.booklet');
            
            target.find('.b-p1').on('click.booklet', function(event) {
              event.preventDefault();
              prev();
            });
            target.find('.b-p2').on('click.booklet', function(event) {
              event.preventDefault();
              next();
            });
          }
        },
        destroyControls = function () {
          destroyManualControls();
        },
        destroyManualControls = function () {
          var bPage = target.find('.b-page');
          if ($.ui) {
            // remove old draggables
            if (bPage.draggable()) {
              bPage.draggable('destroy').removeClass('b-grab b-grabbing');
            }
          }
          // remove mouse tracking for page movement
          target.off('.booklet');
        },

        /* -------------------- Pages -------------------- */

        addPage = function (index, html) {
          // validate inputs
          if (index === 'first') {
            index = 0;
          } else if (index === 'last') {
            index = originalPageTotal;
          } else if (typeof index === 'number') {
            if (index < 0 || index > originalPageTotal) {
              return;
            }
          } else if (index === undefined) {
            return;
          }

          if (html === undefined || html === '') {
            return;
          }

          // remove page structure, revert to original order
          destroyPages();
          destroyControls();

          // add new page
          if (index === originalPageTotal) {
            //end of book
            target.children(':eq(' + (index - 1) + ')').after(html);
          } else {
            target.children(':eq(' + index + ')').before(html);
          }

          originalPageTotal = target.children().length;

          // recall initialize functions
          initPages();
          updateOptions();
          updatePages();
        },
        removePage = function (index) {
          var removedPage;

          // validate inputs
          if (index === 'start') {
            index = 0;
          } else if (index === 'end') {
            index = originalPageTotal;
          } else if (typeof index === 'number') {
            if (index < 0 || index > originalPageTotal) {
              return;
            }
          } else if (index === undefined) {
            return;
          }

          // stop if removing last remaining page
          if (target.children('.b-page').length === 2 && target.find('.b-page-blank').length > 0) {
            return;
          }

          // remove page structure, revert to original order
          destroyPages();
          destroyControls();

          if (index >= options.currentIndex) {
            if (index > 0 && (index % 2) !== 0) {
              options.currentIndex -= 2;
            }
            if (options.currentIndex < 0) {
              options.currentIndex = 0;
            }
          }

          // remove page
          if (index === originalPageTotal) {
            // end of book
            removedPage = target.children(':eq(' + (index - 1) + ')').remove();
          } else {
            removedPage = target.children(':eq(' + index + ')').remove();
          }

          originalPageTotal = target.children().length;

          removedPage = null;

          // recall initialize functions
          initPages();
          updatePages();
          updateOptions();
        },

        /* -------------------- Navigation -------------------- */

        next = function () {
          var index;

          if (!isBusy) {
            if (isPlaying && options.currentIndex + 2 >= options.pageTotal) {
              index = options.pageTotal - 1;
            } else {
              index = options.currentIndex + 2;
            }
          }
          goToPage(index);
          options.onGotoPage(index);
        },
        prev = function () {
          var index;

          if (!isBusy) {
            if (isPlaying && options.currentIndex - 2 < 0) {
              index = 0;
            } else {
              index = options.currentIndex - 2;
            }
          }
          goToPage(index);
          options.onGotoPage(index);
        },
        animations = {
          leaf: function(newIndex) {
            var speed;

            // moving forward (increasing number)
            if (newIndex > options.currentIndex) {
              diff = newIndex - options.currentIndex;

              // set animation speed, depending if user dragged any distance or not
              speed = p3drag === true ? options.speed * (p3.width() / pWidth) : speedH;

              startPageAnimation(diff, true, speed);

              // hide p2 as p3 moves across it
              p2.stop().animate(anim.p2, speed, p3drag === true ? options.easeOut : options.easeIn);

              // if animating after a manual drag, calculate new speed and animate out
              if (p3drag) {
                p3.animate(anim.p3out, speed, options.easeOut);
                p3wrap.animate(anim.p3wrapOut, speed, options.easeOut, function() {
                  updateAfter();
                });
              } else {
                p3.stop()
                  .animate(anim.p3in, speed, options.easeIn)
                  .animate(anim.p3out, speed, options.easeOut);
                p3wrap
                  .animate(anim.p3wrapIn, speed, options.easeIn)
                  .animate(anim.p3wrapOut, speed, options.easeOut, function() {
                    updateAfter();
                  });
              }
            } else if (newIndex < options.currentIndex) {
              // moving backward (decreasing number)
              diff = options.currentIndex - newIndex;

              // set animation speed, depending if user dragged any distance or not
              speed = p0drag === true ? options.speed * (p0.width() / pWidth) : speedH;
              startPageAnimation(diff, false, speed);

              if (p0drag) {
                // hide p1 as p0 moves across it
                p1.animate(anim.p1, speed, options.easeOut);
                p1wrap.animate(anim.p1wrap, speed, options.easeOut);
                p0.animate(anim.p0, speed, options.easeOut);

                p0wrap.animate(anim.p0wrapDrag, speed, options.easeOut, function() {
                  updateAfter();
                });
              } else {
                // hide p1 as p0 moves across it
                p1.animate(anim.p1, speed * 2, options.easing);
                p1wrap.animate(anim.p1wrap, speed * 2, options.easing);

                p0
                  .animate(anim.p0in, speed, options.easeIn)
                  .animate(anim.p0out, speed, options.easeOut);

                p0wrap
                  .animate(anim.p0wrapIn, speed, options.easeIn)
                  .animate(anim.p0wrapOut, speed, options.easeOut, function() {
                    updateAfter();
                  });
              }
            }
          },
          flip: function(newIndex) {
            var speed = 'fast';
            var tmp;

            if (newIndex > options.currentIndex) {
              // NEXT
              diff = newIndex - options.currentIndex;
              startPageAnimation(diff, true, speed);
              tmp = $('<div>').css({
                      'width': 1 + 'px',
                      'position': 'absolute',
                      'height': target.height() + 'px',
                      'left': parseInt(p2.css('left'), 10) + 'px',
                      'top': 0,
                      'z-index': 21,
                      'border': '1px solid #ccc',
                      'padding': 0
                    })
                    .appendTo(target);

              p2.stop().animate({
                width: 0
              }, speed, options.easeIn, function() {
                tmp.stop().animate({
                  left: 0
                }, speed, options.easeIn, function() {
                  tmp.remove();
                });

                p3.css(anim.p3out);
                p3wrap.css(anim.p3wrapOut);
                updateAfter();
              });
            } else if (newIndex < options.currentIndex) {
              //speed = 2000;
              diff = options.currentIndex - newIndex;
              startPageAnimation(diff, false, speed);

              tmp = $('<div>').css({
                      'width': 1 + 'px',
                      'position': 'absolute',
                      'height': target.height() + 'px',
                      'left': 0,
                      'top': 0,
                      'z-index': 21,
                      'border': '1px solid #ccc',
                      'padding': 0
                    })
                    .appendTo(target);

              p1.animate(anim.p1, speed, options.easing);
              tmp.stop().animate({
                  left: anim.p0in.left * 2
                }, speed, options.easing, function() {
                  tmp.remove();
                });
              p1wrap.animate(anim.p1wrap, speed, options.easeIn, function() {                
                p0.css({
                  'left': anim.p0in.left * 2 - 20 + 'px',
                  'overflow-y': 'hidden'
                });
                p0.animate({
                  width: anim.p0in.width * 2 - 20 + 'px'
                }, speed, options.easeIn, function() {
                  p0.css({
                    'overflow-y': 'auto'
                  });
                  p0wrap.css(anim.p0wrapOut);
                  updateAfter();
                });
              });
            }
          }
        },
        animation = function(newIndex, type) {
          animations[type || options.animation](newIndex);
        },
        goToPage = function (newIndex, manualSwitch) {
          manualSwitch = manualSwitch || false;

          if (newIndex < options.pageTotal && newIndex >= 0 && !isBusy) {
            if (!manualSwitch) {
              isBusy = true;
            }
            animation(newIndex);
            options.currentIndex = newIndex;
          }
        },
        startHoverAnimation = function (inc) {
          var p2Width = p2wrap.width();

          if (options.hovers || options.manual) {
            if (inc) {
              if (!isBusy && !isHoveringRight && !isHoveringLeft && !p3drag && options.currentIndex + 2 <= options.pageTotal - 1) {
                p2.stop().animate(anim.hover.p2, anim.hover.speed, options.easing);
                p3.addClass('b-grab');
                p3.stop().animate(anim.hover.p3, anim.hover.speed, options.easing);
                p3wrap.stop().animate(anim.hover.p3wrap, anim.hover.speed, options.easing);
                isHoveringRight = true;
                p2wrap.data('widthBeforeHover', p2Width);
                p2wrap.width(p2Width - anim.hover.p3.width);
                p4wrap.css(css.pwrap.hover);
              }
            } else {
              if (!isBusy && !isHoveringLeft && !isHoveringRight && !p0drag && options.currentIndex - 2 >= 0) {
                p1.stop().animate(anim.hover.p1, anim.hover.speed, options.easing);
                p0.addClass('b-grab');
                p1wrap.stop().animate(anim.hover.p1wrap, anim.hover.speed, options.easing);
                p0.stop().animate(anim.hover.p0, anim.hover.speed, options.easing);
                p0wrap.stop().animate(anim.hover.p0wrap, anim.hover.speed, options.easing);
                isHoveringLeft = true;
                p0wrap.css({
                  'overflow-y': 'hidden'
                });
              }
            }
          }
        },
        endHoverAnimation = function (inc) {
          if (options.hovers || options.manual) {
            if (inc) {
              if (!isBusy && isHoveringRight && !p3drag && options.currentIndex + 2 <= options.pageTotal - 1) {
                p2.stop().animate(anim.hover.p2end, anim.hover.speed, options.easing);
                p3.stop().animate(anim.hover.p3end, anim.hover.speed, options.easing);
                p3wrap.stop().animate(anim.hover.p3wrapEnd, anim.hover.speed, options.easing);
                p2wrap.width(p2wrap.data('widthBeforeHover'));
                p4wrap.css(css.wrap);
                isHoveringRight = false;
              }
            } else {
              if (!isBusy && isHoveringLeft && !p0drag && options.currentIndex - 2 >= 0) {
                p1.stop().animate(anim.hover.p1end, anim.hover.speed, options.easing);
                p1wrap.stop().animate(anim.hover.p1wrapEnd, anim.hover.speed, options.easing);
                p0.stop().animate(anim.hover.p0end, anim.hover.speed, options.easing);
                p0wrap.stop().animate(anim.hover.p0wrapEnd, anim.hover.speed, options.easing);
                p0wrap.css(css.wrap);
                isHoveringLeft = false;
              }
            }
          }
        },
        startPageAnimation = function (diff, inc) {
            var currIndex = options.currentIndex;

            // setup content
            if (inc && diff > 2) {
              // initialize next 2 pages, if jumping forward in the book
              target.find('.b-p3, .b-p4').removeClass('b-p3 b-p4').hide();
              target.find('.b-page-' + currIndex).addClass('b-p3').show().stop().css(css.p3);
              target.find('.b-page-' + (currIndex + 1)).addClass('b-p4').show().css(css.p4);
              target.find('.b-page-' + currIndex + ' .b-wrap').show().css(css.wrap);
              target.find('.b-page-' + (currIndex + 1) + ' .b-wrap').show().css(css.wrap);

              if (isHoveringRight) {
                p3.css({
                  'left': options.width - 40,
                  'width': 20,
                  'padding-left': 10
                });
              }
            } else if (!inc && diff > 2) {
              // initialize previous 2 pages, if jumping backwards in the book
              target.find('.b-pN, .b-p0').removeClass('b-pN b-p0').hide();
              target.find('.b-page-' + currIndex).addClass('b-pN').show().css(css.pN);
              target.find('.b-page-' + (currIndex + 1)).addClass('b-p0').show().css(css.p0);
              target.find('.b-page-' + currIndex + ' .b-wrap').show().css(css.wrap);
              target.find('.b-page-' + (currIndex + 1) + ' .b-wrap').show().css(css.wrap);
              p0wrap.css(css.p0wrap);

              if (isHoveringLeft) {
                p0.css({
                  left: 10,
                  width: 40
                });
                p0wrap.css({
                  right: 10
                });
              }
            }
        },
        updateAfter = function () {
          updatePages();
          isBusy = false;
        };

    /* -------------------------- API -------------------------- */

    return {
      init: init,
      destroy: destroy,
      next: next,
      prev: prev,
      gotopage: function (index) {
        // validate inputs
        if (typeof index === 'string') {
          if (index === 'first') {
            index = 0;
          } else if (index === 'last') {
            index = options.pageTotal - 1;
          } else {
            this.gotopage(parseInt(index));
          }
        } else if (typeof index === 'number') {
          if (index < 0 || index >= options.pageTotal) {
            return;
          }
        } else if (index === undefined) {
          return;
        }

        // adjust for odd page
        if (index % 2 !== 0) {
          index -= 1;
        }

        goToPage(index, true);
      },
      add: addPage,
      remove: removePage,
      option: function (name, value) {
        if (typeof name === 'string') {
          // if option exists
          if (options[name] !== undefined) {
            if (value !== undefined) {
              // if value is sent in, set the option value and update options
              options[name] = value;
              updateOptions();
            } else {
              // if no value sent in, get the current option value
              return options[name];
            }
          } else {
            $.error('Option "' + name + '" does not exist on jQuery.booklet.');
          }
        } else if (typeof name === 'object') {
          // if sending in an object, update options
          updateOptions(name);
        } else if (name === undefined || !name) {
          // return a copy of the options object, to avoid changes
          return $.extend({}, options);
        }
      }
    };
  }

  // define default options
  $.fn.booklet.defaults = {
    width: 600, // container width, px
    height: 400, // container height, px
    speed: 1000, // speed of the transition between pages
    startingPage: 0, // index of the first page to be displayed
    autoSize: false,
    $containerW: null,
    $containerH: null,
    animation: 'leaf', // flip || leaf
    onGotoPage: $.noop,
    easing: 'easeInOutQuad', // easing method for complete transition
    easeIn: 'easeInQuad', // easing method for first half of transition
    easeOut: 'easeOutQuad', // easing method for second half of transition
    pagePadding: 10, // padding for each page wrapper
    manual: true, // enables manual page turning, requires jQuery UI to function
    hovers: true, // enables preview page-turn hover animation, shows a small preview of previous or next page on hover
    hoverWidth: 50, // default width for page-turn hover preview
    hoverSpeed: 500, // default speed for page-turn hover preview
    hoverThreshold: 0.25, // default percentage used for manual page dragging, sets the percentage amount a drag must be before moving next or prev
    hoverClick: true, // enables hovered arreas to be clicked when using manual page turning
    scrollWidth: 30,
    shadowBtmWidth: 30 // shadow width for bottom shadow
  };
})(this, jQuery);
