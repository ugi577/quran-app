import * as store from "./utils/store.js";
import * as T from "./utils/theme.js";
import * as nav from "./utils/nav.js";

App({
  globalData: {
    theme: T,
  },
  onCreate(options) {
    store.init();
    console.log("app on create invoke");
  },

  onDestroy(options) {
    nav.shutdown();
    console.log("app on destroy invoke");
  },
});
