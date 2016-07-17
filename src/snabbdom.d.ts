export interface SnabbdomElement {

}

interface SnabbdomModule {

}

interface Snabbdom {
  h(sel: string, data: Object, children: string | Array<SnabbdomElement>): SnabbdomElement;
  init(modules: Array<SnabbdomModule>): (a: SnabbdomElement | HTMLElement, b: SnabbdomElement) => SnabbdomElement;

  attributes: SnabbdomModule;
  props: SnabbdomModule;
  classList: SnabbdomModule;
  style: SnabbdomModule;
  events: SnabbdomModule;
}

declare let snabbdom: Snabbdom
export var init: (modules: Array<SnabbdomModule>) => (a: SnabbdomElement | HTMLElement, b: SnabbdomElement) => SnabbdomElement;
export var h: (sel: string, data: Object, children: string | Array<SnabbdomElement>) => SnabbdomElement;
export var attributes: SnabbdomModule;
export var props: SnabbdomModule;
export var classList: SnabbdomModule;
export var style: SnabbdomModule;
export var events: SnabbdomModule;

// declare module "snabbdom" {
//
//   export var h: any;
//   export var attributes: SnabbdomModule;
//   export var props: SnabbdomModule;
//   export var classList: SnabbdomModule;
//   export var style: SnabbdomModule;
//   export var events: SnabbdomModule;
// }

// interface Modules {
//   // props: any;
//   attributes: any;
//   class: any;
//   style: any;
//   eventlisteners: any;
// }
//
// interface Snabbdom {
//   modules: Modules;
//   h(sel: string, data: Object, children: string | Array<SnabbdomElement>): SnabbdomElement;
//   init(modules: Array<any>): any;
// }
//
// declare let snabbdom: Snabbdom;
//
// declare module "snabbdom" {
//   export = snabbdom;
// }
//
// declare module "snabbdom/h" {
//   export = snabbdom.h;
// }
//
// declare module "snabbdom/modules/props" {
//   export = snabbdom.modules.props;
// }
//
// declare module "snabbdom/modules/attributes" {
//   export = snabbdom.modules.attributes;
// }
//
// declare module "snabbdom/modules/class" {
//   export = snabbdom.modules.class;
// }
//
// declare module "snabbdom/modules/style" {
//   export = snabbdom.modules.style;
// }
//
// declare module "snabbdom/modules/eventlisteners" {
//   export = snabbdom.modules.eventlisteners;
// }
