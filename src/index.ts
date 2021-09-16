import './util/polyfill';
import { Instance, Options } from './types';

class Sticky {
  version: string = process.env.__VERSION__!;
  userAgent: string = window.navigator.userAgent;
  props: Options;
  instances: Instance[];
  els: Element[] = [];
  private isWin: boolean = false;
  private rid: number = 0;

  constructor(target, obj) {
    const o: Options = typeof obj !== 'undefined' ? obj : {};
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
      applyStyle: o.applyStyle || ((item, style) => Sticky.applyStyle(item, style))
    };
    /*
      define positionVal after the setting of props, because definePosition looks at the props.useFixed
      ----
      -  uses a computed (`.definePosition()`)
      -  defined the position
    */
    this.props.positionVal = Sticky.definePosition(this.props) || 'fixed';

    this.instances = [];

    this.manageElements(target);
  }

  private manageElements(target) {
    const { positionVal, noStyles, stickyBitStickyOffset, verticalPosition } = this.props;
    const verticalPositionStyle = verticalPosition === 'top' && !noStyles ? `${stickyBitStickyOffset}px` : '';
    const positionStyle = positionVal !== 'fixed' ? positionVal : '';

    this.els = Array.from(typeof target === 'string' ? document.querySelectorAll(target) : target);

    for (let i = 0; i < this.els.length; i++) {
      const el: Element = this.els[i];

      if (!el.parentNode) {
        console.warn('The target argument should not be root html');
        continue;
      }

      const instance: Instance = this.addInstance(el, this.props);
      // set vertical position
      this.props.applyStyle!(
        {
          styles: {
            [verticalPosition as string]: verticalPositionStyle,
            position: positionStyle
          },
          classes: {}
        },
        instance
      );
      this.manageState(instance);

      // instances are an array of objects
      this.instances.push(instance);
    }
  }

  /*
    applyStyle
    ---
    - apply the given styles and classes to the element
  */
  private static applyStyle({ styles, classes }, item): void {
    // cache object
    const it = item;
    const e = it.el;
    const p = it.props;
    const stl = e.style;
    // cache props
    const ns = p.noStyles;

    const cArray = e.className.split(' ');

    for (const cls in classes) {
      const addClass = classes[cls];
      if (addClass) {
        if (cArray.indexOf(cls) === -1) cArray.push(cls);
      } else {
        const idx = cArray.indexOf(cls);
        if (idx !== -1) cArray.splice(idx, 1);
      }
    }

    e.className = cArray.join(' ');

    if (styles['position']) {
      stl['position'] = styles['position'];
    }

    if (ns) return;

    for (const key in styles) {
      stl[key] = styles[key];
    }
  }

  /*
    setStickyPosition ✔️
    --------
    —  most basic thing Sticky does
    => checks to see if position sticky is supported
    => defined the position to be used
    => Sticky works accordingly
  */
  private static definePosition(props: Options): string {
    let stickyProp;
    if (props.useFixed) {
      stickyProp = 'fixed';
    } else {
      const prefix = ['', '-o-', '-webkit-', '-moz-', '-ms-'];
      const test = document.head.style;
      for (let i = 0; i < prefix.length; i += 1) {
        test.position = `${prefix[i]}sticky`;
      }
      stickyProp = test.position ? test.position : 'fixed';
      test.position = '';
    }
    return stickyProp;
  }

  private static getScrollElement(target): Element | Window {
    let el;
    if (typeof target === 'string') {
      el = document.querySelector(target);
      if (!el) {
        throw new Error('The selector does not exists!');
      }
      return el;
    }
    return target || window;
  }

  /*
    addInstance ✔️
    --------
    — manages instances of items
    - takes in an el and props
    - returns an item object
    ---
    - target = el
    - o = {object} = props
      - scrollContainer = 'string' | object
      - verticalPosition = number
      - off = boolean
      - parentClass = 'string'
      - stickyClass = 'string'
      - stuckClass = 'string'
    ---
    - defined later
      - parent = dom element
      - state = 'string'
      - offset = number
      - stickyStart = number
      - stickyStop = number
    - returns an instance object
  */
  private addInstance(el: Element, props: Options): Instance {
    const item: Instance = {
      el,
      parent: el.parentNode!,
      props
    };
    if (props.positionVal === 'fixed' || props.useStickyClasses) {
      this.isWin = this.props.scrollContainer === window;
      const se = this.isWin ? window : Sticky.getClosestParent(item.el, item.props.scrollContainer);
      this.computeScrollOffsets(item);
      Sticky.toggleClasses(item.parent, '', props.parentClass);
      item.state = 'default';
      item.stateChange = 'default';
      const fn = () => this.manageState(item);
      item.stateContainer = fn;
      se.addEventListener('scroll', fn);
    }
    return item;
  }

  /*
    --------
    getParent 👨‍
    --------
    - a helper function that gets the target element's parent selected el
    - only used for non `window` scroll elements
    - supports older browsers
  */
  private static getClosestParent(el, match): Element | Window {
    // p = parent element
    const p = match;
    let e = el;
    if (e.parentElement === p) return p;
    // traverse up the dom tree until we get to the parent
    while (e.parentElement !== p) e = e.parentElement;
    // return parent element
    return p;
  }

  /*
    --------
    getTopPosition
    --------
    - a helper function that gets the topPosition of a Sticky element
    - from the top level of the DOM
  */
  private getTopPosition(el): number {
    if (this.props.useGetBoundingClientRect) {
      const scrollContainer = this.props.scrollContainer as Window;
      return el.getBoundingClientRect().top + (scrollContainer.pageYOffset || document.documentElement.scrollTop);
    }
    let topPosition = 0;
    do {
      topPosition = el.offsetTop + topPosition;
    } while ((el = el.offsetParent));
    return topPosition;
  }

  /*
    computeScrollOffsets 📊
    ---
    computeScrollOffsets for Sticky
    - defines
      - offset
      - start
      - stop
  */
  private computeScrollOffsets(item): void {
    const it = item;
    const p = it.props;
    const el = it.el;
    const parent = it.parent;
    const isCustom = !this.isWin && p.positionVal === 'fixed';
    const isTop = p.verticalPosition !== 'bottom';
    const scrollElOffset = isCustom ? this.getTopPosition(p.scrollContainer) : 0;
    const stickyStart = isCustom ? this.getTopPosition(parent) - scrollElOffset : this.getTopPosition(parent);
    const stickyChangeOffset = p.customStickyChangeNumber !== null ? p.customStickyChangeNumber : el.offsetHeight;
    const parentBottom = stickyStart + parent.offsetHeight;
    it.offset = !isCustom ? scrollElOffset + p.stickyBitStickyOffset : 0;
    it.stickyStart = isTop ? stickyStart - it.offset : 0;
    it.stickyChange = it.stickyStart + stickyChangeOffset;
    it.stickyStop = isTop ? parentBottom - (el.offsetHeight + it.offset) : parentBottom - window.innerHeight;
  }

  /*
    toggleClasses ⚖️
    ---
    toggles classes (for older browser support)
    r = removed class
    a = added class
  */
  private static toggleClasses(el, r, a) {
    const e = el;
    const cArray = e.className.split(' ');
    if (a && cArray.indexOf(a) === -1) cArray.push(a);
    const rItem = cArray.indexOf(r);
    if (rItem !== -1) cArray.splice(rItem, 1);
    e.className = cArray.join(' ');
  }

  /*
    manageState 📝
    ---
    - defines the state
      - normal
      - sticky
      - stuck
  */
  private manageState(item) {
    // cache object
    const it = item;
    const { props, state, stateChange, stickyStart, stickyChange, stickyStop } = item;
    // cache props
    const {
      stickyBitStickyOffset,
      positionVal,
      scrollContainer,
      stickyClass,
      stickyChangeClass,
      stuckClass,
      verticalPosition,
      applyStyle,
      noStyles
    } = props;
    const isTop = verticalPosition !== 'bottom';

    /*
      define scroll vars
      ---
      - scroll
      - notSticky
      - isSticky
      - isStuck
    */
    const scroll = this.isWin ? window.scrollY || window.pageYOffset : scrollContainer.scrollTop;
    const notSticky = scroll > stickyStart && scroll < stickyStop && (state === 'default' || state === 'stuck');
    const isSticky = isTop && scroll <= stickyStart && (state === 'sticky' || state === 'stuck');
    const isStuck = scroll >= stickyStop && state === 'sticky';
    /*
      Unnamed arrow functions within this block
      ---
      - help wanted or discussion
      - view test.Sticky.js
        - `Sticky .manageState  `position: fixed` interface` for more awareness 👀
    */
    if (notSticky) {
      it.state = 'sticky';
    } else if (isSticky) {
      it.state = 'default';
    } else if (isStuck) {
      it.state = 'stuck';
    }

    const isStickyChange = scroll >= stickyChange && scroll <= stickyStop;
    const isNotStickyChange = scroll < stickyChange / 2 || scroll > stickyStop;
    if (isNotStickyChange) {
      it.stateChange = 'default';
    } else if (isStickyChange) {
      it.stateChange = 'sticky';
    }

    // Only apply new styles if the state has changed
    if (state === it.state && stateChange === it.stateChange) return;
    this.rid = window.requestAnimationFrame(() => {
      const stateStyles = {
        sticky: {
          styles: {
            position: positionVal,
            top: '',
            bottom: '',
            [verticalPosition]: `${stickyBitStickyOffset}px`
          },
          classes: { [stickyClass]: true }
        },
        default: {
          styles: {
            [verticalPosition]: ''
          },
          classes: {}
        },
        stuck: {
          styles: {
            [verticalPosition]: '',
            /**
             * leave !this.isWin
             * @example https://codepen.io/yowainwright/pen/EXzJeb
             */
            ...((positionVal === 'fixed' && !noStyles) || !this.isWin
              ? {
                  position: 'absolute',
                  top: '',
                  bottom: '0'
                }
              : {})
          },
          classes: { [stuckClass]: true }
        }
      };

      if (positionVal === 'fixed') {
        stateStyles.default.styles['position'] = '';
      }

      const style = stateStyles[it.state];
      style.classes = {
        [stuckClass]: !!style.classes[stuckClass],
        [stickyClass]: !!style.classes[stickyClass],
        [stickyChangeClass]: isStickyChange
      };

      applyStyle(style, item);
    });
  }

  update(updatedProps = null) {
    this.instances.forEach(instance => {
      this.computeScrollOffsets(instance);
      if (updatedProps) {
        // eslint-disable-next-line no-unused-vars
        for (const updatedProp in updatedProps! as Options) {
          instance.props[updatedProp] = updatedProps![updatedProp];
        }
      }
    });

    return this;
  }

  /*
    removes an instance 👋
    --------
    - cleanup instance
  */
  private static removeInstance(instance) {
    const e = instance.el;
    const p = instance.props;

    Sticky.applyStyle(
      {
        styles: { position: '', [p.verticalPosition]: '' },
        classes: { [p.stickyClass]: '', [p.stuckClass]: '' }
      },
      instance
    );

    Sticky.toggleClasses(e.parentNode, p.parentClass, null);
  }

  /*
    cleanup 🛁
    --------
    - cleans up each instance
    - clears instance
  */
  cleanup() {
    for (let i = 0; i < this.instances.length; i += 1) {
      const instance = this.instances[i];
      if (instance.stateContainer) {
        const el = instance.props.scrollContainer as Element | Window;
        el.removeEventListener('scroll', instance.stateContainer);
      }
      Sticky.removeInstance(instance);
    }
    // this.manageState = false;
    window.cancelAnimationFrame(this.rid);
    this.instances = [];
  }
}

export default (target: string | Element | Window, options: Options) => {
  return new Sticky(target, options);
};
