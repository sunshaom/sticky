/*!
  * @silen/sticky v0.0.1
  * (c) 2021
  * author: sunsilent
  * @license MIT
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Sticky = factory());
}(this, (function () { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  (function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  })();

  var Sticky = /*#__PURE__*/function () {
    function Sticky(target, obj) {
      this.version = "0.0.1";
      this.userAgent = window.navigator.userAgent;
      this.els = [];
      this.isWin = false;
      this.rid = 0;
      var o = typeof obj !== 'undefined' ? obj : {};
      this.props = {
        customStickyChangeNumber: o.customStickyChangeNumber || null,
        noStyles: o.noStyles || false,
        stickyBitStickyOffset: o.stickyBitStickyOffset || 0,
        parentClass: o.parentClass || 'js-sticky-parent',
        scrollContainer: Sticky.getScrollElement(o.scrollContainer),
        stickyClass: o.stickyClass || 'js-is-sticky',
        stuckClass: o.stuckClass || 'js-is-stuck',
        stickyChangeClass: o.stickyChangeClass || 'js-is-sticky--change',
        useStickyClasses: o.useStickyClasses || false,
        useFixed: o.useFixed || false,
        useGetBoundingClientRect: o.useGetBoundingClientRect || false,
        verticalPosition: o.verticalPosition || 'top',
        applyStyle: o.applyStyle || function (item, style) {
          return Sticky.applyStyle(item, style);
        }
      };
      this.props.positionVal = Sticky.definePosition(this.props) || 'fixed';
      this.instances = [];
      this.manageElements(target);
    }

    var _proto = Sticky.prototype;

    _proto.manageElements = function manageElements(target) {
      var _this$props = this.props,
          positionVal = _this$props.positionVal,
          noStyles = _this$props.noStyles,
          stickyBitStickyOffset = _this$props.stickyBitStickyOffset,
          verticalPosition = _this$props.verticalPosition;
      var verticalPositionStyle = verticalPosition === 'top' && !noStyles ? stickyBitStickyOffset + "px" : '';
      var positionStyle = positionVal !== 'fixed' ? positionVal : '';
      this.els = Array.from(typeof target === 'string' ? document.querySelectorAll(target) : target);

      for (var i = 0; i < this.els.length; i++) {
        var _styles;

        var el = this.els[i];

        if (!el.parentNode) {
          console.warn('The target argument should not be root html');
          continue;
        }

        var instance = this.addInstance(el, this.props);
        this.props.applyStyle({
          styles: (_styles = {}, _styles[verticalPosition] = verticalPositionStyle, _styles.position = positionStyle, _styles),
          classes: {}
        }, instance);
        this.manageState(instance);
        this.instances.push(instance);
      }
    };

    Sticky.applyStyle = function applyStyle(_ref, item) {
      var styles = _ref.styles,
          classes = _ref.classes;
      var it = item;
      var e = it.el;
      var p = it.props;
      var stl = e.style;
      var ns = p.noStyles;
      var cArray = e.className.split(' ');

      for (var cls in classes) {
        var addClass = classes[cls];

        if (addClass) {
          if (cArray.indexOf(cls) === -1) cArray.push(cls);
        } else {
          var idx = cArray.indexOf(cls);
          if (idx !== -1) cArray.splice(idx, 1);
        }
      }

      e.className = cArray.join(' ');

      if (styles['position']) {
        stl['position'] = styles['position'];
      }

      if (ns) return;

      for (var key in styles) {
        stl[key] = styles[key];
      }
    };

    Sticky.definePosition = function definePosition(props) {
      var stickyProp;

      if (props.useFixed) {
        stickyProp = 'fixed';
      } else {
        var prefix = ['', '-o-', '-webkit-', '-moz-', '-ms-'];
        var test = document.head.style;

        for (var i = 0; i < prefix.length; i += 1) {
          test.position = prefix[i] + "sticky";
        }

        stickyProp = test.position ? test.position : 'fixed';
        test.position = '';
      }

      return stickyProp;
    };

    Sticky.getScrollElement = function getScrollElement(target) {
      var el;

      if (typeof target === 'string') {
        el = document.querySelector(target);

        if (!el) {
          throw new Error('The selector does not exists!');
        }

        return el;
      }

      return target || window;
    };

    _proto.addInstance = function addInstance(el, props) {
      var _this = this;

      var item = {
        el: el,
        parent: el.parentNode,
        props: props
      };

      if (props.positionVal === 'fixed' || props.useStickyClasses) {
        this.isWin = this.props.scrollContainer === window;
        var se = this.isWin ? window : Sticky.getClosestParent(item.el, item.props.scrollContainer);
        this.computeScrollOffsets(item);
        Sticky.toggleClasses(item.parent, '', props.parentClass);
        item.state = 'default';
        item.stateChange = 'default';

        var fn = function fn() {
          return _this.manageState(item);
        };

        item.stateContainer = fn;
        se.addEventListener('scroll', fn);
      }

      return item;
    };

    Sticky.getClosestParent = function getClosestParent(el, match) {
      var p = match;
      var e = el;
      if (e.parentElement === p) return p;

      while (e.parentElement !== p) {
        e = e.parentElement;
      }

      return p;
    };

    _proto.getTopPosition = function getTopPosition(el) {
      if (this.props.useGetBoundingClientRect) {
        var scrollContainer = this.props.scrollContainer;
        return el.getBoundingClientRect().top + (scrollContainer.pageYOffset || document.documentElement.scrollTop);
      }

      var topPosition = 0;

      do {
        topPosition = el.offsetTop + topPosition;
      } while (el = el.offsetParent);

      return topPosition;
    };

    _proto.computeScrollOffsets = function computeScrollOffsets(item) {
      var it = item;
      var p = it.props;
      var el = it.el;
      var parent = it.parent;
      var isCustom = !this.isWin && p.positionVal === 'fixed';
      var isTop = p.verticalPosition !== 'bottom';
      var scrollElOffset = isCustom ? this.getTopPosition(p.scrollContainer) : 0;
      var stickyStart = isCustom ? this.getTopPosition(parent) - scrollElOffset : this.getTopPosition(parent);
      var stickyChangeOffset = p.customStickyChangeNumber !== null ? p.customStickyChangeNumber : el.offsetHeight;
      var parentBottom = stickyStart + parent.offsetHeight;
      it.offset = !isCustom ? scrollElOffset + p.stickyBitStickyOffset : 0;
      it.stickyStart = isTop ? stickyStart - it.offset : 0;
      it.stickyChange = it.stickyStart + stickyChangeOffset;
      it.stickyStop = isTop ? parentBottom - (el.offsetHeight + it.offset) : parentBottom - window.innerHeight;
    };

    Sticky.toggleClasses = function toggleClasses(el, r, a) {
      var e = el;
      var cArray = e.className.split(' ');
      if (a && cArray.indexOf(a) === -1) cArray.push(a);
      var rItem = cArray.indexOf(r);
      if (rItem !== -1) cArray.splice(rItem, 1);
      e.className = cArray.join(' ');
    };

    _proto.manageState = function manageState(item) {
      var _this2 = this;

      var it = item;
      var props = item.props,
          state = item.state,
          stateChange = item.stateChange,
          stickyStart = item.stickyStart,
          stickyChange = item.stickyChange,
          stickyStop = item.stickyStop;
      var stickyBitStickyOffset = props.stickyBitStickyOffset,
          positionVal = props.positionVal,
          scrollContainer = props.scrollContainer,
          stickyClass = props.stickyClass,
          stickyChangeClass = props.stickyChangeClass,
          stuckClass = props.stuckClass,
          verticalPosition = props.verticalPosition,
          applyStyle = props.applyStyle,
          noStyles = props.noStyles;
      var isTop = verticalPosition !== 'bottom';
      var scroll = this.isWin ? window.scrollY || window.pageYOffset : scrollContainer.scrollTop;
      var notSticky = scroll > stickyStart && scroll < stickyStop && (state === 'default' || state === 'stuck');
      var isSticky = isTop && scroll <= stickyStart && (state === 'sticky' || state === 'stuck');
      var isStuck = scroll >= stickyStop && state === 'sticky';

      if (notSticky) {
        it.state = 'sticky';
      } else if (isSticky) {
        it.state = 'default';
      } else if (isStuck) {
        it.state = 'stuck';
      }

      var isStickyChange = scroll >= stickyChange && scroll <= stickyStop;
      var isNotStickyChange = scroll < stickyChange / 2 || scroll > stickyStop;

      if (isNotStickyChange) {
        it.stateChange = 'default';
      } else if (isStickyChange) {
        it.stateChange = 'sticky';
      }

      if (state === it.state && stateChange === it.stateChange) return;
      this.rid = window.requestAnimationFrame(function () {
        var _styles2, _classes, _styles3, _extends2, _classes2, _style$classes;

        var stateStyles = {
          sticky: {
            styles: (_styles2 = {
              position: positionVal,
              top: '',
              bottom: ''
            }, _styles2[verticalPosition] = stickyBitStickyOffset + "px", _styles2),
            classes: (_classes = {}, _classes[stickyClass] = true, _classes)
          },
          default: {
            styles: (_styles3 = {}, _styles3[verticalPosition] = '', _styles3),
            classes: {}
          },
          stuck: {
            styles: _extends((_extends2 = {}, _extends2[verticalPosition] = '', _extends2), positionVal === 'fixed' && !noStyles || !_this2.isWin ? {
              position: 'absolute',
              top: '',
              bottom: '0'
            } : {}),
            classes: (_classes2 = {}, _classes2[stuckClass] = true, _classes2)
          }
        };

        if (positionVal === 'fixed') {
          stateStyles.default.styles['position'] = '';
        }

        var style = stateStyles[it.state];
        style.classes = (_style$classes = {}, _style$classes[stuckClass] = !!style.classes[stuckClass], _style$classes[stickyClass] = !!style.classes[stickyClass], _style$classes[stickyChangeClass] = isStickyChange, _style$classes);
        applyStyle(style, item);
      });
    };

    _proto.update = function update(updatedProps) {
      var _this3 = this;

      if (updatedProps === void 0) {
        updatedProps = null;
      }

      this.instances.forEach(function (instance) {
        _this3.computeScrollOffsets(instance);

        if (updatedProps) {
          for (var updatedProp in updatedProps) {
            instance.props[updatedProp] = updatedProps[updatedProp];
          }
        }
      });
      return this;
    };

    Sticky.removeInstance = function removeInstance(instance) {
      var _styles4, _classes3;

      var e = instance.el;
      var p = instance.props;
      Sticky.applyStyle({
        styles: (_styles4 = {
          position: ''
        }, _styles4[p.verticalPosition] = '', _styles4),
        classes: (_classes3 = {}, _classes3[p.stickyClass] = '', _classes3[p.stuckClass] = '', _classes3)
      }, instance);
      Sticky.toggleClasses(e.parentNode, p.parentClass, null);
    };

    _proto.cleanup = function cleanup() {
      for (var i = 0; i < this.instances.length; i += 1) {
        var instance = this.instances[i];

        if (instance.stateContainer) {
          var el = instance.props.scrollContainer;
          el.removeEventListener('scroll', instance.stateContainer);
        }

        Sticky.removeInstance(instance);
      }

      window.cancelAnimationFrame(this.rid);
      this.instances = [];
    };

    return Sticky;
  }();

  var index = (function (target, options) {
    return new Sticky(target, options);
  });

  return index;

})));
