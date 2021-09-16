export interface Options {
  customStickyChangeNumber?: number | null;
  noStyles?: boolean;
  stickyBitStickyOffset?: number;
  parentClass?: string;
  scrollEl?: Element | string | Window;
  stickyClass?: string;
  stuckClass?: string;
  stickyChangeClass?: string;
  useStickyClasses?: boolean;
  useFixed?: boolean;
  useGetBoundingClientRect?: boolean;
  verticalPosition?: 'top' | 'bottom';
  applyStyle?: Function;

  [prop: string]: any;
}

export interface Instance {
  el: Element;
  parent: Element | Node;
  props: Options;

  [prop: string]: any;
  // extra props
  // state?: string
  // stateChange?: string
  // stateContainer?: Function
  // stickyStart?: number
  // stickyStop?: number
  // stickyChange?: string | number
}
