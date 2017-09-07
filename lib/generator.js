'use strict';

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
var pathFn = require('path');
var fs = require('fs');

env.addFilter('uriencode', function(str) {
  return encodeURI(str);
});

var atomTmplSrc = pathFn.join(__dirname, '../atom.xml');
var atomTmpl = nunjucks.compile(fs.readFileSync(atomTmplSrc, 'utf8'), env);
var rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml');
var rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env);

function isPermisPush(tagData, filterArr){
  for(var i=0; i<tagData.length; i++){
    for(var j=0; j<filterArr.length; j++){
      if(tagData[i].name == filterArr[j])return false;
    }
  }
  return true;
}

module.exports = function(locals , hexo , options) {
  var config = hexo.config;
  var feedConfig = config.feed;
  var template = feedConfig.type === 'rss2' ? rss2Tmpl : atomTmpl;
  var feedPath = feedConfig.path;
  
  if(options.suffix && options.suffix != ""){
    feedPath = feedPath.replace(/\.xml$/,"") + options.suffix + ".xml";
  }

  var posts = locals.posts.sort('-date');
  
  //-----------------------------------
  if(options.customIndex){
    var filterTagArr = [];
    if( typeof config.index_generator !== "undefined" && typeof config.index_generator.noIndexTag !== "undefined" && config.index_generator.noIndexTag.length > 0){
      filterTagArr = config.index_generator.noIndexTag;
    }
    
    var tmpPosts = [];
    var lg = 0;
    for(var i=0; i<posts.data.length; i++){
      if( isPermisPush(posts.data[i].tags.data , filterTagArr) ){
        tmpPosts.push( posts.data[i] );
        lg++;
      }
    }
    posts.length = lg;
    posts.data   = tmpPosts;
  }
  //-----------------------------------
  
  if (feedConfig.limit) posts = posts.limit(feedConfig.limit);
  var url = config.url;
  if (url[url.length - 1] !== '/') url += '/';

  var xml = template.render({
    config: config,
    url: url,
    posts: posts,
    feed_url: config.root + feedPath ,
    feedFile: feedPath
  });

  return {
    path: feedPath,
    data: xml
  };
};
