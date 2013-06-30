this["JST"] = this["JST"] || {};

this["JST"]["app/templates/404.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div style="margin-top:300px">\n\t<h2>Your lucky numbers for today: 4, 0, 4</h2>\n\t<p>A billion pages on the web, and you chose: {{url}}.<br/>Try again</p>\n</div>';
}
return __p;
};

this["JST"]["app/templates/about-packery.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- section class="packery-wrapper" -->\n<div class="packery-test">\n\t<div class="packery">\n\n\t\t<!-- left top -->\n\t\t<div class="stamp corner left top"></div>\n\t\t<div class="stamp top"></div>\n\t\t<div class="stamp left"></div>\n\n\t\t<!-- top center -->\n\t\t<div class="stamp top center"></div>\n\n\t\t<!-- right top -->\n\t\t<div class="stamp corner right top"></div>\n\t\t<div class="stamp top right"></div>\n\t\t<div class="stamp right"></div>\n\n\t\t<!-- left center -->\n\t\t<div class="stamp left center"></div>\n\n\t\t<!-- left bottom -->\n\t\t<div class="stamp corner left bottom"></div>\n\t\t<div class="stamp bottom"></div>\n\t\t<div class="stamp left bottom"></div>\n\n\t\t<div class="stamp corner right bottom"></div>\n\t\t<div class="stamp bottom right-left"></div>\n\t\t<div class="stamp right bottom"></div>\t\t\t\n\n\t\t{{#if GroupImage}}\n\t\t<section class="packery-item group-image">\n\t\t\t{{#with GroupImage.Urls._768}}\n\t\t\t\t<img src="{{Url}}" width="{{Width}}" height="{{Height}}" />\n\t\t\t{{/with}}\n\t\t</section>\n\t\t{{/if}}\n\n\t\t<section class="students packery-item">\n\t\t\t<h1>Students</h1>\n\t\t\t<ul id="student-list"></ul>\n\t\t</section>\n\t\t<section class="alumni packery-item">\n\t\t\t<h1>Alumni</h1>\n\t\t\t<ul id="alumni-list"></ul>\n\t\t</section>\n\t\t<section class="statement packery-item">\n\t\t\t<p>The class <cite>New Media</cite> within the course <cite>Visual Communication</cite> at the <cite>School of Art and Design Kassel</cite> walks a fine line between art, design, provocation and study. The main focus lies on the media consumption of society and its perpetual obsession with technological progress, change and transformation; established processes and methods are permanently questioned and modified.</p>\n\t\t\t<p>The students in the class <cite>New Media</cite> see themselves as researchers, artists, designers and developers at the same time.</p>\n\t\t\t<p>Realising and publicly defending a deeply personal idea means also being able to realise the ideas of others. An outstanding developer of own concepts and ideas will have the ability to implement external ideas and concepts as well.</p>\n\t\t\t<p>There is no need to train service providers for an existing industry, but personalities who by discourse acquired skills which are constantly expanded and established – for oneself and others.</p>\n\t\t\t<p>By use of the Internet and support of the group these skills are exchanged, discussed and broadened self-educatedly. This provides a topicality and relevance which eludes institutions.</p>\n\t\t\t<p>To study “New Media” is to be an author. To learn from oneself, to learn seeing, speaking and thinking. To develop a culture of debate. To work on projects together. To mix media and ideas, to fail and learn from it. The aim is to shape a personal position and methodology.</p>\n\t\t</section>\n\t</div>\n</div>\n\n<!-- /section -->';
}
return __p;
};

this["JST"]["app/templates/calendar-container.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- div -->\n{{#if HasItems}}\n\t<h2>Calendar</h2>\n\t<ul id="calendar-list">\n\n\t</ul>\n{{/if}}\n<!-- /div -->';
}
return __p;
};

this["JST"]["app/templates/calendar-detail.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- article class="portfolio-detail" -->\n<header>\n\t<h1>{{Title}}</h1>\n\t<p>{{niceDate this}}</p>\n\t{{#if Websites}}\n\t\t<p>{{{commaSeparatedWebsites Websites}}}</p>\n\t{{/if}}\n</header>\n<section>\n\t{{{MarkdownedText}}}\n</section>\n<aside>\n\t{{#if combinedProjects}}\n\t\t{{{portfoliolist combinedProjects "Project"}}}\n\t{{/if}}\n\n\t{{#if Exhibitions}}\n\t\t{{{portfoliolist Exhibitions "Exhibition"}}}\n\t{{/if}}\n\t\n\t{{#if Workshops}}\n\t\t{{{portfoliolist Workshops "Workshop"}}}\n\t{{/if}}\n\t\n\t{{#if Excursions}}\n\t\t{{{portfoliolist Excursions "Excursion"}}}\n\t{{/if}}\n</aside>\n<!-- /article -->';
}
return __p;
};

this["JST"]["app/templates/calendar-list-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- li class="upcoming-calendar-list-item" -->\n<a href="/calendar/{{ UrlHash }}/">\n\t<time datetime="">{{ DateRangeNice }}</time>\n\t{{ Title }}\n</a>\n<!-- /li -->';
}
return __p;
};

this["JST"]["app/templates/employee-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- section class="person gravity-item" -->\n\t<div class="img">\n\t\t{{#if Image}}\n\t\t\t{{#with Image.Urls._320}}\n\t\t\t\t<a href="/about/{{../UrlSlug}}/"><img src="{{Url}}" /></a>\n\t\t\t{{/with}}\n\t\t{{/if}}\n\t</div>\n\t<h1><a href="/about/{{UrlSlug}}/">{{FirstName}} {{Surname}}</a></h1>\n\t<p>{{JobTitle}}</p>\n\n<!-- /section -->';
}
return __p;
};

this["JST"]["app/templates/layouts/editor.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<section id="project-editor"></section>';
}
return __p;
};

this["JST"]["app/templates/layouts/index.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div id="packery-container"></div>\n<section id="calendar" class="calendar"></section>';
}
return __p;
};

this["JST"]["app/templates/layouts/main.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
}
return __p;
};

this["JST"]["app/templates/layouts/portfolio.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div id="packery-container"></div>';
}
return __p;
};

this["JST"]["app/templates/packery-container.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- section class="packery-wrapper" -->\n<div class="packery-test">\n\t<div class="packery">\n\n\t\t<!-- left top -->\n\t\t<div class="stamp corner left top"></div>\n\t\t<div class="stamp top"></div>\n\t\t<div class="stamp left"></div>\n\n\t\t<!-- top center -->\n\t\t<div class="stamp top center"></div>\n\n\t\t<!-- right top -->\n\t\t<div class="stamp corner right top"></div>\n\t\t<div class="stamp top right"></div>\n\t\t<div class="stamp right"></div>\n\n\t\t<!-- left center -->\n\t\t<div class="stamp left center"></div>\n\n\t\t<!-- left bottom -->\n\t\t<div class="stamp corner left bottom"></div>\n\t\t<div class="stamp bottom"></div>\n\t\t<div class="stamp left bottom"></div>\n\n\t\t<div class="stamp corner right bottom"></div>\n\t\t<div class="stamp bottom right-left"></div>\n\t\t<div class="stamp right bottom"></div>\n\t\t\n\t</div>\n</div>\n<!-- /section -->';
}
return __p;
};

this["JST"]["app/templates/packery-list-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- article class="gravity-item" -->\n<!--<a href="/{{LinkTo}}/{{UglyHash}}/">\n\t<div>\n\t\t<p>{{ Title }}</p>\n\t\t{{#if PreviewImage}}\n\t\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t\t<div><img src="{{Url}}" width="{{Width}}" height="{{Height}}"/></div>\n\t\t\t{{/with}}\n\t\t{{/if}}\n\t</div>\n</a>-->\n\t{{#if PreviewImage}}\n\t\t<a href="/{{LinkTo}}/{{UglyHash}}/">\n\t\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t\t<img src="{{Url}}" width="{{Width}}" height="{{Height}}"/>\n\t\t\t{{/with}}\n\t\t</a>\n\t{{/if}}\n\t<section role="tooltip-content">\n\t\t<header>\n\t\t\t<h1>\n\t\t\t\t<a href="/{{LinkTo}}/{{UglyHash}}/">{{Title}}</a>\n\t\t\t</h1>\n\t\t\t<p>{{{teaserMeta}}}</p>\n\t\t</header>\n\t\t<p>\n\t\t\t{{{MarkdownedTeaser}}}\n\t\t</p>\n\t\t<a href="/{{LinkTo}}/{{UglyHash}}/" class="btn">Read More</a>\n\t</section>\n<!-- /article -->';
}
return __p;
};

this["JST"]["app/templates/person-info-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<section>\n\t{{#if Image.Urls._320}}\n\t\t<a href="/about/{{UrlSlug}}/">\n\t\t{{#with Image.Urls._320}}\n\t\t\t<img src="{{Url}}" width="{{Width}}" height="{{Height}}" alt="">\n\t\t{{/with}}\n\t\t</a>\n\t{{/if}}\n</section>\n\n<section>\n\t<header>\n\t\t<p>{{personMeta}}</p>\n\t\t<h1>{{FirstName}} {{Surname}}</h1>\n\t</header>\n\n\t{{{MarkdownedBio}}}\n\n\t{{#if Websites}}\n\t\t<ul class="websites">\n\t\t\t{{#each Websites}}\n\t\t\t\t<li>{{{website}}}</li>\n\t\t\t{{/each}}\n\t\t</ul>\n\t{{/if}}\n</section>';
}
return __p;
};

this["JST"]["app/templates/person-list-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- li -->\n<a href="/about/{{UrlSlug}}/">\n\t{{FirstName}} {{Surname}}\n</a>\n<!-- /li -->';
}
return __p;
};

this["JST"]["app/templates/portfolio-detail.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- article class="portfolio-detail" -->\n<header>\n\t<h1>{{Title}}</h1>\n\t<p>\n\t\t{{{nameSummary Persons}}}\n\t</p>\n\t<p>{{niceDate this true}}</p>\n\t{{#stringDiff "Project" ClassName}}\n\t\t{{{SpaceAndLocation}}}\n\t{{/stringDiff}}\n\t{{#if Websites}}\n\t\t<p>{{{commaSeparatedWebsites Websites}}}</p>\n\t{{/if}}\n</header>\n<section>\n\t{{{MarkdownedText}}}\n</section>\n<aside>\n\t\n\t{{#stringCompare "Project" ClassName}}\n\t\t{{#if Exhibitions}}{{{portfoliolist Exhibitions "Exhibition"}}}{{/if}}\n\t\t{{#if Workshops}}{{{portfoliolist Workshops "Workshop"}}}{{/if}}\n\t\t{{#if Excursions}}{{{portfoliolist Excursions "Excursion"}}}{{/if}}\n\t\t{{#if combinedProjects}}{{{portfoliolist combinedProjects "Project"}}}{{/if}}\n\t{{/stringCompare}}\n\n\t{{#stringCompare "Exhibition" ClassName}}\n\t\t{{#if combinedProjects}}{{{portfoliolist combinedProjects "Project"}}}{{/if}}\n\t\t{{#if Workshops}}{{{portfoliolist Workshops "Workshop"}}}{{/if}}\n\t\t{{#if Excursions}}{{{portfoliolist Excursions "Excursion"}}}{{/if}}\n\t{{/stringCompare}}\n\n\t{{#stringCompare "Excursion" ClassName}}\n\t\t{{#if Exhibitions}}{{{portfoliolist Exhibitions "Exhibition"}}}{{/if}}\n\t\t{{#if Workshops}}{{{portfoliolist Workshops "Workshop"}}}{{/if}}\n\t\t{{#if combinedProjects}}{{{portfoliolist combinedProjects "Project"}}}{{/if}}\n\t{{/stringCompare}}\n\n\t{{#stringCompare "Workshop" ClassName}}\n\t\t{{#if Exhibitions}}{{{portfoliolist Exhibitions "Exhibition"}}}{{/if}}\n\t\t{{#if Excursions}}{{{portfoliolist Excursions "Excursion"}}}{{/if}}\n\t\t{{#if combinedProjects}}{{{portfoliolist combinedProjects "Project"}}}{{/if}}\n\t{{/stringCompare}}\n\n\t<hr/>\n\n\t{{#if Categories}}\n\t\t<h4>Categories</h4>\n\t\t<ul>\n\t\t{{#each Categories}}\n\t\t\t<li><a href="/portfolio/search/Category:{{ID}}/">{{Title}}</a></li>\n\t\t{{/each}}\n\t\t</ul>\n\t{{/if}}\n\n\t{{#if IsGroup}}\n\t\t{{{personlist Persons}}}\n\t{{/if}}\n</aside>\n\n<!--{{#if Code}}\n<script type="text/javascript">\n\t$(document).one(\'code:kickoff\', function (e) {\n\t\t{{{Code}}}\n\n\t\te.stopImmediatePropagation();\n\t});\n</script>\n{{/if}}-->\n\n<!-- /article -->';
}
return __p;
};

this["JST"]["app/templates/searchbar.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<style>\n\t#searchbar {\n\t\tbackground: #000;\n\t\tcolor: #fff;\n\t\tposition:absolute;\n\t\ttop: 80%;\n\t\tleft: 45%;\n\t\twidth: 600px;\n\t}\n\n</style>\n\n<!-- div id="projectsearch" -->\n<div class="category-filter">\n\t{{#if Categories}}\n\t\t<ul>\n\t\t\t{{#each Categories}}\n\t\t\t\t<li><a href="#" data-title="{{Title}}" data-id="{{ID}}">{{Title}}</a></li>\n\t\t\t{{/each}}\n\t\t</ul>\n\t{{/if}}\n\t<div class="visualsearch"></div>\n</div>\n<!-- /div -->\n\n\n\n\n\n\n<style>\n\n.VS-search .VS-icon {\n  background-repeat: no-repeat;\n  background-position: center center;\n  vertical-align: middle;\n  width: 16px; height: 16px;\n}\n  .VS-search .VS-icon-cancel {\n    width: 11px; height: 11px;\n    background-position: center 0;\n    background-image: url(../images/embed/icons/cancel_search.png?1311104738);\n    cursor: pointer;\n  }\n    .VS-search .VS-icon-cancel:hover {\n      background-position: center -11px;\n    }\n  .VS-search .VS-icon-search {\n    width: 12px; height: 12px;\n    background-image: url(../images/embed/icons/search_glyph.png?1311104738);\n  }\n\n/*------------------------------ RESET + DEFAULT STYLES ---------------------------------*/\n\n/* \nEric Meyer\'s final reset.css\nSource: http://meyerweb.com/eric/thoughts/2007/05/01/reset-reloaded/ \n*/\n.VS-search div, .VS-search span, .VS-search a, .VS-search img, \n.VS-search ul, .VS-search li, .VS-search form, .VS-search label,\n.VS-interface ul, .VS-interface li, .VS-interface {\n  margin: 0;\n  padding: 0;\n  border: 0;\n  outline: 0;\n  font-weight: inherit;\n  font-style: inherit;\n  font-size: 100%;\n  font-family: inherit;\n  vertical-align: baseline;\n}\n\n.VS-search :focus {\n  outline: 0;\n}\n.VS-search {\n  line-height: 1;\n  color: black;\n}\n.VS-search ol, .VS-search ul {\n  list-style: none;\n}\n\n/* ===================== */\n/* = General and Reset = */\n/* ===================== */\n\n.VS-search {\n  font-family: Arial, sans-serif;\n  color: #373737;\n  font-size: 12px;\n}\n.VS-search input {\n  display: block;\n  border: none;\n  -moz-box-shadow: none;\n  -webkit-box-shadow: none;\n  box-shadow: none;\n  outline: none;\n  margin: 0; padding: 4px;\n  background: transparent;\n  font-size: 16px;\n  line-height: 20px;\n  width: 100%;\n}\n.VS-interface, .VS-search .dialog, .VS-search input {\n  font-family: "Lucida Grande", "Lucida Sans Unicode", Helvetica, Arial, sans-serif !important;\n  line-height: 1.1em;\n}\n\n/* ========== */\n/* = Layout = */\n/* ========== */\n\n.VS-search .VS-search-box {\n  cursor: text;\n  position: relative;\n  background: transparent;\n  border: 2px solid #ccc;\n  border-radius: 16px; -webkit-border-radius: 16px; -moz-border-radius: 16px;\n  background-color: #fafafa;\n  -webkit-box-shadow: inset 0px 0px 3px #ccc;\n  -moz-box-shadow: inset 0px 0px 3px #ccc;\n  box-shadow: inset 0px 0px 3px #ccc;\n  min-height: 28px;\n  height: auto;\n}\n  .VS-search .VS-search-box.VS-focus {\n    border-color: #acf;\n    -webkit-box-shadow: inset 0px 0px 3px #acf;\n    -moz-box-shadow: inset 0px 0px 3px #acf;\n    box-shadow: inset 0px 0px 3px #acf;\n  }\n  .VS-search .VS-placeholder {\n      position: absolute;\n      top: 7px;\n      left: 4px;\n      margin: 0 20px 0 22px;\n      color: #808080;\n      font-size: 14px;\n  }\n  .VS-search .VS-search-box.VS-focus .VS-placeholder,\n  .VS-search .VS-search-box .VS-placeholder.VS-hidden {\n      display: none;\n  }\n  .VS-search .VS-search-inner {\n    position: relative;\n    margin: 0 20px 0 22px;\n    overflow: hidden;\n  }\n  .VS-search input {\n    width: 100px;\n  }\n  .VS-search input,\n  .VS-search .VS-input-width-tester {\n    padding: 6px 0;\n    float: left;\n    color: #808080;\n    font: 13px/17px Helvetica, Arial;\n  }\n  .VS-search.VS-focus input {\n    color: #606060;\n  }\n  .VS-search .VS-icon-search {\n    position: absolute;\n    left: 9px; top: 8px;\n  }\n  .VS-search .VS-icon-cancel {\n    position: absolute;\n    right: 9px; top: 8px;\n  }\n\n/* ================ */\n/* = Search Facet = */\n/* ================ */\n\n.VS-search .search_facet {\n  float: left;\n  margin: 0;\n  padding: 0 0 0 14px;\n  position: relative;\n  border: 1px solid transparent;\n  height: 20px;\n  margin: 3px -3px 3px 0;\n}\n  .VS-search .search_facet.is_selected {\n    margin-left: -3px;\n    -webkit-border-radius: 16px;\n    -moz-border-radius: 16px;\n    border-radius: 16px;\n    background-color: #d2e6fd;\n    background-image: -moz-linear-gradient(top, #d2e6fd, #b0d1f9); /* FF3.6 */\n    background-image: -webkit-gradient(linear, left top, left bottom, from(#d2e6fd), to(#b0d1f9)); /* Saf4+, Chrome */\n    background-image: linear-gradient(top, #d2e6fd, #b0d1f9);\n    border: 1px solid #6eadf5;\n  }\n  .VS-search .search_facet .category {\n    float: left;\n    text-transform: uppercase;\n    font-weight: bold;\n    font-size: 10px;\n    color: #808080;\n    padding: 8px 0 5px;\n    line-height: 13px;\n    cursor: pointer;\n    padding: 4px 0 0;\n  }\n  .VS-search .search_facet.is_selected .category {\n    margin-left: 3px;\n  }\n  .VS-search .search_facet .search_facet_input_container {\n    float: left;\n  }\n  .VS-search .search_facet input {\n    margin: 0;\n    padding: 0;\n    color: #000;\n    font-size: 13px;\n    line-height: 16px;\n    padding: 5px 0 5px 4px;\n    height: 16px;\n    width: auto;\n    z-index: 100;\n    position: relative;\n    padding-top: 1px;\n    padding-bottom: 2px;\n    padding-right: 3px;\n\n  }\n  .VS-search .search_facet.is_editing input,\n  .VS-search .search_facet.is_selected input {\n    color: #000;\n  }\n  .VS-search .search_facet .search_facet_remove {\n    position: absolute;\n    left: 0;\n    top: 4px;\n  }\n    .VS-search .search_facet.is_selected .search_facet_remove {\n      opacity: 0.4;\n      left: 3px;\n      filter: alpha(opacity=40);\n      background-position: center -11px;\n    }\n    .VS-search .search_facet .search_facet_remove:hover {\n      opacity: 1;\n    }\n  .VS-search .search_facet.is_editing .category,\n  .VS-search .search_facet.is_selected .category {\n    color: #000;\n  }\n  .VS-search .search_facet.search_facet_maybe_delete .category,\n  .VS-search .search_facet.search_facet_maybe_delete input {\n    color: darkred;\n  }\n\n/* ================ */\n/* = Search Input = */\n/* ================ */\n\n.VS-search .search_input {\n  height: 28px;\n  float: left;\n  margin-left: -1px;\n}\n  .VS-search .search_input input {\n    padding: 6px 3px 6px 2px;\n    line-height: 10px;\n    height: 22px;\n    margin-top: -4px;\n    width: 10px;\n    z-index: 100;\n    min-width: 4px;\n    position: relative;\n  }\n  .VS-search .search_input.is_editing input {\n    color: #202020;\n  }\n\n/* ================ */\n/* = Autocomplete = */\n/* ================ */\n\n.ui-helper-hidden-accessible {\n    display: none;\n}\n\n.VS-interface.ui-autocomplete {\n  position: absolute;\n  border: 1px solid #C0C0C0;\n  border-top: 1px solid #D9D9D9;\n  background-color: #F6F6F6;\n  cursor: pointer;\n  z-index: 10000;\n  padding: 0;\n  margin: 0;\n  width: auto;\n  min-width: 80px;\n  max-width: 220px;\n  max-height: 240px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  font-size: 13px;\n  top: 5px;\n  opacity: 0.97;\n  box-shadow: 3px 4px 5px -2px rgba(0, 0, 0, 0.5); -webkit-box-shadow: 3px 4px 5px -2px rgba(0, 0, 0, 0.5); -moz-box-shadow: 3px 4px 5px -2px rgba(0, 0, 0, 0.5);\n}\n  .VS-interface.ui-autocomplete .ui-autocomplete-category {\n    text-transform: capitalize;\n    font-size: 11px;\n    padding: 4px 4px 4px;\n    border-top: 1px solid #A2A2A2;\n    border-bottom: 1px solid #A2A2A2;\n    background-color: #B7B7B7;\n    text-shadow: 0 -1px 0 #999;\n    font-weight: bold;\n    color: white;\n    cursor: default;\n  }\n  .VS-interface.ui-autocomplete .ui-menu-item {\n      float: none;\n  }\n  .VS-interface.ui-autocomplete .ui-menu-item a {\n    color: #000;\n    outline: none;\n    display: block;\n    padding: 3px 4px 5px;\n    border-radius: none;\n    line-height: 1;\n    background-color: #F8F8F8;\n    background-image: -moz-linear-gradient(top, #F8F8F8, #F3F3F3); /* FF3.6 */\n    background-image: -webkit-gradient(linear, left top, left bottom, from(#F8F8F8), to(#F3F3F3)); /* Saf4+, Chrome */\n    background-image: linear-gradient(top, #F8F8F8, #F3F3F3);\n    border-top: 1px solid #FAFAFA;\n    border-bottom: 1px solid #f0f0f0;\n  }\n  .VS-interface.ui-autocomplete .ui-menu-item a:active {\n    outline: none;\n  }\n  .VS-interface.ui-autocomplete .ui-menu-item .ui-state-hover, .VS-interface.ui-autocomplete .ui-menu-item .ui-state-focus {\n    background-color: #6483F7;\n    background-image: -moz-linear-gradient(top, #648bF5, #2465f3); /* FF3.6 */\n    background-image: -webkit-gradient(linear, left top, left bottom, from(#648bF5), to(#2465f3)); /* Saf4+, Chrome */\n    background-image: linear-gradient(top, #648bF5, #2465f3);\n    border-top: 1px solid #5b83ec;\n    border-bottom: 1px solid #1459e9;\n    border-left: none;\n    border-right: none;\n    color: white;\n    margin: 0;\n  }\n  .VS-interface.ui-autocomplete .ui-corner-all {\n    border-radius: 0;\n  }\n  .VS-interface.ui-autocomplete li {\n    list-style: none;\n    width: auto;\n  }\n</style>';
}
return __p;
};

this["JST"]["app/templates/security/create-project.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<ul class="project-type-list">\n\t<li>\n\t\t<a href="#" data-type="Excursion" class="excursion">Excursion</a>\n\t</li>\n\n\t<li>\n\t\t<a href="#" data-type="Exhibition" class="exhibition">Exhibition</a>\n\t</li>\n\n\t<li>\n\t\t<a href="#" data-type="Project" class="project">Project</a>\n\t</li>\n\n\t<li>\n\t\t<a href="#" data-type="Workshop" class="workshop">Workshop</a>\n\t</li>\n</ul>\n\n<form class="create-project">\n\t<input type="text" name="title" placeholder="Title" autocomplete="off" />\n\t<button class="btn" type="submit">Create</button>\n\t<div class="form-error">Foo bar!</div>\n</form>\n';
}
return __p;
};

this["JST"]["app/templates/security/editor-project-container.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<section class="editor-project-preview overview active">\n</section>\n\n<section class="editor-project-main detail">\n</section>\n';
}
return __p;
};

this["JST"]["app/templates/security/editor-project-main.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- article -->\n<header data-editor-scope="\\ProjectMain">\n\t<h1 data-editor-type="inline" data-editor-name="Title" data-editor-placeholder="Title">{{Title}}</h1>\n\t<div class="persons">\n\t\t{{#if CurrentMemberPerson}}\n\t\t\t{{#with CurrentMemberPerson}}\n\t\t\t\t{{FirstName}} {{Surname}}\n\t\t\t{{/with}}\n\t\t{{/if}}\n\t\t<div data-editor-type="select-person" data-editor-name="Person" data-editor-placeholder="Add Collaborators…"></div>\n\t</div>\n\t\n\t<!--<p>\n\t{{#if IsGroup}}\n\t\tGroup project\n\t{{else}}\n\t\t{{{nameSummary Persons}}}\n\t{{/if}}\n\t</p>-->\n</header>\n<section data-editor-scope="\\ProjectMain">\n\n\t<div data-editor-type="markdown-split" data-editor-name="Text" data-editor-options=\'{"customParsers": {"images": "ImageMarkdownParser", "embed": "OEmbedMarkdownParser"}}\'>{{Text}}</div>\n\n</section>\n<aside data-editor-scope="\\ProjectMain">\n\t<div>\n\t\t<h3>Websites</h3>\n\t\t\t<ul class="websites">\n\t\t\t</ul>\n\t\t\t<button data-editor-type="modal" data-editor-name="Website" data-editor-fields=\'{"Title": {"type": "text"}, "Link": {"type": "text"}}\'>\n\t\t\t\tAdd Website\n\t\t\t</button>\n\t</div>\n\n\t{{#stringCompare "Project" ClassName}}\n\t\t<h1>Categories</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Category" data-editor-placeholder="Add..."></ul>\n\t{{/stringCompare}}\n\n\t<h1>Projects</h1>\n\t<ul data-editor-type="select-list" data-editor-name="Project" data-editor-placeholder="Add…"></ul>\n\n\t{{#stringDiff "Exhibition" ClassName}}\n\t\t<h1>Exhibitions</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Exhibition" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n\t{{#stringDiff "Workshop" ClassName}}\n\t\t<h1>Workshops</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Workshop" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n\t{{#stringDiff "Excursion" ClassName}}\n\t\t<h1>Excursions</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Excursion" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n\t<hr />\n\n\t{{#stringCompare "Project" ClassName}}\n\t\t<h1>Blocked editors</h1>\n\t\t<ul data-editor-type="select-list-confirm" data-editor-name="BlockedEditors" data-editor-placeholder="Add…" data-editor-confirm="Blocked Editors confirm text"></ul>\n\t{{else}}\n\t\t<h1>Additional editors</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Editors" data-editor-placeholder="Add…" data-editor-confirm="Editors confirm text"></ul>\n\t{{/stringCompare}}\n\n</aside>\n\n<!-- /article -->';
}
return __p;
};

this["JST"]["app/templates/security/editor-project-preview.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="preview-image {{#if PreviewImage}}filled{{/if}}">\n\t{{#if PreviewImage}}\n\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t<img src="{{Url}}" />\n\t\t{{/with}}\n\t{{/if}}\n</div>\n<div class="meta" data-editor-scope="\\ProjectPreview">\n\t<header>\n\t\t<h1 data-editor-type="inline" data-editor-name="Title" data-editor-placeholder="Title">{{Title}}</h1>\n\t\t{{#stringCompare "Project" ClassName}}\n\t\t\t<p><span data-editor-type="date" data-editor-name="Date" data-editor-options=\'{ "contentFormat": "M Y"}\'>{{niceDate this}}</span></p>\n\t\t{{else}}\n\t\t\t<p>\n\t\t\t\t<span data-editor-type="date" data-editor-name="StartDate" data-editor-options=\'{"format": "d. M Y"}\'>{{StartDate}}</span> -\n\t\t\t\t<span data-editor-type="date" data-editor-name="EndDate" data-editor-options=\'{"format": "d. M Y"}\'>{{EndDate}}</span>\n\t\t\t</p>\n\t\t\t<p class="nice-date">{{niceDate this}}</p>\n\t\t{{/stringCompare}}\n\t\t{{#stringDiff "Project" ClassName}}\n\t\t\t<p><span data-editor-type="inline" data-editor-name="Space" data-editor-placeholder="Space">{{Space}}</span></p>\n\t\t\t<p><span data-editor-type="inline" data-editor-name="Location" data-editor-placeholder="Location">{{Location}}</span></p>\n\t\t{{/stringDiff}}\n\t</header>\n\t<p data-editor-type="markdown" data-editor-name="TeaserText" data-editor-placeholder="Teaser" data-editor-options=\'{"customParsers": {}, "position": {"my": "right top", "at": "right bottom", "adjust": {"x": 0, "y": 10}}, "repositionOnChange": true, "charlimit": 156}\'>{{TeaserText}}</p>\n</div>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar-gallery-image.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<a href="#" data-bypass="" data-md-tag="\\[img {{id}}\\]" data-id="{{id}}"><img src="{{url}}" alt="" data-id="{{id}}" data-md-tag="\\[img {{id}}\\]"></a>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar-gallery.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div id="uploadzone"></div>\n<header class="editor-header">\n\t<h1>Images</h1>\n\t{{#if Projects}}\n\t\t<select class="filter">\n\t\t\t<option value="">--- Choose Project ---</option>\n\t\t\t{{#each Projects}}\n\t\t\t\t<option value="{{FilterID}}">{{Title}}</option>\n\t\t\t{{/each}}\n\t\t</select>\n\t{{/if}}\n</header>\n<section class="editor-sidebar-content scrollbox">\n\t{{#if Projects}}\n\t\t{{#each Projects}}\n\t\t\t<header>\n\t\t\t\t<h2>{{Title}}</h2>\n\t\t\t</header>\n\t\t\t<section data-filter-id="{{FilterID}}">\n\t\t\t\t<ul class="image-list"></ul>\n\t\t\t\t\t{{!-- Drop Zone --}}\n\t\t\t</section>\n\t\t{{/each}}\n\t{{/if}}\n</section>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar-person-image.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<a href="#" data-bypass data-id="{{id}}"><img src="{{url}}" alt=""></a>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar-project-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<a href="/secured/edit/{{UglyHash}}/">{{Title}}</a>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar-user.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<header class="editor-header hideable">\n\t<div class="img" id="current-person-image">\n\t\t{{#if CurrentImage}}<img src="{{CurrentImage.url}}">{{/if}}\n\t</div>\n\t<hgroup>\n\t\t{{#if Person}}<h1>{{#with Person}}<a href="/about/{{UrlSlug}}/">{{FirstName}} {{Surname}}</a>{{/with}}</h1>{{/if}}\n\n\t\t{{#if Member}}<p class="email">{{Member.Email}}</p>{{/if}}\n\t</hgroup>\n</header>\n<section class="editor-sidebar-content scrollbox">\n\t<header>\n\t\t<h2>Person Images</h2>\n\t</header>\n\t<section>\n\t\t<ul class="image-list">\n\t\t</ul>\n\t</section>\n\n\t<header>\n\t\t<h2>Projects</h2>\n\t</header>\n\t<section>\n\t\t<ul class="project-list">\n\t\t</ul>\n\t\t<div>\n\t\t\t<a class="btn" href="/secured/new/">Create Project</a>\n\t\t</div>\n\t</section>\n\n\t<header>\n\t\t<h2>Personal Information</h2>\n\t</header>\n\t<section class="meta-info" data-editor-scope="\\CurrentPerson">\n\t\t<div id="bio">\n\t\t\t<h3>Bio</h3>\n\t\t\t<div data-editor-type="markdown" data-editor-name="Bio" data-editor-placeholder="your shitty life!" data-editor-options=\'{"customParsers":{}, "position":{"my": "right top", "at": "left top", "adjust": {"x": -24, "y": -15}}}\'>{{Person.Bio}}</div>\n\t\t</div>\n\t\t<div>\n\t\t\t<h3>Phone</h3>\n\t\t\t<p data-editor-type="inline" data-editor-name="Phone">{{Person.Phone}}</p>\n\t\t</div>\n\t\t<div>\n\t\t\t<h3>Email</h3>\n\t\t\t<p data-editor-type="inline" data-editor-name="Email">{{Person.Email}}</p>\n\t\t</div>\n\t</section>\n\n\t<header>\n\t\t<h2>Websites</h2>\n\t</header>\n\t<section class="meta-info" data-editor-scope="\\CurrentPerson">\n\t\t<div>\n\t\t\t<ul class="websites website-list">\n\t\t\t</ul>\n\t\t\t<a data-editor-type="modal" data-editor-name="Website" data-editor-fields=\'{"Title": {"type": "text"}, "Link": {"type": "text", "placeholder": "http://"}}\' data-editor-options=\'{"position":{"my": "right top", "at": "left top", "adjust": {"x": -24, "y": -20}}}\' class="btn" href="#" data-bypass data-editor-placeholder="Add Website"></a>\n\t\t</div>\n\t</section>\n\n\t<header>\n\t\t<h2>Settings</h2>\n\t</header>\n\t<section>\n\t\t<form class="user-settings">\n\t\t\t<input name="email" type="email" placeholder="Email" value="{{Member.Email}}" required>\n\t\t\t<input name="password" type="password" placeholder="Password">\n\t\t\t<input name="passwordconfirmed" type="password" placeholder="Confirm Password">\n\n\t\t\t<button class="btn" type="submit">Update Settings</button>\n\t\t</form>\n\t</section>\n</section>';
}
return __p;
};

this["JST"]["app/templates/security/editor-sidebar.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<nav>\n\t<ul>\n\t\t<li>\n\t\t\t<a href="#" data-editor-sidebar-content="user" class="icon-user"><span>User</span></a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="/logout/" class="icon-logout"><span>Logout</span></a>\n\t\t</li>\n\t</ul>\n\t<ul>\n\t\t<li>\n\t\t\t<a href="#" data-editor-sidebar-content="gallery" class="icon-editor"><span>Editor</span></a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="#" class="icon-switch"><span>Switch view</span></a>\n\t\t</li>\n\t\t<li>\n\t\t\t<a href="#" class="icon-publish"><span>Publish</span></a>\n\t\t</li>\n\t</ul>\n</nav>\n\n<div id="editor-sidebar-spinner"></div>\n<div id="editor-sidebar-container"></div>';
}
return __p;
};

this["JST"]["app/templates/security/logging-out.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div style="margin-top: 600px">\n\t<p>Logging out <strong>{{Email}}</strong>...</p>\n</div>';
}
return __p;
};

this["JST"]["app/templates/security/login-form.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<form style="margin-top:400px;">\n\t<div><input type="text" name="email" placeholder="Email" /></div>\n\t<div><input type="password" name="password" placeholder="Password" /></div>\n\t<div><input type="checkbox" name="remember" /> Remember me next time</div>\n\t<button class="doLogin" type="submit">Log in</button>\n\t{{#if Email}}\n\t\t<p>You are logged in as <strong>{{Email}}</strong>. <a href="/logout/">Logout?</a></p>\n\t{{else}}\n\t\t<p>You are not logged in.</p>\n\t{{/if}}\n</form>';
}
return __p;
};

this["JST"]["app/templates/website-list-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- li class="website-item" -->\n<a href="{{Link}}">{{Title}}</a>\n<!-- /li -->';
}
return __p;
};