function build(e){var t={};t.builtins=!1,t.insertGlobals="global",browserify(path,t).bundle({standalone:"io"},e)}var browserify=require("browserify"),path=require.resolve("../");module.exports=build;