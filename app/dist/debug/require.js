/**
 * almond 0.0.3 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
/*jslint strict: false, plusplus: false */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {

    var defined = {},
        waiting = {},
        aps = [].slice,
        main, req;

    if (typeof define === "function") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseName = baseName.split("/");
                baseName = baseName.slice(0, baseName.length - 1);

                name = baseName.concat(name.split("/"));

                //start trimDots
                var i, part;
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }
        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            main.apply(undef, args);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, i, ret, map;

        //Use name if no relName
        if (!relName) {
            relName = name;
        }

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Default to require, exports, module if no deps if
            //the factory arg has any arguments specified.
            if (!deps.length && callback.length) {
                deps = ['require', 'exports', 'module'];
            }

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name]
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw name + ' missing ' + depName;
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef) {
                    defined[name] = cjsModule.exports;
                } else if (!usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {

            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            //Drop the config stuff on the ground.
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function () {
        return req;
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (define.unordered) {
            waiting[name] = [name, deps, callback];
        } else {
            main(name, deps, callback);
        }
    };

    define.amd = {
        jQuery: true
    };
}());
;this["JST"] = this["JST"] || {};

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
};;
/*! jQuery v1.9.1 | (c) 2005, 2012 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/(function(e,t){var n,r,i=typeof t,o=e.document,a=e.location,s=e.jQuery,u=e.$,l={},c=[],p="1.9.1",f=c.concat,d=c.push,h=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,b=function(e,t){return new b.fn.init(e,t,r)},x=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^[\],:{}\s]*$/,E=/(?:^|:|,)(?:\s*\[)+/g,S=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,A=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,j=/^-ms-/,D=/-([\da-z])/gi,L=function(e,t){return t.toUpperCase()},H=function(e){(o.addEventListener||"load"===e.type||"complete"===o.readyState)&&(q(),b.ready())},q=function(){o.addEventListener?(o.removeEventListener("DOMContentLoaded",H,!1),e.removeEventListener("load",H,!1)):(o.detachEvent("onreadystatechange",H),e.detachEvent("onload",H))};b.fn=b.prototype={jquery:p,constructor:b,init:function(e,n,r){var i,a;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof b?n[0]:n,b.merge(this,b.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:o,!0)),C.test(i[1])&&b.isPlainObject(n))for(i in n)b.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(a=o.getElementById(i[2]),a&&a.parentNode){if(a.id!==i[2])return r.find(e);this.length=1,this[0]=a}return this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):b.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),b.makeArray(e,this))},selector:"",length:0,size:function(){return this.length},toArray:function(){return h.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=b.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return b.each(this,e,t)},ready:function(e){return b.ready.promise().done(e),this},slice:function(){return this.pushStack(h.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(b.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:d,sort:[].sort,splice:[].splice},b.fn.init.prototype=b.fn,b.extend=b.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},u=1,l=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},u=2),"object"==typeof s||b.isFunction(s)||(s={}),l===u&&(s=this,--u);l>u;u++)if(null!=(o=arguments[u]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(b.isPlainObject(r)||(n=b.isArray(r)))?(n?(n=!1,a=e&&b.isArray(e)?e:[]):a=e&&b.isPlainObject(e)?e:{},s[i]=b.extend(c,a,r)):r!==t&&(s[i]=r));return s},b.extend({noConflict:function(t){return e.$===b&&(e.$=u),t&&e.jQuery===b&&(e.jQuery=s),b},isReady:!1,readyWait:1,holdReady:function(e){e?b.readyWait++:b.ready(!0)},ready:function(e){if(e===!0?!--b.readyWait:!b.isReady){if(!o.body)return setTimeout(b.ready);b.isReady=!0,e!==!0&&--b.readyWait>0||(n.resolveWith(o,[b]),b.fn.trigger&&b(o).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===b.type(e)},isArray:Array.isArray||function(e){return"array"===b.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if(!e||"object"!==b.type(e)||e.nodeType||b.isWindow(e))return!1;try{if(e.constructor&&!y.call(e,"constructor")&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||y.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=b.buildFragment([e],t,i),i&&b(i).remove(),b.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=b.trim(n),n&&k.test(n.replace(S,"@").replace(A,"]").replace(E,"")))?Function("return "+n)():(b.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||b.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&b.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(j,"ms-").replace(D,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:v&&!v.call("\ufeff\u00a0")?function(e){return null==e?"":v.call(e)}:function(e){return null==e?"":(e+"").replace(T,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?b.merge(n,"string"==typeof e?[e]:e):d.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(g)return g.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return f.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),b.isFunction(e)?(r=h.call(arguments,2),i=function(){return e.apply(n||this,r.concat(h.call(arguments)))},i.guid=e.guid=e.guid||b.guid++,i):t},access:function(e,n,r,i,o,a,s){var u=0,l=e.length,c=null==r;if("object"===b.type(r)){o=!0;for(u in r)b.access(e,n,u,r[u],!0,a,s)}else if(i!==t&&(o=!0,b.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(b(e),n)})),n))for(;l>u;u++)n(e[u],r,s?i:i.call(e[u],u,n(e[u],r)));return o?e:c?n.call(e):l?n(e[0],r):a},now:function(){return(new Date).getTime()}}),b.ready.promise=function(t){if(!n)if(n=b.Deferred(),"complete"===o.readyState)setTimeout(b.ready);else if(o.addEventListener)o.addEventListener("DOMContentLoaded",H,!1),e.addEventListener("load",H,!1);else{o.attachEvent("onreadystatechange",H),e.attachEvent("onload",H);var r=!1;try{r=null==e.frameElement&&o.documentElement}catch(i){}r&&r.doScroll&&function a(){if(!b.isReady){try{r.doScroll("left")}catch(e){return setTimeout(a,50)}q(),b.ready()}}()}return n.promise(t)},b.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=b.type(e);return b.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=b(o);var _={};function F(e){var t=_[e]={};return b.each(e.match(w)||[],function(e,n){t[n]=!0}),t}b.Callbacks=function(e){e="string"==typeof e?_[e]||F(e):b.extend({},e);var n,r,i,o,a,s,u=[],l=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=u.length,n=!0;u&&o>a;a++)if(u[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,u&&(l?l.length&&c(l.shift()):r?u=[]:p.disable())},p={add:function(){if(u){var t=u.length;(function i(t){b.each(t,function(t,n){var r=b.type(n);"function"===r?e.unique&&p.has(n)||u.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=u.length:r&&(s=t,c(r))}return this},remove:function(){return u&&b.each(arguments,function(e,t){var r;while((r=b.inArray(t,u,r))>-1)u.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?b.inArray(e,u)>-1:!(!u||!u.length)},empty:function(){return u=[],this},disable:function(){return u=l=r=t,this},disabled:function(){return!u},lock:function(){return l=t,r||p.disable(),this},locked:function(){return!l},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!u||i&&!l||(n?l.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},b.extend({Deferred:function(e){var t=[["resolve","done",b.Callbacks("once memory"),"resolved"],["reject","fail",b.Callbacks("once memory"),"rejected"],["notify","progress",b.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return b.Deferred(function(n){b.each(t,function(t,o){var a=o[0],s=b.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&b.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?b.extend(e,r):r}},i={};return r.pipe=r.then,b.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=h.call(arguments),r=n.length,i=1!==r||e&&b.isFunction(e.promise)?r:0,o=1===i?e:b.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?h.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,u,l;if(r>1)for(s=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&b.isFunction(n[t].promise)?n[t].promise().done(a(t,l,n)).fail(o.reject).progress(a(t,u,s)):--i;return i||o.resolveWith(l,n),o.promise()}}),b.support=function(){var t,n,r,a,s,u,l,c,p,f,d=o.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*"),r=d.getElementsByTagName("a")[0],!n||!r||!n.length)return{};s=o.createElement("select"),l=s.appendChild(o.createElement("option")),a=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={getSetAttribute:"t"!==d.className,leadingWhitespace:3===d.firstChild.nodeType,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:"/a"===r.getAttribute("href"),opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:!!a.value,optSelected:l.selected,enctype:!!o.createElement("form").enctype,html5Clone:"<:nav></:nav>"!==o.createElement("nav").cloneNode(!0).outerHTML,boxModel:"CSS1Compat"===o.compatMode,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},a.checked=!0,t.noCloneChecked=a.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!l.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}a=o.createElement("input"),a.setAttribute("value",""),t.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),t.radioValue="t"===a.value,a.setAttribute("checked","t"),a.setAttribute("name","t"),u=o.createDocumentFragment(),u.appendChild(a),t.appendChecked=a.checked,t.checkClone=u.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;return d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip,b(function(){var n,r,a,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",u=o.getElementsByTagName("body")[0];u&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",u.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",a=d.getElementsByTagName("td"),a[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===a[0].offsetHeight,a[0].style.display="",a[1].style.display="none",t.reliableHiddenOffsets=p&&0===a[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=4===d.offsetWidth,t.doesNotIncludeMarginInBodyOffset=1!==u.offsetTop,e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(o.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(u.style.zoom=1)),u.removeChild(n),n=d=a=r=null)}),n=s=u=l=r=a=null,t}();var O=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,B=/([A-Z])/g;function P(e,n,r,i){if(b.acceptData(e)){var o,a,s=b.expando,u="string"==typeof n,l=e.nodeType,p=l?b.cache:e,f=l?e[s]:e[s]&&s;if(f&&p[f]&&(i||p[f].data)||!u||r!==t)return f||(l?e[s]=f=c.pop()||b.guid++:f=s),p[f]||(p[f]={},l||(p[f].toJSON=b.noop)),("object"==typeof n||"function"==typeof n)&&(i?p[f]=b.extend(p[f],n):p[f].data=b.extend(p[f].data,n)),o=p[f],i||(o.data||(o.data={}),o=o.data),r!==t&&(o[b.camelCase(n)]=r),u?(a=o[n],null==a&&(a=o[b.camelCase(n)])):a=o,a}}function R(e,t,n){if(b.acceptData(e)){var r,i,o,a=e.nodeType,s=a?b.cache:e,u=a?e[b.expando]:b.expando;if(s[u]){if(t&&(o=n?s[u]:s[u].data)){b.isArray(t)?t=t.concat(b.map(t,b.camelCase)):t in o?t=[t]:(t=b.camelCase(t),t=t in o?[t]:t.split(" "));for(r=0,i=t.length;i>r;r++)delete o[t[r]];if(!(n?$:b.isEmptyObject)(o))return}(n||(delete s[u].data,$(s[u])))&&(a?b.cleanData([e],!0):b.support.deleteExpando||s!=s.window?delete s[u]:s[u]=null)}}}b.extend({cache:{},expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?b.cache[e[b.expando]]:e[b.expando],!!e&&!$(e)},data:function(e,t,n){return P(e,t,n)},removeData:function(e,t){return R(e,t)},_data:function(e,t,n){return P(e,t,n,!0)},_removeData:function(e,t){return R(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&b.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),b.fn.extend({data:function(e,n){var r,i,o=this[0],a=0,s=null;if(e===t){if(this.length&&(s=b.data(o),1===o.nodeType&&!b._data(o,"parsedAttrs"))){for(r=o.attributes;r.length>a;a++)i=r[a].name,i.indexOf("data-")||(i=b.camelCase(i.slice(5)),W(o,i,s[i]));b._data(o,"parsedAttrs",!0)}return s}return"object"==typeof e?this.each(function(){b.data(this,e)}):b.access(this,function(n){return n===t?o?W(o,e,b.data(o,e)):null:(this.each(function(){b.data(this,e,n)}),t)},null,n,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){b.removeData(this,e)})}});function W(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(B,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:O.test(r)?b.parseJSON(r):r}catch(o){}b.data(e,n,r)}else r=t}return r}function $(e){var t;for(t in e)if(("data"!==t||!b.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}b.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=b._data(e,n),r&&(!i||b.isArray(r)?i=b._data(e,n,b.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=b.queue(e,t),r=n.length,i=n.shift(),o=b._queueHooks(e,t),a=function(){b.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return b._data(e,n)||b._data(e,n,{empty:b.Callbacks("once memory").add(function(){b._removeData(e,t+"queue"),b._removeData(e,n)})})}}),b.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?b.queue(this[0],e):n===t?this:this.each(function(){var t=b.queue(this,e,n);b._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&b.dequeue(this,e)})},dequeue:function(e){return this.each(function(){b.dequeue(this,e)})},delay:function(e,t){return e=b.fx?b.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=b.Deferred(),a=this,s=this.length,u=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=b._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(u));return u(),o.promise(n)}});var I,z,X=/[\t\r\n]/g,U=/\r/g,V=/^(?:input|select|textarea|button|object)$/i,Y=/^(?:a|area)$/i,J=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,G=/^(?:checked|selected)$/i,Q=b.support.getSetAttribute,K=b.support.input;b.fn.extend({attr:function(e,t){return b.access(this,b.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){b.removeAttr(this,e)})},prop:function(e,t){return b.access(this,b.prop,e,t,arguments.length>1)},removeProp:function(e){return e=b.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,u="string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=b.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,u=0===arguments.length||"string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?b.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,r="boolean"==typeof t;return b.isFunction(e)?this.each(function(n){b(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,a=0,s=b(this),u=t,l=e.match(w)||[];while(o=l[a++])u=r?u:!s.hasClass(o),s[u?"addClass":"removeClass"](o)}else(n===i||"boolean"===n)&&(this.className&&b._data(this,"__className__",this.className),this.className=this.className||e===!1?"":b._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(X," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=b.isFunction(e),this.each(function(n){var o,a=b(this);1===this.nodeType&&(o=i?e.call(this,n,a.val()):e,null==o?o="":"number"==typeof o?o+="":b.isArray(o)&&(o=b.map(o,function(e){return null==e?"":e+""})),r=b.valHooks[this.type]||b.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=b.valHooks[o.type]||b.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(U,""):null==n?"":n)}}}),b.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,u=0>i?s:o?i:0;for(;s>u;u++)if(n=r[u],!(!n.selected&&u!==i||(b.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&b.nodeName(n.parentNode,"optgroup"))){if(t=b(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n=b.makeArray(t);return b(e).find("option").each(function(){this.selected=b.inArray(b(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attr:function(e,n,r){var o,a,s,u=e.nodeType;if(e&&3!==u&&8!==u&&2!==u)return typeof e.getAttribute===i?b.prop(e,n,r):(a=1!==u||!b.isXMLDoc(e),a&&(n=n.toLowerCase(),o=b.attrHooks[n]||(J.test(n)?z:I)),r===t?o&&a&&"get"in o&&null!==(s=o.get(e,n))?s:(typeof e.getAttribute!==i&&(s=e.getAttribute(n)),null==s?t:s):null!==r?o&&a&&"set"in o&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r):(b.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=b.propFix[n]||n,J.test(n)?!Q&&G.test(n)?e[b.camelCase("default-"+n)]=e[r]=!1:e[r]=!1:b.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!b.support.radioValue&&"radio"===t&&b.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!b.isXMLDoc(e),a&&(n=b.propFix[n]||n,o=b.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):V.test(e.nodeName)||Y.test(e.nodeName)&&e.href?0:t}}}}),z={get:function(e,n){var r=b.prop(e,n),i="boolean"==typeof r&&e.getAttribute(n),o="boolean"==typeof r?K&&Q?null!=i:G.test(n)?e[b.camelCase("default-"+n)]:!!i:e.getAttributeNode(n);return o&&o.value!==!1?n.toLowerCase():t},set:function(e,t,n){return t===!1?b.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&b.propFix[n]||n,n):e[b.camelCase("default-"+n)]=e[n]=!0,n}},K&&Q||(b.attrHooks.value={get:function(e,n){var r=e.getAttributeNode(n);return b.nodeName(e,"input")?e.defaultValue:r&&r.specified?r.value:t},set:function(e,n,r){return b.nodeName(e,"input")?(e.defaultValue=n,t):I&&I.set(e,n,r)}}),Q||(I=b.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&("id"===n||"name"===n||"coords"===n?""!==r.value:r.specified)?r.value:t},set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},b.attrHooks.contenteditable={get:I.get,set:function(e,t,n){I.set(e,""===t?!1:t,n)}},b.each(["width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}})})),b.support.hrefNormalized||(b.each(["href","src","width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return null==r?t:r}})}),b.each(["href","src"],function(e,t){b.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}})),b.support.style||(b.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),b.support.optSelected||(b.propHooks.selected=b.extend(b.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),b.support.enctype||(b.propFix.enctype="encoding"),b.support.checkOn||b.each(["radio","checkbox"],function(){b.valHooks[this]={get:function(e){return null===e.getAttribute("value")?"on":e.value}}}),b.each(["radio","checkbox"],function(){b.valHooks[this]=b.extend(b.valHooks[this],{set:function(e,n){return b.isArray(n)?e.checked=b.inArray(b(e).val(),n)>=0:t}})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}b.event={global:{},add:function(e,n,r,o,a){var s,u,l,c,p,f,d,h,g,m,y,v=b._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=b.guid++),(u=v.events)||(u=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof b===i||e&&b.event.triggered===e.type?t:b.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(w)||[""],l=n.length;while(l--)s=rt.exec(n[l])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),p=b.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=b.event.special[g]||{},d=b.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&b.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=u[g])||(h=u[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),b.event.global[g]=!0;e=null}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,p,f,d,h,g,m=b.hasData(e)&&b._data(e);if(m&&(c=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(s=rt.exec(t[l])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=b.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),u=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));u&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||b.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)b.event.remove(e,d+t[l],n,r,!0);b.isEmptyObject(c)&&(delete m.handle,b._removeData(e,"events"))}},trigger:function(n,r,i,a){var s,u,l,c,p,f,d,h=[i||o],g=y.call(n,"type")?n.type:n,m=y.call(n,"namespace")?n.namespace.split("."):[];if(l=f=i=i||o,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+b.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),u=0>g.indexOf(":")&&"on"+g,n=n[b.expando]?n:new b.Event(g,"object"==typeof n&&n),n.isTrigger=!0,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:b.makeArray(r,[n]),p=b.event.special[g]||{},a||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!a&&!p.noBubble&&!b.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(l=l.parentNode);l;l=l.parentNode)h.push(l),f=l;f===(i.ownerDocument||o)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((l=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(b._data(l,"events")||{})[n.type]&&b._data(l,"handle"),s&&s.apply(l,r),s=u&&l[u],s&&b.acceptData(l)&&s.apply&&s.apply(l,r)===!1&&n.preventDefault();if(n.type=g,!(a||n.isDefaultPrevented()||p._default&&p._default.apply(i.ownerDocument,r)!==!1||"click"===g&&b.nodeName(i,"a")||!b.acceptData(i)||!u||!i[g]||b.isWindow(i))){f=i[u],f&&(i[u]=null),b.event.triggered=g;try{i[g]()}catch(v){}b.event.triggered=t,f&&(i[u]=f)}return n.result}},dispatch:function(e){e=b.event.fix(e);var n,r,i,o,a,s=[],u=h.call(arguments),l=(b._data(this,"events")||{})[e.type]||[],c=b.event.special[e.type]||{};if(u[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=b.event.handlers.call(this,e,l),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((b.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,u),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],u=n.delegateCount,l=e.target;if(u&&l.nodeType&&(!e.button||"click"!==e.type))for(;l!=this;l=l.parentNode||this)if(1===l.nodeType&&(l.disabled!==!0||"click"!==e.type)){for(o=[],a=0;u>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?b(r,this).index(l)>=0:b.find(r,this,null,[l]).length),o[r]&&o.push(i);o.length&&s.push({elem:l,handlers:o})}return n.length>u&&s.push({elem:this,handlers:n.slice(u)}),s},fix:function(e){if(e[b.expando])return e;var t,n,r,i=e.type,a=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new b.Event(a),t=r.length;while(t--)n=r[t],e[n]=a[n];return e.target||(e.target=a.srcElement||o),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,a):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,a,s=n.button,u=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||o,a=i.documentElement,r=i.body,e.pageX=n.clientX+(a&&a.scrollLeft||r&&r.scrollLeft||0)-(a&&a.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(a&&a.scrollTop||r&&r.scrollTop||0)-(a&&a.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&u&&(e.relatedTarget=u===e.target?n.toElement:u),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},click:{trigger:function(){return b.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t}},focus:{trigger:function(){if(this!==o.activeElement&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===o.activeElement&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=b.extend(new b.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?b.event.trigger(i,null,t):b.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},b.removeEvent=o.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},b.Event=function(e,n){return this instanceof b.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&b.extend(this,n),this.timeStamp=e&&e.timeStamp||b.now(),this[b.expando]=!0,t):new b.Event(e,n)},b.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},b.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){b.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;
return(!i||i!==r&&!b.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),b.support.submitBubbles||(b.event.special.submit={setup:function(){return b.nodeName(this,"form")?!1:(b.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=b.nodeName(n,"input")||b.nodeName(n,"button")?n.form:t;r&&!b._data(r,"submitBubbles")&&(b.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),b._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&b.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return b.nodeName(this,"form")?!1:(b.event.remove(this,"._submit"),t)}}),b.support.changeBubbles||(b.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(b.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),b.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),b.event.simulate("change",this,e,!0)})),!1):(b.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!b._data(t,"changeBubbles")&&(b.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||b.event.simulate("change",this.parentNode,e,!0)}),b._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return b.event.remove(this,"._change"),!Z.test(this.nodeName)}}),b.support.focusinBubbles||b.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){b.event.simulate(t,e.target,b.event.fix(e),!0)};b.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),b.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return b().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=b.guid++)),this.each(function(){b.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,b(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){b.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){b.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?b.event.trigger(e,n,r,!0):t}}),function(e,t){var n,r,i,o,a,s,u,l,c,p,f,d,h,g,m,y,v,x="sizzle"+-new Date,w=e.document,T={},N=0,C=0,k=it(),E=it(),S=it(),A=typeof t,j=1<<31,D=[],L=D.pop,H=D.push,q=D.slice,M=D.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},_="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=F.replace("w","w#"),B="([*^$|!~]?=)",P="\\["+_+"*("+F+")"+_+"*(?:"+B+_+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+O+")|)|)"+_+"*\\]",R=":("+F+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+P.replace(3,8)+")*)|.*)\\)|)",W=RegExp("^"+_+"+|((?:^|[^\\\\])(?:\\\\.)*)"+_+"+$","g"),$=RegExp("^"+_+"*,"+_+"*"),I=RegExp("^"+_+"*([\\x20\\t\\r\\n\\f>+~])"+_+"*"),z=RegExp(R),X=RegExp("^"+O+"$"),U={ID:RegExp("^#("+F+")"),CLASS:RegExp("^\\.("+F+")"),NAME:RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:RegExp("^("+F.replace("w","w*")+")"),ATTR:RegExp("^"+P),PSEUDO:RegExp("^"+R),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+_+"*(even|odd|(([+-]|)(\\d*)n|)"+_+"*(?:([+-]|)"+_+"*(\\d+)|))"+_+"*\\)|)","i"),needsContext:RegExp("^"+_+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+_+"*((?:-\\d)?\\d*)"+_+"*\\)|)(?=[^-]|$)","i")},V=/[\x20\t\r\n\f]*[+~]/,Y=/^[^{]+\{\s*\[native code/,J=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,G=/^(?:input|select|textarea|button)$/i,Q=/^h\d$/i,K=/'|\\/g,Z=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,et=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,tt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{q.call(w.documentElement.childNodes,0)[0].nodeType}catch(nt){q=function(e){var t,n=[];while(t=this[e++])n.push(t);return n}}function rt(e){return Y.test(e+"")}function it(){var e,t=[];return e=function(n,r){return t.push(n+=" ")>i.cacheLength&&delete e[t.shift()],e[n]=r}}function ot(e){return e[x]=!0,e}function at(e){var t=p.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}}function st(e,t,n,r){var i,o,a,s,u,l,f,g,m,v;if((t?t.ownerDocument||t:w)!==p&&c(t),t=t||p,n=n||[],!e||"string"!=typeof e)return n;if(1!==(s=t.nodeType)&&9!==s)return[];if(!d&&!r){if(i=J.exec(e))if(a=i[1]){if(9===s){if(o=t.getElementById(a),!o||!o.parentNode)return n;if(o.id===a)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(a))&&y(t,o)&&o.id===a)return n.push(o),n}else{if(i[2])return H.apply(n,q.call(t.getElementsByTagName(e),0)),n;if((a=i[3])&&T.getByClassName&&t.getElementsByClassName)return H.apply(n,q.call(t.getElementsByClassName(a),0)),n}if(T.qsa&&!h.test(e)){if(f=!0,g=x,m=t,v=9===s&&e,1===s&&"object"!==t.nodeName.toLowerCase()){l=ft(e),(f=t.getAttribute("id"))?g=f.replace(K,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=l.length;while(u--)l[u]=g+dt(l[u]);m=V.test(e)&&t.parentNode||t,v=l.join(",")}if(v)try{return H.apply(n,q.call(m.querySelectorAll(v),0)),n}catch(b){}finally{f||t.removeAttribute("id")}}}return wt(e.replace(W,"$1"),t,n,r)}a=st.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},c=st.setDocument=function(e){var n=e?e.ownerDocument||e:w;return n!==p&&9===n.nodeType&&n.documentElement?(p=n,f=n.documentElement,d=a(n),T.tagNameNoComments=at(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),T.attributes=at(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return"boolean"!==t&&"string"!==t}),T.getByClassName=at(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",e.getElementsByClassName&&e.getElementsByClassName("e").length?(e.lastChild.className="e",2===e.getElementsByClassName("e").length):!1}),T.getByName=at(function(e){e.id=x+0,e.innerHTML="<a name='"+x+"'></a><div name='"+x+"'></div>",f.insertBefore(e,f.firstChild);var t=n.getElementsByName&&n.getElementsByName(x).length===2+n.getElementsByName(x+0).length;return T.getIdNotName=!n.getElementById(x),f.removeChild(e),t}),i.attrHandle=at(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==A&&"#"===e.firstChild.getAttribute("href")})?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},T.getIdNotName?(i.find.ID=function(e,t){if(typeof t.getElementById!==A&&!d){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){return e.getAttribute("id")===t}}):(i.find.ID=function(e,n){if(typeof n.getElementById!==A&&!d){var r=n.getElementById(e);return r?r.id===e||typeof r.getAttributeNode!==A&&r.getAttributeNode("id").value===e?[r]:t:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){var n=typeof e.getAttributeNode!==A&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=T.tagNameNoComments?function(e,n){return typeof n.getElementsByTagName!==A?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.NAME=T.getByName&&function(e,n){return typeof n.getElementsByName!==A?n.getElementsByName(name):t},i.find.CLASS=T.getByClassName&&function(e,n){return typeof n.getElementsByClassName===A||d?t:n.getElementsByClassName(e)},g=[],h=[":focus"],(T.qsa=rt(n.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+_+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){e.innerHTML="<input type='hidden' i=''/>",e.querySelectorAll("[i^='']").length&&h.push("[*^$]="+_+"*(?:\"\"|'')"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(T.matchesSelector=rt(m=f.matchesSelector||f.mozMatchesSelector||f.webkitMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){T.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",R)}),h=RegExp(h.join("|")),g=RegExp(g.join("|")),y=rt(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},v=f.compareDocumentPosition?function(e,t){var r;return e===t?(u=!0,0):(r=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t))?1&r||e.parentNode&&11===e.parentNode.nodeType?e===n||y(w,e)?-1:t===n||y(w,t)?1:0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return u=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:0;if(o===a)return ut(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?ut(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},u=!1,[0,0].sort(v),T.detectDuplicates=u,p):p},st.matches=function(e,t){return st(e,null,null,t)},st.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Z,"='$1']"),!(!T.matchesSelector||d||g&&g.test(t)||h.test(t)))try{var n=m.call(e,t);if(n||T.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return st(t,p,null,[e]).length>0},st.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},st.attr=function(e,t){var n;return(e.ownerDocument||e)!==p&&c(e),d||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):d||T.attributes?e.getAttribute(t):((n=e.getAttributeNode(t))||e.getAttribute(t))&&e[t]===!0?t:n&&n.specified?n.value:null},st.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},st.uniqueSort=function(e){var t,n=[],r=1,i=0;if(u=!T.detectDuplicates,e.sort(v),u){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e};function ut(e,t){var n=t&&e,r=n&&(~t.sourceIndex||j)-(~e.sourceIndex||j);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function lt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ct(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function pt(e){return ot(function(t){return t=+t,ot(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}o=st.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=st.selectors={cacheLength:50,createPseudo:ot,match:U,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(et,tt),e[3]=(e[4]||e[5]||"").replace(et,tt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||st.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&st.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return U.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&z.test(n)&&(t=ft(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){return"*"===e?function(){return!0}:(e=e.replace(et,tt).toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[e+" "];return t||(t=RegExp("(^|"+_+")"+e+"("+_+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==A&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=st.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!u&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[x]||(m[x]={}),l=c[e]||[],d=l[0]===N&&l[1],f=l[0]===N&&l[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[N,d,f];break}}else if(v&&(l=(t[x]||(t[x]={}))[e])&&l[0]===N)f=l[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[x]||(p[x]={}))[e]=[N,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||st.error("unsupported pseudo: "+e);return r[x]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?ot(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=M.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:ot(function(e){var t=[],n=[],r=s(e.replace(W,"$1"));return r[x]?ot(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:ot(function(e){return function(t){return st(e,t).length>0}}),contains:ot(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:ot(function(e){return X.test(e||"")||st.error("unsupported lang: "+e),e=e.replace(et,tt).toLowerCase(),function(t){var n;do if(n=d?t.getAttribute("xml:lang")||t.getAttribute("lang"):t.lang)return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return Q.test(e.nodeName)},input:function(e){return G.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:pt(function(){return[0]}),last:pt(function(e,t){return[t-1]}),eq:pt(function(e,t,n){return[0>n?n+t:n]}),even:pt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:pt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:pt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:pt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[n]=lt(n);for(n in{submit:!0,reset:!0})i.pseudos[n]=ct(n);function ft(e,t){var n,r,o,a,s,u,l,c=E[e+" "];if(c)return t?0:c.slice(0);s=e,u=[],l=i.preFilter;while(s){(!n||(r=$.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),u.push(o=[])),n=!1,(r=I.exec(s))&&(n=r.shift(),o.push({value:n,type:r[0].replace(W," ")}),s=s.slice(n.length));for(a in i.filter)!(r=U[a].exec(s))||l[a]&&!(r=l[a](r))||(n=r.shift(),o.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?st.error(e):E(e,u).slice(0)}function dt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function ht(e,t,n){var i=t.dir,o=n&&"parentNode"===i,a=C++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,s){var u,l,c,p=N+" "+a;if(s){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[x]||(t[x]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,s)||r,l[1]===!0)return!0}}function gt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function mt(e,t,n,r,i){var o,a=[],s=0,u=e.length,l=null!=t;for(;u>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),l&&t.push(s));return a}function yt(e,t,n,r,i,o){return r&&!r[x]&&(r=yt(r)),i&&!i[x]&&(i=yt(i,o)),ot(function(o,a,s,u){var l,c,p,f=[],d=[],h=a.length,g=o||xt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:mt(g,f,e,s,u),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,u),r){l=mt(y,d),r(l,[],s,u),c=l.length;while(c--)(p=l[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?M.call(o,p):f[c])>-1&&(o[l]=!(a[l]=p))}}else y=mt(y===a?y.splice(h,y.length):y),i?i(null,a,y,u):H.apply(a,y)})}function vt(e){var t,n,r,o=e.length,a=i.relative[e[0].type],s=a||i.relative[" "],u=a?1:0,c=ht(function(e){return e===t},s,!0),p=ht(function(e){return M.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==l)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>u;u++)if(n=i.relative[e[u].type])f=[ht(gt(f),n)];else{if(n=i.filter[e[u].type].apply(null,e[u].matches),n[x]){for(r=++u;o>r;r++)if(i.relative[e[r].type])break;return yt(u>1&&gt(f),u>1&&dt(e.slice(0,u-1)).replace(W,"$1"),n,r>u&&vt(e.slice(u,r)),o>r&&vt(e=e.slice(r)),o>r&&dt(e))}f.push(n)}return gt(f)}function bt(e,t){var n=0,o=t.length>0,a=e.length>0,s=function(s,u,c,f,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,T=l,C=s||a&&i.find.TAG("*",d&&u.parentNode||u),k=N+=null==T?1:Math.random()||.1;for(w&&(l=u!==p&&u,r=n);null!=(h=C[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,u,c)){f.push(h);break}w&&(N=k,r=++n)}o&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,o&&b!==v){g=0;while(m=t[g++])m(x,y,u,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=L.call(f));y=mt(y)}H.apply(f,y),w&&!s&&y.length>0&&v+t.length>1&&st.uniqueSort(f)}return w&&(N=k,l=T),x};return o?ot(s):s}s=st.compile=function(e,t){var n,r=[],i=[],o=S[e+" "];if(!o){t||(t=ft(e)),n=t.length;while(n--)o=vt(t[n]),o[x]?r.push(o):i.push(o);o=S(e,bt(i,r))}return o};function xt(e,t,n){var r=0,i=t.length;for(;i>r;r++)st(e,t[r],n);return n}function wt(e,t,n,r){var o,a,u,l,c,p=ft(e);if(!r&&1===p.length){if(a=p[0]=p[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&!d&&i.relative[a[1].type]){if(t=i.find.ID(u.matches[0].replace(et,tt),t)[0],!t)return n;e=e.slice(a.shift().value.length)}o=U.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],i.relative[l=u.type])break;if((c=i.find[l])&&(r=c(u.matches[0].replace(et,tt),V.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=r.length&&dt(a),!e)return H.apply(n,q.call(r,0)),n;break}}}return s(e,p)(r,t,d,n,V.test(e)),n}i.pseudos.nth=i.pseudos.eq;function Tt(){}i.filters=Tt.prototype=i.pseudos,i.setFilters=new Tt,c(),st.attr=b.attr,b.find=st,b.expr=st.selectors,b.expr[":"]=b.expr.pseudos,b.unique=st.uniqueSort,b.text=st.getText,b.isXMLDoc=st.isXML,b.contains=st.contains}(e);var at=/Until$/,st=/^(?:parents|prev(?:Until|All))/,ut=/^.[^:#\[\.,]*$/,lt=b.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};b.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return r=this,this.pushStack(b(e).filter(function(){for(t=0;i>t;t++)if(b.contains(r[t],this))return!0}));for(n=[],t=0;i>t;t++)b.find(e,this[t],n);return n=this.pushStack(i>1?b.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t,n=b(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(b.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1))},filter:function(e){return this.pushStack(ft(this,e,!0))},is:function(e){return!!e&&("string"==typeof e?lt.test(e)?b(e,this.context).index(this[0])>=0:b.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],a=lt.test(e)||"string"!=typeof e?b(e,t||this.context):0;for(;i>r;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&11!==n.nodeType){if(a?a.index(n)>-1:b.find.matchesSelector(n,e)){o.push(n);break}n=n.parentNode}}return this.pushStack(o.length>1?b.unique(o):o)},index:function(e){return e?"string"==typeof e?b.inArray(this[0],b(e)):b.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?b(e,t):b.makeArray(e&&e.nodeType?[e]:e),r=b.merge(this.get(),n);return this.pushStack(b.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),b.fn.andSelf=b.fn.addBack;function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}b.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return b.dir(e,"parentNode")},parentsUntil:function(e,t,n){return b.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return b.dir(e,"nextSibling")},prevAll:function(e){return b.dir(e,"previousSibling")},nextUntil:function(e,t,n){return b.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return b.dir(e,"previousSibling",n)},siblings:function(e){return b.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return b.sibling(e.firstChild)},contents:function(e){return b.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:b.merge([],e.childNodes)}},function(e,t){b.fn[e]=function(n,r){var i=b.map(this,t,n);return at.test(e)||(r=n),r&&"string"==typeof r&&(i=b.filter(r,i)),i=this.length>1&&!ct[e]?b.unique(i):i,this.length>1&&st.test(e)&&(i=i.reverse()),this.pushStack(i)}}),b.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),1===t.length?b.find.matchesSelector(t[0],e)?[t[0]]:[]:b.find.matches(e,t)},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!b(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(t=t||0,b.isFunction(t))return b.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return b.grep(e,function(e){return e===t===n});if("string"==typeof t){var r=b.grep(e,function(e){return 1===e.nodeType});if(ut.test(t))return b.filter(t,r,!n);t=b.filter(t,r)}return b.grep(e,function(e){return b.inArray(e,t)>=0===n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Nt=/^(?:checkbox|radio)$/i,Ct=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:b.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(o),Dt=jt.appendChild(o.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,b.fn.extend({text:function(e){return b.access(this,function(e){return e===t?b.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(b.isFunction(e))return this.each(function(t){b(this).wrapAll(e.call(this,t))});if(this[0]){var t=b(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return b.isFunction(e)?this.each(function(t){b(this).wrapInner(e.call(this,t))}):this.each(function(){var t=b(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=b.isFunction(e);return this.each(function(n){b(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){b.nodeName(this,"body")||b(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.insertBefore(e,this.firstChild)})},before:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=0;for(;null!=(n=this[r]);r++)(!e||b.filter(e,[n]).length>0)&&(t||1!==n.nodeType||b.cleanData(Ot(n)),n.parentNode&&(t&&b.contains(n.ownerDocument,n)&&Mt(Ot(n,"script")),n.parentNode.removeChild(n)));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&b.cleanData(Ot(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&b.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return b.clone(this,e,t)})},html:function(e){return b.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!b.support.htmlSerialize&&mt.test(e)||!b.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(b.cleanData(Ot(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){var t=b.isFunction(e);return t||"string"==typeof e||(e=b(e).not(this).detach()),this.domManip([e],!0,function(e){var t=this.nextSibling,n=this.parentNode;n&&(b(this).remove(),n.insertBefore(e,t))})},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=f.apply([],e);var i,o,a,s,u,l,c=0,p=this.length,d=this,h=p-1,g=e[0],m=b.isFunction(g);if(m||!(1>=p||"string"!=typeof g||b.support.checkClone)&&Ct.test(g))return this.each(function(i){var o=d.eq(i);m&&(e[0]=g.call(this,i,n?o.html():t)),o.domManip(e,n,r)});if(p&&(l=b.buildFragment(e,this[0].ownerDocument,!1,this),i=l.firstChild,1===l.childNodes.length&&(l=i),i)){for(n=n&&b.nodeName(i,"tr"),s=b.map(Ot(l,"script"),Ht),a=s.length;p>c;c++)o=l,c!==h&&(o=b.clone(o,!0,!0),a&&b.merge(s,Ot(o,"script"))),r.call(n&&b.nodeName(this[c],"table")?Lt(this[c],"tbody"):this[c],o,c);if(a)for(u=s[s.length-1].ownerDocument,b.map(s,qt),c=0;a>c;c++)o=s[c],kt.test(o.type||"")&&!b._data(o,"globalEval")&&b.contains(u,o)&&(o.src?b.ajax({url:o.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):b.globalEval((o.text||o.textContent||o.innerHTML||"").replace(St,"")));l=i=null}return this}});function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function Ht(e){var t=e.getAttributeNode("type");return e.type=(t&&t.specified)+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function Mt(e,t){var n,r=0;for(;null!=(n=e[r]);r++)b._data(n,"globalEval",!t||b._data(t[r],"globalEval"))}function _t(e,t){if(1===t.nodeType&&b.hasData(e)){var n,r,i,o=b._data(e),a=b._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)b.event.add(t,n,s[n][r])}a.data&&(a.data=b.extend({},a.data))}}function Ft(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!b.support.noCloneEvent&&t[b.expando]){i=b._data(t);for(r in i.events)b.removeEvent(t,r,i.handle);t.removeAttribute(b.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),b.support.html5Clone&&e.innerHTML&&!b.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Nt.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}b.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){b.fn[e]=function(e){var n,r=0,i=[],o=b(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),b(o[r])[t](n),d.apply(i,n.get());return this.pushStack(i)}});function Ot(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||b.nodeName(o,n)?s.push(o):b.merge(s,Ot(o,n));return n===t||n&&b.nodeName(e,n)?b.merge([e],s):s}function Bt(e){Nt.test(e.type)&&(e.defaultChecked=e.checked)}b.extend({clone:function(e,t,n){var r,i,o,a,s,u=b.contains(e.ownerDocument,e);if(b.support.html5Clone||b.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(b.support.noCloneEvent&&b.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||b.isXMLDoc(e)))for(r=Ot(o),s=Ot(e),a=0;null!=(i=s[a]);++a)r[a]&&Ft(i,r[a]);if(t)if(n)for(s=s||Ot(e),r=r||Ot(o),a=0;null!=(i=s[a]);a++)_t(i,r[a]);else _t(e,o);return r=Ot(o,"script"),r.length>0&&Mt(r,!u&&Ot(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,u,l,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===b.type(o))b.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),u=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[u]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!b.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!b.support.tbody){o="table"!==u||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)b.nodeName(l=o.childNodes[i],"tbody")&&!l.childNodes.length&&o.removeChild(l)
}b.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),b.support.appendChecked||b.grep(Ot(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===b.inArray(o,r))&&(a=b.contains(o.ownerDocument,o),s=Ot(f.appendChild(o),"script"),a&&Mt(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,u=b.expando,l=b.cache,p=b.support.deleteExpando,f=b.event.special;for(;null!=(n=e[s]);s++)if((t||b.acceptData(n))&&(o=n[u],a=o&&l[o])){if(a.events)for(r in a.events)f[r]?b.event.remove(n,r):b.removeEvent(n,r,a.handle);l[o]&&(delete l[o],p?delete n[u]:typeof n.removeAttribute!==i?n.removeAttribute(u):n[u]=null,c.push(o))}}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+x+")(.*)$","i"),Yt=RegExp("^("+x+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+x+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===b.css(e,"display")||!b.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=b._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=b._data(r,"olddisplay",un(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&b._data(r,"olddisplay",i?n:b.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}b.fn.extend({css:function(e,n){return b.access(this,function(e,n,r){var i,o,a={},s=0;if(b.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=b.css(e,n[s],!1,o);return a}return r!==t?b.style(e,n,r):b.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:nn(this))?b(this).show():b(this).hide()})}}),b.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":b.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,u=b.camelCase(n),l=e.style;if(n=b.cssProps[u]||(b.cssProps[u]=tn(l,u)),s=b.cssHooks[n]||b.cssHooks[u],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:l[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(b.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||b.cssNumber[u]||(r+="px"),b.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(l[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{l[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,u=b.camelCase(n);return n=b.cssProps[u]||(b.cssProps[u]=tn(e.style,u)),s=b.cssHooks[n]||b.cssHooks[u],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||b.isNumeric(o)?o||0:a):a},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s.getPropertyValue(n)||s[n]:t,l=e.style;return s&&(""!==u||b.contains(e.ownerDocument,e)||(u=b.style(e,n)),Yt.test(u)&&Ut.test(n)&&(i=l.width,o=l.minWidth,a=l.maxWidth,l.minWidth=l.maxWidth=l.width=u,u=s.width,l.width=i,l.minWidth=o,l.maxWidth=a)),u}):o.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s[n]:t,l=e.style;return null==u&&l&&l[n]&&(u=l[n]),Yt.test(u)&&!zt.test(n)&&(i=l.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),l.left="fontSize"===n?"1em":u,u=l.pixelLeft+"px",l.left=i,a&&(o.left=a)),""===u?"auto":u});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=b.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=b.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=b.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=b.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=b.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(b.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function un(e){var t=o,n=Gt[e];return n||(n=ln(e,t),"none"!==n&&n||(Pt=(Pt||b("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=ln(e,t),Pt.detach()),Gt[e]=n),n}function ln(e,t){var n=b(t.createElement(e)).appendTo(t.body),r=b.css(n[0],"display");return n.remove(),r}b.each(["height","width"],function(e,n){b.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(b.css(e,"display"))?b.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,i),i):0)}}}),b.support.opacity||(b.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=b.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===b.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),b(function(){b.support.reliableMarginRight||(b.cssHooks.marginRight={get:function(e,n){return n?b.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!b.support.pixelPosition&&b.fn.position&&b.each(["top","left"],function(e,n){b.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?b(e).position()[n]+"px":r):t}}})}),b.expr&&b.expr.filters&&(b.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!b.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||b.css(e,"display"))},b.expr.filters.visible=function(e){return!b.expr.filters.hidden(e)}),b.each({margin:"",padding:"",border:"Width"},function(e,t){b.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(b.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;b.fn.extend({serialize:function(){return b.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=b.prop(this,"elements");return e?b.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!b(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Nt.test(e))}).map(function(e,t){var n=b(this).val();return null==n?null:b.isArray(n)?b.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),b.param=function(e,n){var r,i=[],o=function(e,t){t=b.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=b.ajaxSettings&&b.ajaxSettings.traditional),b.isArray(e)||e.jquery&&!b.isPlainObject(e))b.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(b.isArray(t))b.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==b.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}b.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){b.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),b.fn.hover=function(e,t){return this.mouseenter(e).mouseleave(t||e)};var mn,yn,vn=b.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Nn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Cn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=b.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=a.href}catch(Ln){yn=o.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(b.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(u){var l;return o[u]=!0,b.each(e[u]||[],function(e,u){var c=u(n,r,i);return"string"!=typeof c||a||o[c]?a?!(l=c):t:(n.dataTypes.unshift(c),s(c),!1)}),l}return s(n.dataTypes[0])||!o["*"]&&s("*")}function Mn(e,n){var r,i,o=b.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&b.extend(!0,e,r),e}b.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,u=e.indexOf(" ");return u>=0&&(i=e.slice(u,e.length),e=e.slice(0,u)),b.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&b.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?b("<div>").append(b.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},b.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){b.fn[t]=function(e){return this.on(t,e)}}),b.each(["get","post"],function(e,n){b[n]=function(e,r,i,o){return b.isFunction(r)&&(o=o||i,i=r,r=t),b.ajax({url:e,type:n,dataType:o,data:r,success:i})}}),b.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Nn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":b.parseJSON,"text xml":b.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Mn(Mn(e,b.ajaxSettings),t):Mn(b.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,u,l,c,p=b.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?b(f):b.event,h=b.Deferred(),g=b.Callbacks("once memory"),m=p.statusCode||{},y={},v={},x=0,T="canceled",N={readyState:0,getResponseHeader:function(e){var t;if(2===x){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===x?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return x||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return x||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>x)for(t in e)m[t]=[m[t],e[t]];else N.always(e[N.status]);return this},abort:function(e){var t=e||T;return l&&l.abort(t),k(0,t),this}};if(h.promise(N).complete=g.add,N.success=N.done,N.error=N.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=b.trim(p.dataType||"*").toLowerCase().match(w)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?80:443))==(mn[3]||("http:"===mn[1]?80:443)))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=b.param(p.data,p.traditional)),qn(An,p,n,N),2===x)return N;u=p.global,u&&0===b.active++&&b.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Cn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(b.lastModified[o]&&N.setRequestHeader("If-Modified-Since",b.lastModified[o]),b.etag[o]&&N.setRequestHeader("If-None-Match",b.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&N.setRequestHeader("Content-Type",p.contentType),N.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)N.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,N,p)===!1||2===x))return N.abort();T="abort";for(i in{success:1,error:1,complete:1})N[i](p[i]);if(l=qn(jn,p,n,N)){N.readyState=1,u&&d.trigger("ajaxSend",[N,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){N.abort("timeout")},p.timeout));try{x=1,l.send(y,k)}catch(C){if(!(2>x))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,C=n;2!==x&&(x=2,s&&clearTimeout(s),l=t,a=i||"",N.readyState=e>0?4:0,r&&(w=_n(p,N,r)),e>=200&&300>e||304===e?(p.ifModified&&(T=N.getResponseHeader("Last-Modified"),T&&(b.lastModified[o]=T),T=N.getResponseHeader("etag"),T&&(b.etag[o]=T)),204===e?(c=!0,C="nocontent"):304===e?(c=!0,C="notmodified"):(c=Fn(p,w),C=c.state,y=c.data,v=c.error,c=!v)):(v=C,(e||!C)&&(C="error",0>e&&(e=0))),N.status=e,N.statusText=(n||C)+"",c?h.resolveWith(f,[y,C,N]):h.rejectWith(f,[N,C,v]),N.statusCode(m),m=t,u&&d.trigger(c?"ajaxSuccess":"ajaxError",[N,p,c?y:v]),g.fireWith(f,[N,C]),u&&(d.trigger("ajaxComplete",[N,p]),--b.active||b.event.trigger("ajaxStop")))}return N},getScript:function(e,n){return b.get(e,t,n,"script")},getJSON:function(e,t,n){return b.get(e,t,n,"json")}});function _n(e,n,r){var i,o,a,s,u=e.contents,l=e.dataTypes,c=e.responseFields;for(s in c)s in r&&(n[c[s]]=r[s]);while("*"===l[0])l.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in u)if(u[s]&&u[s].test(o)){l.unshift(s);break}if(l[0]in r)a=l[0];else{for(s in r){if(!l[0]||e.converters[s+" "+l[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==l[0]&&l.unshift(a),r[a]):t}function Fn(e,t){var n,r,i,o,a={},s=0,u=e.dataTypes.slice(),l=u[0];if(e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u[1])for(i in e.converters)a[i.toLowerCase()]=e.converters[i];for(;r=u[++s];)if("*"!==r){if("*"!==l&&l!==r){if(i=a[l+" "+r]||a["* "+r],!i)for(n in a)if(o=n.split(" "),o[1]===r&&(i=a[l+" "+o[0]]||a["* "+o[0]])){i===!0?i=a[n]:a[n]!==!0&&(r=o[0],u.splice(s--,0,r));break}if(i!==!0)if(i&&e["throws"])t=i(t);else try{t=i(t)}catch(c){return{state:"parsererror",error:i?c:"No conversion from "+l+" to "+r}}}l=r}return{state:"success",data:t}}b.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return b.globalEval(e),e}}}),b.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),b.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=o.head||b("head")[0]||o.documentElement;return{send:function(t,i){n=o.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var On=[],Bn=/(=)\?(?=&|$)|\?\?/;b.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=On.pop()||b.expando+"_"+vn++;return this[e]=!0,e}}),b.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,u=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return u||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=b.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,u?n[u]=n[u].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||b.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,On.push(o)),s&&b.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}b.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=b.ajaxSettings.xhr(),b.support.cors=!!Rn&&"withCredentials"in Rn,Rn=b.support.ajax=!!Rn,Rn&&b.ajaxTransport(function(n){if(!n.crossDomain||b.support.cors){var r;return{send:function(i,o){var a,s,u=n.xhr();if(n.username?u.open(n.type,n.url,n.async,n.username,n.password):u.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)u[s]=n.xhrFields[s];n.mimeType&&u.overrideMimeType&&u.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)u.setRequestHeader(s,i[s])}catch(l){}u.send(n.hasContent&&n.data||null),r=function(e,i){var s,l,c,p;try{if(r&&(i||4===u.readyState))if(r=t,a&&(u.onreadystatechange=b.noop,$n&&delete Pn[a]),i)4!==u.readyState&&u.abort();else{p={},s=u.status,l=u.getAllResponseHeaders(),"string"==typeof u.responseText&&(p.text=u.responseText);try{c=u.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,l)},n.async?4===u.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},b(e).unload($n)),Pn[a]=r),u.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+x+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=Yn.exec(t),a=i.cur(),s=+a||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(b.cssNumber[e]?"":"px"),"px"!==r&&s){s=b.css(i.elem,e,!0)||n||1;do u=u||".5",s/=u,b.style(i.elem,e,s+r);while(u!==(u=i.cur()/a)&&1!==u&&--l)}i.unit=r,i.start=s,i.end=o[1]?s+(o[1]+1)*n:n}return i}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=b.now()}function Zn(e,t){b.each(t,function(t,n){var r=(Qn[t]||[]).concat(Qn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function er(e,t,n){var r,i,o=0,a=Gn.length,s=b.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,a=0,u=l.tweens.length;for(;u>a;a++)l.tweens[a].run(o);return s.notifyWith(e,[l,o,n]),1>o&&u?n:(s.resolveWith(e,[l]),!1)},l=s.promise({elem:e,props:b.extend({},t),opts:b.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=b.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?s.resolveWith(e,[l,t]):s.rejectWith(e,[l,t]),this}}),c=l.props;for(tr(c,l.opts.specialEasing);a>o;o++)if(r=Gn[o].call(l,e,c,l.opts))return r;return Zn(l,c),b.isFunction(l.opts.start)&&l.opts.start.call(e,l),b.fx.timer(b.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function tr(e,t){var n,r,i,o,a;for(i in e)if(r=b.camelCase(i),o=t[r],n=e[i],b.isArray(n)&&(o=n[1],n=e[i]=n[0]),i!==r&&(e[r]=n,delete e[i]),a=b.cssHooks[r],a&&"expand"in a){n=a.expand(n),delete e[r];for(i in n)i in e||(e[i]=n[i],t[i]=o)}else t[r]=o}b.Animation=b.extend(er,{tweener:function(e,t){b.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,u,l,c,p,f=this,d=e.style,h={},g=[],m=e.nodeType&&nn(e);n.queue||(c=b._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,p=c.empty.fire,c.empty.fire=function(){c.unqueued||p()}),c.unqueued++,f.always(function(){f.always(function(){c.unqueued--,b.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[d.overflow,d.overflowX,d.overflowY],"inline"===b.css(e,"display")&&"none"===b.css(e,"float")&&(b.support.inlineBlockNeedsLayout&&"inline"!==un(e.nodeName)?d.zoom=1:d.display="inline-block")),n.overflow&&(d.overflow="hidden",b.support.shrinkWrapBlocks||f.always(function(){d.overflow=n.overflow[0],d.overflowX=n.overflow[1],d.overflowY=n.overflow[2]}));for(i in t)if(a=t[i],Vn.exec(a)){if(delete t[i],u=u||"toggle"===a,a===(m?"hide":"show"))continue;g.push(i)}if(o=g.length){s=b._data(e,"fxshow")||b._data(e,"fxshow",{}),"hidden"in s&&(m=s.hidden),u&&(s.hidden=!m),m?b(e).show():f.done(function(){b(e).hide()}),f.done(function(){var t;b._removeData(e,"fxshow");for(t in h)b.style(e,t,h[t])});for(i=0;o>i;i++)r=g[i],l=f.createTween(r,m?s[r]:0),h[r]=s[r]||b.style(e,r),r in s||(s[r]=l.start,m&&(l.end=l.start,l.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}b.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(b.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?b.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=b.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){b.fx.step[e.prop]?b.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[b.cssProps[e.prop]]||b.cssHooks[e.prop])?b.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},b.each(["toggle","show","hide"],function(e,t){var n=b.fn[t];b.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),b.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=b.isEmptyObject(e),o=b.speed(t,n,r),a=function(){var t=er(this,b.extend({},e),o);a.finish=function(){t.stop(!0)},(i||b._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=b.timers,a=b._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&b.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=b._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=b.timers,a=r?r.length:0;for(n.finish=!0,b.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}b.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){b.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),b.speed=function(e,t,n){var r=e&&"object"==typeof e?b.extend({},e):{complete:n||!n&&t||b.isFunction(e)&&e,duration:e,easing:n&&t||t&&!b.isFunction(t)&&t};return r.duration=b.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in b.fx.speeds?b.fx.speeds[r.duration]:b.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){b.isFunction(r.old)&&r.old.call(this),r.queue&&b.dequeue(this,r.queue)},r},b.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},b.timers=[],b.fx=rr.prototype.init,b.fx.tick=function(){var e,n=b.timers,r=0;for(Xn=b.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||b.fx.stop(),Xn=t},b.fx.timer=function(e){e()&&b.timers.push(e)&&b.fx.start()},b.fx.interval=13,b.fx.start=function(){Un||(Un=setInterval(b.fx.tick,b.fx.interval))},b.fx.stop=function(){clearInterval(Un),Un=null},b.fx.speeds={slow:600,fast:200,_default:400},b.fx.step={},b.expr&&b.expr.filters&&(b.expr.filters.animated=function(e){return b.grep(b.timers,function(t){return e===t.elem}).length}),b.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){b.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,b.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},b.offset={setOffset:function(e,t,n){var r=b.css(e,"position");"static"===r&&(e.style.position="relative");var i=b(e),o=i.offset(),a=b.css(e,"top"),s=b.css(e,"left"),u=("absolute"===r||"fixed"===r)&&b.inArray("auto",[a,s])>-1,l={},c={},p,f;u?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),b.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(l.top=t.top-o.top+p),null!=t.left&&(l.left=t.left-o.left+f),"using"in t?t.using.call(e,l):i.css(l)}},b.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===b.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),b.nodeName(e[0],"html")||(n=e.offset()),n.top+=b.css(e[0],"borderTopWidth",!0),n.left+=b.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-b.css(r,"marginTop",!0),left:t.left-n.left-b.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||o.documentElement;while(e&&!b.nodeName(e,"html")&&"static"===b.css(e,"position"))e=e.offsetParent;return e||o.documentElement})}}),b.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);b.fn[e]=function(i){return b.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?b(a).scrollLeft():o,r?o:b(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return b.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}b.each({Height:"height",Width:"width"},function(e,n){b.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){b.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return b.access(this,function(n,r,i){var o;return b.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?b.css(n,r,s):b.style(n,r,i,s)},n,a?i:t,a,null)}})}),e.jQuery=e.$=b,"function"==typeof define&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return b})})(window);
// Underscore.js 1.4.4
// ===================

// > http://underscorejs.org
// > (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
// > Underscore may be freely distributed under the MIT license.

// Baseline setup
// --------------
(function() {

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

define("underscore", (function (global) {
    return function () {
        var ret, fn;
        return ret || global._;
    };
}(this)));

//     Backbone.js 1.0.0

//     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.0.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection'];

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.url) this.url = options.url;
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, merge: false, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && window.ActiveXObject &&
          !(window.external && window.external.msActiveXFilteringEnabled)) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

}).call(this);

define("backbone", ["underscore","jquery"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Backbone;
    };
}(this)));

// lib/handlebars/base.js
var Handlebars = {};

Handlebars.VERSION = "1.0.beta.6";

Handlebars.helpers  = {};
Handlebars.partials = {};

Handlebars.registerHelper = function(name, fn, inverse) {
  if(inverse) { fn.not = inverse; }
  this.helpers[name] = fn;
};

Handlebars.registerPartial = function(name, str) {
  this.partials[name] = str;
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Could not find property '" + arg + "'");
  }
});

var toString = Object.prototype.toString, functionType = "[object Function]";

Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  var inverse = options.inverse || function() {}, fn = options.fn;


  var ret = "";
  var type = toString.call(context);

  if(type === functionType) { context = context.call(this); }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      for(var i=0, j=context.length; i<j; i++) {
        ret = ret + fn(context[i]);
      }
    } else {
      ret = inverse(this);
    }
    return ret;
  } else {
    return fn(context);
  }
});

Handlebars.registerHelper('each', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  var ret = "";

  if(context && context.length > 0) {
    for(var i=0, j=context.length; i<j; i++) {
      ret = ret + fn(context[i]);
    }
  } else {
    ret = inverse(this);
  }
  return ret;
});

Handlebars.registerHelper('if', function(context, options) {
  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if(!context || Handlebars.Utils.isEmpty(context)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('unless', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  options.fn = inverse;
  options.inverse = fn;

  return Handlebars.helpers['if'].call(this, context, options);
});

Handlebars.registerHelper('with', function(context, options) {
  return options.fn(context);
});

Handlebars.registerHelper('log', function(context) {
  Handlebars.log(context);
});
;
// lib/handlebars/compiler/parser.js
/* Jison generated parser */
var handlebars = (function(){

var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"program":4,"EOF":5,"statements":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"inMustache":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"OPEN_PARTIAL":24,"params":25,"hash":26,"param":27,"STRING":28,"INTEGER":29,"BOOLEAN":30,"hashSegments":31,"hashSegment":32,"ID":33,"EQUALS":34,"pathSegments":35,"SEP":36,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"OPEN_PARTIAL",28:"STRING",29:"INTEGER",30:"BOOLEAN",33:"ID",34:"EQUALS",36:"SEP"},
productions_: [0,[3,2],[4,3],[4,1],[4,0],[6,1],[6,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,3],[13,4],[7,2],[17,3],[17,2],[17,2],[17,1],[25,2],[25,1],[27,1],[27,1],[27,1],[27,1],[26,1],[31,2],[31,1],[32,3],[32,3],[32,3],[32,3],[21,1],[35,3],[35,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1] 
break;
case 2: this.$ = new yy.ProgramNode($$[$0-2], $$[$0]) 
break;
case 3: this.$ = new yy.ProgramNode($$[$0]) 
break;
case 4: this.$ = new yy.ProgramNode([]) 
break;
case 5: this.$ = [$$[$0]] 
break;
case 6: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 7: this.$ = new yy.InverseNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 8: this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 9: this.$ = $$[$0] 
break;
case 10: this.$ = $$[$0] 
break;
case 11: this.$ = new yy.ContentNode($$[$0]) 
break;
case 12: this.$ = new yy.CommentNode($$[$0]) 
break;
case 13: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 14: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 15: this.$ = $$[$0-1] 
break;
case 16: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 17: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], true) 
break;
case 18: this.$ = new yy.PartialNode($$[$0-1]) 
break;
case 19: this.$ = new yy.PartialNode($$[$0-2], $$[$0-1]) 
break;
case 20: 
break;
case 21: this.$ = [[$$[$0-2]].concat($$[$0-1]), $$[$0]] 
break;
case 22: this.$ = [[$$[$0-1]].concat($$[$0]), null] 
break;
case 23: this.$ = [[$$[$0-1]], $$[$0]] 
break;
case 24: this.$ = [[$$[$0]], null] 
break;
case 25: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
break;
case 26: this.$ = [$$[$0]] 
break;
case 27: this.$ = $$[$0] 
break;
case 28: this.$ = new yy.StringNode($$[$0]) 
break;
case 29: this.$ = new yy.IntegerNode($$[$0]) 
break;
case 30: this.$ = new yy.BooleanNode($$[$0]) 
break;
case 31: this.$ = new yy.HashNode($$[$0]) 
break;
case 32: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 33: this.$ = [$$[$0]] 
break;
case 34: this.$ = [$$[$0-2], $$[$0]] 
break;
case 35: this.$ = [$$[$0-2], new yy.StringNode($$[$0])] 
break;
case 36: this.$ = [$$[$0-2], new yy.IntegerNode($$[$0])] 
break;
case 37: this.$ = [$$[$0-2], new yy.BooleanNode($$[$0])] 
break;
case 38: this.$ = new yy.IdNode($$[$0]) 
break;
case 39: $$[$0-2].push($$[$0]); this.$ = $$[$0-2]; 
break;
case 40: this.$ = [$$[$0]] 
break;
}
},
table: [{3:1,4:2,5:[2,4],6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{1:[3]},{5:[1,16]},{5:[2,3],7:17,8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,19],20:[2,3],22:[1,13],23:[1,14],24:[1,15]},{5:[2,5],14:[2,5],15:[2,5],16:[2,5],19:[2,5],20:[2,5],22:[2,5],23:[2,5],24:[2,5]},{4:20,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{4:21,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],24:[2,9]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],24:[2,10]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],24:[2,11]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],24:[2,12]},{17:22,21:23,33:[1,25],35:24},{17:26,21:23,33:[1,25],35:24},{17:27,21:23,33:[1,25],35:24},{17:28,21:23,33:[1,25],35:24},{21:29,33:[1,25],35:24},{1:[2,1]},{6:30,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{5:[2,6],14:[2,6],15:[2,6],16:[2,6],19:[2,6],20:[2,6],22:[2,6],23:[2,6],24:[2,6]},{17:22,18:[1,31],21:23,33:[1,25],35:24},{10:32,20:[1,33]},{10:34,20:[1,33]},{18:[1,35]},{18:[2,24],21:40,25:36,26:37,27:38,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,38],28:[2,38],29:[2,38],30:[2,38],33:[2,38],36:[1,46]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],36:[2,40]},{18:[1,47]},{18:[1,48]},{18:[1,49]},{18:[1,50],21:51,33:[1,25],35:24},{5:[2,2],8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,2],22:[1,13],23:[1,14],24:[1,15]},{14:[2,20],15:[2,20],16:[2,20],19:[2,20],22:[2,20],23:[2,20],24:[2,20]},{5:[2,7],14:[2,7],15:[2,7],16:[2,7],19:[2,7],20:[2,7],22:[2,7],23:[2,7],24:[2,7]},{21:52,33:[1,25],35:24},{5:[2,8],14:[2,8],15:[2,8],16:[2,8],19:[2,8],20:[2,8],22:[2,8],23:[2,8],24:[2,8]},{14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],24:[2,14]},{18:[2,22],21:40,26:53,27:54,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,23]},{18:[2,26],28:[2,26],29:[2,26],30:[2,26],33:[2,26]},{18:[2,31],32:55,33:[1,56]},{18:[2,27],28:[2,27],29:[2,27],30:[2,27],33:[2,27]},{18:[2,28],28:[2,28],29:[2,28],30:[2,28],33:[2,28]},{18:[2,29],28:[2,29],29:[2,29],30:[2,29],33:[2,29]},{18:[2,30],28:[2,30],29:[2,30],30:[2,30],33:[2,30]},{18:[2,33],33:[2,33]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],34:[1,57],36:[2,40]},{33:[1,58]},{14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],24:[2,13]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],24:[2,16]},{5:[2,17],14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],24:[2,17]},{5:[2,18],14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],24:[2,18]},{18:[1,59]},{18:[1,60]},{18:[2,21]},{18:[2,25],28:[2,25],29:[2,25],30:[2,25],33:[2,25]},{18:[2,32],33:[2,32]},{34:[1,57]},{21:61,28:[1,62],29:[1,63],30:[1,64],33:[1,25],35:24},{18:[2,39],28:[2,39],29:[2,39],30:[2,39],33:[2,39],36:[2,39]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],24:[2,19]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],24:[2,15]},{18:[2,34],33:[2,34]},{18:[2,35],33:[2,35]},{18:[2,36],33:[2,36]},{18:[2,37],33:[2,37]}],
defaultActions: {16:[2,1],37:[2,23],53:[2,21]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                var errStr = "";
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + this.terminals_[symbol] + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};/* Jison generated lexer */
var lexer = (function(){

var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            match = this._input.match(this.rules[rules[i]]);
            if (match) {
                lines = match[0].match(/\n.*/g);
                if (lines) this.yylineno += lines.length;
                this.yylloc = {first_line: this.yylloc.last_line,
                               last_line: this.yylineno+1,
                               first_column: this.yylloc.last_column,
                               last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, rules[i],this.conditionStack[this.conditionStack.length-1]);
                if (token) return token;
                else return;
            }
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:
                                   if(yy_.yytext.slice(-1) !== "\\") this.begin("mu");
                                   if(yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0,yy_.yyleng-1), this.begin("emu");
                                   if(yy_.yytext) return 14;
                                 
break;
case 1: return 14; 
break;
case 2: this.popState(); return 14; 
break;
case 3: return 24; 
break;
case 4: return 16; 
break;
case 5: return 20; 
break;
case 6: return 19; 
break;
case 7: return 19; 
break;
case 8: return 23; 
break;
case 9: return 23; 
break;
case 10: yy_.yytext = yy_.yytext.substr(3,yy_.yyleng-5); this.popState(); return 15; 
break;
case 11: return 22; 
break;
case 12: return 34; 
break;
case 13: return 33; 
break;
case 14: return 33; 
break;
case 15: return 36; 
break;
case 16: /*ignore whitespace*/ 
break;
case 17: this.popState(); return 18; 
break;
case 18: this.popState(); return 18; 
break;
case 19: yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2).replace(/\\"/g,'"'); return 28; 
break;
case 20: return 30; 
break;
case 21: return 30; 
break;
case 22: return 29; 
break;
case 23: return 33; 
break;
case 24: yy_.yytext = yy_.yytext.substr(1, yy_.yyleng-2); return 33; 
break;
case 25: return 'INVALID'; 
break;
case 26: return 5; 
break;
}
};
lexer.rules = [/^[^\x00]*?(?=(\{\{))/,/^[^\x00]+/,/^[^\x00]{2,}?(?=(\{\{))/,/^\{\{>/,/^\{\{#/,/^\{\{\//,/^\{\{\^/,/^\{\{\s*else\b/,/^\{\{\{/,/^\{\{&/,/^\{\{![\s\S]*?\}\}/,/^\{\{/,/^=/,/^\.(?=[} ])/,/^\.\./,/^[\/.]/,/^\s+/,/^\}\}\}/,/^\}\}/,/^"(\\["]|[^"])*"/,/^true(?=[}\s])/,/^false(?=[}\s])/,/^[0-9]+(?=[}\s])/,/^[a-zA-Z0-9_$-]+(?=[=}\s\/.])/,/^\[[^\]]*\]/,/^./,/^$/];
lexer.conditions = {"mu":{"rules":[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"INITIAL":{"rules":[0,1,26],"inclusive":true}};return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = handlebars;
exports.parse = function () { return handlebars.parse.apply(handlebars, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
};
;
// lib/handlebars/compiler/base.js
Handlebars.Parser = handlebars;

Handlebars.parse = function(string) {
  Handlebars.Parser.yy = Handlebars.AST;
  return Handlebars.Parser.parse(string);
};

Handlebars.print = function(ast) {
  return new Handlebars.PrintVisitor().accept(ast);
};

Handlebars.logger = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, level: 3,

  // override in the host environment
  log: function(level, str) {}
};

Handlebars.log = function(level, str) { Handlebars.logger.log(level, str); };
;
// lib/handlebars/compiler/ast.js
(function() {

  Handlebars.AST = {};

  Handlebars.AST.ProgramNode = function(statements, inverse) {
    this.type = "program";
    this.statements = statements;
    if(inverse) { this.inverse = new Handlebars.AST.ProgramNode(inverse); }
  };

  Handlebars.AST.MustacheNode = function(params, hash, unescaped) {
    this.type = "mustache";
    this.id = params[0];
    this.params = params.slice(1);
    this.hash = hash;
    this.escaped = !unescaped;
  };

  Handlebars.AST.PartialNode = function(id, context) {
    this.type    = "partial";

    // TODO: disallow complex IDs

    this.id      = id;
    this.context = context;
  };

  var verifyMatch = function(open, close) {
    if(open.original !== close.original) {
      throw new Handlebars.Exception(open.original + " doesn't match " + close.original);
    }
  };

  Handlebars.AST.BlockNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "block";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.InverseNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "inverse";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.ContentNode = function(string) {
    this.type = "content";
    this.string = string;
  };

  Handlebars.AST.HashNode = function(pairs) {
    this.type = "hash";
    this.pairs = pairs;
  };

  Handlebars.AST.IdNode = function(parts) {
    this.type = "ID";
    this.original = parts.join(".");

    var dig = [], depth = 0;

    for(var i=0,l=parts.length; i<l; i++) {
      var part = parts[i];

      if(part === "..") { depth++; }
      else if(part === "." || part === "this") { this.isScoped = true; }
      else { dig.push(part); }
    }

    this.parts    = dig;
    this.string   = dig.join('.');
    this.depth    = depth;
    this.isSimple = (dig.length === 1) && (depth === 0);
  };

  Handlebars.AST.StringNode = function(string) {
    this.type = "STRING";
    this.string = string;
  };

  Handlebars.AST.IntegerNode = function(integer) {
    this.type = "INTEGER";
    this.integer = integer;
  };

  Handlebars.AST.BooleanNode = function(bool) {
    this.type = "BOOLEAN";
    this.bool = bool;
  };

  Handlebars.AST.CommentNode = function(comment) {
    this.type = "comment";
    this.comment = comment;
  };

})();;
// lib/handlebars/utils.js
Handlebars.Exception = function(message) {
  var tmp = Error.prototype.constructor.apply(this, arguments);

  for (var p in tmp) {
    if (tmp.hasOwnProperty(p)) { this[p] = tmp[p]; }
  }

  this.message = tmp.message;
};
Handlebars.Exception.prototype = new Error;

// Build out our basic SafeString type
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};

(function() {
  var escape = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /&(?!\w+;)|[<>"'`]/g;
  var possible = /[&<>"'`]/;

  var escapeChar = function(chr) {
    return escape[chr] || "&amp;";
  };

  Handlebars.Utils = {
    escapeExpression: function(string) {
      // don't escape SafeStrings, since they're already safe
      if (string instanceof Handlebars.SafeString) {
        return string.toString();
      } else if (string == null || string === false) {
        return "";
      }

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    },

    isEmpty: function(value) {
      if (typeof value === "undefined") {
        return true;
      } else if (value === null) {
        return true;
      } else if (value === false) {
        return true;
      } else if(Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  };
})();;
// lib/handlebars/compiler/compiler.js
Handlebars.Compiler = function() {};
Handlebars.JavaScriptCompiler = function() {};

(function(Compiler, JavaScriptCompiler) {
  Compiler.OPCODE_MAP = {
    appendContent: 1,
    getContext: 2,
    lookupWithHelpers: 3,
    lookup: 4,
    append: 5,
    invokeMustache: 6,
    appendEscaped: 7,
    pushString: 8,
    truthyOrFallback: 9,
    functionOrFallback: 10,
    invokeProgram: 11,
    invokePartial: 12,
    push: 13,
    assignToHash: 15,
    pushStringParam: 16
  };

  Compiler.MULTI_PARAM_OPCODES = {
    appendContent: 1,
    getContext: 1,
    lookupWithHelpers: 2,
    lookup: 1,
    invokeMustache: 3,
    pushString: 1,
    truthyOrFallback: 1,
    functionOrFallback: 1,
    invokeProgram: 3,
    invokePartial: 1,
    push: 1,
    assignToHash: 1,
    pushStringParam: 1
  };

  Compiler.DISASSEMBLE_MAP = {};

  for(var prop in Compiler.OPCODE_MAP) {
    var value = Compiler.OPCODE_MAP[prop];
    Compiler.DISASSEMBLE_MAP[value] = prop;
  }

  Compiler.multiParamSize = function(code) {
    return Compiler.MULTI_PARAM_OPCODES[Compiler.DISASSEMBLE_MAP[code]];
  };

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, nextCode;
      var out = [], str, name, value;

      for(var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if(opcode === 'DECLARE') {
          name = opcodes[++i];
          value = opcodes[++i];
          out.push("DECLARE " + name + " = " + value);
        } else {
          str = Compiler.DISASSEMBLE_MAP[opcode];

          var extraParams = Compiler.multiParamSize(opcode);
          var codes = [];

          for(var j=0; j<extraParams; j++) {
            nextCode = opcodes[++i];

            if(typeof nextCode === "string") {
              nextCode = "\"" + nextCode.replace("\n", "\\n") + "\"";
            }

            codes.push(nextCode);
          }

          str = str + " " + codes.join(" ");

          out.push(str);
        }
      }

      return out.join("\n");
    },

    guid: 0,

    compile: function(program, options) {
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.program(program);
    },

    accept: function(node) {
      return this[node.type](node);
    },

    program: function(program) {
      var statements = program.statements, statement;
      this.opcodes = [];

      for(var i=0, l=statements.length; i<l; i++) {
        statement = statements[i];
        this[statement.type](statement);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache;
      var depth, child, inverse, inverseGuid;

      var params = this.setupStackForMustache(mustache);

      var programGuid = this.compileProgram(block.program);

      if(block.program.inverse) {
        inverseGuid = this.compileProgram(block.program.inverse);
        this.declare('inverse', inverseGuid);
      }

      this.opcode('invokeProgram', programGuid, params.length, !!mustache.hash);
      this.declare('inverse', null);
      this.opcode('append');
    },

    inverse: function(block) {
      var params = this.setupStackForMustache(block.mustache);

      var programGuid = this.compileProgram(block.program);

      this.declare('inverse', programGuid);

      this.opcode('invokeProgram', null, params.length, !!block.mustache.hash);
      this.declare('inverse', null);
      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('push', '{}');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        this.accept(val);
        this.opcode('assignToHash', pair[0]);
      }
    },

    partial: function(partial) {
      var id = partial.id;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', id.original);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      var params = this.setupStackForMustache(mustache);

      this.opcode('invokeMustache', params.length, mustache.id.original, !!mustache.hash);

      if(mustache.escaped && !this.options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);

      this.opcode('getContext', id.depth);

      this.opcode('lookupWithHelpers', id.parts[0] || null, id.isScoped || false);

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('push', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('push', bool.bool);
    },

    comment: function() {},

    // HELPERS
    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.string);
        } else {
          this[param.type](param);
        }
      }
    },

    opcode: function(name, val1, val2, val3) {
      this.opcodes.push(Compiler.OPCODE_MAP[name]);
      if(val1 !== undefined) { this.opcodes.push(val1); }
      if(val2 !== undefined) { this.opcodes.push(val2); }
      if(val3 !== undefined) { this.opcodes.push(val3); }
    },

    declare: function(name, value) {
      this.opcodes.push('DECLARE');
      this.opcodes.push(name);
      this.opcodes.push(value);
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    setupStackForMustache: function(mustache) {
      var params = mustache.params;

      this.pushParams(params);

      if(mustache.hash) {
        this.hash(mustache.hash);
      }

      this.ID(mustache.id);

      return params;
    }
  };

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name, type) {
			if (/^[0-9]+$/.test(name)) {
        return parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
	    	return parent + "." + name;
			}
			else {
				return parent + "['" + name + "']";
      }
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return "buffer += " + string + ";";
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        aliases: { self: 'this' },
        registers: {list: []}
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(l=opcodes.length; this.i<l; this.i++) {
        opcode = this.nextOpcode(0);

        if(opcode[0] === 'DECLARE') {
          this.i = this.i + 2;
          this[opcode[1]] = opcode[2];
        } else {
          this.i = this.i + opcode[1].length;
          this[opcode[0]].apply(this, opcode[1]);
        }
      }

      return this.createFunctionContext(asObject);
    },

    nextOpcode: function(n) {
      var opcodes = this.environment.opcodes, opcode = opcodes[this.i + n], name, val;
      var extraParams, codes;

      if(opcode === 'DECLARE') {
        name = opcodes[this.i + 1];
        val  = opcodes[this.i + 2];
        return ['DECLARE', name, val];
      } else {
        name = Compiler.DISASSEMBLE_MAP[opcode];

        extraParams = Compiler.multiParamSize(opcode);
        codes = [];

        for(var j=0; j<extraParams; j++) {
          codes.push(opcodes[this.i + j + 1 + n]);
        }

        return [name, codes];
      }
    },

    eat: function(opcode) {
      this.i = this.i + opcode.length;
    },

    preamble: function() {
      var out = [];

      // this register will disambiguate helper lookup from finding a function in
      // a context. This is necessary for mustache compatibility, which requires
      // that context functions in blocks are evaluated by blockHelperMissing, and
      // then proceed as if the resulting value was provided to blockHelperMissing.
      this.useRegister('foundHelper');

      if (!this.isChild) {
        var namespace = this.namespace;
        var copies = "helpers = helpers || " + namespace + ".helpers;";
        if(this.environment.usePartial) { copies = copies + " partials = partials || " + namespace + ".partials;"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars;
      if (!this.isChild) {
        locals = locals.concat(this.context.registers.list);
      }

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        var aliases = []
        for (var alias in this.context.aliases) {
          this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.source.push("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      if (asObject) {
        params.push(this.source.join("\n  "));

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + this.source.join("\n  ") + '}';
        Handlebars.log(Handlebars.logger.DEBUG, functionSource + "\n\n");
        return functionSource;
      }
    },

    appendContent: function(content) {
      this.source.push(this.appendToBuffer(this.quotedString(content)));
    },

    append: function() {
      var local = this.popStack();
      this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.source.push("else { " + this.appendToBuffer("''") + " }");
      }
    },

    appendEscaped: function() {
      var opcode = this.nextOpcode(1), extra = "";
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      if(opcode[0] === 'appendContent') {
        extra = " + " + this.quotedString(opcode[1][0]);
        this.eat(opcode);
      }

      this.source.push(this.appendToBuffer("escapeExpression(" + this.popStack() + ")" + extra));
    },

    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    lookupWithHelpers: function(name, isScoped) {
      if(name) {
        var topStack = this.nextStack();

        this.usingKnownHelper = false;

        var toPush;
        if (!isScoped && this.options.knownHelpers[name]) {
          toPush = topStack + " = " + this.nameLookup('helpers', name, 'helper');
          this.usingKnownHelper = true;
        } else if (isScoped || this.options.knownHelpersOnly) {
          toPush = topStack + " = " + this.nameLookup('depth' + this.lastContext, name, 'context');
        } else {
          this.register('foundHelper', this.nameLookup('helpers', name, 'helper'));
          toPush = topStack + " = foundHelper || " + this.nameLookup('depth' + this.lastContext, name, 'context');
        }

        toPush += ';';
        this.source.push(toPush);
      } else {
        this.pushStack('depth' + this.lastContext);
      }
    },

    lookup: function(name) {
      var topStack = this.topStack();
      this.source.push(topStack + " = (" + topStack + " === null || " + topStack + " === undefined || " + topStack + " === false ? " +
 				topStack + " : " + this.nameLookup(topStack, name, 'context') + ");");
    },

    pushStringParam: function(string) {
      this.pushStack('depth' + this.lastContext);
      this.pushString(string);
    },

    pushString: function(string) {
      this.pushStack(this.quotedString(string));
    },

    push: function(name) {
      this.pushStack(name);
    },

    invokeMustache: function(paramSize, original, hasHash) {
      this.populateParams(paramSize, this.quotedString(original), "{}", null, hasHash, function(nextStack, helperMissingString, id) {
        if (!this.usingKnownHelper) {
          this.context.aliases.helperMissing = 'helpers.helperMissing';
          this.context.aliases.undef = 'void 0';
          this.source.push("else if(" + id + "=== undef) { " + nextStack + " = helperMissing.call(" + helperMissingString + "); }");
          if (nextStack !== id) {
            this.source.push("else { " + nextStack + " = " + id + "; }");
          }
        }
      });
    },

    invokeProgram: function(guid, paramSize, hasHash) {
      var inverse = this.programExpression(this.inverse);
      var mainProgram = this.programExpression(guid);

      this.populateParams(paramSize, null, mainProgram, inverse, hasHash, function(nextStack, helperMissingString, id) {
        if (!this.usingKnownHelper) {
          this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';
          this.source.push("else { " + nextStack + " = blockHelperMissing.call(" + helperMissingString + "); }");
        }
      });
    },

    populateParams: function(paramSize, helperId, program, inverse, hasHash, fn) {
      var needsRegister = hasHash || this.options.stringParams || inverse || this.options.data;
      var id = this.popStack(), nextStack;
      var params = [], param, stringParam, stringOptions;

      if (needsRegister) {
        this.register('tmp1', program);
        stringOptions = 'tmp1';
      } else {
        stringOptions = '{ hash: {} }';
      }

      if (needsRegister) {
        var hash = (hasHash ? this.popStack() : '{}');
        this.source.push('tmp1.hash = ' + hash + ';');
      }

      if(this.options.stringParams) {
        this.source.push('tmp1.contexts = [];');
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          this.source.push('tmp1.contexts.push(' + this.popStack() + ');');
        }
      }

      if(inverse) {
        this.source.push('tmp1.fn = tmp1;');
        this.source.push('tmp1.inverse = ' + inverse + ';');
      }

      if(this.options.data) {
        this.source.push('tmp1.data = data;');
      }

      params.push(stringOptions);

      this.populateCall(params, id, helperId || id, fn, program !== '{}');
    },

    populateCall: function(params, id, helperId, fn, program) {
      var paramString = ["depth0"].concat(params).join(", ");
      var helperMissingString = ["depth0"].concat(helperId).concat(params).join(", ");

      var nextStack = this.nextStack();

      if (this.usingKnownHelper) {
        this.source.push(nextStack + " = " + id + ".call(" + paramString + ");");
      } else {
        this.context.aliases.functionType = '"function"';
        var condition = program ? "foundHelper && " : ""
        this.source.push("if(" + condition + "typeof " + id + " === functionType) { " + nextStack + " = " + id + ".call(" + paramString + "); }");
      }
      fn.call(this, nextStack, helperMissingString, id);
      this.usingKnownHelper = false;
    },

    invokePartial: function(context) {
      params = [this.nameLookup('partials', context, 'partial'), "'" + context + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.pushStack("self.invokePartial(" + params.join(", ") + ");");
    },

    assignToHash: function(key) {
      var value = this.popStack();
      var hash = this.topStack();

      this.source.push(hash + "['" + key + "'] = " + value + ";");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
        var index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context);
      }
    },

    programExpression: function(guid) {
      if(guid == null) { return "self.noop"; }

      var child = this.environment.children[guid],
          depths = child.depths.list;
      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      if(depths.length === 0) {
        return "self.program(" + programParams.join(", ") + ")";
      } else {
        programParams.shift();
        return "self.programWithDepth(" + programParams.join(", ") + ")";
      }
    },

    register: function(name, val) {
      this.useRegister(name);
      this.source.push(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.context.registers[name]) {
        this.context.registers[name] = true;
        this.context.registers.list.push(name);
      }
    },

    pushStack: function(item) {
      this.source.push(this.nextStack() + " = " + item + ";");
      return "stack" + this.stackSlot;
    },

    nextStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return "stack" + this.stackSlot;
    },

    popStack: function() {
      return "stack" + this.stackSlot--;
    },

    topStack: function() {
      return "stack" + this.stackSlot;
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') + '"';
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

	JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
		if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
			return true;
		}
		return false;
	}

})(Handlebars.Compiler, Handlebars.JavaScriptCompiler);

Handlebars.precompile = function(string, options) {
  options = options || {};

  var ast = Handlebars.parse(string);
  var environment = new Handlebars.Compiler().compile(ast, options);
  return new Handlebars.JavaScriptCompiler().compile(environment, options);
};

Handlebars.compile = function(string, options) {
  options = options || {};

  var compiled;
  function compile() {
    var ast = Handlebars.parse(string);
    var environment = new Handlebars.Compiler().compile(ast, options);
    var templateSpec = new Handlebars.JavaScriptCompiler().compile(environment, options, undefined, true);
    return Handlebars.template(templateSpec);
  }

  // Template is only compiled on first use and cached after that point.
  return function(context, options) {
    if (!compiled) {
      compiled = compile();
    }
    return compiled.call(this, context, options);
  };
};
;
// lib/handlebars/runtime.js
Handlebars.VM = {
  template: function(templateSpec) {
    // Just add water
    var container = {
      escapeExpression: Handlebars.Utils.escapeExpression,
      invokePartial: Handlebars.VM.invokePartial,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          return Handlebars.VM.program(fn, data);
        } else if(programWrapper) {
          return programWrapper;
        } else {
          programWrapper = this.programs[i] = Handlebars.VM.program(fn);
          return programWrapper;
        }
      },
      programWithDepth: Handlebars.VM.programWithDepth,
      noop: Handlebars.VM.noop
    };

    return function(context, options) {
      options = options || {};
      return templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
    };
  },

  programWithDepth: function(fn, data, $depth) {
    var args = Array.prototype.slice.call(arguments, 2);

    return function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
  },
  program: function(fn, data) {
    return function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
  },
  noop: function() { return ""; },
  invokePartial: function(partial, name, context, helpers, partials, data) {
    options = { helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    } else if (!Handlebars.compile) {
      throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    } else {
      partials[name] = Handlebars.compile(partial);
      return partials[name](context, options);
    }
  }
};

Handlebars.template = Handlebars.VM.template;
;

define("handlebars", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Handlebars;
    };
}(this)));

/*!
 * backbone.layoutmanager.js v0.8.5
 * Copyright 2013, Tim Branyen (@tbranyen)
 * backbone.layoutmanager.js may be freely distributed under the MIT license.
 */
(function(window) {



// Hoisted, referenced at the bottom of the source.  This caches a list of all
// LayoutManager options at definition time.
var keys;

// Localize global dependency references.
var Backbone = window.Backbone;
var _ = window._;
var $ = Backbone.$;

// Maintain references to the two `Backbone.View` functions that are
// overwritten so that they can be proxied.
var _configure = Backbone.View.prototype._configure;
var render = Backbone.View.prototype.render;

// Cache these methods for performance.
var aPush = Array.prototype.push;
var aConcat = Array.prototype.concat;
var aSplice = Array.prototype.splice;

// LayoutManager is a wrapper around a `Backbone.View`.
var LayoutManager = Backbone.View.extend({
  // This named function allows for significantly easier debugging.
  constructor: function Layout(options) {
    // Options may not always be passed to the constructor, this ensures it is
    // always an object.
    options = options || {};

    // Grant this View superpowers.
    LayoutManager.setupView(this, options);

    // Have Backbone set up the rest of this View.
    Backbone.View.call(this, options);
  },

  // Shorthand to `setView` function with the `insert` flag set.
  insertView: function(selector, view) {
    // If the `view` argument exists, then a selector was passed in.  This code
    // path will forward the selector on to `setView`.
    if (view) {
      return this.setView(selector, view, true);
    }

    // If no `view` argument is defined, then assume the first argument is the
    // View, somewhat now confusingly named `selector`.
    return this.setView(selector, true);
  },

  // Iterate over an object and ensure every value is wrapped in an array to
  // ensure they will be inserted, then pass that object to `setViews`.
  insertViews: function(views) {
    // If an array of views was passed it should be inserted into the
    // root view. Much like calling insertView without a selector.
    if (_.isArray(views)) {
      return this.setViews({ "": views });
    }

    _.each(views, function(view, selector) {
      views[selector] = _.isArray(view) ? view : [view];
    });

    return this.setViews(views);
  },

  // Returns the View that matches the `getViews` filter function.
  getView: function(fn) {
    // If `getView` is invoked with undefined as the first argument, then the
    // second argument will be used instead.  This is to allow
    // `getViews(undefined, fn)` to work as `getViews(fn)`.  Useful for when
    // you are allowing an optional selector.
    if (fn == null) {
      fn = arguments[1];
    }

    return this.getViews(fn).first().value();
  },

  // Provide a filter function to get a flattened array of all the subviews.
  // If the filter function is omitted it will return all subviews.  If a
  // String is passed instead, it will return the Views for that selector.
  getViews: function(fn) {
    // Generate an array of all top level (no deeply nested) Views flattened.
    var views = _.chain(this.views).map(function(view) {
      return _.isArray(view) ? view : [view];
    }, this).flatten().value();

    // If the filter argument is a String, then return a chained Version of the
    // elements.
    if (typeof fn === "string") {
      return _.chain([this.views[fn]]).flatten();
    }

    // If the argument passed is an Object, then pass it to `_.where`.
    if (typeof fn === "object") {
      return _.chain([_.where(views, fn)]).flatten();
    }

    // If a filter function is provided, run it on all Views and return a
    // wrapped chain. Otherwise, simply return a wrapped chain of all Views.
    return _.chain(typeof fn === "function" ? _.filter(views, fn) : views);
  },

  // Use this to remove Views, internally uses `getViews` so you can pass the
  // same argument here as you would to that method.
  removeView: function(fn) {
    // Allow an optional selector or function to find the right model and
    // remove nested Views based off the results of the selector or filter.
    return this.getViews(fn).each(function(nestedView) {
      nestedView.remove();
    });
  },

  // This takes in a partial name and view instance and assigns them to
  // the internal collection of views.  If a view is not a LayoutManager
  // instance, then mix in the LayoutManager prototype.  This ensures
  // all Views can be used successfully.
  //
  // Must definitely wrap any render method passed in or defaults to a
  // typical render function `return layout(this).render()`.
  setView: function(name, view, insert) {
    var manager, existing, options;
    // Parent view, the one you are setting a View on.
    var root = this;

    // If no name was passed, use an empty string and shift all arguments.
    if (typeof name !== "string") {
      insert = view;
      view = name;
      name = "";
    }

    // If the parent views object doesn't exist... create it.
    this.views = this.views || {};

    // Shorthand the `__manager__` property.
    manager = view.__manager__;

    // Shorthand the View that potentially already exists.
    existing = this.views[name];

    // If the View has not been properly set up, throw an Error message
    // indicating that the View needs `manage: true` set.
    if (!manager) {
      throw new Error("Please set `View#manage` property with selector '" +
        name + "' to `true`.");
    }

    // Assign options.
    options = view.getAllOptions();

    // Add reference to the parentView.
    manager.parent = root;

    // Add reference to the placement selector used.
    manager.selector = name;

    // Set up event bubbling, inspired by Backbone.ViewMaster.  Do not bubble
    // internal events that are triggered.
    view.on("all", function(name) {
      if (name !== "beforeRender" && name !== "afterRender") {
        root.trigger.apply(root, arguments);
      }
    }, view);

    // Code path is less complex for Views that are not being inserted.  Simply
    // remove existing Views and bail out with the assignment.
    if (!insert) {
      // If the View we are adding has already been rendered, simply inject it
      // into the parent.
      if (manager.hasRendered) {
        // Apply the partial.
        options.partial(root.$el, view.$el, root.__manager__, manager);
      }

      // Ensure remove is called when swapping View's.
      if (existing) {
        // If the views are an array, iterate and remove each individually.
        _.each(aConcat.call([], existing), function(nestedView) {
          nestedView.remove();
        });
      }

      // Assign to main views object and return for chainability.
      return this.views[name] = view;
    }

    // Ensure this.views[name] is an array and push this View to the end.
    this.views[name] = aConcat.call([], existing || [], view);

    // Put the view into `insert` mode.
    manager.insert = true;

    return view;
  },

  // Allows the setting of multiple views instead of a single view.
  setViews: function(views) {
    // Iterate over all the views and use the View's view method to assign.
    _.each(views, function(view, name) {
      // If the view is an array put all views into insert mode.
      if (_.isArray(view)) {
        return _.each(view, function(view) {
          this.insertView(name, view);
        }, this);
      }

      // Assign each view using the view function.
      this.setView(name, view);
    }, this);

    // Allow for chaining
    return this;
  },

  // By default this should find all nested views and render them into
  // the this.el and call done once all of them have successfully been
  // resolved.
  //
  // This function returns a promise that can be chained to determine
  // once all subviews and main view have been rendered into the view.el.
  render: function() {
    var root = this;
    var options = root.getAllOptions();
    var manager = root.__manager__;
    var parent = manager.parent;
    var rentManager = parent && parent.__manager__;
    var def = options.deferred();

    // Triggered once the render has succeeded.
    function resolve() {
      var next, afterRender;

      // If there is a parent, attach.
      if (parent) {
        if (!options.contains(parent.el, root.el)) {
          // Apply the partial.
          options.partial(parent.$el, root.$el, rentManager, manager);
        }
      }

      // Ensure events are always correctly bound after rendering.
      root.delegateEvents();

      // Set this View as successfully rendered.
      manager.hasRendered = true;

      // Only process the queue if it exists.
      if (next = manager.queue.shift()) {
        // Ensure that the next render is only called after all other
        // `done` handlers have completed.  This will prevent `render`
        // callbacks from firing out of order.
        next();
      } else {
        // Once the queue is depleted, remove it, the render process has
        // completed.
        delete manager.queue;
      }

      // Reusable function for triggering the afterRender callback and event
      // and setting the hasRendered flag.
      function completeRender() {
        var afterRender = options.afterRender;

        if (afterRender) {
          afterRender.call(root, root);
        }

        // Always emit an afterRender event.
        root.trigger("afterRender", root);
      }

      // If the parent is currently rendering, wait until it has completed
      // until calling the nested View's `afterRender`.
      if (rentManager && rentManager.queue) {
        // Wait until the parent View has finished rendering, which could be
        // asynchronous, and trigger afterRender on this View once it has
        // compeleted.
        parent.once("afterRender", completeRender);
      } else {
        // This View and its parent have both rendered.
        completeRender();
      }

      return def.resolveWith(root, [root]);
    }

    // Actually facilitate a render.
    function actuallyRender() {
      var options = root.getAllOptions();
      var manager = root.__manager__;
      var parent = manager.parent;
      var rentManager = parent && parent.__manager__;

      // The `_viewRender` method is broken out to abstract away from having
      // too much code in `actuallyRender`.
      root._render(LayoutManager._viewRender, options).done(function() {
        // If there are no children to worry about, complete the render
        // instantly.
        if (!_.keys(root.views).length) {
          return resolve();
        }

        // Create a list of promises to wait on until rendering is done.
        // Since this method will run on all children as well, its sufficient
        // for a full hierarchical.
        var promises = _.map(root.views, function(view) {
          var insert = _.isArray(view);

          // If items are being inserted, they will be in a non-zero length
          // Array.
          if (insert && view.length) {
            // Schedule each view to be rendered in order and return a promise
            // representing the result of the final rendering.
            return _.reduce(view.slice(1), function(prevRender, view) {
              return prevRender.then(function() {
                return view.render();
              });
            // The first view should be rendered immediately, and the resulting
            // promise used to initialize the reduction.
            }, view[0].render());
          }

          // Only return the fetch deferred, resolve the main deferred after
          // the element has been attached to it's parent.
          return !insert ? view.render() : view;
        });

        // Once all nested Views have been rendered, resolve this View's
        // deferred.
        options.when(promises).done(resolve);
      });
    }

    // Another render is currently happening if there is an existing queue, so
    // push a closure to render later into the queue.
    if (manager.queue) {
      aPush.call(manager.queue, actuallyRender);
    } else {
      manager.queue = [];

      // This the first `render`, preceeding the `queue` so render
      // immediately.
      actuallyRender(root, def);
    }

    // Add the View to the deferred so that `view.render().view.el` is
    // possible.
    def.view = root;

    // This is the promise that determines if the `render` function has
    // completed or not.
    return def;
  },

  // Ensure the cleanup function is called whenever remove is called.
  remove: function() {
    // Force remove itself from its parent.
    LayoutManager._removeView(this, true);

    // Call the original remove function.
    return this._remove.apply(this, arguments);
  },

  // Merge instance and global options.
  getAllOptions: function() {
    // Instance overrides take precedence, fallback to prototype options.
    return _.extend({}, this, LayoutManager.prototype.options, this.options);
  }
},
{
  // Clearable cache.
  _cache: {},

  // Creates a deferred and returns a function to call when finished.
  _makeAsync: function(options, done) {
    var handler = options.deferred();

    // Used to handle asynchronous renders.
    handler.async = function() {
      handler._isAsync = true;

      return done;
    };

    return handler;
  },

  // This gets passed to all _render methods.  The `root` value here is passed
  // from the `manage(this).render()` line in the `_render` function
  _viewRender: function(root, options) {
    var url, contents, fetchAsync, renderedEl;
    var manager = root.__manager__;

    // This function is responsible for pairing the rendered template into
    // the DOM element.
    function applyTemplate(rendered) {
      // Actually put the rendered contents into the element.
      if (rendered) {
        // If no container is specified, we must replace the content.
        if (manager.noel) {
          // Hold a reference to created element as replaceWith doesn't return new el.
          renderedEl = $(rendered);

          // Remove extra root elements
          root.$el.slice(1).remove();

          root.$el.replaceWith(renderedEl);
          // Don't delegate events here - we'll do that in resolve()
          root.setElement(renderedEl, false);
        } else {
          options.html(root.$el, rendered);
        }
      }

      // Resolve only after fetch and render have succeeded.
      fetchAsync.resolveWith(root, [root]);
    }

    // Once the template is successfully fetched, use its contents to proceed.
    // Context argument is first, since it is bound for partial application
    // reasons.
    function done(context, contents) {
      // Store the rendered template someplace so it can be re-assignable.
      var rendered;
      // This allows the `render` method to be asynchronous as well as `fetch`.
      var renderAsync = LayoutManager._makeAsync(options, function(rendered) {
        applyTemplate(rendered);
      });

      // Ensure the cache is up-to-date.
      LayoutManager.cache(url, contents);

      // Render the View into the el property.
      if (contents) {
        rendered = options.render.call(renderAsync, contents, context);
      }

      // If the function was synchronous, continue execution.
      if (!renderAsync._isAsync) {
        applyTemplate(rendered);
      }
    }

    return {
      // This `render` function is what gets called inside of the View render,
      // when `manage(this).render` is called.  Returns a promise that can be
      // used to know when the element has been rendered into its parent.
      render: function() {
        var context = root.serialize || options.serialize;
        var template = root.template || options.template;

        // If data is a function, immediately call it.
        if (_.isFunction(context)) {
          context = context.call(root);
        }

        // This allows for `var done = this.async()` and then `done(contents)`.
        fetchAsync = LayoutManager._makeAsync(options, function(contents) {
          done(context, contents);
        });

        // Set the url to the prefix + the view's template property.
        if (typeof template === "string") {
          url = options.prefix + template;
        }

        // Check if contents are already cached and if they are, simply process
        // the template with the correct data.
        if (contents = LayoutManager.cache(url)) {
          done(context, contents, url);

          return fetchAsync;
        }

        // Fetch layout and template contents.
        if (typeof template === "string") {
          contents = options.fetch.call(fetchAsync, options.prefix + template);
        // If the template is already a function, simply call it.
        } else if (typeof template === "function") {
          contents = template;
        // If its not a string and not undefined, pass the value to `fetch`.
        } else if (template != null) {
          contents = options.fetch.call(fetchAsync, template);
        }

        // If the function was synchronous, continue execution.
        if (!fetchAsync._isAsync) {
          done(context, contents);
        }

        return fetchAsync;
      }
    };
  },

  // Remove all nested Views.
  _removeViews: function(root, force) {
    var views;

    // Shift arguments around.
    if (typeof root === "boolean") {
      force = root;
      root = this;
    }

    // Allow removeView to be called on instances.
    root = root || this;

    // Iterate over all of the nested View's and remove.
    root.getViews().each(function(view) {
      // Force doesn't care about if a View has rendered or not.
      if (view.__manager__.hasRendered || force) {
        LayoutManager._removeView(view, force);
      }
    });
  },

  // Remove a single nested View.
  _removeView: function(view, force) {
    var parentViews;
    // Shorthand the manager for easier access.
    var manager = view.__manager__;
    // Test for keep.
    var keep = typeof view.keep === "boolean" ? view.keep : view.options.keep;

    // Only remove views that do not have `keep` attribute set, unless the
    // View is in `insert` mode and the force flag is set.
    if (!keep && (manager.insert === true || force)) {
      // Clean out the events.
      LayoutManager.cleanViews(view);

      // Since we are removing this view, force subviews to remove
      view._removeViews(true);

      // Remove the View completely.
      view.$el.remove();

      // Bail out early if no parent exists.
      if (!manager.parent) { return; }

      // Assign (if they exist) the sibling Views to a property.
      parentViews = manager.parent.views[manager.selector];

      // If this is an array of items remove items that are not marked to
      // keep.
      if (_.isArray(parentViews)) {
        // Remove duplicate Views.
        return _.each(_.clone(parentViews), function(view, i) {
          // If the managers match, splice off this View.
          if (view && view.__manager__ === manager) {
            aSplice.call(parentViews, i, 1);
          }
        });
      }

      // Otherwise delete the parent selector.
      delete manager.parent.views[manager.selector];
    }
  },

  // Cache templates into LayoutManager._cache.
  cache: function(path, contents) {
    // If template path is found in the cache, return the contents.
    if (path in this._cache && contents == null) {
      return this._cache[path];
    // Ensure path and contents aren't undefined.
    } else if (path != null && contents != null) {
      return this._cache[path] = contents;
    }

    // If the template is not in the cache, return undefined.
  },

  // Accept either a single view or an array of views to clean of all DOM
  // events internal model and collection references and all Backbone.Events.
  cleanViews: function(views) {
    // Clear out all existing views.
    _.each(aConcat.call([], views), function(view) {
      // Remove all custom events attached to this View.
      view.unbind();

      // Automatically unbind `model`.
      if (view.model instanceof Backbone.Model) {
        view.model.off(null, null, view);
      }

      // Automatically unbind `collection`.
      if (view.collection instanceof Backbone.Collection) {
        view.collection.off(null, null, view);
      }

      // Automatically unbind events bound to this View.
      view.stopListening();

      // If a custom cleanup method was provided on the view, call it after
      // the initial cleanup is done
      _.result(view, "cleanup");
    });
  },

  // This static method allows for global configuration of LayoutManager.
  configure: function(options) {
    _.extend(LayoutManager.prototype.options, options);

    // Allow LayoutManager to manage Backbone.View.prototype.
    if (options.manage) {
      Backbone.View.prototype.manage = true;
    }

    // Disable the element globally.
    if (options.el === false) {
      Backbone.View.prototype.el = false;
    }
  },

  // Configure a View to work with the LayoutManager plugin.
  setupView: function(views, options) {
    // Set up all Views passed.
    _.each(aConcat.call([], views), function(view) {
      // If the View has already been setup, no need to do it again.
      if (view.__manager__) {
        return;
      }

      var views, declaredViews, viewOptions;
      var proto = LayoutManager.prototype;
      var viewOverrides = _.pick(view, keys);

      // Ensure necessary properties are set.
      _.defaults(view, {
        // Ensure a view always has a views object.
        views: {},

        // Internal state object used to store whether or not a View has been
        // taken over by layout manager and if it has been rendered into the DOM.
        __manager__: {},

        // Add the ability to remove all Views.
        _removeViews: LayoutManager._removeViews,

        // Add the ability to remove itself.
        _removeView: LayoutManager._removeView

      // Mix in all LayoutManager prototype properties as well.
      }, LayoutManager.prototype);

      // Extend the options with the prototype and passed options.
      options = view.options = _.defaults(options || {}, view.options,
        proto.options);

      // Ensure view events are properly copied over.
      viewOptions = _.pick(options, aConcat.call(["events"],
        _.values(options.events)));

      // Merge the View options into the View.
      _.extend(view, viewOptions);

      // If the View still has the Backbone.View#render method, remove it.  Don't
      // want it accidentally overriding the LM render.
      if (viewOverrides.render === LayoutManager.prototype.render ||
        viewOverrides.render === Backbone.View.prototype.render) {
        delete viewOverrides.render;
      }

      // Pick out the specific properties that can be dynamically added at
      // runtime and ensure they are available on the view object.
      _.extend(options, viewOverrides);

      // By default the original Remove function is the Backbone.View one.
      view._remove = Backbone.View.prototype.remove;

      // Always use this render function when using LayoutManager.
      view._render = function(manage, options) {
        // Keep the view consistent between callbacks and deferreds.
        var view = this;
        // Shorthand the manager.
        var manager = view.__manager__;
        // Cache these properties.
        var beforeRender = options.beforeRender;

        // Ensure all nested Views are properly scrubbed if re-rendering.
        if (manager.hasRendered) {
          this._removeViews();
        }

        // If a beforeRender function is defined, call it.
        if (beforeRender) {
          beforeRender.call(this, this);
        }

        // Always emit a beforeRender event.
        this.trigger("beforeRender", this);

        // Render!
        return manage(this, options).render();
      };

      // Ensure the render is always set correctly.
      view.render = LayoutManager.prototype.render;

      // If the user provided their own remove override, use that instead of the
      // default.
      if (view.remove !== proto.remove) {
        view._remove = view.remove;
        view.remove = proto.remove;
      }

      // Normalize views to exist on either instance or options, default to
      // options.
      views = options.views || view.views;

      // Set the internal views, only if selectors have been provided.
      if (_.keys(views).length) {
        // Keep original object declared containing Views.
        declaredViews = views;

        // Reset the property to avoid duplication or overwritting.
        view.views = {};

        // Set the declared Views.
        view.setViews(declaredViews);
      }

      // If a template is passed use that instead.
      if (view.options.template) {
        view.options.template = options.template;
      // Ensure the template is mapped over.
      } else if (view.template) {
        options.template = view.template;
      }
    });
  }
});

// Convenience assignment to make creating Layout's slightly shorter.
Backbone.Layout = LayoutManager;
// Tack on the version.
LayoutManager.VERSION = "0.8.5";

// Override _configure to provide extra functionality that is necessary in
// order for the render function reference to be bound during initialize.
Backbone.View.prototype._configure = function(options) {
  var noel, retVal;

  // Remove the container element provided by Backbone.
  if ("el" in options ? options.el === false : this.el === false) {
    noel = true;
  }

  // Run the original _configure.
  retVal = _configure.apply(this, arguments);

  // If manage is set, do it!
  if (options.manage || this.manage) {
    // Set up this View.
    LayoutManager.setupView(this);
  }

  // Assign the `noel` property once we're sure the View we're working with is
  // mangaed by LayoutManager.
  if (this.__manager__) {
    this.__manager__.noel = noel;
  }

  // Act like nothing happened.
  return retVal;
};

// Default configuration options; designed to be overriden.
LayoutManager.prototype.options = {
  // Prefix template/layout paths.
  prefix: "",

  // Can be used to supply a different deferred implementation.
  deferred: function() {
    return $.Deferred();
  },

  // Fetch is passed a path and is expected to return template contents as a
  // function or string.
  fetch: function(path) {
    return _.template($(path).html());
  },

  // This is the most common way you will want to partially apply a view into
  // a layout.
  partial: function($root, $el, rentManager, manager) {
    // If selector is specified, attempt to find it.
    if (manager.selector) {
      if (rentManager.noel) {
        var $filtered = $root.filter(manager.selector);
        $root = $filtered.length ? $filtered : $root.find(manager.selector);
      } else {
        $root = $root.find(manager.selector);
      }
    }

    // Use the insert method if insert argument is true.
    if (manager.insert) {
      this.insert($root, $el);
    } else {
      this.html($root, $el);
    }
  },

  // Override this with a custom HTML method, passed a root element and content
  // (a jQuery collection or a string) to replace the innerHTML with.
  html: function($root, content) {
    $root.html(content);
  },

  // Very similar to HTML except this one will appendChild by default.
  insert: function($root, $el) {
    $root.append($el);
  },

  // Return a deferred for when all promises resolve/reject.
  when: function(promises) {
    return $.when.apply(null, promises);
  },

  // By default, render using underscore's templating.
  render: function(template, context) {
    return template(context);
  },

  // A method to determine if a View contains another.
  contains: function(parent, child) {
    return $.contains(parent, child);
  }
};

// Maintain a list of the keys at define time.
keys = _.keys(LayoutManager.prototype.options);

})(typeof global === "object" ? global : this);

define("plugins/backbone.layoutmanager", function(){});

// Generated by CoffeeScript 1.6.2
/**
 * Backbone JJRelational
 * v0.2.5
 *
 * A relational plugin for Backbone JS that provides one-to-one, one-to-many and many-to-many relations between Backbone models.
 *
*/
(function() {
  
  var Backbone, exports, flatten, getUrlForIdQueue, getUrlForModelWithId, getValue, isManyType, isOneType, urlError, _;

  if (typeof window === 'undefined') {
    _ = require('underscore');
    Backbone = require('backbone');
    exports = module.exports = Backbone;
  } else {
    _ = window._;
    Backbone = window.Backbone;
    exports = window;
  }
  /**
  	 * 
  	 * The Store - well, stores all models in it.
  	 * On creation, a model registers itself in the store by its `storeIdentifier`-attribute.
  	 * Backbone JJStore provides some methods to get models by id/cid, for example, etc.
  	 *
  */

  Backbone.JJStore = {};
  Backbone.JJStore.Models = {};
  Backbone.JJStore.Events = _.extend({}, Backbone.Events);
  /**
  	 * Adds a store for the given `storeIdentifier` if one doesn't exist yet.
  	 * @param  {String} storeIdentifier
  	 * @return {Array}                              The matching store array
  */

  Backbone.JJStore.__registerModelType = function(storeIdentifier) {
    if (!this.Models[storeIdentifier]) {
      this.Models[storeIdentifier] = [];
    }
    return this.Models[storeIdentifier];
  };
  /**
  	 * Adds a model to its store if it's not present yet.
  	 * @param  {String} storeIdentifier              The store identifier
  	 * @param  {Backbone.JJRelationalModel} model    The model to register
  	 * @return {Boolean} true
  */

  Backbone.JJStore.__registerModelInStore = function(storeIdentifier, model) {
    var store;

    store = this.__registerModelType(storeIdentifier);
    if (!this.__modelExistsInStore(store, model)) {
      store.push(model);
      Backbone.JJStore.Events.trigger('added:' + storeIdentifier, model);
    }
    return true;
  };
  /**
  	 * Removes a model from its store if present.
  	 * @param  {Backbone.JJRelationalModel} model    The model to remove
  	 * @return {Boolean} true
  */

  Backbone.JJStore.__removeModelFromStore = function(model) {
    var store;

    store = this.Models[model.storeIdentifier];
    _.find(store, function(m, i) {
      if (m === model) {
        store.splice(i, 1);
        return true;
      }
    });
    return true;
  };
  /**
  	 * Checks if a model exists in a store.
  	 * @param  {String | Array} store                 Store identifier or store array.
  	 * @param  {Backbone.JJRelationalModel} model     The model to check.
  	 * @return {Boolean}                              Found or not.
  */

  Backbone.JJStore.__modelExistsInStore = function(store, model) {
    if (_.isString(store)) {
      store = this.Models[store];
    }
    return _.contains(store, model);
  };
  /**
  	 * Returns a model from the store by a specific attribute
  	 * @param  {String | Array} store                 Store identifier or store array.
  	 * @param  {String} propName                      Property/attribute name
  	 * @param  {mixed} propValue                      Property/attribute value
  	 * @param  {Boolean} useAttributes = false        If true, model.attributes will be searched, if false, just model.
  	 * @return {Backbone.JJRelationalModel}           The found model (if not found, `null` will be returned)
  */

  Backbone.JJStore.getModelByProperty = function(store, propName, propValue, useAttributes) {
    var returnModel;

    if (_.isString(store)) {
      store = this.Models[store];
    }
    returnModel = void 0;
    if (store) {
      returnModel = _.find(store, function(m, i) {
        var toUse;

        toUse = m;
        if (useAttributes) {
          toUse = toUse.attributes;
        }
        if (toUse[propName] === propValue) {
          return true;
        }
      });
    }
    return returnModel;
  };
  Backbone.JJStore._byId = function(store, id) {
    return this.getModelByProperty(store, 'id', id, false);
  };
  Backbone.JJStore._byCid = function(store, cid) {
    return this.getModelByProperty(store, 'cid', cid, false);
  };
  /**
  	 *
  	 * The main part
  	 *
  */

  Backbone.JJRelational = {};
  Backbone.JJRelational.Config = {
    url_id_appendix: '?ids=',
    work_with_store: true
  };
  Backbone.JJRelational.CollectionTypes = {};
  /**
  	 * Find a type on the global object by name. Splits name on dots.
  	 * (i.e. 'Store.Models.MyModel' will return exports['Store']['Models']['MyModel'])
  	 * @param  {String} name                           Name to look for
  	 * @return {mixed}                                 Global var
  */

  Backbone.JJRelational.__getObjectByName = function(name) {
    var type;

    type = _.reduce(name.split('.'), function(memo, val) {
      return memo[val];
    }, exports);
    if (type !== exports) {
      return type;
    } else {
      return null;
    }
  };
  /**
  	 * Registers one or many collection-types, in order to build a correct collection instance for many-relations.
  	 * @param  {Object} collTypes                      key => value pairs, where `key` is the name under which to store the collection type (`value`)
  	 * @return {Boolean}           					   Success or not.
  */

  Backbone.JJRelational.registerCollectionTypes = function(collTypes) {
    var collection, name;

    if (!_.isObject(collTypes)) {
      return false;
    }
    for (name in collTypes) {
      collection = collTypes[name];
      Backbone.JJRelational.CollectionTypes[name] = collection;
    }
    return true;
  };
  /**
  	 * Returns a collection type by the registered name.
  	 * If none is found, Backbone.Collection will be returned.
  	 * @param  {String} name                           Name under which the collection type is stored
  	 * @return {Backbone.Collection}                   Found collection type or Backbone.Collection
  */

  Backbone.JJRelational.__getCollectionType = function(name) {
    var coll, n, _ref;

    _ref = Backbone.JJRelational.CollectionTypes;
    for (n in _ref) {
      coll = _ref[n];
      if (n === name) {
        return coll;
      }
    }
    return Backbone.Collection;
  };
  /**
  	 * Backbone.JJRelationalModel
  	 *
  	 * The main model extension of Backbone.Model
  	 * Here come the good parts. :)
  	 * @type {Backbone.JJRelationalModel}
  	 *
  */

  Backbone.JJRelationalModel = Backbone.Model.extend({
    relationsInstalled: false,
    /**
    		 * The constructor:
    		 * The Model is built normally, then the relational attributes are set up and the model is registered in the store.
    		 * After that, the relational attributes are populated (if present in argument `attributes`).
    		 * At last, the creation of the model is triggered on Backbone.JJStore.Events. (e.g. 'created:MyModel')
    		 * 
    		 * @param  {Object} attributes                  Initial attributes.
    		 * @param  {Object} options                     Options object.
    		 * @return {Backbone.JJRelationalModel}         The freshly created model.
    */

    constructor: function(attributes, options) {
      var existModel, id;

      if (Backbone.JJRelational.Config.work_with_store && _.isObject(attributes) && (id = attributes[this.idAttribute])) {
        existModel = Backbone.JJStore._byId(this.storeIdentifier, id);
      }
      if (existModel) {
        existModel.set(attributes, options);
        return existModel;
      }
      Backbone.Model.apply(this, arguments);
      this.__prepopulate_rel_atts();
      Backbone.JJStore.__registerModelInStore(this.storeIdentifier, this);
      this.__populate_rels_with_atts(attributes, options);
      Backbone.JJStore.Events.trigger('created:' + this.storeIdentifier, this);
      return this;
    },
    /**
    		 * Initializes the relational attributes and binds basic listeners.
    		 * has_many and many_many get empty collections, with a `_relational`-property containing:
    		 * `owner`, `ownerKey`, `reverseKey` and `idQueue`
    		 * 
    		 * @return {Backbone.JJRelationalModel}
    */

    __prepopulate_rel_atts: function() {
      var collType, gObj, i, indexOfID, relModel, relation, value, _i, _len, _ref;

      if (this.relations) {
        _ref = this.relations;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          relation = _ref[i];
          relModel = relation.relatedModel;
          relation.includeInJSON = relation.includeInJSON ? relation.includeInJSON : [];
          relation.includeInJSON = _.isArray(relation.includeInJSON) ? relation.includeInJSON : [relation.includeInJSON];
          indexOfID = _.indexOf(relation.includeInJSON, 'id');
          if (indexOfID >= 0 && this.idAttribute) {
            relation.includeInJSON[indexOfID] = this.idAttribute;
          }
          if (relModel === void 0 || relModel.prototype instanceof Backbone.JJRelationalModel === false) {
            if (_.isString(relModel)) {
              gObj = Backbone.JJRelational.__getObjectByName(relModel);
              if (gObj && gObj.prototype instanceof Backbone.JJRelationalModel === true) {
                relModel = this.relations[i].relatedModel = gObj;
              } else {
                throw new TypeError('relatedModel "' + relModel + '" is neither a reference to a JJRelationalModel nor a string referring to an object in the global oject');
              }
            } else if (_.isFunction(relModel)) {
              relModel = this.relations[i].relatedModel = relModel.call(this);
            }
          }
          value;
          if (relation && !isOneType(relation) && (collType = Backbone.JJRelational.__getCollectionType(relation.collectionType))) {
            value = new collType();
            value._relational = {
              owner: this,
              ownerKey: relation.key,
              reverseKey: relation.reverseKey,
              idQueue: []
            };
          } else {
            value = null;
          }
          this.attributes[relation.key] = value;
          Backbone.JJStore.Events.bind('created:' + relModel.prototype.storeIdentifier, this.newModelInStore, this);
        }
        this.bind('destroy', this._destroyAllRelations);
      }
      this.relationsInstalled = true;
      return this;
    },
    /*
    		 # Fills in any relational values that are present in the `attributes`-argument
    		 # e.g. var m = new MyModel({ HasOneRelation : relationalModel });
    		 #
    		 # @param {Object} attributes
    		 # @param {Object} options
    		 #
    */

    __populate_rels_with_atts: function(attributes, options) {
      var key, relation, v, value, _i, _len;

      for (key in attributes) {
        value = attributes[key];
        if (relation = this.getRelationByKey(key)) {
          if (value instanceof Backbone.Collection === true) {
            throw new TypeError('The attribute "' + key + '" is a collection. You should not replace whole collections in a relational attribute. Please use the direct reference to the model array (Backbone.Collection.models)');
          } else {
            value = _.isArray(value) ? value : [value];
            for (_i = 0, _len = value.length; _i < _len; _i++) {
              v = value[_i];
              this.checkAndAdd(v, relation, options);
            }
          }
        }
      }
      return this;
    },
    /**
    		 * Override "`save`" method.
    		 * The concept is: When saving a model, it is checked whether it has any relations containing a 
    		 * new model. If yes, the new model is saved first. When all new models have been saved, only
    		 * then is the actual model saved.
    		 * Relational collections are saved as an array of models + idQueue
    		 * Concerning relations, the `includeInJSON`-property is used to generate the JSON object
    		 * 
    		 * @param  {String | Object} key                  See Backbone core
    		 * @param  {mixed | Object} value                 See Backbone core
    		 * @param  {Object} options                       (optional) See Backbone core
    		 * @return {Backbone.$.ajax}
    */

    save: function(key, value, options) {
      attrs;
      current;
      var actualSave, attrs, checkAndContinue, checkIfNew, current, model, obj, opts, optsToUse, relModelsToSave, relation, returnXhr, silentOptions, val, _i, _j, _k, _len, _len1, _len2, _ref, _ref1,
        _this = this;

      returnXhr = null;
      if (_.isObject(key) || !key) {
        attrs = key;
        options = value;
      } else if (key !== null) {
        attrs = {};
        attrs[key] = value;
      }
      options = options ? _.clone(options) : {};
      options.isSave = true;
      if (options.wait) {
        if (!this._validate(attrs, options)) {
          return false;
        }
        current = flatten(_.clone(this.attributes));
      }
      silentOptions = _.extend({}, options, {
        silent: true
      });
      optsToUse = options.wait ? silentOptions : options;
      if (attrs && !this.set(attrs, optsToUse)) {
        return false;
      }
      if (!attrs && !this._validate(null, options)) {
        return false;
      }
      actualSave = function() {
        var done, method, success, xhr;

        success = options.success;
        if (!options.contentType) {
          options.contentType = 'application/json';
        }
        if (!options.data) {
          options.data = JSON.stringify(_this.toJSON({
            isSave: true
          }));
        }
        done = false;
        options.success = function(resp, status, xhr) {
          var serverAttrs;

          done = true;
          serverAttrs = _this.parse(resp);
          if (options.wait) {
            serverAttrs = _.extend(attrs || {}, serverAttrs);
          }
          if (!_this.set(serverAttrs, options)) {
            return false;
          }
          if (success) {
            return success(_this, resp);
          }
        };
        method = _this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
        if (method === 'patch') {
          options.attrs = attrs;
        }
        xhr = _this.sync.call(_this, method, _this, options);
        if (!done && options.wait) {
          _this.clear(silentOptions);
          _this.set(current, silentOptions);
        }
        return xhr;
      };
      if (!options.ignoreSaveOnModels) {
        options.ignoreSaveOnModels = [this];
      }
      relModelsToSave = [];
      checkIfNew = function(val) {
        if (val && (val instanceof Backbone.JJRelationalModel) && val.isNew()) {
          return relModelsToSave.push({
            model: val,
            done: false
          });
        }
      };
      checkAndContinue = function() {
        var done, obj, _i, _len;

        if (_.isEmpty(relModelsToSave)) {
          returnXhr = actualSave();
        }
        done = true;
        for (_i = 0, _len = relModelsToSave.length; _i < _len; _i++) {
          obj = relModelsToSave[_i];
          if (obj.done === false) {
            done = false;
          }
        }
        if (done) {
          return returnXhr = actualSave();
        }
      };
      if (this.relations) {
        _ref = this.relations;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          relation = _ref[_i];
          val = this.get(relation.key);
          if (isOneType(relation)) {
            checkIfNew(val);
          } else if (isManyType(relation)) {
            _ref1 = val.models;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              model = _ref1[_j];
              checkIfNew(model);
            }
          }
        }
      }
      if (_.isEmpty(relModelsToSave)) {
        returnXhr = actualSave();
      }
      for (_k = 0, _len2 = relModelsToSave.length; _k < _len2; _k++) {
        obj = relModelsToSave[_k];
        if (_.indexOf(options.ignoreSaveOnModels, obj.model) <= -1) {
          options.ignoreSaveOnModels.push(obj.model);
          opts = _.clone(options);
          opts.success = function(model, resp) {
            var _l, _len3;

            for (_l = 0, _len3 = relModelsToSave.length; _l < _len3; _l++) {
              obj = relModelsToSave[_l];
              if (obj.model.cid === model.cid) {
                obj.done = true;
              }
            }
            Backbone.JJStore.Events.trigger('created:' + model.storeIdentifier, model);
            return checkAndContinue();
          };
          obj.model.save({}, opts);
        } else {
          obj.done = true;
          checkAndContinue();
        }
      }
      return returnXhr;
    },
    /**
    		 * Override "`set`" method.
    		 * This is pretty much the most important override...
    		 * 
    		 * @param {String | Object} key                    See Backbone core
    		 * @param {mixed | Object} val                     See Backbone core
    		 * @param {Object} options                         (optional) Backbone core
    */

    set: function(key, val, options) {
      var attrs, change, changes, changing, current, ignoreChanges, prev, relation, silent, unset, v, value, _i, _j, _len, _len1;

      if (key === null) {
        return this;
      }
      if (_.isObject(key)) {
        attrs = key;
        options = val;
      } else {
        attrs = {};
        attrs[key] = val;
      }
      options = options || {};
      if (!this._validate(attrs, options)) {
        return false;
      }
      silent = options && options.silent;
      unset = options && options.unset;
      ignoreChanges = options && options.ignoreChanges;
      changes = [];
      changing = this._changing;
      this._changing = true;
      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes;
      prev = this._previousAttributes;
      if (this.idAttribute in attrs) {
        this.id = attrs[this.idAttribute];
      }
      options.ignoreChanges = true;
      for (key in attrs) {
        value = attrs[key];
        if (!_.isEqual(current[key], value)) {
          changes.push(key);
        }
        if (!_.isEqual(prev[key], value)) {
          this.changed[key] = val;
        } else {
          delete this.changed[key];
        }
        if ((relation = this.getRelationByKey(key)) && this.relationsInstalled) {
          this._emptyRelation(relation);
          value = _.isArray(value) ? value : [value];
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            v = value[_i];
            if (!unset) {
              this.checkAndAdd(v, relation, options);
            }
          }
        } else {
          if (unset) {
            delete current[key];
          } else {
            current[key] = value;
          }
        }
      }
      if (!silent) {
        if (changes.length) {
          this._pending = true;
        }
        for (_j = 0, _len1 = changes.length; _j < _len1; _j++) {
          change = changes[_j];
          this.trigger('change:' + change, this, current[change], options);
        }
      }
      if (changing) {
        return this;
      }
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },
    /**
    		 * Override "`_validate`" method.
    		 * The difference is that it flattens relational collections down to its model array.
    		 * 
    		 * @param  {Object} attrs                            see Backbone core
    		 * @param  {Object} options                          see Backbone core
    		 * @return {Boolean}                                 see Backbone core
    */

    _validate: function(attrs, options) {
      var error, relation, val, _i, _len, _ref;

      if (!this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        val = attrs[relation.key];
        if (val instanceof Backbone.Collection === true) {
          attrs[relation.key] = val.models;
        }
      }
      error = this.validate(attrs, options);
      if (!error) {
        return true;
      }
      if (options && options.error) {
        options.error(this, error, options);
      }
      this.trigger('error', this, error, options);
      return false;
    },
    /**
    		 * Override `toJSON` method for relation handling.
    		 * If it's for saving (`options.isSave == true`), then it uses the includeInJSON property of relations. 
    		 * This can go down as many levels as required.
    		 * If not, it just goes down one level.
    		 * 
    		 * @param  {Object} options                    Options object
    		 * @return {Object}                            Final JSON object
    */

    toJSON: function(options) {
      var include, json, key, relValue, relation, _i, _j, _len, _len1, _ref, _ref1;

      options = options || {};
      if (options.withRelIDs) {
        return this.toJSONWithRelIDs();
      }
      json = _.clone(this.attributes);
      if (options.bypass) {
        return json;
      }
      if (options.isSave) {
        _ref = this.relations;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          relation = _ref[_i];
          if (options.scaffold && (_.indexOf(options.scaffold, relation.key) < 0)) {
            continue;
          }
          include = relation.includeInJSON;
          key = relation.key;
          relValue = this.get(key);
          if (isOneType(relation)) {
            if (relValue) {
              if (relValue instanceof relation.relatedModel === true) {
                if (include.length === 0) {
                  json[relation.key] = relValue.toJSONWithRelIDs();
                } else if (include.length === 1) {
                  json[relation.key] = relValue.get(include[0]);
                } else {
                  json[relation.key] = relValue.toJSON({
                    isSave: true,
                    scaffold: include
                  });
                }
              } else {
                json[relation.key] = _.indexOf(include, relation.relatedModel.prototype.idAttribute) >= 0 ? relValue : null;
              }
            } else {
              json[relation.key] = null;
            }
          } else if (isManyType(relation)) {
            if (include.length === 0) {
              json[relation.key] = relValue.toJSON({
                withRelIDs: true
              });
            } else if (include.length === 1) {
              json[relation.key] = relValue.getArrayForAttribute(include[0]);
            } else {
              json[relation.key] = relValue.toJSON({
                isSave: true,
                scaffold: include
              });
              if (_.indexOf(include, 'id') >= 0) {
                json[relation.key].push(relValue._relational.idQueue);
              }
            }
          }
        }
      } else {
        _ref1 = this.relations;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          relation = _ref1[_j];
          relValue = this.get(relation.key);
          if (isOneType(relation)) {
            json[relation.key] = relValue instanceof relation.relatedModel === true ? relValue.toJSONWithRelIDs() : relValue;
          } else if (isManyType(relation)) {
            json[relation.key] = relValue.toJSON({
              withRelIDs: true
            });
          }
        }
      }
      if (options.scaffold) {
        json = _.pick.apply(window, [json, options.scaffold]);
      }
      return json;
    },
    /**
    		 * Returns a JSON of the model with the relations represented only by ids.
    		 * 
    		 * @return {Object}                            Final JSON object
    */

    toJSONWithRelIDs: function() {
      var json, relValue, relation, _i, _len, _ref;

      json = _.clone(this.attributes);
      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        relValue = this.get(relation.key);
        if (isOneType(relation)) {
          json[relation.key] = relValue instanceof relation.relatedModel === true ? relValue.id : relValue;
        } else if (isManyType(relation)) {
          json[relation.key] = relValue.getIDArray();
        }
      }
      return json;
    },
    /**
    		 * This function checks a given value and adds it to the relation accordingly.
    		 * If it's a model, it adds it to the relation. If it's a set of attributes, it creates a new model
    		 * and adds it. Otherwise it assumes that it must be the id, looks it up in the store (if there's
    		 * already a model) or adds it to the relation's idQueue.
    		 * 
    		 * @param  {mixed}  val                              The value to check
    		 * @param  {Object} rel                              The relation which to add the value to
    		 * @param  {Object} options                          Options object
    		 * @return {Backbone.JJRelationalModel}
    */

    checkAndAdd: function(val, rel, options) {
      var existModel, newModel, relModel, storeIdentifier;

      options = options || {};
      relModel = rel.relatedModel;
      if (val instanceof relModel === true) {
        this.addToRelation(val, rel, false);
      } else if (_.isObject(val) && val instanceof Backbone.Model === false) {
        newModel = new relModel(val);
        this.addToRelation(newModel, rel, false);
      } else {
        storeIdentifier = relModel.prototype.storeIdentifier;
        if (existModel = Backbone.JJStore._byId(storeIdentifier, val)) {
          if (options.ignoreModel === existModel) {
            return;
          }
          this.addToRelation(existModel, rel, false);
        } else if (isManyType(rel)) {
          this.get(rel.key).addToIdQueue(val);
        } else if (isOneType(rel)) {
          this.setHasOneRelation(rel, val, true);
        }
      }
      return this;
    },
    /**
    		 * This function is triggered by a newly created model (@see Backbone.JJRelationalModel.constructor)
    		 * that has been registered in the store and COULD belong to a relation.
    		 * 
    		 * @param {Backbone.JJRelationalModel} model        The newly created model which triggered the event.
    */

    newModelInStore: function(model) {
      var id, idQueue, relColl, relation;

      id = model.id;
      if (id) {
        relation = this.getRelationByIdentifier(model.storeIdentifier);
        if (relation) {
          if (isOneType(relation)) {
            if (id === this.get(relation.key)) {
              this.addToRelation(model, relation, false);
            }
          } else if (isManyType(relation)) {
            relColl = this.get(relation.key);
            idQueue = relColl._relational.idQueue;
            if (_.indexOf(idQueue, id) > -1) {
              this.addToRelation(model, relation, false);
            }
          }
        }
      }
      return void 0;
    },
    /**
    		 * Adds a model to a relation.
    		 * 
    		 * @param {Backbone.JJRelationalModel} model         The model to add
    		 * @param {String | Object} relation                 Relation object or relationKey
    		 * @param {Boolean} silent                           Indicates whether to pass on the relation to the added model. (reverse set)
    		 * @return {Backbone.JJRelationalModel}
    */

    addToRelation: function(model, relation, silent) {
      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      if (relation && (model instanceof relation.relatedModel === true)) {
        if (isOneType(relation)) {
          if (this.get(relation.key) !== model) {
            this.setHasOneRelation(relation, model, silent);
          }
        } else if (isManyType(relation)) {
          this.get(relation.key).add(model, {
            silentRelation: silent
          });
        }
      }
      return this;
    },
    /**
    		 * Sets a value on a has_one relation.
    		 * 
    		 * @param {String | Object} relation                 Relation object or relationKey
    		 * @param {mixed} val                                The value to set
    		 * @param {Boolean} silentRelation                   Indicates whether to pass on the relation to the added model. (reverse set)
    */

    setHasOneRelation: function(relation, val, silentRelation) {
      var prev;

      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      prev = this.get(relation.key);
      this.attributes[relation.key] = val;
      if (silentRelation) {
        return;
      }
      if (prev instanceof relation.relatedModel === true) {
        prev.removeFromRelation(relation.reverseKey, this, true);
      }
      if (val instanceof relation.relatedModel === true) {
        val.addToRelation(this, relation.reverseKey, true);
      }
      return this;
    },
    /**
    		 * Removes a model from a relation
    		 * @param  {String | Object} relation                 Relation object or relationKey
    		 * @param  {Backbone.JJRelationalModel} model         The model to add
    		 * @param  {Boolean} silent                           Indicates whether to pass on the relation to the added model. (reverse set)
    		 * @return {Backbone.JJRelationalModel}
    */

    removeFromRelation: function(relation, model, silent) {
      var coll;

      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      if (relation) {
        if (isOneType(relation)) {
          this.setHasOneRelation(relation, null, silent);
        } else if (isManyType(relation)) {
          coll = this.get(relation.key);
          if (model instanceof relation.relatedModel === true) {
            coll.remove(model, {
              silentRelation: silent
            });
          } else {
            coll.removeFromIdQueue(model);
          }
        }
      }
      return this;
    },
    /**
    		 * Completely empties a relation.
    		 * 
    		 * @param  {Object} relation
    		 * @return {Backbone.JJRelationalModel}
    */

    _emptyRelation: function(relation) {
      var coll;

      if (isOneType(relation)) {
        this.setHasOneRelation(relation, null, false);
      } else if (isManyType(relation)) {
        coll = this.get(relation.key);
        coll._cleanup();
      }
      return this;
    },
    /**
    		 * Cleanup function that removes all listeners, empties relation and informs related models of removal
    		 * 
    		 * @return {Backbone.JJRelationalModel}
    */

    _destroyAllRelations: function() {
      var relModel, relation, _i, _len, _ref;

      Backbone.JJStore.__removeModelFromStore(this);
      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        this.unbind('destroy', this._destroyAllRelations);
        Backbone.JJStore.Events.unbind('created:' + relation.relatedModel.prototype.storeIdentifier, this.newModelInStore, this);
        if (isOneType(relation) && (relModel = this.get(relation.key))) {
          this.setHasOneRelation(relation, null, false);
        } else if (isManyType(relation)) {
          this.get(relation.key)._cleanup();
        }
      }
      return this;
    },
    /**
    		 * Helper function to get the length of the relational idQueue (for has_one: 0 || 1)
    		 * 
    		 * @param  {String | Object} relation                Relation object or relationKey
    		 * @return {Integer}                                 Length of idQueue
    */

    getIdQueueLength: function(relation) {
      var val;

      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      if (relation) {
        if (isOneType(relation)) {
          val = this.get(relation.key);
          if ((!val) || (val instanceof relation.relatedModel === true)) {
            return 0;
          } else {
            return 1;
          }
        } else if (isManyType(relation)) {
          return this.get(relation.key)._relational.idQueue.length;
        }
      }
      return 0;
    },
    /**
    		 * Clears the idQueue of a relation
    		 * 
    		 * @param  {String | Object} relation                 Relation object or relationKey
    		 * @return {Backbone.JJRelationalModel}
    */

    clearIdQueue: function(relation) {
      var coll, val;

      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      if (relation) {
        if (isOneType(relation)) {
          val = this.get(relation.key);
          if (val && (val instanceof relation.relatedModel === false)) {
            this.set(relation.key, null, {
              silentRelation: true
            });
          }
        } else if (isManyType(relation)) {
          coll = this.get(relation.key);
          coll._relational.idQueue = [];
        }
      }
      return this;
    },
    /**
    		 * Fetches missing related models, if their ids are known.
    		 * 
    		 * @param  {String | Object} relation                 Relation object or relationKey
    		 * @param  {Object} options                           Options object
    		 * @return {Backbone.$.ajax}
    */

    fetchByIdQueue: function(relation, options) {
      var id, relModel, success, url,
        _this = this;

      if (!_.isObject(relation)) {
        relation = this.getRelationByKey(relation);
      }
      if (relation) {
        if (isManyType(relation)) {
          this.get(relation.key).fetchByIdQueue(options);
        } else if (isOneType(relation)) {
          id = this.get(relation.key);
          if (id && (id instanceof relation.relatedModel === false)) {
            relModel = relation.relatedModel;
            if (options) {
              options = _.clone(options);
            } else {
              options = {};
            }
            url = getValue(relModel.prototype, 'url');
            url += Backbone.JJRelational.Config.url_id_appendix + id;
            options.url = url;
            if (options.parse === void 0) {
              options.parse = true;
            }
            success = options.success;
            options.success = function(resp, status, xhr) {
              var model;

              _this.setHasOneRelation(relation, null, true);
              options.ignoreModel = _this;
              model = new relModel(relModel.prototype.parse(resp[0]), options);
              _this.set(relation.key, model);
              if (success) {
                return success(model, resp);
              }
            };
            return this.sync.call(this, 'read', this, options);
          }
        }
      }
      return this;
    },
    /**
    		 * 
    		 * @begin Helper methods
    		 *
    */

    getRelationByKey: function(key) {
      var relation, _i, _len, _ref;

      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        if (relation.key === key) {
          return relation;
        }
      }
      return false;
    },
    getRelationByReverseKey: function(key) {
      var relation, _i, _len, _ref;

      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        if (relation.reverseKey === key) {
          return relation;
        }
      }
      return false;
    },
    getRelationByIdentifier: function(identifier) {
      var relation, _i, _len, _ref;

      _ref = this.relations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        if (relation.relatedModel.prototype.storeIdentifier === identifier) {
          return relation;
        }
      }
      return false;
    }
  });
  /**
  	 * Sums up "`fetchByIdQueue`"-calls on the same relation in a whole collection
  	 * by collecting the idQueues of each model and firing a single request.
  	 * The fetched models are just added to the store, so they will be added to the relation
  	 * via the Backbone.JJStore.Events listener
  	 * 
  	 * @param  {String} relationKey                       Key of the relation
  	 * @param  {Object} options                           Options object
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype.fetchByIdQueueOfModels = function(relationKey, options) {
    var idQueue, relModel, relation, success,
      _this = this;

    if (this.model && (this.model.prototype instanceof Backbone.JJRelationalModel === true)) {
      relation = this.model.prototype.getRelationByKey(relationKey);
      relModel = relation.relatedModel;
      idQueue = [];
      if (isOneType(relation)) {
        this.each(function(model) {
          var val;

          val = model.get(relationKey);
          if (val && val instanceof relModel === false) {
            return idQueue.push(val);
          }
        });
      } else if (isManyType(relation)) {
        this.each(function(model) {
          var coll;

          coll = model.get(relationKey);
          return idQueue = _.union(idQueue, coll._relational.idQueue);
        });
      }
      if (idQueue.length > 0) {
        options.url = getUrlForIdQueue(relModel.prototype, idQueue);
        if (options.parse === void 0) {
          options.parse = true;
        }
        success = options.success;
        options.success = function(resp, status, xhr) {
          var collType, parsedObj, parsedObjs, respObj, _i, _j, _len, _len1;

          parsedObjs = [];
          if (relation.collectionType && (collType = Backbone.JJRelational.__getCollectionType(relation.collectionType))) {
            parsedObjs = collType.prototype.parse(resp);
          } else if (_.isArray(resp)) {
            for (_i = 0, _len = resp.length; _i < _len; _i++) {
              respObj = resp[_i];
              if (_.isObject(respObj)) {
                parsedObjs.push(relModel.prototype.parse(respObj));
              }
            }
          }
          for (_j = 0, _len1 = parsedObjs.length; _j < _len1; _j++) {
            parsedObj = parsedObjs[_j];
            new relModel(parsedObj);
          }
          if (success) {
            return success(_this, resp);
          }
        };
        return this.sync.call(this, 'read', this, options);
      }
    }
    if (options.success) {
      options.success(this);
    }
    return this;
  };
  /**
  	 *
  	 * Backbone.Collection hacks
  	 *
  */

  Backbone.Collection.prototype.__add = Backbone.Collection.prototype.add;
  /**
  	 * This "`add`" hack checks if the collection belongs to the relation of a model.
  	 * If yes, handle the models accordingly.
  	 * 
  	 * @param {Array | Object | Backbone.Model} models         The models to add
  	 * @param {Object} options                                 Options object
  */

  Backbone.Collection.prototype.add = function(models, options) {
    var existModel, id, idsToAdd, idsToRemove, model, modelToAdd, modelsToAdd, _i, _j, _k, _len, _len1, _len2;

    if (!this._relational) {
      return this.__add(models, options);
    }
    if (this._relational) {
      options || (options = {});
      if (!_.isArray(models)) {
        models = [models];
      }
      modelsToAdd = [];
      idsToRemove = [];
      idsToAdd = [];
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        if (model instanceof Backbone.Model === false) {
          if (!_.isObject(model)) {
            if (existModel = Backbone.JJStore._byId(this.model.prototype.storeIdentifier, model)) {
              model = existModel;
            } else {
              idsToAdd.push(model);
              break;
            }
          } else {
            model = this._prepareModel(model, options);
          }
        }
        if (model instanceof this.model === false) {
          throw new TypeError('Invalid model to be added to collection with relation key "' + this._relational.ownerKey + '"');
        } else {
          modelsToAdd.push(model);
          if (model.id) {
            idsToRemove.push(model.id);
          }
        }
      }
      this.removeFromIdQueue(idsToRemove);
      for (_j = 0, _len1 = idsToAdd.length; _j < _len1; _j++) {
        id = idsToAdd[_j];
        this.addToIdQueue(id);
      }
      if (!options.silentRelation) {
        for (_k = 0, _len2 = modelsToAdd.length; _k < _len2; _k++) {
          modelToAdd = modelsToAdd[_k];
          modelToAdd.addToRelation(this._relational.owner, this._relational.reverseKey, true);
        }
      }
      options.silentRelation = false;
    }
    return this.__add(modelsToAdd, options);
  };
  /**
  	 * "`update`" has to be overridden,
  	 * because in case of merging, we need to pass `silentRelation: true` to the options.
  	 * 
  	 * @param  {Object | Array | Backbone.Model} models         The models to add
  	 * @param  {Object} options                                 Options object
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.update = function(models, options) {
    var add, existing, idAttr, merge, mergeOptions, model, modelMap, remove, _i, _j, _len, _len1, _ref;

    add = [];
    remove = [];
    merge = [];
    modelMap = {};
    idAttr = this.model.prototype.idAttribute;
    options = _.extend({
      add: true,
      merge: true,
      remove: true
    }, options);
    if (options.parse) {
      models = this.parse(models);
    }
    if (!_.isArray(models)) {
      models = models ? [models] : [];
    }
    for (_i = 0, _len = models.length; _i < _len; _i++) {
      model = models[_i];
      existing = this.get(model.id || model.cid || model[idAttr]);
      if (options.remove && existing) {
        modelMap[existing.cid] = true;
      }
      if (options.add && !existing) {
        add.push(model);
      }
      if (options.merge && existing) {
        merge.push(model);
      }
    }
    if (options.remove) {
      _ref = this.models;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        model = _ref[_j];
        if (!modelMap[model.cid]) {
          remove.push(model);
        }
      }
    }
    if (remove.length) {
      this.remove(remove, options);
    }
    options.merge = true;
    if (add.length) {
      this.add(add, options);
    }
    if (merge.length) {
      mergeOptions = _.extend({
        silentRelation: true
      }, options);
      this.add(merge, mergeOptions);
    }
    return this;
  };
  Backbone.Collection.prototype.__remove = Backbone.Collection.prototype.remove;
  /**
  	 * If this is a relational collection, the removal is passed on and the model is informed
  	 * of the removal.
  	 * 
  	 * @param  {Backbone.Model} models                          The model to remove
  	 * @param  {Object} options                                 Options object
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype.remove = function(models, options) {
    var _this = this;

    if (!this._relational) {
      return this.__remove(models, options);
    }
    options || (options = {});
    if (!_.isArray(models)) {
      models = [models];
    } else {
      models = models.slice(0);
    }
    _.each(models, function(model) {
      if (model instanceof Backbone.Model === true) {
        _this.__remove(model, options);
        if (!options.silentRelation) {
          return _this._relatedModelRemoved(model, options);
        }
      }
    });
    return this;
  };
  /**
  	 * Cleanup function for relational collections.
  	 * 
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype._cleanup = function() {
    this.remove(this.models, {
      silentRelation: false
    });
    this._relational.idQueue = [];
    return this;
  };
  /**
  	 * Informs the removed model of its removal from the collection, so that it can act accordingly.
  	 * 
  	 * @param  {Backbone.JJRelationalModel} model               The removed model
  	 * @param  {Object} options                                 Options object
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype._relatedModelRemoved = function(model, options) {
    var silent;

    if (options.silentRelation) {
      silent = false;
    } else {
      silent = true;
    }
    model.removeFromRelation(this._relational.reverseKey, this._relational.owner, silent);
    return this;
  };
  Backbone.Collection.prototype.__reset = Backbone.Collection.prototype.reset;
  /**
  	 * Cleans up a relational collection before resetting with the new ones.
  	 * 
  	 * @param  {Backbone.Model} models                          Models to reset with
  	 * @param  {Object} options                                 Options object
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype.reset = function(models, options) {
    if (this._relational) {
      this._cleanup();
    }
    this.__reset(models, options);
    return this;
  };
  Backbone.Collection.prototype.__fetch = Backbone.Collection.prototype.fetch;
  /**
  	 * The fetch function...normal fetch is performed, after which the parsed response is checked if there are
  	 * any models that already exist in the store (via id). If yes: the model will be updated, no matter what.
  	 * After that, "`update`" or "`reset`" method is chosen.
  	 * 
  	 * @param  {Object} options                                Options object
  	 * @return {Backbone.$.ajax}
  */

  Backbone.Collection.prototype.fetch = function(options) {
    var success,
      _this = this;

    options = options ? _.clone(options) : {};
    if (options.parse === void 0) {
      options.parse = true;
    }
    success = options.success;
    options.success = function(resp, status, xhr) {
      var args, existingModel, existingModels, id, idAttribute, method, models, parsedResp, respObj, storeIdentifier, _i, _len;

      idAttribute = _this.model.prototype.idAttribute;
      storeIdentifier = _this.model.prototype.storeIdentifier;
      parsedResp = _this.parse(resp);
      existingModels = [];
      args = [];
      args.push(parsedResp);
      for (_i = 0, _len = parsedResp.length; _i < _len; _i++) {
        respObj = parsedResp[_i];
        id = respObj[idAttribute];
        existingModel = Backbone.JJStore._byId(storeIdentifier, id);
        if (existingModel) {
          existingModel.set(respObj, options);
          existingModels.push(existingModel);
          args.push(respObj);
        }
      }
      parsedResp = _.without.apply(window, args);
      if (_this._relational) {
        options.ignoreModel = _this._relational.owner;
      }
      models = existingModels.concat(parsedResp);
      method = options.update ? 'update' : 'reset';
      if (options.update) {
        options.merge = false;
      }
      _this[method](models, options);
      if (success) {
        return success(_this, resp);
      }
    };
    return this.sync.call(this, 'read', this, options);
  };
  /**
  	 * If any ids are stored in the collection's idQueue, the missing models will be fetched.
  	 * 
  	 * @param  {Object} options                                   Options object
  	 * @return {Backbone.$.ajax}
  */

  Backbone.Collection.prototype.fetchByIdQueue = function(options) {
    var idQueue, success,
      _this = this;

    if (options) {
      options = _.clone(options);
    } else {
      options = {};
    }
    idQueue = this._relational.idQueue;
    if (idQueue.length > 0) {
      options.url = getUrlForIdQueue(this, idQueue);
      if (options.parse === void 0) {
        options.parse = true;
      }
      success = options.success;
      options.success = function(resp, status, xhr) {
        options.ignoreModel = _this._relational.owner;
        _this._relational.idQueue = [];
        _this.add(_this.parse(resp), options);
        if (success) {
          return success(_this, resp);
        }
      };
      return this.sync.call(this, 'read', this, options);
    }
    return this;
  };
  /**
  	 * Adds an id to the collection's idQueue
  	 * @param {mixed} id                                          The id to add
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype.addToIdQueue = function(id) {
    var queue;

    queue = this._relational.idQueue;
    queue.push(id);
    this._relational.idQueue = _.uniq(queue);
    return this;
  };
  /**
  	 * Removes ids from the collection's idQueue
  	 * @param  {mixed | Array} ids                                The (array of) id(s) to remove
  	 * @return {Backbone.Collection}
  */

  Backbone.Collection.prototype.removeFromIdQueue = function(ids) {
    var args;

    ids = _.isArray ? ids : [ids];
    args = [this._relational.idQueue].concat(ids);
    this._relational.idQueue = _.without.apply(window, args);
    return this;
  };
  /**
  	 * Returns an array of the collection's models' ids + idQueue
  	 * @return {Array}
  */

  Backbone.Collection.prototype.getIDArray = function() {
    var ids;

    ids = [];
    this.each(function(model) {
      if (model.id) {
        return ids.push(model.id);
      }
    });
    return _.union(ids, this._relational.idQueue);
  };
  /**
  	 * Returns an array of an attribute of all models.
  	 * @param  {String} attr                                     The attribute's name
  	 * @return {Array}
  */

  Backbone.Collection.prototype.getArrayForAttribute = function(attr) {
    var atts;

    if (attr === this.model.prototype.idAttribute) {
      return this.getIDArray();
    }
    atts = [];
    this.each(function(model) {
      return atts.push(model.get(attr));
    });
    return atts;
  };
  /**
  	 * Helper method that flattens relational collections within in an object to an array of models + idQueue.
  	 * @param  {Object} obj                                      The object to flatten
  	 * @return {Object}
  */

  flatten = function(obj) {
    var key, value;

    for (key in obj) {
      value = obj[key];
      if ((value instanceof Backbone.Collection) && value._relational) {
        obj[key] = value.models.concat(value._relational.idQueue);
      }
    }
    return obj;
  };
  /**
  	 * Helper method to get a value from an object. (functions will be called)
  	 * @param  {Object} object
  	 * @param  {String} prop
  	 * @return {mixed}
  */

  getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    if (_.isFunction(object[prop])) {
      return object[prop]();
    } else {
      return object[prop];
    }
  };
  /**
  	 * Helper method to get the url for a model (this is comparable to Backbone.Model.url)
  	 * @param  {Backbone.Model} model
  	 * @param  {mixed} id    (optional)
  	 * @return {String}
  */

  getUrlForModelWithId = function(model, id) {
    var base;

    base = getValue(model, 'urlRoot') || getValue(model.collection, 'url') || urlError();
    return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(id ? id : model.id);
  };
  /**
  	 * Helper method to get a formatted url based on an object and idQueue.
  	 * @param  {Backbone.Model} obj
  	 * @param  {Array} idQueue
  	 * @return {String}
  */

  getUrlForIdQueue = function(obj, idQueue) {
    var url;

    url = getValue(obj, 'url');
    if (!url) {
      urlError();
      return false;
    } else {
      url += Backbone.JJRelational.Config.url_id_appendix + idQueue.join(',');
      return url;
      /**
        	 * Throw an error, when a URL is needed, but none is supplied.
        	 * @return {Error}
      */

    }
  };
  urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };
  isOneType = function(relation) {
    if (relation.type === 'has_one') {
      return true;
    } else {
      return false;
    }
  };
  isManyType = function(relation) {
    if (relation.type === 'has_many' || relation.type === 'many_many') {
      return true;
    } else {
      return false;
    }
  };
  return this;
})();

define("plugins/backbone.JJRelational", function(){});

// Generated by CoffeeScript 1.6.2
/*
	Represents the JJRestApi for global Settings, Events, Models and Collections
	
	Example: Accessible in every module via
	
		define[
			'modules/JJRestApi'
		], (JJRestApi) ->
*/

var JJRestApi;

JJRestApi = {
  url: '/api/v2/',
  extension: 'json',
  structurID: 'api-structure'
};

JJRestApi.Models = {};

JJRestApi.Collections = {};

JJRestApi.Modules = {};

JJRestApi.Modules._modules = [];

JJRestApi.Events = _.extend({}, Backbone.Events);

/* 
 #	Prototype getter
 #
 #	@param string className
 #	@return Backbone.RelationalModel based on className
*/


JJRestApi.Model = function(className) {
  if (this.Models[className]) {
    return this.Models[className];
  } else {
    return false;
  }
};

/*
 #	Collection getter
 #
 #	@param string className
 #	@return Backbone.Collection based on className
*/


JJRestApi.Collection = function(className) {
  if (this.Collections[className]) {
    return this.Collections[className];
  } else {
    return false;
  }
};

/*
 #	Register Modules and extend them after bootstrapping the app structure
 #
 #	@param Object module
 #	@param function extensions in a callback
*/


JJRestApi.Modules.extend = function(module, extension) {
  JJRestApi.Modules._modules.push({
    module: module,
    extension: extension
  });
  return true;
};

JJRestApi.extendModel = function(className, modelToExtendFrom, extension) {
  var model;

  model = this.Model(className);
  if (modelToExtendFrom.prototype instanceof Backbone.Model === false) {
    extension = modelToExtendFrom;
    modelToExtendFrom = model;
  }
  extension || (extension = {});
  if (model) {
    return this.Models[className] = modelToExtendFrom.extend(extension);
  }
};

JJRestApi.extendCollection = function(className, collTypeToExtendFrom, extension) {
  var collType;

  collType = this.Collection(className);
  if (collTypeToExtendFrom instanceof Backbone.Collection === false) {
    extension = collTypeToExtendFrom;
    collTypeToExtendFrom = collType;
  }
  extension || (extension = {});
  if (collType) {
    return this.Collections[className] = collTypeToExtendFrom.extend(extension);
  }
};

JJRestApi.setObjectUrl = function(className, options) {
  options = options || {};
  return this.url + className + (options.id ? '/' + options.id : '') + '.' + this.extension;
};

/**
 *
 * Gets the security token passed by SilverStripe and adds it to every ajax request
 *
*/


JJRestApi.hookSecurityToken = function() {
  return JJRestApi.getFromDomOrApi('SecurityID', {
    noAjax: true
  }).done(function(data) {
    if (data.SecurityID) {
      return $(document).bind('ajaxSend', function(event, xhr, settings) {
        return xhr.setRequestHeader(data.RequestHeader, data.SecurityID);
      });
    }
  });
};

/**
 * Loads an Object from the DOM via #api-object or /api/v2/Object.extension
 * @param  {String} name    name to get/fetch (e.g. ClassName)
 * @param  {Object} options 
 * @return deferred promise object
*/


JJRestApi.getFromDomOrApi = function(name, options) {
  var $obj, data, dfd, nameToSearch, url;

  options = options || {};
  nameToSearch = options.name ? options.name : name.toLowerCase();
  /**
  	 * @todo get the API-prefix from DOM and pass it on from SilverStripe
  */

  $obj = $('#api-' + nameToSearch);
  if ($obj.length) {
    data = $.trim($obj.html());
    if ($obj.attr('type') === 'application/json') {
      data = data ? $.parseJSON(data) : null;
    }
    dfd = new $.Deferred();
    dfd.resolve(data);
    return dfd.promise();
  } else if (!options.noAjax) {
    url = options.url ? options.url : JJRestApi.setObjectUrl(name, options);
    if (options.urlSuffix) {
      url += options.urlSuffix;
    }
    dfd = $.getJSON(url);
    JJRestApi.Events.trigger('dfdAjax', dfd);
    return dfd;
  } else {
    return $.Deferred().resolve(null);
  }
};

/**
 *
 * Converts an object with search and context to URL String, e.g. 's=Foo:bar&context=view.foobar'
 *
*/


JJRestApi.objToUrlString = function(obj) {
  var k, key, l, returnString, searchString, v, value;

  returnString = '';
  for (key in obj) {
    value = obj[key];
    if (key === ('search' || 's')) {
      searchString = 's=';
      for (k in value) {
        v = value[k];
        searchString += encodeURIComponent(k) + ':';
        searchString += _.isArray(v) ? encodeURIComponent(v.join('|')) : encodeURIComponent(v);
        searchString += ';';
      }
      returnString += searchString;
    } else {
      returnString += encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
    returnString += '&';
  }
  l = returnString.length;
  if (returnString.lastIndexOf('&') === (l - 1)) {
    returnString = returnString.substr(0, l - 1);
  }
  return returnString;
};

/*
 #	The Bootstrapper rebuilds the JJ_RestfulServer/Structure response as backbone-relational structure
 #
 #	@param callback function
 #	@return false
*/


JJRestApi.bootstrapWithStructure = function(callback) {
  var dfd;

  dfd = JJRestApi.getFromDomOrApi('Structure');
  dfd.done(function(data) {
    return JJRestApi.Bootstrap(data);
  });
  dfd.fail(function() {
    throw new Error('Structure could not be loaded.');
  });
  return dfd;
};

JJRestApi.Bootstrap = function(response) {
  data;
  config;
  var buildPrototype, className, collRegisterObj, collectionsToRegister, config, data, getRelationObj, getRelationType, isMany, module, name, relations, _i, _j, _len, _len1, _ref, _ref1,
    _this = this;

  collectionsToRegister = [];
  getRelationType = function(type) {
    relType;
    var relType;

    switch (type) {
      case 'belongs_to':
        relType = 'has_one';
        break;
      case 'has_one':
        relType = 'has_one';
        break;
      case 'has_many':
        relType = 'has_many';
        break;
      case 'many_many':
        relType = 'many_many';
        break;
      case 'belongs_many_many':
        relType = 'many_many';
    }
    return relType;
  };
  getRelationObj = function(className, relation) {
    var relType, relationObj;

    relType = getRelationType(relation.Type);
    relationObj = {
      type: relType,
      relatedModel: function() {
        return JJRestApi.Model(relation.ClassName);
      },
      key: relation.Key,
      reverseKey: relation.ReverseKey,
      includeInJSON: ['id']
    };
    if (relType !== 'has_one') {
      relationObj.collectionType = relation.ClassName;
      collectionsToRegister.push(relation.ClassName);
    }
    return relationObj;
  };
  isMany = function(type) {
    if (type = 'has_many' || 'many_many') {
      return true;
    } else {
      return false;
    }
  };
  buildPrototype = function(className, relations, config) {
    var field, i, index, modelOptions, relObj, relation, rels, _ref;

    modelOptions = {
      defaults: {}
    };
    rels = [];
    for (i in relations) {
      relation = relations[i];
      if (relObj = getRelationObj(className, relation)) {
        rels.push(relObj);
      }
    }
    if (rels.length) {
      modelOptions.relations = rels;
    }
    modelOptions.storeIdentifier = className;
    modelOptions.url = function() {
      if (this.id) {
        return JJRestApi.url + this.storeIdentifier + '/' + this.id + '.' + JJRestApi.extension;
      } else {
        return this.urlRoot;
      }
    };
    modelOptions.urlRoot = _this.setObjectUrl(className);
    modelOptions.idAttribute = 'ID';
    if (config && config.DefaultFields) {
      _ref = config.DefaultFields;
      for (index in _ref) {
        field = _ref[index];
        modelOptions.defaults[field] = null;
      }
    }
    _this.Models[className] = _this.Model(className).extend(modelOptions);
    return true;
  };
  config = response.Config || false;
  data = response.Config ? response.Objs : response;
  if (!data) {
    return;
  }
  for (className in data) {
    relations = data[className];
    this.Models[className] = Backbone.JJRelationalModel.extend({});
    this.Collections[className] = Backbone.Collection.extend({
      url: this.setObjectUrl(className),
      comparator: function(model) {
        return model.id;
      },
      parse: function(response) {
        return response;
      }
    });
  }
  _ref = JJRestApi.Modules._modules;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    module = _ref[_i];
    module.extension.call(window, module.module);
  }
  for (className in data) {
    relations = data[className];
    buildPrototype(className, relations, config);
    this.Collections[className] = this.Collection(className).extend({
      model: this.Model(className)
    });
  }
  collRegisterObj = {};
  _ref1 = _.uniq(collectionsToRegister);
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    name = _ref1[_j];
    collRegisterObj[name] = this.Collection(name);
  }
  Backbone.JJRelational.registerCollectionTypes(collRegisterObj);
  return false;
};

JJRestApi;

define("plugins/backbone.JJRestApi", function(){});

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
window.matchMedia=window.matchMedia||(function(e,f){var c,a=e.documentElement,b=a.firstElementChild||a.firstChild,d=e.createElement("body"),g=e.createElement("div");g.id="mq-test-1";g.style.cssText="position:absolute;top:-100em";d.appendChild(g);return function(h){g.innerHTML='&shy;<style media="'+h+'"> #mq-test-1 { width: 42px; }</style>';a.insertBefore(d,b);c=g.offsetWidth==42;a.removeChild(d);return{matches:c,media:h}}})(document);
define("responsiveimage/external/matchmedia", function(){});

/*! Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with divs). Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */

(function( w ){

	// Enable strict mode
	

	w.picturefill_opts = {
		wrapperTag: 'span',
		imageTag: 'span'
	};

	w.picturefill = function(options) {
		options = options || w.picturefill_opts;

		var ps = w.document.getElementsByTagName( options.wrapperTag );

		// Loop the pictures
		for( var i = 0, il = ps.length; i < il; i++ ){
			if( ps[ i ].getAttribute( "data-picture" ) !== null ){

				var sources = ps[ i ].getElementsByTagName( options.imageTag ),
					matches = [],
					width = ps[ i ].offsetWidth;

				// See if which sources match
				for( var j = 0, jl = sources.length; j < jl; j++ ){
					var media = sources[ j ].getAttribute( "data-media" ),
						ratio = ps[ j ].getAttribute( "data-ratio" );

					// if there's no media specified, OR w.matchMedia is supported 
					if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){

						matches.push( sources[ j ] );

						/*if (!ratio) {
							ratios.push(0);
						}
						else {
							ratios.push(width / ratio);
						}*/
					}
				}

				// Find any existing img element in the picture element
				var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ],
					img;

				if( matches.length ){
					if( !picImg ){
						picImg = w.document.createElement( "img" );
						picImg.alt = ps[ i ].getAttribute( "data-alt" );

						ps[ i ].appendChild( picImg );
					}

					img = matches.pop();

					picImg.src = img.getAttribute( "data-src");
					picImg.height = width / parseFloat(img.getAttribute('data-ratio'), 10);
				}
				else if( picImg ){
					ps[ i ].removeChild( picImg );
				}
			}
		}
	};

	// Run on resize and domready (w.load as a fallback)
	if( w.addEventListener ){
		w.addEventListener( "resize", w.picturefill, false );
		w.addEventListener( "DOMContentLoaded", function(){
			w.picturefill();
			// Run once only
			w.removeEventListener( "load", w.picturefill, false );
		}, false );
		w.addEventListener( "load", w.picturefill, false );
	}
	else if( w.attachEvent ){
		w.attachEvent( "onload", w.picturefill );
	}

}( this ));
define("responsiveimage/picturefill", function(){});

// Generated by CoffeeScript 1.6.2
define('app',['jquery', 'underscore', 'backbone', 'handlebars', 'plugins/backbone.layoutmanager', 'plugins/backbone.JJRelational', 'plugins/backbone.JJRestApi', 'responsiveimage/picturefill'], function($, _, Backbone, Handlebars) {
  var JST, app;

  app = {
    root: '/',
    pendingTemplateReqs: {}
  };
  JST = window.JST = window.JST || {};
  Backbone.NMLayout = Backbone.Layout.extend({
    setViewAndRenderMaybe: function(selector, view) {
      this.setView(selector, view);
      if (this.__manager__.hasRendered) {
        return view.render();
      }
    },
    insertViewAndRenderMaybe: function(selector, view) {
      this.insertView(selector, view);
      if (this.__manager__.hasRendered) {
        return view.render();
      }
    }
  });
  Backbone.Layout.configure({
    manage: true,
    prefix: 'app/app/templates/',
    pendingAjaxRequests: {},
    fetch: function(path) {
      var dfd, done, replacedPath;

      done = void 0;
      replacedPath = path.replace(Backbone.Layout.prototype.options.prefix, '');
      if (replacedPath.indexOf('/') === 0) {
        path = replacedPath.substring(1);
      } else {
        path = path + '.html';
      }
      if (!JST[path]) {
        done = this.async();
        if (dfd = app.pendingTemplateReqs[path]) {
          dfd.then(function() {
            return done(JST[path]);
          });
        } else {
          dfd = $.ajax({
            url: app.root + path
          });
          app.pendingTemplateReqs[path] = dfd;
          dfd.then(function(contents) {
            JST[path] = Handlebars.compile(contents);
            JST[path].__compiled__ = true;
            delete app.pendingTemplateReqs[path];
            return done(JST[path]);
          });
        }
        return dfd;
      }
      if (!JST[path].__compiled__) {
        JST[path] = Handlebars.template(JST[path]);
        JST[path].__compiled__ = true;
      }
      return JST[path];
    }
  });
  return _.extend(app, {
    module: function(additionalProps) {
      return _.extend({
        Views: {}
      }, additionalProps);
    },
    useLayout: function(name, options) {
      var $body, currentLayout, customClass, l, layout;

      options = options || {};
      customClass = options.customClass ? options.customClass : name;
      if (this.layout && this.layout.getAllOptions().template === 'layouts/' + name) {
        l = this.layout;
        if (l.customClass) {
          l.$el.removeClass(l.customClass);
        }
        if (customClass) {
          l.customClass = customClass;
          l.$el.addClass(customClass);
        }
        return this.layout;
      }
      if (this.layout) {
        this.layout.remove();
      }
      layout = new Backbone.NMLayout(_.extend({
        template: 'layouts/' + name,
        className: 'layout ' + customClass,
        id: 'layout'
      }, options));
      $('#main').empty().append(layout.el);
      $(layout.el).css('height', '100%');
      currentLayout = this.currentLayoutName;
      $body = $('body');
      if (currentLayout) {
        $body.removeClass(currentLayout);
      }
      $body.addClass(name);
      this.currentLayoutName = name;
      layout.render();
      this.layout = layout;
      return layout;
    }
  }, Backbone.Events);
});

// Generated by CoffeeScript 1.6.2
define('modules/ProjectSearch',['app'], function(app) {
  var ProjectSearch,
    _this = this;

  ProjectSearch = {
    fields: {
      'Title': 'partial',
      'Space': 'partial',
      'Location': 'partial',
      'Text': function(obj, valArray) {
        return ProjectSearch.test(obj, 'TeaserText', valArray, 'partial');
      },
      'Type': function(obj, valArray) {
        return ProjectSearch.test(obj, 'ClassName', valArray, 'partial');
      },
      'Category': function(obj, valArray) {
        var result;

        if (obj.Categories && obj.Categories.length) {
          result = true;
          _.each(valArray, function(val) {
            var out;

            out = false;
            _.each(obj.Categories, function(cat) {
              if (ProjectSearch.exactMatchFilter(cat, 'Title', val)) {
                return out = true;
              }
            });
            if (!out) {
              return result = false;
            }
          });
          return result;
        }
        return false;
      },
      'Person': function(obj, valArray) {
        var result;

        if (obj.Persons && obj.Persons.length) {
          result = true;
          _.each(ProjectSearch.partializeArray(valArray), function(val) {
            var out;

            out = false;
            _.each(obj.Persons, function(person) {
              var fullName;

              fullName = (person.FirstName ? person.FirstName + ' ' : '') + (person.Surname ? person.Surname : '');
              if (fullName.indexOf(val) >= 0) {
                return out = true;
              }
            });
            if (!out) {
              return result = false;
            }
          });
          return result;
        }
        return false;
      }
    },
    /**
    			 * transforms a string into an object with the searchable field as key and the possible OR values as array
    			 * @param  {String} term
    			 * @return {Object}
    */

    transformSearchTerm: function(term) {
      var els, out, segment, vals, _i, _len, _ref;

      out = {};
      term = decodeURI(term);
      _ref = term.split(';');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        segment = _ref[_i];
        els = segment.split(':');
        vals = null;
        if (els.length > 1) {
          vals = els[1].split('|');
        }
        out[els[0]] = vals;
      }
      return out;
    },
    makeSearchTerm: function(obj) {
      var a, a2, key, v, val, _i, _len;

      a = [];
      for (key in obj) {
        val = obj[key];
        a2 = [];
        if (!_.isArray(val)) {
          val = [val];
        }
        for (_i = 0, _len = val.length; _i < _len; _i++) {
          v = val[_i];
          if (v) {
            a2.push(v);
          }
        }
        if (a2.length) {
          a.push("" + key + ":" + (a2.join('|')));
        }
      }
      return encodeURI(a.join(';'));
    },
    partializeArray: function(valArray) {
      var out, val, _i, _len;

      out = [];
      for (_i = 0, _len = valArray.length; _i < _len; _i++) {
        val = valArray[_i];
        out = out.concat(val.split(' '));
      }
      return out;
    },
    test: function(obj, key, valArray, forceMethod) {
      var method, result, type, val, _i, _len;

      result = true;
      if (!_.isArray(valArray)) {
        valArray = [valArray];
      }
      type = forceMethod || this.fields[key];
      if (type) {
        if (_.isFunction(type)) {
          result = type.call(this, obj, valArray);
        } else {
          if (type === 'exact') {
            method = 'exactMatchFilter';
          } else {
            method = 'partialMatchFilter';
            valArray = this.partializeArray(valArray);
          }
          for (_i = 0, _len = valArray.length; _i < _len; _i++) {
            val = valArray[_i];
            if (!this[method](obj, key, val)) {
              return false;
            }
          }
        }
      }
      return result;
    },
    partialMatchFilter: function(obj, key, val) {
      var against;

      if (!obj.hasOwnProperty(key)) {
        return false;
      }
      against = obj[key].toLowerCase();
      if (against.indexOf(val.toLowerCase()) >= 0) {
        return true;
      }
      return false;
    },
    exactMatchFilter: function(obj, key, val) {
      if (!obj.hasOwnProperty(key)) {
        return false;
      }
      if (val.toLowerCase() === obj[key].toLowerCase()) {
        return true;
      }
      return false;
    }
  };
  ProjectSearch.getVisualSearchMatches = function() {
    var matches, persons, used, wholePortfolio, year, years, _i, _len;

    wholePortfolio = app.wholePortfolioJSON();
    matches = {
      Title: [],
      Space: [],
      Location: [],
      Person: [],
      Year: [],
      Type: ['Project', 'Exhibition', 'Excursion', 'Workshop']
    };
    years = [];
    persons = [];
    used = [];
    _.each(wholePortfolio, function(m) {
      var d;

      if (m.Title) {
        matches.Title.push(m.Title);
      }
      if (m.Space) {
        matches.Space.push(m.Space);
      }
      if (m.Location) {
        matches.Location.push(m.Location);
      }
      if (m.YearSearch) {
        d = parseInt(m.YearSearch);
      }
      if (d) {
        years.push(d);
      }
      return _.each(m.Persons, function(person) {
        var fullname;

        if (person.FirstName && person.Surname) {
          fullname = "" + person.Surname + ", " + person.FirstName;
          if (_.indexOf(used, fullname) < 0) {
            persons.push({
              label: fullname,
              value: "" + person.FirstName + " " + person.Surname
            });
            return used.push(fullname);
          }
        }
      });
    });
    matches.Person = _.sortBy(persons, function(p) {
      return p.label;
    });
    years = _.sortBy(_.uniq(years), function(y) {
      return y * -1;
    });
    for (_i = 0, _len = years.length; _i < _len; _i++) {
      year = years[_i];
      matches.Year.push(year.toString());
    }
    return matches;
  };
  ProjectSearch.View = Backbone.View.extend({
    template: 'searchbar',
    id: 'searchbar',
    search: {
      'Category': []
    },
    events: {
      'click .category-filter a': 'updateCategorySearch'
    },
    initialize: function(opts) {
      if (opts.searchTerm) {
        this.search = ProjectSearch.transformSearchTerm(opts.searchTerm);
      }
      if (!this.search.Category) {
        return this.search.Category = [];
      }
    },
    doSearch: function() {
      var directTo, searchTerm;

      console.group('searching for');
      console.log(this.search);
      searchTerm = ProjectSearch.makeSearchTerm(this.search);
      console.log(searchTerm);
      console.groupEnd();
      directTo = searchTerm ? "/portfolio/search/" + searchTerm + "/" : '/portfolio/';
      return Backbone.history.navigate(directTo, true);
    },
    updateCategorySearch: function(e) {
      var $a, i, meth, title;

      e.preventDefault();
      $a = $(e.target);
      $a.blur();
      title = $a.data('title');
      i = _.indexOf(this.search.Category, title);
      if (i < 0) {
        this.search.Category.push(title);
        meth = 'addClass';
      } else {
        this.search.Category.splice(i, 1);
        meth = 'removeClass';
      }
      $a[meth]('active');
      this.doSearch();
      return false;
    },
    initVisualSearch: function() {
      var $visSearch, autoMatches,
        _this = this;

      $visSearch = this.$el.find('.visualsearch');
      autoMatches = ProjectSearch.VisualSearchMatches = ProjectSearch.VisualSearchMatches || ProjectSearch.getVisualSearchMatches();
      this.visualSearch = VS.init({
        container: $visSearch,
        remainder: 'Text',
        callbacks: {
          search: function(query, searchCollection) {
            _this.search = {
              Category: _this.search.Category
            };
            searchCollection.each(function(facet) {
              var cat;

              cat = facet.get('category');
              if (!_this.search[cat]) {
                _this.search[cat] = [];
              }
              return _this.search[cat].push(facet.get('value'));
            });
            console.log(_this.search);
            return _this.doSearch();
          },
          facetMatches: function(callback) {
            return callback(['Type', 'Person', 'Title', 'Year', 'Space', 'Location']);
          },
          valueMatches: function(facet, searchTerm, callback) {
            switch (facet) {
              case 'Person':
                return callback(autoMatches.Person);
              case 'Title':
                return callback(autoMatches.Title);
              case 'Year':
                return callback(autoMatches.Year);
              case 'Space':
                return callback(autoMatches.Space);
              case 'Location':
                return callback(autoMatches.Location);
              case 'Type':
                return callback(autoMatches.Type);
            }
          }
        }
      });
      this.prePopulateSearchBox();
      console.log('Project search view: %o', this.search);
      return console.log(this.visualSearch);
    },
    prePopulateSearchBox: function() {
      var key, query, v, val, _i, _len, _ref;

      query = '';
      _ref = this.search;
      for (key in _ref) {
        val = _ref[key];
        if (key !== 'Category') {
          for (_i = 0, _len = val.length; _i < _len; _i++) {
            v = val[_i];
            query += "\"" + key + "\": \"" + v + "\" ";
          }
        }
      }
      return this.visualSearch.searchBox.value(query);
    },
    updateCategoryClasses: function() {
      _this = this;
      return this.$el.find('.category-filter a').each(function() {
        var $this, cat, title, _i, _len, _ref, _results;

        $this = $(this);
        title = $this.data('title').toLowerCase();
        _ref = _this.search.Category;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cat = _ref[_i];
          if (cat.toLowerCase() === title) {
            _results.push($this.addClass('active'));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    },
    afterRender: function() {
      this.updateCategoryClasses();
      return this.initVisualSearch();
    },
    serialize: function() {
      var json;

      json = {};
      json.Categories = _.map(app.Collections.Category.models, function(cat) {
        return {
          ID: cat.id,
          Title: cat.get('Title')
        };
      });
      return json;
    }
  });
  return ProjectSearch;
});

// Generated by CoffeeScript 1.6.2
define('modules/DataRetrieval',['app', 'modules/ProjectSearch'], function(app, ProjectSearch) {
  var DataRetrieval;

  DataRetrieval = {
    forProjectsOverview: function(configObj) {
      var dfds, present, projectType, projectTypes, returnDfd, _fn, _i, _len;

      present = configObj.present;
      projectTypes = app.Config.ProjectTypes;
      returnDfd = new $.Deferred();
      if (!present.flag) {
        dfds = [];
        _fn = function(projectType) {
          var options;

          options = {
            name: configObj.domName(projectType),
            urlSuffix: configObj.urlSuffix
          };
          return dfds.push(JJRestApi.getFromDomOrApi(projectType, options).done(function(data) {
            return app.handleFetchedModels(projectType, data);
          }));
        };
        for (_i = 0, _len = projectTypes.length; _i < _len; _i++) {
          projectType = projectTypes[_i];
          _fn(projectType);
        }
        $.when.apply(this, dfds).done(function() {
          present.flag = true;
          return returnDfd.resolve();
        });
      } else {
        returnDfd.resolve();
      }
      return returnDfd.promise();
    },
    filterProjectTypesBySearchTerm: function(searchTerm) {
      var out, result, searchObj, wholePortfolio;

      wholePortfolio = app.Cache.WholePortfolio;
      searchObj = ProjectSearch.transformSearchTerm(searchTerm);
      console.log('Search obj found by data retrieval: %o', searchObj);
      result = _.filter(app.wholePortfolioJSON(), function(model) {
        result = true;
        _.each(searchObj, function(vals, key) {
          if (!ProjectSearch.test(model, key, vals)) {
            return result = false;
          }
        });
        return result;
      });
      out = _.map(result, function(model) {
        return (function(model) {
          return _.find(wholePortfolio, function(m) {
            return m.id === model.ID && m.get('ClassName') === model.ClassName;
          });
        })(model);
      });
      return out;
    },
    forCalendar: function(type) {
      var config, dfd, options;

      config = app.Config.Calendar[type];
      dfd = new $.Deferred();
      if (!config.flag) {
        options = _.clone(config);
        options.name = type + '-calendar';
        JJRestApi.getFromDomOrApi('CalendarEntry', options).done(function(data) {
          var item, _i, _len;

          if (data) {
            if (type === 'upcoming') {
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                item = data[_i];
                item.IsUpcoming = true;
              }
            }
            app.handleFetchedModels('CalendarEntry', data);
            config.flag = true;
            if (type === 'whole') {
              app.Config.Calendar.upcoming.flag = true;
            }
          }
          return dfd.resolve();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    forCategories: function() {
      var dfd;

      dfd = new $.Deferred();
      if (app.CategoriesFetched) {
        dfd.resolve();
      } else {
        JJRestApi.getFromDomOrApi('Category').done(function(data) {
          if (data && _.isArray(data)) {
            app.handleFetchedModels('Category', data);
            app.CategoriesFetched = true;
          }
          return dfd.resolve();
        });
      }
      return dfd.promise();
    },
    forPersonsOverview: function() {
      var config, dfd, options;

      config = app.Config.Person;
      dfd = new $.Deferred();
      if (!config.about_present) {
        options = _.clone(config);
        JJRestApi.getFromDomOrApi('Person', options).done(function(data) {
          config.about_present = true;
          app.handleFetchedModels('Person', data);
          return dfd.resolve();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    forDetailedObject: function(classType, slug, checkForLoggedIn) {
      var coll, configObj, dfd, existModel, fromDomOrApi, options, resolve, whereStatement,
        _this = this;

      configObj = app.Config.Detail[classType];
      options = {
        name: configObj.domName,
        urlSuffix: configObj.urlSuffix(slug)
      };
      fromDomOrApi = function() {
        var seed;

        seed = new $.Deferred();
        JJRestApi.getFromDomOrApi(classType, options).done(function(data) {
          var model;

          if (!data) {
            seed.resolve(null);
          }
          data = _.isArray(data) ? data : [data];
          model = data.length === 1 ? app.handleFetchedModel(classType, data[0]) : null;
          if (model) {
            model._isCompletelyFetched = true;
            if (app.CurrentMember) {
              model._isFetchedWhenLoggedIn = true;
            }
          }
          return seed.resolve(model);
        });
        return seed.promise();
      };
      dfd = new $.Deferred();
      coll = app.Collections[classType];
      whereStatement = configObj.where(slug);
      existModel = coll.findWhere(whereStatement);
      if (existModel) {
        if (existModel._isCompletelyFetched) {
          resolve = true;
        }
        if (checkForLoggedIn && !existModel._isFetchedWhenLoggedIn) {
          resolve = false;
        }
        if (resolve) {
          dfd.resolve(existModel);
        } else {
          options.noAjax = true;
          fromDomOrApi().done(function(model) {
            if (model && model.cid === existModel.cid) {
              return dfd.resolve(model);
            } else {
              return _this.fetchExistingModelCompletely(existModel).done(function(existModel) {
                return dfd.resolve(existModel);
              });
            }
          });
        }
      } else {
        fromDomOrApi().done(function(model) {
          return dfd.resolve(model);
        });
      }
      return dfd.promise();
    },
    forRandomGroupImage: function() {
      var dfd, getRandom, pageInfos;

      pageInfos = app.PageInfos;
      dfd = new $.Deferred();
      getRandom = function() {
        var groupImages;

        groupImages = pageInfos.GroupImages;
        if (groupImages && groupImages.length > 0) {
          return groupImages[Math.floor(Math.random() * groupImages.length)];
        }
        return null;
      };
      if (!pageInfos.GroupImages) {
        JJRestApi.getFromDomOrApi('GroupImage').done(function(data) {
          pageInfos.GroupImages = data;
          return dfd.resolve(getRandom());
        });
      } else {
        dfd.resolve(getRandom());
      }
      return dfd.promise();
    },
    forUserGallery: function(type) {
      var dfd, req, userGallery;

      userGallery = app.Cache.UserGallery;
      dfd = new $.Deferred();
      if (userGallery.fetched[type]) {
        dfd.resolve(userGallery);
      } else {
        req = $.getJSON(app.Config.GalleryUrl + type + '/').done(function(data) {
          userGallery.images[type] = data;
          userGallery.fetched[type] = true;
          return dfd.resolve(userGallery);
        });
        dfd.fail(function() {
          if (req.readyState !== 4) {
            return req.abort();
          }
        });
      }
      return dfd;
    },
    forDocImage: function(id) {
      var dfd, existModel;

      dfd = new $.Deferred();
      if (existModel = app.Collections.DocImage.get(id)) {
        dfd.resolve(existModel);
      } else {
        JJRestApi.getFromDomOrApi('DocImage', {
          id: id
        }).done(function(model) {
          if (model) {
            return dfd.resolve(app.handleFetchedModel('DocImage', model));
          } else {
            return dfd.reject();
          }
        });
      }
      return dfd.promise();
    },
    forMultipleDocImages: function(ids) {
      var dfd, doHave, needed, url;

      dfd = new $.Deferred();
      needed = [];
      doHave = [];
      _.each(ids, function(id) {
        var existModel;

        if (existModel = app.Collections.DocImage.get(id)) {
          return doHave.push(existModel);
        } else {
          return needed.push(id);
        }
      });
      if (!needed.length) {
        dfd.resolve(doHave);
        return dfd;
      }
      url = JJRestApi.setObjectUrl('DocImage') + Backbone.JJRelational.Config.url_id_appendix + needed.join(',');
      if (this._docImagesReq && this._docImagesReq.readyState !== 4) {
        this._docImagesReq.abort();
      }
      this._docImagesReq = $.getJSON(url, function(data) {
        if ($.isArray(data)) {
          doHave = doHave.concat(app.handleFetchedModels('DocImage', data));
        }
        return dfd.resolve(doHave);
      });
      return dfd;
    },
    fetchExistingModelCompletely: function(existModel) {
      var dfd;

      dfd = new $.Deferred();
      existModel.fetch({
        success: function(model) {
          dfd.resolve(model);
          model._isCompletelyFetched = true;
          if (app.CurrentMember) {
            return model._isFetchedWhenLoggedIn = true;
          }
        }
      });
      return dfd.promise();
    }
  };
  return DataRetrieval;
});

// Generated by CoffeeScript 1.6.2
define('modules/RecycleBin',['app'], function(app) {
  var RecycleBin;

  RecycleBin = {};
  RecycleBin.setup = function() {
    var $bin, doneHandling,
      _this = this;

    doneHandling = function() {
      $bin.addClass('done');
      return setTimeout(function() {
        return $bin.removeClass('done');
      }, 1000);
    };
    this.$bin = $bin = $('#recycle-bin').removeClass('done');
    $bin.on('dragenter dragleave drop', function(e) {
      var method;

      method = e.type === 'dragenter' ? 'addClass' : 'removeClass';
      return $(e.target)[method]('dragover');
    });
    return $bin.on('drop', function(e) {
      var id, model, req, toRecycle, url;

      toRecycle = _this.activeRecycleDrag;
      _this.activeRecycleDrag = null;
      if (toRecycle && toRecycle.className) {
        $bin.addClass('processing');
        id = toRecycle.model.ID ? toRecycle.model.ID : toRecycle.model.id;
        _this.removeViewAndData(toRecycle);
        if (model = Backbone.JJStore._byId(toRecycle.className, id)) {
          model.destroy();
          doneHandling();
          return $bin.removeClass('processing');
        } else {
          url = JJRestApi.setObjectUrl(toRecycle.className, {
            id: id
          });
          req = $.ajax({
            url: url,
            contentType: 'json',
            type: 'DELETE'
          });
          req.always(function() {
            return $bin.removeClass('processing');
          });
          return req.done(function() {
            return doneHandling();
          });
        }
      }
    });
  };
  RecycleBin.removeViewAndData = function(toRecycle) {
    toRecycle.view.$el.trigger('dragend');
    $('body').removeClass('drag-inline');
    if (toRecycle.className === 'PersonImage' || toRecycle.className === 'DocImage') {
      app.removeFromGalleryCache(toRecycle.className, toRecycle.model.id);
      return toRecycle.view.liveRemoval();
    } else {
      return toRecycle.view.remove();
    }
  };
  RecycleBin.setViewAsRecyclable = function(view) {
    var data,
      _this = this;

    data = {
      view: view,
      model: view.model
    };
    data.className = view.className ? view.className : view.model.ClassName;
    return view.$el.on('dragstart dragend', function(e) {
      var method;

      $.fireGlobalDragEvent(e.type, e.target);
      if (e.type === 'dragstart') {
        method = 'addClass';
        _this.activeRecycleDrag = data;
      } else {
        _this.activeRecycleDrag = null;
        method = 'removeClass';
      }
      return _this.$bin[method]('active');
    });
  };
  return RecycleBin;
});

// Generated by CoffeeScript 1.6.2
define('modules/Website',['app', 'modules/RecycleBin'], function(app, RecycleBin) {
  
  var Website;

  Website = app.module();
  Website.Views.ListView = Backbone.View.extend({
    tagName: 'li',
    template: 'website-list-item',
    className: 'Website',
    serialize: function() {
      return {
        ID: this.model.id,
        Title: this.model.get('Title'),
        Link: this.model.get('Link')
      };
    },
    afterRender: function() {
      return RecycleBin.setViewAsRecyclable(this);
    }
  });
  return Website;
});

(function(t,e){if(typeof exports=="object")module.exports=e();else if(typeof define=="function"&&define.amd)define('plugins/misc/spin.min',[],e);else t.Spinner=e()})(this,function(){var t=["webkit","Moz","ms","O"],e={},i;function o(t,e){var i=document.createElement(t||"div"),o;for(o in e)i[o]=e[o];return i}function n(t){for(var e=1,i=arguments.length;e<i;e++)t.appendChild(arguments[e]);return t}var r=function(){var t=o("style",{type:"text/css"});n(document.getElementsByTagName("head")[0],t);return t.sheet||t.styleSheet}();function s(t,o,n,s){var a=["opacity",o,~~(t*100),n,s].join("-"),f=.01+n/s*100,l=Math.max(1-(1-t)/o*(100-f),t),d=i.substring(0,i.indexOf("Animation")).toLowerCase(),u=d&&"-"+d+"-"||"";if(!e[a]){r.insertRule("@"+u+"keyframes "+a+"{"+"0%{opacity:"+l+"}"+f+"%{opacity:"+t+"}"+(f+.01)+"%{opacity:1}"+(f+o)%100+"%{opacity:"+t+"}"+"100%{opacity:"+l+"}"+"}",r.cssRules.length);e[a]=1}return a}function a(e,i){var o=e.style,n,r;if(o[i]!==undefined)return i;i=i.charAt(0).toUpperCase()+i.slice(1);for(r=0;r<t.length;r++){n=t[r]+i;if(o[n]!==undefined)return n}}function f(t,e){for(var i in e)t.style[a(t,i)||i]=e[i];return t}function l(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var o in i)if(t[o]===undefined)t[o]=i[o]}return t}function d(t){var e={x:t.offsetLeft,y:t.offsetTop};while(t=t.offsetParent)e.x+=t.offsetLeft,e.y+=t.offsetTop;return e}var u={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:1/4,fps:20,zIndex:2e9,className:"spinner",top:"auto",left:"auto",position:"relative"};function p(t){if(typeof this=="undefined")return new p(t);this.opts=l(t||{},p.defaults,u)}p.defaults={};l(p.prototype,{spin:function(t){this.stop();var e=this,n=e.opts,r=e.el=f(o(0,{className:n.className}),{position:n.position,width:0,zIndex:n.zIndex}),s=n.radius+n.length+n.width,a,l;if(t){t.insertBefore(r,t.firstChild||null);l=d(t);a=d(r);f(r,{left:(n.left=="auto"?l.x-a.x+(t.offsetWidth>>1):parseInt(n.left,10)+s)+"px",top:(n.top=="auto"?l.y-a.y+(t.offsetHeight>>1):parseInt(n.top,10)+s)+"px"})}r.setAttribute("role","progressbar");e.lines(r,e.opts);if(!i){var u=0,p=(n.lines-1)*(1-n.direction)/2,c,h=n.fps,m=h/n.speed,y=(1-n.opacity)/(m*n.trail/100),g=m/n.lines;(function v(){u++;for(var t=0;t<n.lines;t++){c=Math.max(1-(u+(n.lines-t)*g)%m*y,n.opacity);e.opacity(r,t*n.direction+p,c,n)}e.timeout=e.el&&setTimeout(v,~~(1e3/h))})()}return e},stop:function(){var t=this.el;if(t){clearTimeout(this.timeout);if(t.parentNode)t.parentNode.removeChild(t);this.el=undefined}return this},lines:function(t,e){var r=0,a=(e.lines-1)*(1-e.direction)/2,l;function d(t,i){return f(o(),{position:"absolute",width:e.length+e.width+"px",height:e.width+"px",background:t,boxShadow:i,transformOrigin:"left",transform:"rotate("+~~(360/e.lines*r+e.rotate)+"deg) translate("+e.radius+"px"+",0)",borderRadius:(e.corners*e.width>>1)+"px"})}for(;r<e.lines;r++){l=f(o(),{position:"absolute",top:1+~(e.width/2)+"px",transform:e.hwaccel?"translate3d(0,0,0)":"",opacity:e.opacity,animation:i&&s(e.opacity,e.trail,a+r*e.direction,e.lines)+" "+1/e.speed+"s linear infinite"});if(e.shadow)n(l,f(d("#000","0 0 4px "+"#000"),{top:2+"px"}));n(t,n(l,d(e.color,"0 0 1px rgba(0,0,0,.1)")))}return t},opacity:function(t,e,i){if(e<t.childNodes.length)t.childNodes[e].style.opacity=i}});function c(){function t(t,e){return o("<"+t+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',e)}r.addRule(".spin-vml","behavior:url(#default#VML)");p.prototype.lines=function(e,i){var o=i.length+i.width,r=2*o;function s(){return f(t("group",{coordsize:r+" "+r,coordorigin:-o+" "+-o}),{width:r,height:r})}var a=-(i.width+i.length)*2+"px",l=f(s(),{position:"absolute",top:a,left:a}),d;function u(e,r,a){n(l,n(f(s(),{rotation:360/i.lines*e+"deg",left:~~r}),n(f(t("roundrect",{arcsize:i.corners}),{width:o,height:i.width,left:i.radius,top:-i.width>>1,filter:a}),t("fill",{color:i.color,opacity:i.opacity}),t("stroke",{opacity:0}))))}if(i.shadow)for(d=1;d<=i.lines;d++)u(d,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(d=1;d<=i.lines;d++)u(d);return n(e,l)};p.prototype.opacity=function(t,e,i,o){var n=t.firstChild;o=o.shadow&&o.lines||0;if(n&&e+o<n.childNodes.length){n=n.childNodes[e+o];n=n&&n.firstChild;n=n&&n.firstChild;if(n)n.opacity=i}}}var h=f(o("group"),{behavior:"url(#default#VML)"});if(!a(h,"transform")&&h.adj)c();else i=a(h,"animation");return p});
/**
 * jQuery list plug-in 1.2.4
 * Copyright 2012, Digital Fusion
 * Licensed under the MIT license.
 * http://teamdf.com/jquery-plugins/license/
 *
 * @author Sam Sehnert, Phil Taylor
 */

(function($){
	
	
	// The name of your plugin. This is used to namespace your
	// plugin methods, object data, and registerd events.
	var plugin_name = 'list';
	var plugin_version = '1.2.4';
	var plugin_logging = true;
	
	// Set up the plugin defaults.
	// These will be stored in $this.data(plugin_name).settings,
	// and can be overwritten by having 'options' passed through
	// as the parameter to the init method.
  var defaults = {
    headerSelector  : 'dt',
    zIndex          : 1,
    fakeHeaderClass : 'ui-' + plugin_name + '-fakeheader'
  };
	
	var scrollTimeout = null;
	
	// Any private methods that the plugin uses, such as event handlers,
	// or small utility functions for parsing data etc that isn't useful
	// outside the context of the plugin code itself.
	var _private = {
		
		log : function(){
			// SAFELY call console.log without fear of errors
			// also provides an override for turning off all plugin console output.
			if( plugin_logging && window.console && window.console.log ){
				try {
					// IE 8 doesn't implement apply on the console methods.
					window.console.log.apply(console,arguments);
				} catch (e) {
					// Because IE8 doesn't implement apply for console methods,
					// we simply pass the arguments directly to the log.
					window.console.log( arguments );
				}
			}
		},
		
		// Update the whole header object on the fly so all properties will be reserved. So setting
		// different styles for specific titles, such as different font color for today or weekends, 
		// holidays, etc. becomes posible.
		updateHeader: function(target, newHeader) {
            var data = target.data(plugin_name);
            if (data) {
                data.fakeHeader = newHeader.clone().removeAttr('id').addClass(data.settings.fakeHeaderClass);
                data.fakeHeader.css({
                    position: 'absolute',
                    top: 0,
                    width: data.headers.width(),
                    zIndex: data.settings.zIndex
                });
                target.data(plugin_name, data).children(0).eq(0).replaceWith(data.fakeHeader);
            }
        },
				
		// Contains events for this plugin.
		events : {
			
			/**
			 * Window resize (should also be called when resizing the target element).
			 */
			resize : function(){
				var $this = $(this),data = $this.data(plugin_name);
				
				if( data ){
					data.fakeHeader.width(data.headers.width());
					data.wrapper.css('maxHeight',$this.css('maxHeight'));
				}
			},
			
			/**
			 * List element scroll handler event. Called to animate and substitute heading blocks.
			 */
			scroll : function(){
				var $this = $(this),data = $this.data(plugin_name);
				
				if( data ){
					
					var newHeader		= null,
						currentHeader	= data.headers.eq( data.currentHeader ),
						nextHeader		= data.currentHeader >= data.headers.length-1 ? null : data.headers.eq( data.currentHeader+1 ),
						prevHeader		= data.currentHeader <= 0 ? null : data.headers.eq( data.currentHeader-1 ),
						trigger			= false;
					
					// Make sure the container top position is fresh.
					data.containerTop	= $this.offset().top + parseInt($this.css('marginTop'),10) + parseInt($this.css('borderTopWidth'),10);
					data.fakeHeader.css('top',0);
					
					// Check the position of the current header rather than the previous header.
					if( prevHeader !== null ){
						
					 	var top		= currentHeader.offset().top,
					 		height	= currentHeader.outerHeight();
					 	
					 	if( top > data.containerTop ){
					 		
					 		data.fakeHeader.css('top',(top-height)-data.containerTop);
					 		_private.updateHeader($this, prevHeader);
					 		data.currentHeader = data.currentHeader-1;
					 		trigger = true;
					 	}
					 	
					 	if( (top-height) > data.containerTop ){
					 		
					 		data.fakeHeader.css('top',0);
					 		newHeader = data.currentHeader-1;
					 	}
					 	
					}
					
					// Check the position of the next header element.
					if( nextHeader !== null ){
					 	
					 	var top		= nextHeader.offset().top,
					 		height	= nextHeader.outerHeight();
					 	
					 	if( (top-height) < data.containerTop ){
					 		
					 		data.fakeHeader.css('top',(top-height)-data.containerTop);
					 	}
					 	
					 	if( top < data.containerTop ){
					 		
					 		data.fakeHeader.css('top',0);
					 		newHeader = data.currentHeader+1;
					 	}
					}
							
					// Now assign the contents of the previous header.
					if( newHeader !== null ){
						
						var $header = data.headers.eq(newHeader);
						
						data.currentHeader = newHeader;
						_private.updateHeader($this, $header);
						trigger = true;
					}
					
					var max = ( data.wrapper.scrollTop() >= data.wrapper.prop('scrollHeight') - data.wrapper.height() );
					
					if( trigger || max || data.max && !max ){
						// Trigger the headingChange event.
						$this.trigger('headingChange',[data.currentHeader,data.headers.eq(data.currentHeader),max]);
					}
					
					data.max = max;
					
					// Save the new data.
					$this.data(plugin_name,data);
				}
			}
		}
	}
	
	// The methods array will allow you to define public methods that
	// can be called using the plugin function using the following syntax;
	//
	// $('.selector').plugin_name( 'my_method'/*, optional arguments */);
	//
	// The 'init' method is special, and will be called when the user calls;
	//
	// $('.selector').plugin_name(/*{ options object }*/);
	var methods = {
		
		/**
		 * Initialises the plugin.
		 * 
		 * @param options object : An object containing any overrides to the default settings.
		 *
		 * @return collection : Returns the jQuery collection
		 */
		init : function( options ){
			
			// Loop through each passed element.
			return $(this).each(function(){
				
				// Settings to the defaults.
				var settings = $.extend({},defaults);
				
				// If options exist, lets merge them
				// with our default settings.
				if( typeof options == 'object' ) $.extend( settings, options );
				
				// Create shortcuts, and get any existing data.
				var $this = $(this), data = $this.data(plugin_name);
				
				// If the plugin hasn't been initialized yet
				if ( ! data ) {
					
					// Create the data object.
					data = {
						target			: $this,			// This element.
						wrapper			: $this.wrapInner('<div class="ui-'+plugin_name+'" />').find('.ui-'+plugin_name+''),
						settings		: settings,			// The settings for this plugin.
						headers			: [],
						containerTop	: 0,
						currentHeader	: 0,
						fakeHeader		: null,
						scrolllist		: [],
						original		: {
							position	: '',
							overflowX	: '',
							overflowY	: ''
						},
						max				: false
					}
					
					// Add the container class, and the base HTML structure
					$this.addClass('-'+plugin_name+'-container').css({
						position	: $this.css('position') == 'absolute' ? 'absolute' : 'relative',
						overflowY	: 'hidden'
					});
					
					// Grab some variables to set up the list.
				    data.headers		= $this.find(data.settings.headerSelector);
				    data.fakeHeader	= data.headers.eq(0).clone().removeAttr('id').addClass(data.settings.fakeHeaderClass);
				    
				    // bind a scroll event and change the text of the fake heading
				    data.wrapper.bind('scroll.'+plugin_name,$.proxy(_private.events.scroll,$this)).css({
				    	height		: '100%',
				    	maxHeight	: $this.css('maxHeight'),
				    	overflowY	: 'scroll',
				    	position	: 'relative'
				    });
				    
					// Set the fake headers
				    data.fakeHeader.css({
				    	position	: 'absolute',
				    	top			: 0,
				    	width		: data.headers.width(),
				    	zIndex		: data.settings.zIndex
				    });
					
					// Bind the resize event to the window.
					$(window).bind('resize.'+plugin_name,$.proxy(_private.events.resize,$this));
				   
				    // Add the fake header before all other children, and set the HTML.
				    $this.data(plugin_name,data).prepend( data.fakeHeader );
				}
			});
		},
		
		/**
		 * Retrieves the current header index that the user is scrolled to.
		 *
		 * @return int : The index position of the header (relative to the headers collection).
		 */
		header : function(){
			
			var $this = $(this),
				data = $this.data(plugin_name);
			
			// Only bother if we've set this up before.
			if( data ){
				return data.currentHeader;
			}
		},
		
		/**
		 * Used to scroll to a new header element, or to retrieve the currently set header.
		 *
		 * @param int newHeader			: The index position of the header (relative to the headers collection).
		 * @param mixed speed			: The animation speed of scrolling to the new header.
		 * @param mixed easing			: The animation easing to use.
		 * @param function completion	: The animation completion function to call.
		 *
		 * @return collection : The collection that this was called with
		 */
		scrollTo : function( newHeader, speed, easing, completion ){
			
			return this.each(function(){
				
				var $this = $(this),
					data = $this.data(plugin_name);
				
				// Only bother if we've set this up before.
				if( data ){
					
					// If we've got the header, and its a number
					if( newHeader !== undefined && !isNaN( newHeader ) && newHeader >= 0 && newHeader < data.headers.length ){
						
						// Get the new header.
						var $header = data.headers.eq(newHeader),
							scrollTo = $header.position().top + data.wrapper.scrollTop() + parseInt($header.css('borderTopWidth'),10) + parseInt($header.css('borderBottomWidth'),10);
						
						// If we're not animating, we need to set the element directly.
						if( !speed ){
							
							data.wrapper.stop().scrollTop( scrollTo );
							
							// Set as the current header.
							data.currentHeader = newHeader;
							_private.updateHeader($this, $header);
							
							// Trigger the headingChange event.
							$this.trigger('headingChange',[newHeader,$header]);
							
							// Store the new header data.
							$this.data(plugin_name,data);
							
						} else {
							// If we are animating, the scroll event will fire.
							data.wrapper.stop().animate({scrollTop:scrollTo},speed,easing,completion);
						}
					}
				}
			});
		},
		
		/**
		 * Used to modify settings after initialisation has taken place.
		 * an example switch construct has been written to show how you
		 * might fire off an update procedure for certain defaults.
		 * Should only be called on one element at a time.
		 * 
		 * @param key string	: The option name that you want to update.
		 * @param value mixed	: (opt) The value that you want to set the option to.
		 *
		 * @return mixed : If no value is passed, will return the value for the passed key, otherwise, returns the jQuery collection.
		 */
		option : function( key, value ){
			
			var $this = $(this),
				data = $this.data(plugin_name);
			
			// Only bother if we've set this up before.
			if( data ){

				// Return settings array if no key is provided.
				if( typeof key == 'undefined' ) return data.settings;
			
				// The key has to exist, otherwise its invalid.
				if( !key in data.settings ) return false;
				
				// Check if we're adding or updating.
				if( typeof value == 'undefined' ){
					return data.settings[key];
				} else {
					data.settings[key] = value;
					return $this;
				}
			}			
		},
		
		
		/**
		 * Get the current name and version number of this plugin.
		 *
		 * @param num bool : Whether to return the version number, or string.
		 *
		 * @return string | number : The version string or version number.
		 */
		version : function( num ){
			// Returns the version string for this plugin.
			if( num ){
				// Calculate the version number.
				var v		= plugin_version.split('.'),
					major	= ( Number( v[0] ) || 1 )+'',
					minor	= ( Number( v[1] ) || 0 )+'',
					bugfix	= ( Number( v[2] ) || 0 )+'',
					fill	= '000';
				
				// Return the version as a comparable number.
				return Number( fill.slice(0,3-major.length)+major+fill.slice(0,3-minor.length)+minor+fill.slice(0,3-bugfix.length)+bugfix );
				
			} else {
				// Return the version string for this plugin.
				return plugin_name+' v'+plugin_version;
			}
		},
		
		/**
		 * Remove all data and events associated with the plugin, and restore
		 * the status of any manipulated elmenets to pre-plugin state.
		 *
		 * @return collection : Returns the jQuery collection.
		 */
		destroy: function(){
			/* Remove the ui plugin from these elements that have it */
			
			return this.each(function(){

				var $this = $(this),
					data = $this.data(plugin_name);
				
				// Only bother if we've set this up before.
				if( data ){
					
					// Remove wrapper and fakeheader.
					data.wrapper.children().unwrap();
					data.fakeHeader.remove();
					
					// Now, remove all data, etc, then
					// reattach this element to its parent, then delete list div.
					$this.css(data.original)
						 .removeData(plugin_name)
						 .removeClass('-'+plugin_name+'-container')
				    	 .unbind('.'+plugin_name);
				}
			});
		}
	};
	
	/**
	 * Plugin method calling handler.
	 *
	 * @param method string : (opt) Calls the defined method (or init function if omitted).
	 * @param arguments		: Any remaining arguments will be passed as arguments to the recieving method. 
	 *
	 * @return mixed : Returns the result of the called method.
	 */
	$.fn[plugin_name] = function( method ){
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.' + plugin_name );
		}	
	}
	
	// Initialise $.plugin_name for methods below.
	$[plugin_name] = {};
	
	/**
	 * Allow console logging from this plugin?
	 * 
	 * @param l bool : (opt) Turn logging on or off...
	 *
	 * @return bool : Whether this plugin will print to the log or not.
	 */
	$[plugin_name].log = function(l){ if(l!==undefined){ plugin_logging=l; } return plugin_logging; };
		
})(jQuery);
define("plugins/misc/jquery.list", function(){});

// Generated by CoffeeScript 1.6.2

/**
 *
 *	static file drag and drop helper class
 *
*/
(function($) {
  var JJFileUpload;

  JJFileUpload = (function() {
    function JJFileUpload() {}

    /**
    		 * Uploads the dropped files (from the filesystem)
    		 * @param  {Event} e               	The drop event
    		 * @param  {jQuery} $dropzone       Where the files have been dropped
    		 * @param  {string} postUrl         URL to post the files to
    		 * @param  {Object} additionalData  additional POST data
    		 * @param  {string} defaultErrorMsg Default error message
    		 * @param  {string} filematch		String to match filenames to
    		 * @param  {int} maxAllowed			Maximum allowed number of files
    		 * @return {$.Deferred}             jQuery Deferred object
    */


    JJFileUpload["do"] = function(e, $dropzone, postUrl, additionalData, defaultErrorMsg, filematch, maxAllowed) {
      var $progress, $progressText, a, b, errorMsg, files, formData, req,
        _this = this;

      errorMsg = null;
      $dropzone.removeClass('failed done');
      $('.progress-text, .progress', $dropzone).remove();
      $progress = $('<div />', {
        "class": 'progress'
      }).height(0).appendTo($dropzone);
      $progressText = $('<div />', {
        "class": 'progress-text'
      }).appendTo($dropzone);
      files = e.dataTransfer.files;
      formData = new FormData();
      if (maxAllowed && files.length > maxAllowed) {
        files = array_slice(files, 0, 3);
      }
      $.each(files, function(index, file) {
        if (!file.type.match(filematch)) {
          return errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!';
        } else {
          return formData.append(file.name, file);
        }
      });
      if (additionalData) {
        for (a in additionalData) {
          b = additionalData[a];
          formData.append(a, b);
        }
      }
      if (errorMsg) {
        console.log(errorMsg);
        req = new $.Deferred();
        req.reject({
          error: errorMsg
        });
      } else {
        $dropzone.addClass('uploading');
        req = $.ajax({
          url: postUrl,
          data: formData,
          processData: false,
          contentType: false,
          type: 'POST',
          xhr: function() {
            var xhr;

            xhr = new XMLHttpRequest();
            xhr.upload.onprogress = function(evt) {
              var completed;

              if (evt.lengthComputable) {
                completed = Math.round((evt.loaded / evt.total) * 100);
                $progressText.html(completed + '%');
                return $progress.height(completed + '%');
              }
            };
            return xhr;
          }
        });
      }
      return req.pipe(function(res) {
        if (!res.error) {
          return res;
        } else {
          return $.Deferred().reject(res);
        }
      }).fail(function(res) {
        $dropzone.addClass('failed');
        $progressText.text(defaultErrorMsg);
        return setTimeout(function() {
          return $dropzone.removeClass('dragover');
        }, 3000);
      }).always(function() {
        $dropzone.removeClass('uploading');
        $progress.remove();
        return $progressText.remove();
      }).done(function() {
        $dropzone.addClass('done');
        return setTimeout(function() {
          return $dropzone.removeClass('dragover');
        }, 1000);
      });
    };

    return JJFileUpload;

  })();
  return window.JJFileUpload = JJFileUpload;
})(jQuery);

define("plugins/editor/jquery.jjfileupload", function(){});

// Generated by CoffeeScript 1.6.2

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($) {
  var JJSimpleImagesUploadZone, JJSingleImageUploadZone, JJUploadZone;

  $.globalDragStart = $.Callbacks();
  $.globalDragEnd = $.Callbacks();
  $.dragLeaveTimeout = null;
  $.fireGlobalDragEvent = function(name, target, type) {
    var eventName;

    if (type == null) {
      type = 'inline';
    }
    eventName = name === 'dragstart' ? 'Start' : 'End';
    return $['globalDrag' + eventName].fire({
      type: type,
      target: target
    });
  };
  $.globalDragStart.add(function(e) {
    if ($.dragLeaveTimeout) {
      clearTimeout($.dragLeaveTimeout);
    }
    return $('body').addClass('dragover drag-' + e.type);
  });
  $.globalDragEnd.add(function(e) {
    if ($.dragLeaveTimeout) {
      clearTimeout($.dragLeaveTimeout);
    }
    return $.dragLeaveTimeout = setTimeout(function() {
      return $('body').removeClass('dragover drag-' + e.type);
    }, 200);
  });
  JJUploadZone = (function() {
    JJUploadZone.prototype.fileMatch = 'image.*';

    JJUploadZone.prototype.defaults = {
      url: null,
      errorMsg: 'Sorry, but there has been an error.',
      additionalData: null,
      responseHandler: function(data) {
        console.log('UPLOAD DATA');
        return console.log(data);
      }
    };

    JJUploadZone.prototype.$dropzone = null;

    JJUploadZone.prototype.maxAllowed = null;

    function JJUploadZone(selector, opts) {
      this.options = $.extend({}, this.defaults, opts);
      this.$dropzone = selector instanceof jQuery ? selector : $(selector);
      this.$dropzone.addClass('dropzone');
    }

    JJUploadZone.prototype.cleanup = function() {
      return this.$dropzone.off('dragenter dragleave drop');
    };

    JJUploadZone.prototype.deferredUpload = function(e) {
      var uploadDfd,
        _this = this;

      uploadDfd = JJFileUpload["do"](e, this.$dropzone, this.options.url, this.options.additionalData, this.options.errorMsg, this.fileMatch, this.maxAllowed);
      return uploadDfd.done(function(data) {
        data = $.parseJSON(data);
        return _this.options.responseHandler(data);
      });
    };

    return JJUploadZone;

  })();
  JJSimpleImagesUploadZone = (function(_super) {
    __extends(JJSimpleImagesUploadZone, _super);

    function JJSimpleImagesUploadZone(selector, opts) {
      JJSimpleImagesUploadZone.__super__.constructor.call(this, selector, opts);
      this.dragAndDropSetup();
    }

    JJSimpleImagesUploadZone.prototype.dragAndDropSetup = function() {
      var $dropzone,
        _this = this;

      $dropzone = this.$dropzone;
      $dropzone.on('dragenter', function(e) {
        return $(this).addClass('dragover');
      });
      $dropzone.on('dragleave', function(e) {
        return $(this).removeClass('dragover');
      });
      return $dropzone.on('drop', function(e) {
        return _this.deferredUpload(e).always(function() {
          $.fireGlobalDragEvent(e.type, e.target);
          return $dropzone.removeClass('dragover');
        });
      });
    };

    return JJSimpleImagesUploadZone;

  })(JJUploadZone);
  JJSingleImageUploadZone = (function(_super) {
    __extends(JJSingleImageUploadZone, _super);

    function JJSingleImageUploadZone(selector, opts) {
      JJSingleImageUploadZone.__super__.constructor.call(this, selector, opts);
      window.dropzoneIDCount++;
      this.dropzoneID = 'jjdrop-' + window.dropzoneIDCount;
      this.dragAndDropSetup();
    }

    JJSingleImageUploadZone.prototype.setAsActiveDraggable = function(e) {
      if (e.type === 'dragstart') {
        this._activeDraggableId = $(e.target).data('id');
        if (!this._activeDraggableId) {
          return this._activeDraggableId = $(e.target).parent().data('id');
        }
      } else {
        return this._activeDraggableId = null;
      }
    };

    JJSingleImageUploadZone.prototype.setAsDraggable = function($el) {
      var _this = this;

      if (!this.draggables) {
        this.draggables = [];
      }
      if ($el.length) {
        this.draggables.push($el);
        return $el.on('dragstart.' + this.dropzoneID + ' dragend.' + this.dropzoneID, function(e) {
          $.fireGlobalDragEvent(e.type, e.target);
          return _this.setAsActiveDraggable(e);
        });
      }
    };

    JJSingleImageUploadZone.prototype.cleanup = function() {
      var $draggable, _i, _len, _ref, _results;

      JJSingleImageUploadZone.__super__.cleanup.call(this);
      if (this.draggables) {
        _ref = this.draggables;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          $draggable = _ref[_i];
          _results.push($draggable.off('dragstart.' + this.dropzoneID + ' dragend.' + this.dropzoneID));
        }
        return _results;
      }
    };

    JJSingleImageUploadZone.prototype.dragAndDropSetup = function() {
      var $dropzone,
        _this = this;

      $dropzone = this.$dropzone;
      $dropzone.on('dragenter', function(e) {
        return $(this).addClass('dragover');
      });
      $dropzone.on('dragleave drop', function(e) {
        return $(this).removeClass('dragover');
      });
      return $dropzone.on('drop', function(e) {
        var data, id;

        $.fireGlobalDragEvent(e.type, e.target);
        if (id = _this._activeDraggableId) {
          _this._activeDraggableId = null;
          data = _this.options.getFromCache(id);
          if (data) {
            if (data.done) {
              return data.done(_this.options.responseHandler);
            } else {
              return _this.options.responseHandler(data);
            }
          }
        } else if (e.dataTransfer.files.length) {
          return _this.deferredUpload(e);
        }
      });
    };

    return JJSingleImageUploadZone;

  })(JJUploadZone);
  window.dropzoneIDCount = 0;
  window.JJSimpleImagesUploadZone = JJSimpleImagesUploadZone;
  return window.JJSingleImageUploadZone = JJSingleImageUploadZone;
})(jQuery);

define("plugins/editor/jquery.jjdropzone", function(){});

/*
 *	Tabby jQuery plugin version 0.12
 *
 *	Ted Devito - http://teddevito.com/demos/textarea.html
 *
 *	Copyright (c) 2009 Ted Devito
 *	 
 *	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following 
 *	conditions are met:
 *	
 *		1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *		2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer  
 *			in the documentation and/or other materials provided with the distribution.
 *		3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written 
 *			permission. 
 *	 
 *	THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 *	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE 
 *	LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
 *	PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY 
 *	THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT 
 *	OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
 
// create closure

(function($) {
 
	// plugin definition

	$.fn.tabby = function(options) {
		//debug(this);
		// build main options before element iteration
		var opts = $.extend({}, $.fn.tabby.defaults, options);
		var pressed = $.fn.tabby.pressed; 
		
		// iterate and reformat each matched element
		return this.each(function() {
			$this = $(this);
			
			// build element specific options
			var options = $.meta ? $.extend({}, opts, $this.data()) : opts;
			
			$this.bind('keydown',function (e) {
				var kc = $.fn.tabby.catch_kc(e);
				if (16 == kc) pressed.shft = true;
				/*
				because both CTRL+TAB and ALT+TAB default to an event (changing tab/window) that 
				will prevent js from capturing the keyup event, we'll set a timer on releasing them.
				*/
				if (17 == kc) {pressed.ctrl = true;	setTimeout("$.fn.tabby.pressed.ctrl = false;",1000);}
				if (18 == kc) {pressed.alt = true; 	setTimeout("$.fn.tabby.pressed.alt = false;",1000);}
					
				if (9 == kc && !pressed.ctrl && !pressed.alt) {
					e.preventDefault; // does not work in O9.63 ??
					pressed.last = kc;	setTimeout("$.fn.tabby.pressed.last = null;",0);
					process_keypress ($(e.target).get(0), pressed.shft, options);
					return false;
				}
				
			}).bind('keyup',function (e) {
				if (16 == $.fn.tabby.catch_kc(e)) pressed.shft = false;
			}).bind('blur',function (e) { // workaround for Opera -- http://www.webdeveloper.com/forum/showthread.php?p=806588
				if (9 == pressed.last) $(e.target).one('focus',function (e) {pressed.last = null;}).get(0).focus();
			});
		
		});
	};
	
	// define and expose any extra methods
	$.fn.tabby.catch_kc = function(e) { return e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which; };
	$.fn.tabby.pressed = {shft : false, ctrl : false, alt : false, last: null};
	
	// private function for debugging
	function debug($obj) {
		if (window.console && window.console.log)
		window.console.log('textarea count: ' + $obj.size());
	};

	function process_keypress (o,shft,options) {
		var scrollTo = o.scrollTop;
		//var tabString = String.fromCharCode(9);
		
		// gecko; o.setSelectionRange is only available when the text box has focus
		if (o.setSelectionRange) gecko_tab (o, shft, options);
		
		// ie; document.selection is always available
		else if (document.selection) ie_tab (o, shft, options);
		
		o.scrollTop = scrollTo;
	}
	
	// plugin defaults
	$.fn.tabby.defaults = {tabString : String.fromCharCode(9)};
	
	function gecko_tab (o, shft, options) {
		var ss = o.selectionStart;
		var es = o.selectionEnd;	
				
		// when there's no selection and we're just working with the caret, we'll add/remove the tabs at the caret, providing more control
		if(ss == es) {
			// SHIFT+TAB
			if (shft) {
				// check to the left of the caret first
				if ("\t" == o.value.substring(ss-options.tabString.length, ss)) {
					o.value = o.value.substring(0, ss-options.tabString.length) + o.value.substring(ss); // put it back together omitting one character to the left
					o.focus();
					o.setSelectionRange(ss - options.tabString.length, ss - options.tabString.length);
				} 
				// then check to the right of the caret
				else if ("\t" == o.value.substring(ss, ss + options.tabString.length)) {
					o.value = o.value.substring(0, ss) + o.value.substring(ss + options.tabString.length); // put it back together omitting one character to the right
					o.focus();
					o.setSelectionRange(ss,ss);
				}
			}
			// TAB
			else {			
				o.value = o.value.substring(0, ss) + options.tabString + o.value.substring(ss);
				o.focus();
	    		o.setSelectionRange(ss + options.tabString.length, ss + options.tabString.length);
			}
		} 
		// selections will always add/remove tabs from the start of the line
		else {
			// split the textarea up into lines and figure out which lines are included in the selection
			var lines = o.value.split("\n");
			var indices = new Array();
			var sl = 0; // start of the line
			var el = 0; // end of the line
			var sel = false;
			for (var i in lines) {
				el = sl + lines[i].length;
				indices.push({start: sl, end: el, selected: (sl <= ss && el > ss) || (el >= es && sl < es) || (sl > ss && el < es)});
				sl = el + 1;// for "\n"
			}
			
			// walk through the array of lines (indices) and add tabs where appropriate						
			var modifier = 0;
			for (var i in indices) {
				if (indices[i].selected) {
					var pos = indices[i].start + modifier; // adjust for tabs already inserted/removed
					// SHIFT+TAB
					if (shft && options.tabString == o.value.substring(pos,pos+options.tabString.length)) { // only SHIFT+TAB if there's a tab at the start of the line
						o.value = o.value.substring(0,pos) + o.value.substring(pos + options.tabString.length); // omit the tabstring to the right
						modifier -= options.tabString.length;
					}
					// TAB
					else if (!shft) {
						o.value = o.value.substring(0,pos) + options.tabString + o.value.substring(pos); // insert the tabstring
						modifier += options.tabString.length;
					}
				}
			}
			o.focus();
			var ns = ss + ((modifier > 0) ? options.tabString.length : (modifier < 0) ? -options.tabString.length : 0);
			var ne = es + modifier;
			o.setSelectionRange(ns,ne);
		}
	}
	
	function ie_tab (o, shft, options) {
		var range = document.selection.createRange();
		
		if (o == range.parentElement()) {
			// when there's no selection and we're just working with the caret, we'll add/remove the tabs at the caret, providing more control
			if ('' == range.text) {
				// SHIFT+TAB
				if (shft) {
					var bookmark = range.getBookmark();
					//first try to the left by moving opening up our empty range to the left
				    range.moveStart('character', -options.tabString.length);
				    if (options.tabString == range.text) {
				    	range.text = '';
				    } else {
				    	// if that didn't work then reset the range and try opening it to the right
				    	range.moveToBookmark(bookmark);
				    	range.moveEnd('character', options.tabString.length);
				    	if (options.tabString == range.text) 
				    		range.text = '';
				    }
				    // move the pointer to the start of them empty range and select it
				    range.collapse(true);
					range.select();
				}
				
				else {
					// very simple here. just insert the tab into the range and put the pointer at the end
					range.text = options.tabString; 
					range.collapse(false);
					range.select();
				}
			}
			// selections will always add/remove tabs from the start of the line
			else {
			
				var selection_text = range.text;
				var selection_len = selection_text.length;
				var selection_arr = selection_text.split("\r\n");
				
				var before_range = document.body.createTextRange();
				before_range.moveToElementText(o);
				before_range.setEndPoint("EndToStart", range);
				var before_text = before_range.text;
				var before_arr = before_text.split("\r\n");
				var before_len = before_text.length; // - before_arr.length + 1;
				
				var after_range = document.body.createTextRange();
				after_range.moveToElementText(o);
				after_range.setEndPoint("StartToEnd", range);
				var after_text = after_range.text; // we can accurately calculate distance to the end because we're not worried about MSIE trimming a \r\n
				
				var end_range = document.body.createTextRange();
				end_range.moveToElementText(o);
				end_range.setEndPoint("StartToEnd", before_range);
				var end_text = end_range.text; // we can accurately calculate distance to the end because we're not worried about MSIE trimming a \r\n
								
				var check_html = $(o).html();
				$("#r3").text(before_len + " + " + selection_len + " + " + after_text.length + " = " + check_html.length);				
				if((before_len + end_text.length) < check_html.length) {
					before_arr.push("");
					before_len += 2; // for the \r\n that was trimmed	
					if (shft && options.tabString == selection_arr[0].substring(0,options.tabString.length))
						selection_arr[0] = selection_arr[0].substring(options.tabString.length);
					else if (!shft) selection_arr[0] = options.tabString + selection_arr[0];	
				} else {
					if (shft && options.tabString == before_arr[before_arr.length-1].substring(0,options.tabString.length)) 
						before_arr[before_arr.length-1] = before_arr[before_arr.length-1].substring(options.tabString.length);
					else if (!shft) before_arr[before_arr.length-1] = options.tabString + before_arr[before_arr.length-1];
				}
				
				for (var i = 1; i < selection_arr.length; i++) {
					if (shft && options.tabString == selection_arr[i].substring(0,options.tabString.length))
						selection_arr[i] = selection_arr[i].substring(options.tabString.length);
					else if (!shft) selection_arr[i] = options.tabString + selection_arr[i];
				}
				
				if (1 == before_arr.length && 0 == before_len) {
					if (shft && options.tabString == selection_arr[0].substring(0,options.tabString.length))
						selection_arr[0] = selection_arr[0].substring(options.tabString.length);
					else if (!shft) selection_arr[0] = options.tabString + selection_arr[0];
				}

				if ((before_len + selection_len + after_text.length) < check_html.length) {
					selection_arr.push("");
					selection_len += 2; // for the \r\n that was trimmed
				}
				
				before_range.text = before_arr.join("\r\n");
				range.text = selection_arr.join("\r\n");
				
				var new_range = document.body.createTextRange();
				new_range.moveToElementText(o);
				
				if (0 < before_len)	new_range.setEndPoint("StartToEnd", before_range);
				else new_range.setEndPoint("StartToStart", before_range);
				new_range.setEndPoint("EndToEnd", range);
				
				new_range.select();
				
			} 
		}
	}

// end of closure
})(jQuery);
define("plugins/editor/jquery.tabby", function(){});

/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.strs = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l
    , before
    , iter = 0;

  before = src;
  while (src) {
    if (iter) {
      this.tokens[this.tokens.length -1].origin = before.substring(0, before.indexOf(src));
    }
    before = src;

    iter++;


    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i+1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1][cap[1].length-1] === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }
  
  if (this.tokens && this.tokens.length) this.tokens[this.tokens.length -1].origin = before;


  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  // commented out by johnny, because added 'cite'
  //text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/,
  // custom by johnny
  cite: /^""([\s\S]+?)""/,
  text: /^[\s\S]+?(?=[\\<!\[_"*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {

    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    /*
    ** custom edit by johnny
     */
    // cite
    
    if (cap = this.rules.cite.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<cite>'
        + this.output(cap[2] || cap[1])
        + '</cite>';
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<del>'
        + this.output(cap[1])
        + '</del>';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + this.output(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    .replace(/--/g, '—')
    .replace(/'([^']*)'/g, '‘$1’')
    .replace(/"([^"]*)"/g, '“$1”')
    .replace(/\.{3}/g, '…');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, rawsrc) {
  var parser = new Parser(options);
  return parser.parse(src, rawsrc);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src, rawsrc) {
  var positions = [];
  for (var i = 0;i<src.length;i++) {
    node = src[i];
    positions.push(rawsrc.indexOf(node.origin));
  }

  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    var tok = this.tok(),
        pos = positions[0],
        ltp = tok.indexOf('>');

    // insert position
    if (tok) tok = [tok.slice(0, ltp), ' data-editor-pos="' + pos + '"', tok.slice(ltp)].join('');
    positions.shift();

    out += tok;
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + '>'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        var code = this.options.highlight(this.token.text, this.token.lang);
        if (code != null && code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="'
        + this.options.langPrefix
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    if (opt) opt = merge({}, marked.defaults, opt);

    var tokens = Lexer.lex(tokens, opt)
      , highlight = opt.highlight
      , pending = 0
      , l = tokens.length
      , i = 0;

    if (!highlight || highlight.length < 3) {
      return callback(null, Parser.parse(tokens, opt));
    }

    var done = function() {
      delete opt.highlight;
      var out = Parser.parse(tokens, opt);
      opt.highlight = highlight;
      return callback(null, out);
    };

    for (; i < l; i++) {
      (function(token) {
        if (token.type !== 'code') return;
        pending++;
        return highlight(token.text, token.lang, function(err, code) {
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt, src);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-'
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

/*if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}*/
// edit by johnny
if (typeof exports === 'object') {
  module.exports = marked;
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

define("plugins/editor/marked_jjedit", function(){});

// Generated by CoffeeScript 1.6.2

/**
 *
 * JJMarkdownEditor 
 * v.0.0.2
 *
 * (2013)
 * 
 * A jQuery Markdown Editor with input & preview area, featuring several extra markdown syntax extensions like [img {id}] and [embed {url}]
 * Requirements: 
 * 	- jQuery
 * 	- Tabby jQuery plugin
 * 	- marked_jjedit.js
 * 	- jquery.jjfileupload.js
 *
*/
(function($) {
  var CustomMarkdownParser, CustomMarkdownParserInterface, JJMarkdownEditor;

  JJMarkdownEditor = (function() {
    /**
    		 * 
    		 * Default options
    		 *
    */

    var setAsActiveDraggable;

    JJMarkdownEditor.prototype.defaults = {
      preview: '#preview',
      parsingDelay: 200,
      dragAndDropAllowed: true,
      hideDropzoneDelay: 1000,
      errorMsg: 'Sorry, but there has been an error.',
      contentGetter: 'val',
      customParsers: {},
      customParserOptions: {},
      afterRender: null,
      onChange: null,
      onBlur: null,
      imageUrl: '/imagery/images/docimage/',
      placeholder: 'PLACEHOLDER',
      charlimit: 0,
      additionalPOSTData: null,
      uploadResponseHandler: null
    };

    function JJMarkdownEditor(selector, opts) {
      var $input;

      $input = null;
      this.$preview = null;
      this.currentDrag = null;
      this.inlineElementDragged = null;
      this.dragCount = 0;
      this.fileDragPermitted = true;
      this.pendingAjax = [];
      this.customParsers = {};
      this.firstTimeRendered = false;
      this.options = $.extend({}, this.defaults, opts);
      this.$input = selector instanceof jQuery ? selector : $(selector);
      this.$input._val = this.$input[this.options.contentGetter];
      this.$preview = this.options.preview instanceof jQuery ? this.options.preview : $(this.options.preview);
      this.initialize();
    }

    /**
    		 *
    		 * Static functions that allow DOM Elements to be dragged into the Preview area of any JJMarkdown Editor
    		 *
    */


    setAsActiveDraggable = function(e) {
      var set;

      if (e.type === 'dragstart') {
        set = $(e.target).data('md-tag');
        if (!set) {
          set = $(e.target).parent().data('md-tag');
        }
        set = set.replace('\\[', '[').replace('\\]', ']');
      } else {
        set = null;
      }
      $.fireGlobalDragEvent(e.type, e.target);
      return JJMarkdownEditor._activeDraggable = set;
    };

    JJMarkdownEditor.setAsDraggable = function($els) {
      if (!JJMarkdownEditor.draggables) {
        JJMarkdownEditor.draggables = [];
      }
      $els = $els.filter('[data-md-tag]');
      if ($els.length) {
        JJMarkdownEditor.draggables.push($els);
        return $els.on('dragstart dragend', setAsActiveDraggable);
      }
    };

    JJMarkdownEditor.cleanupDraggables = function() {
      if (JJMarkdownEditor.draggables) {
        return $.each(JJMarkdownEditor.draggables, function(i, $els) {
          return $els.off('dragstart dragend');
        });
      }
    };

    JJMarkdownEditor.prototype.cleanup = function() {
      this.$input.remove();
      this.$preview.remove();
      if (this.$dropzone) {
        return this.$dropzone.remove();
      }
    };

    JJMarkdownEditor.prototype.initialize = function() {
      var $els, $input, $preview, scrollArea,
        _this = this;

      $.each(this.options.customParsers, function(key, parser) {
        var opts, p;

        p = window[parser];
        if (p) {
          opts = _this.options.customParserOptions[key];
          return _this.customParsers[key] = new p(opts);
        }
      });
      $input = this.$input;
      $preview = this.$preview;
      _this = this;
      $input.tabby().trigger('keyup');
      this.delayTimeout = null;
      $input.off('keyup').on('keyup', function(e) {
        var $this, charlimit, delayTimeout;

        $this = $(this);
        charlimit = _this.options.charlimit;
        if (charlimit > 0 && $input._val().length > charlimit) {
          $input._val($input._val().substring(0, charlimit));
        }
        if (delayTimeout) {
          clearTimeout(delayTimeout);
        }
        return delayTimeout = setTimeout(function() {
          return _this.parseMarkdown();
        }, _this.options.parsingDelay);
      });
      $els = $input.add($preview);
      scrollArea = null;
      $els.on('scroll', function(e) {
        var $partner, $this;

        $this = $(this);
        $partner = $this.is($input) ? $preview : $input;
        if (scrollArea && scrollArea.is($partner)) {
          return false;
        }
        scrollArea = $this;
        $partner[0].scrollTop = this.scrollTop * $partner[0].scrollHeight / this.scrollHeight;
        return setTimeout(function() {
          return scrollArea = null;
        }, 200);
      });
      _this.parseMarkdown();
      if (this.options.dragAndDropAllowed) {
        this.dragAndDropSetup();
      }
      return this;
    };

    JJMarkdownEditor.prototype.parseMarkdown = function() {
      var markdown, raw, seeds,
        _this = this;

      $.each(this.pendingAjax, function(i, pending) {
        if (pending.readyState !== 4 && pending.abort) {
          return pending.abort();
        }
      });
      raw = this.$input._val();
      markdown = marked(raw);
      seeds = [];
      $.each(this.customParsers, function(i, parser) {
        var ids, seed;

        ids = parser.findIDs(raw);
        seed = parser.getData(ids);
        seeds.push(seed);
        if (!parser.noAjax) {
          return _this.pendingAjax.push(seed);
        }
      });
      return $.when.apply($, seeds).then(function() {
        var data;

        _this.pendingAjax = [];
        $.each(_this.customParsers, function(i, parser) {
          return markdown = parser.parseMarkdown(markdown);
        });
        _this.$preview.trigger('markdown:replaced');
        if (raw.length === 0) {
          _this.$preview.html(_this.options.placeholder);
        } else {
          _this.$preview.html(markdown);
        }
        _this.inlineDragAndDropSetup();
        if (_this.options.afterRender) {
          _this.options.afterRender();
        }
        data = {
          raw: raw
        };
        if (_this.customParsers.images) {
          data.images = _this.customParsers.images.returnIds();
        }
        if (_this.options.onChange && _this.firstTimeRendered) {
          _this.options.onChange(data);
        }
        return _this.firstTimeRendered = true;
      });
    };

    JJMarkdownEditor.prototype.dragAndDropSetup = function() {
      var $preview, dropzoneDelay, _bindDropHandler, _setHideDropzoneTimeout,
        _this = this;

      $preview = this.$preview;
      dropzoneDelay = this.options.hideDropzoneDelay;
      $preview.on('dragover', function(e) {
        var $dropzone, $target, $temp, currDrag, func, isContainer;

        if (!_this.currentDrag) {
          _this.currentDrag = {
            $dropzone: $('<div>', {
              'class': 'dropzone'
            })
          };
          _this.dragCount++;
          $preview.data('dragid', _this.dragCount);
          _this.currentDrag.$dropzone.data('dragid', _this.dragCount);
        }
        _bindDropHandler();
        currDrag = _this.currentDrag;
        $dropzone = currDrag.$dropzone;
        if (currDrag.hideDropzoneTimeout) {
          clearTimeout(_this.currentDrag.hideDropzoneTimeout);
        }
        $target = $(e.target);
        if (!$target.is($dropzone)) {
          isContainer = false;
          if ($target.is($preview)) {
            isContainer = true;
          } else {
            if (!$target.attr('data-editor-pos')) {
              $temp = $target.closest('[data-editor-pos]');
              if ($temp.length) {
                $target = $temp;
              } else {
                $target = $preview;
                isContainer = true;
              }
            }
          }
          func = isContainer ? 'appendTo' : 'insertBefore';
          currDrag.$target = $target;
          return $dropzone[func].call($dropzone, $target);
        }
      });
      $preview.on('drop', function(e) {
        var $target;

        $target = $(e.originalEvent.originalTarget);
        if (_this.currentDrag && !$target.is(_this.currentDrag.$dropzone)) {
          _setHideDropzoneTimeout();
          return false;
        }
      });
      _setHideDropzoneTimeout = function() {
        if (!_this.currentDrag) {
          return;
        }
        clearTimeout(_this.currentDrag.hideDropzoneTimeout);
        return _this.currentDrag.hideDropzoneTimeout = setTimeout(function() {
          return _this.currentDrag.$dropzone.hide().detach().show();
        }, dropzoneDelay);
      };
      $preview.on('dragleave', _setHideDropzoneTimeout);
      return _bindDropHandler = function() {
        var $dropzone;

        if (_this.currentDrag.dropHandlerBound) {
          return false;
        }
        _this.currentDrag.dropHandlerBound = true;
        $dropzone = _this.currentDrag.$dropzone;
        $dropzone.on('dragenter', function(e) {
          return $(this).addClass('dragover');
        });
        $dropzone.on('dragleave', function(e) {
          return $(this).removeClass('dragover');
        });
        return $dropzone.on('drop', function(e) {
          var $target, dfdParse, el, hideDropzoneTimeout, md, uploadDfd;

          $target = _this.currentDrag.$target;
          hideDropzoneTimeout = _this.currentDrag.hideDropzoneTimeout;
          if (hideDropzoneTimeout) {
            clearTimeout(hideDropzoneTimeout);
          }
          $dropzone.off('drop');
          _this.currentDrag = null;
          dfdParse = new $.Deferred();
          dfdParse.done(function() {
            $dropzone.remove();
            return _this.parseMarkdown();
          });
          if (el = _this.inlineElementDragged) {
            _this.moveInlineElement($(el), $target);
            _this.inlineElementDragged = null;
            return dfdParse.resolve();
          } else if (md = JJMarkdownEditor._activeDraggable) {
            _this.insertAtEditorPosByEl($target, md);
            JJMarkdownEditor._activeDraggable = null;
            return dfdParse.resolve();
          } else if (e.dataTransfer.files.length) {
            uploadDfd = JJFileUpload["do"](e, $dropzone, _this.options.imageUrl, _this.options.additionalPOSTData, _this.options.errorMsg, 'image.*');
            return uploadDfd.done(function(data) {
              var nl, obj, rawMd, _i, _len;

              data = $.parseJSON(data);
              if (_this.options.uploadResponseHandler) {
                _this.options.uploadResponseHandler(data);
              }
              rawMd = '';
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                obj = data[_i];
                rawMd += '[img ' + obj.id + ']';
              }
              nl = '  \n\n';
              _this.insertAtEditorPosByEl($target, rawMd + nl);
              return dfdParse.resolve();
            });
          } else {
            return $dropzone.remove();
          }
        });
      };
    };

    JJMarkdownEditor.prototype.inlineDragAndDropSetup = function() {
      var $imgs, $preview,
        _this = this;

      $preview = this.$preview;
      $imgs = $preview.find('[data-md-tag]');
      _this = this;
      $imgs.on('dragstart', function(e) {
        return _this.inlineElementDragged = this;
      });
      $imgs.on('dragend', function(e) {
        return _this.inlineElementDragged = null;
      });
      return $preview.on('markdown:replace', function() {
        return $imgs.off('dragstart dragend');
      });
    };

    JJMarkdownEditor.prototype.moveInlineElement = function($el, $target) {
      var mdTag, pos;

      mdTag = $el.data('md-tag').replace(/\\/g, '');
      pos = $el.data('editor-pos');
      if (!($target.is(this.$preview)) && ($target.data('editor-pos') < pos)) {
        pos += mdTag.length;
      }
      this.insertAtEditorPosByEl($target, mdTag);
      return this.removeAtEditorPos(pos, mdTag);
    };

    JJMarkdownEditor.prototype.removeAtEditorPos = function(pos, md) {
      var val;

      val = this.$input._val();
      val = [val.slice(0, pos), val.slice(pos + md.length)].join('');
      return this.$input._val(val);
    };

    JJMarkdownEditor.prototype.insertAtEditorPosByEl = function($el, md) {
      var pos, val;

      val = this.$input._val();
      if ($el.is(this.$preview)) {
        val = val + md;
      } else {
        pos = $el.data('editor-pos');
        val = [val.slice(0, pos), md, val.slice(pos)].join('');
      }
      return this.$input._val(val);
    };

    return JJMarkdownEditor;

  })();
  CustomMarkdownParserInterface = {
    findIDs: function(raw) {},
    parseFound: function(found) {},
    getUrl: function(reqIds) {},
    getData: function(ids) {},
    parseMarkdown: function(md) {},
    returnIds: function() {}
  };
  CustomMarkdownParser = (function() {
    CustomMarkdownParser.prototype.url = '';

    function CustomMarkdownParser(opts) {
      var a, b;

      this.cache = [];
      if (opts) {
        for (a in opts) {
          b = opts[a];
          this[a] = b;
        }
      }
    }

    return CustomMarkdownParser;

  })();
  CustomMarkdownParser.prototype.findIDs = function(raw) {
    var cap, found, founds, replacements;

    this._raw = raw;
    replacements = [];
    founds = [];
    while (cap = this.rule.exec(raw)) {
      replacements.push(cap);
      found = this.parseFound(cap[1]);
      if ($.inArray(found, founds) < 0) {
        founds.push(found);
      }
    }
    this._tempReplacements = replacements;
    return founds;
  };
  CustomMarkdownParser.prototype.parseFound = function(found) {
    return found;
  };
  CustomMarkdownParser.prototype.getUrl = function(reqIds) {
    return this.url + '?ids=' + reqIds.join(',');
  };
  CustomMarkdownParser.prototype.getData = function(ids) {
    var dfd, reqIds, resolveData, url,
      _this = this;

    reqIds = [];
    resolveData = [];
    dfd = new $.Deferred();
    $.each(ids, function(i, id) {
      var found;

      found = null;
      $.each(_this.cache, function(j, obj) {
        if (obj.id === id) {
          found = obj;
        }
      });
      if (!found) {
        return reqIds.push(id);
      } else {
        return resolveData.push(found);
      }
    });
    if (!reqIds.length) {
      this.data = resolveData;
      dfd.resolve();
      return dfd;
    }
    url = this.getUrl(reqIds);
    return $.getJSON(url).done(function(data) {
      if ($.isArray(data)) {
        _this.cache = _this.cache.concat(data);
        resolveData = resolveData.concat(data);
        return _this.data = resolveData;
      }
    });
  };
  CustomMarkdownParser.prototype.parseMarkdown = function(md) {
    var insertDataIntoRawTag, patternsUsed, raw, usedIds,
      _this = this;

    insertDataIntoRawTag = function(rawTag, dataName, dataVal) {
      var ltp;

      ltp = rawTag.indexOf('>');
      return [rawTag.slice(0, ltp), ' data-' + dataName + '="' + dataVal + '"', rawTag.slice(ltp)].join('');
    };
    patternsUsed = [];
    raw = this._raw;
    usedIds = [];
    $.each(this._tempReplacements, function(i, replace) {
      var id, obj, pattern, tag;

      obj = null;
      id = _this.parseFound(replace[1]);
      $.each(_this.data, function(j, o) {
        if (o.id === id) {
          obj = o;
        }
      });
      if (obj) {
        usedIds.push(obj.id);
        pattern = replace[0].replace('[', '\\[').replace(']', '\\]');
        tag = insertDataIntoRawTag(obj.tag, 'editor-pos', replace['index']);
        tag = insertDataIntoRawTag(tag, 'md-tag', pattern);
        return md = md.replace(replace[0], tag);
      }
    });
    this._raw = null;
    this._tempReplacements = null;
    this.usedIds = $.unique(usedIds);
    return md;
  };
  CustomMarkdownParser.prototype.returnIds = function() {
    var out;

    out = {
      ids: this.usedIds
    };
    if (this.className) {
      out.className = this.className;
    }
    return out;
  };
  window.JJMarkdownEditor = JJMarkdownEditor;
  return window.CustomMarkdownParser = CustomMarkdownParser;
})(jQuery);

define("plugins/editor/jquery.jjmarkdown", function(){});

/*
 * qTip2 - Pretty powerful tooltips - v2.0.1-101
 * http://qtip2.com
 *
 * Copyright (c) 2013 Craig Michael Thompson
 * Released under the MIT, GPL licenses
 * http://jquery.org/license
 *
 * Date: Thu Jun 20 2013 12:59 GMT+0200+0200
 * Plugins: viewport
 * Styles: basic css3
 */
/*global window: false, jQuery: false, console: false, define: false */


// Uses AMD or browser globals to create a jQuery plugin.

(function($) {
	/* This currently causes issues with Safari 6, so for it's disabled */
	// // (Dis)able ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

;// Munge the primitives - Paul Irish tip
var TRUE = true,
FALSE = false,
NULL = null,

// Common variables
X = 'x', Y = 'y',
WIDTH = 'width',
HEIGHT = 'height',

// Positioning sides
TOP = 'top',
LEFT = 'left',
BOTTOM = 'bottom',
RIGHT = 'right',
CENTER = 'center',

// Position adjustment types
FLIP = 'flip',
FLIPINVERT = 'flipinvert',
SHIFT = 'shift',

// Shortcut vars
QTIP, PROTOTYPE, CORNER, CHECKS,
PLUGINS = {},
NAMESPACE = 'qtip',
ATTR_HAS = 'data-hasqtip',
ATTR_ID = 'data-qtip-id',
WIDGET = ['ui-widget', 'ui-tooltip'],
SELECTOR = '.'+NAMESPACE,
INACTIVE_EVENTS = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' '),

CLASS_FIXED = NAMESPACE+'-fixed',
CLASS_DEFAULT = NAMESPACE + '-default',
CLASS_FOCUS = NAMESPACE + '-focus',
CLASS_HOVER = NAMESPACE + '-hover',
CLASS_DISABLED = NAMESPACE+'-disabled',

replaceSuffix = '_replacedByqTip',
oldtitle = 'oldtitle',
trackingBound;

// Browser detection
BROWSER = {
	/*
	 * IE version detection
	 *
	 * Adapted from: http://ajaxian.com/archives/attack-of-the-ie-conditional-comment
	 * Credit to James Padolsey for the original implemntation!
	 */
	ie: (function(){
		var v = 3, div = document.createElement('div');
		while ((div.innerHTML = '<!--[if gt IE '+(++v)+']><i></i><![endif]-->')) {
			if(!div.getElementsByTagName('i')[0]) { break; }
		}
		return v > 4 ? v : NaN;
	}()),
 
	/*
	 * iOS version detection
	 */
	iOS: parseFloat( 
		('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0,''])[1])
		.replace('undefined', '3_2').replace('_', '.').replace('_', '')
	) || FALSE
};

;function QTip(target, options, id, attr) {
	// Elements and ID
	this.id = id;
	this.target = target;
	this.tooltip = NULL;
	this.elements = elements = { target: target };

	// Internal constructs
	this._id = NAMESPACE + '-' + id;
	this.timers = { img: {} };
	this.options = options;
	this.plugins = {};

	// Cache object
	this.cache = cache = {
		event: {},
		target: $(),
		disabled: FALSE,
		attr: attr,
		onTooltip: FALSE,
		lastClass: ''
	};

	// Set the initial flags
	this.rendered = this.destroyed = this.disabled = this.waiting = 
		this.hiddenDuringWait = this.positioning = this.triggering = FALSE;
}
PROTOTYPE = QTip.prototype;

PROTOTYPE.render = function(show) {
	if(this.rendered || this.destroyed) { return this; } // If tooltip has already been rendered, exit

	var self = this,
		options = this.options,
		cache = this.cache,
		elements = this.elements,
		text = options.content.text,
		title = options.content.title,
		button = options.content.button,
		posOptions = options.position,
		namespace = '.'+this._id+' ',
		deferreds = [];

	// Add ARIA attributes to target
	$.attr(this.target[0], 'aria-describedby', this._id);

	// Create tooltip element
	this.tooltip = elements.tooltip = tooltip = $('<div/>', {
		'id': this._id,
		'class': [ NAMESPACE, CLASS_DEFAULT, options.style.classes, NAMESPACE + '-pos-' + options.position.my.abbrev() ].join(' '),
		'width': options.style.width || '',
		'height': options.style.height || '',
		'tracking': posOptions.target === 'mouse' && posOptions.adjust.mouse,

		/* ARIA specific attributes */
		'role': 'alert',
		'aria-live': 'polite',
		'aria-atomic': FALSE,
		'aria-describedby': this._id + '-content',
		'aria-hidden': TRUE
	})
	.toggleClass(CLASS_DISABLED, this.disabled)
	.attr(ATTR_ID, this.id)
	.data(NAMESPACE, this)
	.appendTo(posOptions.container)
	.append(
		// Create content element
		elements.content = $('<div />', {
			'class': NAMESPACE + '-content',
			'id': this._id + '-content',
			'aria-atomic': TRUE
		})
	);

	// Set rendered flag and prevent redundant reposition calls for now
	this.rendered = -1;
	this.positioning = TRUE;

	// Create title...
	if(title) {
		this._createTitle();

		// Update title only if its not a callback (called in toggle if so)
		if(!$.isFunction(title)) {
			deferreds.push( this._updateTitle(title, FALSE) );
		}
	}

	// Create button
	if(button) { this._createButton(); }

	// Set proper rendered flag and update content if not a callback function (called in toggle)
	if(!$.isFunction(text)) {
		deferreds.push( this._updateContent(text, FALSE) );
	}
	this.rendered = TRUE;

	// Setup widget classes
	this._setWidget();

	// Assign passed event callbacks (before plugins!)
	$.each(options.events, function(name, callback) {
		$.isFunction(callback) && tooltip.bind(
			(name === 'toggle' ? ['tooltipshow','tooltiphide'] : ['tooltip'+name])
				.join(namespace)+namespace, callback
		);
	});

	// Initialize 'render' plugins
	$.each(PLUGINS, function(name) {
		var instance;
		if(this.initialize === 'render' && (instance = this(self))) {
			self.plugins[name] = instance;
		}
	});

	// Assign events
	this._assignEvents();

	// When deferreds have completed
	$.when.apply($, deferreds).then(function() {
		// tooltiprender event
		self._trigger('render');

		// Reset flags
		self.positioning = FALSE;

		// Show tooltip if not hidden during wait period
		if(!self.hiddenDuringWait && (options.show.ready || show)) {
			self.toggle(TRUE, cache.event, FALSE);
		}
		self.hiddenDuringWait = FALSE;
	});

	// Expose API
	QTIP.api[this.id] = this;

	return this;
};

PROTOTYPE.destroy = function(immediate) {
	// Set flag the signify destroy is taking place to plugins
	// and ensure it only gets destroyed once!
	if(this.destroyed) { return this.target; }

	function process() {
		if(this.destroyed) { return; }
		this.destroyed = TRUE;
		
		var target = this.target,
			title = target.attr(oldtitle);

		// Destroy tooltip if rendered
		if(this.rendered) {
			this.tooltip.stop(1,0).find('*').remove().end().remove();
		}

		// Destroy all plugins
		$.each(this.plugins, function(name) {
			this.destroy && this.destroy();
		});

		// Clear timers and remove bound events
		clearTimeout(this.timers.show);
		clearTimeout(this.timers.hide);
		this._unassignEvents();

		// Remove api object and ARIA attributes
		target.removeData(NAMESPACE).removeAttr(ATTR_ID)
			.removeAttr('aria-describedby');

		// Reset old title attribute if removed
		if(this.options.suppress && title) {
			target.attr('title', title).removeAttr(oldtitle);
		}

		// Remove qTip events associated with this API
		this._unbind(target);

		// Remove ID from used id objects, and delete object references
		// for better garbage collection and leak protection
		this.options = this.elements = this.cache = this.timers = 
			this.plugins = this.mouse = NULL;

		// Delete epoxsed API object
		delete QTIP.api[this.id];
	}

	// If an immediate destory is needed
	if(immediate !== TRUE && this.rendered) {
		tooltip.one('tooltiphidden', $.proxy(process, this));
		!this.triggering && this.hide();
	}

	// If we're not in the process of hiding... process
	else { process.call(this); }

	return this.target;
};

;function invalidOpt(a) {
	return a === NULL || $.type(a) !== 'object';
}

function invalidContent(c) {
	return !( $.isFunction(c) || (c && c.attr) || c.length || ($.type(c) === 'object' && (c.jquery || c.then) ));
}

// Option object sanitizer
function sanitizeOptions(opts) {
	var content, text, ajax, once;

	if(invalidOpt(opts)) { return FALSE; }

	if(invalidOpt(opts.metadata)) {
		opts.metadata = { type: opts.metadata };
	}

	if('content' in opts) {
		content = opts.content;

		if(invalidOpt(content) || content.jquery || content.done) {
			content = opts.content = {
				text: (text = invalidContent(content) ? FALSE : content)
			};
		}
		else { text = content.text; }

		// DEPRECATED - Old content.ajax plugin functionality
		// Converts it into the proper Deferred syntax
		if('ajax' in content) {
			ajax = content.ajax;
			once = ajax && ajax.once !== FALSE;
			delete content.ajax;

			content.text = function(event, api) {
				var loading = text || $(this).attr(api.options.content.attr) || 'Loading...',

				deferred = $.ajax(
					$.extend({}, ajax, { context: api })
				)
				.then(ajax.success, NULL, ajax.error)
				.then(function(content) {
					if(content && once) { api.set('content.text', content); }
					return content;
				},
				function(xhr, status, error) {
					if(api.destroyed || xhr.status === 0) { return; }
					api.set('content.text', status + ': ' + error);
				});

				return !once ? (api.set('content.text', loading), deferred) : loading;
			};
		}

		if('title' in content) {
			if(!invalidOpt(content.title)) {
				content.button = content.title.button;
				content.title = content.title.text;
			}

			if(invalidContent(content.title || FALSE)) {
				content.title = FALSE;
			}
		}
	}

	if('position' in opts && invalidOpt(opts.position)) {
		opts.position = { my: opts.position, at: opts.position };
	}

	if('show' in opts && invalidOpt(opts.show)) {
		opts.show = opts.show.jquery ? { target: opts.show } : 
			opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
	}

	if('hide' in opts && invalidOpt(opts.hide)) {
		opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
	}

	if('style' in opts && invalidOpt(opts.style)) {
		opts.style = { classes: opts.style };
	}

	// Sanitize plugin options
	$.each(PLUGINS, function() {
		this.sanitize && this.sanitize(opts);
	});

	return opts;
}

// Setup builtin .set() option checks
CHECKS = PROTOTYPE.checks = {
	builtin: {
		// Core checks
		'^id$': function(obj, o, v, prev) {
			var id = v === TRUE ? QTIP.nextid : v,
				new_id = NAMESPACE + '-' + id;

			if(id !== FALSE && id.length > 0 && !$('#'+new_id).length) {
				this._id = new_id;

				if(this.rendered) {
					this.tooltip[0].id = this._id;
					this.elements.content[0].id = this._id + '-content';
					this.elements.title[0].id = this._id + '-title';
				}
			}
			else { obj[o] = prev; }
		},
		'^prerender': function(obj, o, v) {
			v && !this.rendered && this.render(this.options.show.ready);
		},

		// Content checks
		'^content.text$': function(obj, o, v) {
			this._updateContent(v);
		},
		'^content.attr$': function(obj, o, v, prev) {
			if(this.options.content.text === this.target.attr(prev)) {
				this._updateContent( this.target.attr(v) );
			}
		},
		'^content.title$': function(obj, o, v) {
			// Remove title if content is null
			if(!v) { return this._removeTitle(); }

			// If title isn't already created, create it now and update
			v && !this.elements.title && this._createTitle();
			this._updateTitle(v);
		},
		'^content.button$': function(obj, o, v) {
			this._updateButton(v);
		},
		'^content.title.(text|button)$': function(obj, o, v) {
			this.set('content.'+o, v); // Backwards title.text/button compat
		}, 

		// Position checks
		'^position.(my|at)$': function(obj, o, v){
			'string' === typeof v && (obj[o] = new CORNER(v, o === 'at'));
		},
		'^position.container$': function(obj, o, v){
			this.tooltip.appendTo(v);
		},

		// Show checks
		'^show.ready$': function(obj, o, v) {
			v && (!this.rendered && this.render(TRUE) || this.toggle(TRUE));
		},

		// Style checks
		'^style.classes$': function(obj, o, v, p) {
			this.tooltip.removeClass(p).addClass(v);
		},
		'^style.width|height': function(obj, o, v) {
			this.tooltip.css(o, v);
		},
		'^style.widget|content.title': function() {
			this._setWidget();
		},
		'^style.def': function(obj, o, v) {
			this.tooltip.toggleClass(CLASS_DEFAULT, !!v);
		},

		// Events check
		'^events.(render|show|move|hide|focus|blur)$': function(obj, o, v) {
			tooltip[($.isFunction(v) ? '' : 'un') + 'bind']('tooltip'+o, v);
		},

		// Properties which require event reassignment
		'^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)': function() {
			var posOptions = this.options.position;

			// Set tracking flag
			tooltip.attr('tracking', posOptions.target === 'mouse' && posOptions.adjust.mouse);

			// Reassign events
			this._unassignEvents();
			this._assignEvents();
		}
	}
};

// Dot notation converter
function convertNotation(options, notation) {
	var i = 0, obj, option = options,

	// Split notation into array
	levels = notation.split('.');

	// Loop through
	while( option = option[ levels[i++] ] ) {
		if(i < levels.length) { obj = option; }
	}

	return [obj || options, levels.pop()];
}

PROTOTYPE.get = function(notation) {
	if(this.destroyed) { return this; }

	var o = convertNotation(this.options, notation.toLowerCase()),
		result = o[0][ o[1] ];

	return result.precedance ? result.string() : result;
};

function setCallback(notation, args) {
	var category, rule, match;

	for(category in this.checks) {
		for(rule in this.checks[category]) {
			if(match = (new RegExp(rule, 'i')).exec(notation)) {
				args.push(match);

				if(category === 'builtin' || this.plugins[category]) {
					this.checks[category][rule].apply(
						this.plugins[category] || this, args
					);
				}
			}
		}
	}
}

var rmove = /^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,
	rrender = /^prerender|show\.ready/i;

PROTOTYPE.set = function(option, value) {
	if(this.destroyed) { return this; }

	var rendered = this.rendered,
		reposition = FALSE,
		options = this.options,
		checks = this.checks,
		name;

	// Convert singular option/value pair into object form
	if('string' === typeof option) {
		name = option; option = {}; option[name] = value;
	}
	else { option = $.extend({}, option); }

	// Set all of the defined options to their new values
	$.each(option, function(notation, value) {
		if(!rendered && !rrender.test(notation)) {
			delete option[notation]; return;
		}

		// Set new obj value
		var obj = convertNotation(options, notation.toLowerCase()), previous;
		previous = obj[0][ obj[1] ];
		obj[0][ obj[1] ] = value && value.nodeType ? $(value) : value;

		// Also check if we need to reposition
		reposition = rmove.test(notation) || reposition;

		// Set the new params for the callback
		option[notation] = [obj[0], obj[1], value, previous];
	});

	// Re-sanitize options
	sanitizeOptions(options);

	/*
	 * Execute any valid callbacks for the set options
	 * Also set positioning flag so we don't get loads of redundant repositioning calls.
	 */
	this.positioning = TRUE;
	$.each(option, $.proxy(setCallback, this));
	this.positioning = FALSE;

	// Update position if needed
	if(this.rendered && this.tooltip[0].offsetWidth > 0 && reposition) {
		this.reposition( options.position.target === 'mouse' ? NULL : this.cache.event );
	}

	return this;
};

;PROTOTYPE._update = function(content, element, reposition) {
	var self = this,
		cache = this.cache;

	// Make sure tooltip is rendered and content is defined. If not return
	if(!this.rendered || !content) { return FALSE; }

	// Use function to parse content
	if($.isFunction(content)) {
		content = content.call(this.elements.target, cache.event, this) || '';
	}

	// Handle deferred content
	if($.isFunction(content.then)) {
		cache.waiting = TRUE;
		return content.then(function(c) {
			cache.waiting = FALSE;
			return self._update(c, element, reposition);
		}, NULL, function(e) {
			return self._update(e, element, reposition);
		});
	}

	// If content is null... return false
	if(content === FALSE || (!content && content !== '')) { return FALSE; }

	// Append new content if its a DOM array and show it if hidden
	if(content.jquery && content.length > 0) {
		element.children()
			.detach()
			.end()
		.append( content.css({ display: 'block' }) );
	}

	// Content is a regular string, insert the new content
	else { element.html(content); }

	// Ensure images have loaded...
	cache.waiting = TRUE;
	return element.imagesLoaded()
		.done(function(images) {
			cache.waiting = FALSE;

			// Reposition if rendered
			if(reposition !== FALSE && self.rendered && self.tooltip[0].offsetWidth > 0) {
				self.reposition(cache.event, !images.length);
			}
		})
		.promise();
};

PROTOTYPE._updateContent = function(content, reposition) {
	this._update(content, this.elements.content, reposition);
};

PROTOTYPE._updateTitle = function(content, reposition) {
	if(this._update(content, this.elements.title, reposition) === FALSE) {
		this._removeTitle(FALSE);
	}
};

PROTOTYPE._createTitle = function()
{
	var elements = this.elements,
		id = this._id+'-title';

	// Destroy previous title element, if present
	if(elements.titlebar) { this._removeTitle(); }

	// Create title bar and title elements
	elements.titlebar = $('<div />', {
		'class': NAMESPACE + '-titlebar ' + (this.options.style.widget ? createWidgetClass('header') : '')
	})
	.append(
		elements.title = $('<div />', {
			'id': id,
			'class': NAMESPACE + '-title',
			'aria-atomic': TRUE
		})
	)
	.insertBefore(elements.content)

	// Button-specific events
	.delegate('.qtip-close', 'mousedown keydown mouseup keyup mouseout', function(event) {
		$(this).toggleClass('ui-state-active ui-state-focus', event.type.substr(-4) === 'down');
	})
	.delegate('.qtip-close', 'mouseover mouseout', function(event){
		$(this).toggleClass('ui-state-hover', event.type === 'mouseover');
	});

	// Create button if enabled
	if(this.options.content.button) { this._createButton(); }
};

PROTOTYPE._removeTitle = function(reposition)
{
	var elements = this.elements;

	if(elements.title) {
		elements.titlebar.remove();
		elements.titlebar = elements.title = elements.button = NULL;

		// Reposition if enabled
		if(reposition !== FALSE) { this.reposition(); }
	}
};

;PROTOTYPE.reposition = function(event, effect) {
	if(!this.rendered || this.positioning || this.destroyed) { return this; }

	// Set positioning flag
	this.positioning = TRUE;

	var cache = this.cache,
		tooltip = this.tooltip,
		posOptions = this.options.position,
		target = posOptions.target,
		my = posOptions.my,
		at = posOptions.at,
		viewport = posOptions.viewport,
		container = posOptions.container,
		adjust = posOptions.adjust,
		method = adjust.method.split(' '),
		elemWidth = tooltip.outerWidth(FALSE),
		elemHeight = tooltip.outerHeight(FALSE),
		targetWidth = 0,
		targetHeight = 0,
		type = tooltip.css('position'),
		position = { left: 0, top: 0 },
		visible = tooltip[0].offsetWidth > 0,
		isScroll = event && event.type === 'scroll',
		win = $(window),
		doc = container[0].ownerDocument,
		mouse = this.mouse,
		pluginCalculations, offset;

	// Check if absolute position was passed
	if($.isArray(target) && target.length === 2) {
		// Force left top and set position
		at = { x: LEFT, y: TOP };
		position = { left: target[0], top: target[1] };
	}

	// Check if mouse was the target
	else if(target === 'mouse' && ((event && event.pageX) || cache.event.pageX)) {
		// Force left top to allow flipping
		at = { x: LEFT, y: TOP };

		// Use cached event if one isn't available for positioning
		event = mouse && mouse.pageX && (adjust.mouse || !event || !event.pageX) ? mouse :
			(event && (event.type === 'resize' || event.type === 'scroll') ? cache.event :
			event && event.pageX && event.type === 'mousemove' ? event :
			(!adjust.mouse || this.options.show.distance) && cache.origin && cache.origin.pageX ? cache.origin :
			event) || event || cache.event || mouse || {};

		// Calculate body and container offset and take them into account below
		if(type !== 'static') { position = container.offset(); }
		if(doc.body.offsetWidth !== (window.innerWidth || doc.documentElement.clientWidth)) { offset = $(doc.body).offset(); }

		// Use event coordinates for position
		position = {
			left: event.pageX - position.left + (offset && offset.left || 0),
			top: event.pageY - position.top + (offset && offset.top || 0)
		};

		// Scroll events are a pain, some browsers
		if(adjust.mouse && isScroll) {
			position.left -= mouse.scrollX - win.scrollLeft();
			position.top -= mouse.scrollY - win.scrollTop();
		}
	}

	// Target wasn't mouse or absolute...
	else {
		// Check if event targetting is being used
		if(target === 'event' && event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
			cache.target = $(event.target);
		}
		else if(target !== 'event'){
			cache.target = $(target.jquery ? target : elements.target);
		}
		target = cache.target;

		// Parse the target into a jQuery object and make sure there's an element present
		target = $(target).eq(0);
		if(target.length === 0) { return this; }

		// Check if window or document is the target
		else if(target[0] === document || target[0] === window) {
			targetWidth = BROWSER.iOS ? window.innerWidth : target.width();
			targetHeight = BROWSER.iOS ? window.innerHeight : target.height();

			if(target[0] === window) {
				position = {
					top: (viewport || target).scrollTop(),
					left: (viewport || target).scrollLeft()
				};
			}
		}

		// Check if the target is an <AREA> element
		else if(PLUGINS.imagemap && target.is('area')) {
			pluginCalculations = PLUGINS.imagemap(this, target, at, PLUGINS.viewport ? method : FALSE);
		}

		// Check if the target is an SVG element
		else if(PLUGINS.svg && target[0].ownerSVGElement) {
			pluginCalculations = PLUGINS.svg(this, target, at, PLUGINS.viewport ? method : FALSE);
		}

		// Otherwise use regular jQuery methods
		else {
			targetWidth = target.outerWidth(FALSE);
			targetHeight = target.outerHeight(FALSE);
			position = target.offset();
		}

		// Parse returned plugin values into proper variables
		if(pluginCalculations) {
			targetWidth = pluginCalculations.width;
			targetHeight = pluginCalculations.height;
			offset = pluginCalculations.offset;
			position = pluginCalculations.position;
		}

		// Adjust position to take into account offset parents
		position = this.reposition.offset(target, position, container);

		// Adjust for position.fixed tooltips (and also iOS scroll bug in v3.2-4.0 & v4.3-4.3.2)
		if((BROWSER.iOS > 3.1 && BROWSER.iOS < 4.1) || 
			(BROWSER.iOS >= 4.3 && BROWSER.iOS < 4.33) || 
			(!BROWSER.iOS && type === 'fixed')
		){
			position.left -= win.scrollLeft();
			position.top -= win.scrollTop();
		}

		// Adjust position relative to target
		if(!pluginCalculations || (pluginCalculations && pluginCalculations.adjustable !== FALSE)) {
			position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
			position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0;
		}
	}

	// Adjust position relative to tooltip
	position.left += adjust.x + (my.x === RIGHT ? -elemWidth : my.x === CENTER ? -elemWidth / 2 : 0);
	position.top += adjust.y + (my.y === BOTTOM ? -elemHeight : my.y === CENTER ? -elemHeight / 2 : 0);

	// Use viewport adjustment plugin if enabled
	if(PLUGINS.viewport) {
		position.adjusted = PLUGINS.viewport(
			this, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight
		);

		// Apply offsets supplied by positioning plugin (if used)
		if(offset && position.adjusted.left) { position.left += offset.left; }
		if(offset && position.adjusted.top) {  position.top += offset.top; }
	}

	// Viewport adjustment is disabled, set values to zero
	else { position.adjusted = { left: 0, top: 0 }; }

	// tooltipmove event
	if(!this._trigger('move', [position, viewport.elem || viewport], event)) { return this; }
	delete position.adjusted;

	// If effect is disabled, target it mouse, no animation is defined or positioning gives NaN out, set CSS directly
	if(effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === 'mouse' || !$.isFunction(posOptions.effect)) {
		tooltip.css(position);
	}

	// Use custom function if provided
	else if($.isFunction(posOptions.effect)) {
		posOptions.effect.call(tooltip, this, $.extend({}, position));
		tooltip.queue(function(next) {
			// Reset attributes to avoid cross-browser rendering bugs
			$(this).css({ opacity: '', height: '' });
			if(BROWSER.ie) { this.style.removeAttribute('filter'); }

			next();
		});
	}

	// Set positioning flag
	this.positioning = FALSE;

	return this;
};

// Custom (more correct for qTip!) offset calculator
PROTOTYPE.reposition.offset = function(elem, pos, container) {
	if(!container[0]) { return pos; }

	var ownerDocument = $(elem[0].ownerDocument),
		quirks = !!BROWSER.ie && document.compatMode !== 'CSS1Compat',
		parent = container[0],
		scrolled, position, parentOffset, overflow;

	function scroll(e, i) {
		pos.left += i * e.scrollLeft();
		pos.top += i * e.scrollTop();
	}

	// Compensate for non-static containers offset
	do {
		if((position = $.css(parent, 'position')) !== 'static') {
			if(position === 'fixed') {
				parentOffset = parent.getBoundingClientRect();
				scroll(ownerDocument, -1);
			}
			else {
				parentOffset = $(parent).position();
				parentOffset.left += (parseFloat($.css(parent, 'borderLeftWidth')) || 0);
				parentOffset.top += (parseFloat($.css(parent, 'borderTopWidth')) || 0);
			}

			pos.left -= parentOffset.left + (parseFloat($.css(parent, 'marginLeft')) || 0);
			pos.top -= parentOffset.top + (parseFloat($.css(parent, 'marginTop')) || 0);

			// If this is the first parent element with an overflow of "scroll" or "auto", store it
			if(!scrolled && (overflow = $.css(parent, 'overflow')) !== 'hidden' && overflow !== 'visible') { scrolled = $(parent); }
		}
	}
	while((parent = parent.offsetParent));

	// Compensate for containers scroll if it also has an offsetParent (or in IE quirks mode)
	if(scrolled && (scrolled[0] !== ownerDocument[0] || quirks)) {
		scroll(scrolled, 1);
	}

	return pos;
};

// Corner class
var C = (CORNER = PROTOTYPE.reposition.Corner = function(corner, forceY) {
	corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, CENTER).toLowerCase();
	this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
	this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();
	this.forceY = !!forceY;

	var f = corner.charAt(0);
	this.precedance = (f === 't' || f === 'b' ? Y : X);
}).prototype;

C.invert = function(z, center) {
	this[z] = this[z] === LEFT ? RIGHT : this[z] === RIGHT ? LEFT : center || this[z];	
};

C.string = function() {
	var x = this.x, y = this.y;
	return x === y ? x : this.precedance === Y || (this.forceY && y !== 'center') ? y+' '+x : x+' '+y;
};

C.abbrev = function() {
	var result = this.string().split(' ');
	return result[0].charAt(0) + (result[1] && result[1].charAt(0) || '');
};

C.clone = function() {
	return new CORNER( this.string(), this.forceY );
};;
PROTOTYPE.toggle = function(state, event) {
	var cache = this.cache,
		options = this.options,
		tooltip = this.tooltip;

	// Try to prevent flickering when tooltip overlaps show element
	if(event) {
		if((/over|enter/).test(event.type) && (/out|leave/).test(cache.event.type) &&
			options.show.target.add(event.target).length === options.show.target.length &&
			tooltip.has(event.relatedTarget).length) {
			return this;
		}

		// Cache event
		cache.event = $.extend({}, event);
	}
		
	// If we're currently waiting and we've just hidden... stop it
	this.waiting && !state && (this.hiddenDuringWait = TRUE);

	// Render the tooltip if showing and it isn't already
	if(!this.rendered) { return state ? this.render(1) : this; }
	else if(this.destroyed || this.disabled) { return this; }

	var type = state ? 'show' : 'hide',
		opts = this.options[type],
		otherOpts = this.options[ !state ? 'show' : 'hide' ],
		posOptions = this.options.position,
		contentOptions = this.options.content,
		width = this.tooltip.css('width'),
		visible = this.tooltip[0].offsetWidth > 0,
		animate = state || opts.target.length === 1,
		sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
		identicalState, allow, showEvent, delay;

	// Detect state if valid one isn't provided
	if((typeof state).search('boolean|number')) { state = !visible; }

	// Check if the tooltip is in an identical state to the new would-be state
	identicalState = !tooltip.is(':animated') && visible === state && sameTarget;

	// Fire tooltip(show/hide) event and check if destroyed
	allow = !identicalState ? !!this._trigger(type, [90]) : NULL;

	// If the user didn't stop the method prematurely and we're showing the tooltip, focus it
	if(allow !== FALSE && state) { this.focus(event); }

	// If the state hasn't changed or the user stopped it, return early
	if(!allow || identicalState) { return this; }

	// Set ARIA hidden attribute
	$.attr(tooltip[0], 'aria-hidden', !!!state);

	// Execute state specific properties
	if(state) {
		// Store show origin coordinates
		cache.origin = $.extend({}, this.mouse);

		// Update tooltip content & title if it's a dynamic function
		if($.isFunction(contentOptions.text)) { this._updateContent(contentOptions.text, FALSE); }
		if($.isFunction(contentOptions.title)) { this._updateTitle(contentOptions.title, FALSE); }

		// Cache mousemove events for positioning purposes (if not already tracking)
		if(!trackingBound && posOptions.target === 'mouse' && posOptions.adjust.mouse) {
			$(document).bind('mousemove.'+NAMESPACE, this._storeMouse);
			trackingBound = TRUE;
		}

		// Update the tooltip position (set width first to prevent viewport/max-width issues)
		if(!width) { tooltip.css('width', tooltip.outerWidth(FALSE)); }
		this.reposition(event, arguments[2]);
		if(!width) { tooltip.css('width', ''); }

		// Hide other tooltips if tooltip is solo
		if(!!opts.solo) {
			(typeof opts.solo === 'string' ? $(opts.solo) : $(SELECTOR, opts.solo))
				.not(tooltip).not(opts.target).qtip('hide', $.Event('tooltipsolo'));
		}
	}
	else {
		// Clear show timer if we're hiding
		clearTimeout(this.timers.show);

		// Remove cached origin on hide
		delete cache.origin;

		// Remove mouse tracking event if not needed (all tracking qTips are hidden)
		if(trackingBound && !$(SELECTOR+'[tracking="true"]:visible', opts.solo).not(tooltip).length) {
			$(document).unbind('mousemove.'+NAMESPACE);
			trackingBound = FALSE;
		}

		// Blur the tooltip
		this.blur(event);
	}

	// Define post-animation, state specific properties
	after = $.proxy(function() {
		if(state) {
			// Prevent antialias from disappearing in IE by removing filter
			if(BROWSER.ie) { tooltip[0].style.removeAttribute('filter'); }

			// Remove overflow setting to prevent tip bugs
			tooltip.css('overflow', '');

			// Autofocus elements if enabled
			if('string' === typeof opts.autofocus) {
				$(this.options.show.autofocus, tooltip).focus();
			}

			// If set, hide tooltip when inactive for delay period
			this.options.show.target.trigger('qtip-'+this.id+'-inactive');
		}
		else {
			// Reset CSS states
			tooltip.css({
				display: '',
				visibility: '',
				opacity: '',
				left: '',
				top: ''
			});
		}

		// tooltipvisible/tooltiphidden events
		this._trigger(state ? 'visible' : 'hidden');
	}, this);

	// If no effect type is supplied, use a simple toggle
	if(opts.effect === FALSE || animate === FALSE) {
		tooltip[ type ]();
		after();
	}

	// Use custom function if provided
	else if($.isFunction(opts.effect)) {
		tooltip.stop(1, 1);
		opts.effect.call(tooltip, this);
		tooltip.queue('fx', function(n) {
			after(); n();
		});
	}

	// Use basic fade function by default
	else { tooltip.fadeTo(90, state ? 1 : 0, after); }

	// If inactive hide method is set, active it
	if(state) { opts.target.trigger('qtip-'+this.id+'-inactive'); }

	return this;
};

PROTOTYPE.show = function(event) { return this.toggle(TRUE, event); };

PROTOTYPE.hide = function(event) { return this.toggle(FALSE, event); };

;PROTOTYPE.focus = function(event) {
	if(!this.rendered || this.destroyed) { return this; }

	var qtips = $(SELECTOR),
		tooltip = this.tooltip,
		curIndex = parseInt(tooltip[0].style.zIndex, 10),
		newIndex = QTIP.zindex + qtips.length,
		focusedElem;

	// Only update the z-index if it has changed and tooltip is not already focused
	if(!tooltip.hasClass(CLASS_FOCUS)) {
		// tooltipfocus event
		if(this._trigger('focus', [newIndex], event)) {
			// Only update z-index's if they've changed
			if(curIndex !== newIndex) {
				// Reduce our z-index's and keep them properly ordered
				qtips.each(function() {
					if(this.style.zIndex > curIndex) {
						this.style.zIndex = this.style.zIndex - 1;
					}
				});

				// Fire blur event for focused tooltip
				qtips.filter('.' + CLASS_FOCUS).qtip('blur', event);
			}

			// Set the new z-index
			tooltip.addClass(CLASS_FOCUS)[0].style.zIndex = newIndex;
		}
	}

	return this;
};

PROTOTYPE.blur = function(event) {
	if(!this.rendered || this.destroyed) { return this; }

	// Set focused status to FALSE
	this.tooltip.removeClass(CLASS_FOCUS);

	// tooltipblur event
	this._trigger('blur', [ this.tooltip.css('zIndex') ], event);

	return this;
};

;PROTOTYPE.disable = function(state) {
	if(this.destroyed) { return this; }

	if('boolean' !== typeof state) {
		state = !(this.tooltip.hasClass(CLASS_DISABLED) || this.disabled);
	}

	if(this.rendered) {
		this.tooltip.toggleClass(CLASS_DISABLED, state)
			.attr('aria-disabled', state);
	}

	this.disabled = !!state;

	return this;
};

PROTOTYPE.enable = function() { return this.disable(FALSE); };

;PROTOTYPE._createButton = function()
{
	var self = this,
		elements = this.elements,
		tooltip = elements.tooltip,
		button = this.options.content.button,
		isString = typeof button === 'string',
		close = isString ? button : 'Close tooltip';

	if(elements.button) { elements.button.remove(); }

	// Use custom button if one was supplied by user, else use default
	if(button.jquery) {
		elements.button = button;
	}
	else {
		elements.button = $('<a />', {
			'class': 'qtip-close ' + (this.options.style.widget ? '' : NAMESPACE+'-icon'),
			'title': close,
			'aria-label': close
		})
		.prepend(
			$('<span />', {
				'class': 'ui-icon ui-icon-close',
				'html': '&times;'
			})
		);
	}

	// Create button and setup attributes
	elements.button.appendTo(elements.titlebar || tooltip)
		.attr('role', 'button')
		.click(function(event) {
			if(!tooltip.hasClass(CLASS_DISABLED)) { self.hide(event); }
			return FALSE;
		});
};

PROTOTYPE._updateButton = function(button)
{
	// Make sure tooltip is rendered and if not, return
	if(!this.rendered) { return FALSE; }

	var elem = this.elements.button;
	if(button) { this._createButton(); }
	else { elem.remove(); }
};

;// Widget class creator
function createWidgetClass(cls) {
	return WIDGET.concat('').join(cls ? '-'+cls+' ' : ' ');
}

// Widget class setter method
PROTOTYPE._setWidget = function()
{
	var on = this.options.style.widget,
		elements = this.elements,
		tooltip = elements.tooltip,
		disabled = tooltip.hasClass(CLASS_DISABLED);

	tooltip.removeClass(CLASS_DISABLED);
	CLASS_DISABLED = on ? 'ui-state-disabled' : 'qtip-disabled';
	tooltip.toggleClass(CLASS_DISABLED, disabled);

	tooltip.toggleClass('ui-helper-reset '+createWidgetClass(), on).toggleClass(CLASS_DEFAULT, this.options.style.def && !on);
	
	if(elements.content) {
		elements.content.toggleClass( createWidgetClass('content'), on);
	}
	if(elements.titlebar) {
		elements.titlebar.toggleClass( createWidgetClass('header'), on);
	}
	if(elements.button) {
		elements.button.toggleClass(NAMESPACE+'-icon', !on);
	}
};;function showMethod(event) {
	if(this.tooltip.hasClass(CLASS_DISABLED)) { return FALSE; }

	// Clear hide timers
	clearTimeout(this.timers.show);
	clearTimeout(this.timers.hide);

	// Start show timer
	var callback = $.proxy(function(){ this.toggle(TRUE, event); }, this);
	if(this.options.show.delay > 0) {
		this.timers.show = setTimeout(callback, this.options.show.delay);
	}
	else{ callback(); }
}

function hideMethod(event) {
	if(this.tooltip.hasClass(CLASS_DISABLED)) { return FALSE; }

	// Check if new target was actually the tooltip element
	var relatedTarget = $(event.relatedTarget),
		ontoTooltip = relatedTarget.closest(SELECTOR)[0] === this.tooltip[0],
		ontoTarget = relatedTarget[0] === this.options.show.target[0];

	// Clear timers and stop animation queue
	clearTimeout(this.timers.show);
	clearTimeout(this.timers.hide);

	// Prevent hiding if tooltip is fixed and event target is the tooltip.
	// Or if mouse positioning is enabled and cursor momentarily overlaps
	if(this !== relatedTarget[0] && 
		(this.options.position.target === 'mouse' && ontoTooltip) || 
		(this.options.hide.fixed && (
			(/mouse(out|leave|move)/).test(event.type) && (ontoTooltip || ontoTarget))
		))
	{
		try {
			event.preventDefault();
			event.stopImmediatePropagation();
		} catch(e) {}

		return;
	}

	// If tooltip has displayed, start hide timer
	var callback = $.proxy(function(){ this.toggle(FALSE, event); }, this);
	if(this.options.hide.delay > 0) {
		this.timers.hide = setTimeout(callback, this.options.hide.delay);
	}
	else{ callback(); }
}

function inactiveMethod(event) {
	if(this.tooltip.hasClass(CLASS_DISABLED) || !this.options.hide.inactive) { return FALSE; }

	// Clear timer
	clearTimeout(this.timers.inactive);
	this.timers.inactive = setTimeout(
		$.proxy(function(){ this.hide(event); }, this), this.options.hide.inactive
	);
}

function repositionMethod(event) {
	if(this.rendered && this.tooltip[0].offsetWidth > 0) { this.reposition(event); }
}

// Store mouse coordinates
PROTOTYPE._storeMouse = function(event) {
	this.mouse = {
		pageX: event.pageX,
		pageY: event.pageY,
		type: 'mousemove',
		scrollX: window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
		scrollY: window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
	};
};

// Bind events
PROTOTYPE._bind = function(targets, events, method, suffix, context) {
	var ns = '.' + this._id + (suffix ? '-'+suffix : '');
	events.length && $(targets).bind(
		(events.split ? events : events.join(ns + ' ')) + ns,
		$.proxy(method, context || this)
	);
};
PROTOTYPE._unbind = function(targets, suffix) {
	$(targets).unbind('.' + this._id + (suffix ? '-'+suffix : ''));
};

// Apply common event handlers using delegate (avoids excessive .bind calls!)
var ns = '.'+NAMESPACE;
function delegate(selector, events, method) {	
	$(document.body).delegate(selector,
		(events.split ? events : events.join(ns + ' ')) + ns,
		function() {
			var api = QTIP.api[ $.attr(this, ATTR_ID) ];
			api && !api.disabled && method.apply(api, arguments);
		}
	);
}

$(function() {
	delegate(SELECTOR, ['mouseenter', 'mouseleave'], function(event) {
		var state = event.type === 'mouseenter',
			tooltip = $(event.currentTarget),
			target = $(event.relatedTarget || event.target),
			options = this.options;

		// On mouseenter...
		if(state) {
			// Focus the tooltip on mouseenter (z-index stacking)
			this.focus(event);

			// Clear hide timer on tooltip hover to prevent it from closing
			tooltip.hasClass(CLASS_FIXED) && !tooltip.hasClass(CLASS_DISABLED) && clearTimeout(this.timers.hide);
		}

		// On mouseleave...
		else {
			// Hide when we leave the tooltip and not onto the show target (if a hide event is set)
			if(options.position.target === 'mouse' && options.hide.event && 
				options.show.target && !target.closest(options.show.target[0]).length) {
				this.hide(event);
			}
		}

		// Add hover class
		tooltip.toggleClass(CLASS_HOVER, state);
	});

	// Define events which reset the 'inactive' event handler
	delegate('['+ATTR_ID+']', INACTIVE_EVENTS, inactiveMethod);
});

// Event trigger
PROTOTYPE._trigger = function(type, args, event) {
	var callback = $.Event('tooltip'+type);
	callback.originalEvent = (event && $.extend({}, event)) || this.cache.event || NULL;

	this.triggering = TRUE;
	this.tooltip.trigger(callback, [this].concat(args || []));
	this.triggering = FALSE;

	return !callback.isDefaultPrevented();
};

// Event assignment method
PROTOTYPE._assignEvents = function() {
	var options = this.options,
		posOptions = options.position,

		tooltip = this.tooltip,
		showTarget = options.show.target,
		hideTarget = options.hide.target,
		containerTarget = posOptions.container,
		viewportTarget = posOptions.viewport,
		documentTarget = $(document),
		bodyTarget = $(document.body),
		windowTarget = $(window),

		showEvents = options.show.event ? $.trim('' + options.show.event).split(' ') : [],
		hideEvents = options.hide.event ? $.trim('' + options.hide.event).split(' ') : [],
		toggleEvents = [];

	// Hide tooltips when leaving current window/frame (but not select/option elements)
	if(/mouse(out|leave)/i.test(options.hide.event) && options.hide.leave === 'window') {
		this._bind(documentTarget, ['mouseout', 'blur'], function(event) {
			if(!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
				this.hide(event);
			}
		});
	}

	// Enable hide.fixed by adding appropriate class
	if(options.hide.fixed) {
		hideTarget = hideTarget.add( tooltip.addClass(CLASS_FIXED) );
	}

	/*
	 * Make sure hoverIntent functions properly by using mouseleave to clear show timer if
	 * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
	 */
	else if(/mouse(over|enter)/i.test(options.show.event)) {
		this._bind(hideTarget, 'mouseleave', function() {
			clearTimeout(this.timers.show);
		});
	}

	// Hide tooltip on document mousedown if unfocus events are enabled
	if(('' + options.hide.event).indexOf('unfocus') > -1) {
		this._bind(containerTarget.closest('html'), ['mousedown', 'touchstart'], function(event) {
			var elem = $(event.target),
				enabled = this.rendered && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0,
				isAncestor = elem.parents(SELECTOR).filter(this.tooltip[0]).length > 0;

			if(elem[0] !== this.target[0] && elem[0] !== this.tooltip[0] && !isAncestor &&
				!this.target.has(elem[0]).length && enabled
			) {
				this.hide(event);
			}
		});
	}

	// Check if the tooltip hides when inactive
	if('number' === typeof options.hide.inactive) {
		// Bind inactive method to show target(s) as a custom event
		this._bind(showTarget, 'qtip-'+this.id+'-inactive', inactiveMethod);

		// Define events which reset the 'inactive' event handler
		this._bind(hideTarget.add(tooltip), QTIP.inactiveEvents, inactiveMethod, '-inactive');
	}

	// Apply hide events (and filter identical show events)
	hideEvents = $.map(hideEvents, function(type) {
		var showIndex = $.inArray(type, showEvents);

		// Both events and targets are identical, apply events using a toggle
		if((showIndex > -1 && hideTarget.add(showTarget).length === hideTarget.length)) {
			toggleEvents.push( showEvents.splice( showIndex, 1 )[0] ); return;
		}

		return type;
	});

	// Apply show/hide/toggle events
	this._bind(showTarget, showEvents, showMethod);
	this._bind(hideTarget, hideEvents, hideMethod);
	this._bind(showTarget, toggleEvents, function(event) {
		(this.tooltip[0].offsetWidth > 0 ? hideMethod : showMethod).call(this, event);
	});


	// Mouse movement bindings
	this._bind(showTarget.add(tooltip), 'mousemove', function(event) {
		// Check if the tooltip hides when mouse is moved a certain distance
		if('number' === typeof options.hide.distance) {
			var origin = this.cache.origin || {},
				limit = this.options.hide.distance,
				abs = Math.abs;

			// Check if the movement has gone beyond the limit, and hide it if so
			if(abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
				this.hide(event);
			}
		}

		// Cache mousemove coords on show targets
		this._storeMouse(event);
	});

	// Mouse positioning events
	if(posOptions.target === 'mouse') {
		// If mouse adjustment is on...
		if(posOptions.adjust.mouse) {
			// Apply a mouseleave event so we don't get problems with overlapping
			if(options.hide.event) {
				// Track if we're on the target or not
				this._bind(showTarget, ['mouseenter', 'mouseleave'], function(event) {
					this.cache.onTarget = event.type === 'mouseenter';
				});
			}

			// Update tooltip position on mousemove
			this._bind(documentTarget, 'mousemove', function(event) {
				// Update the tooltip position only if the tooltip is visible and adjustment is enabled
				if(this.rendered && this.cache.onTarget && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0) {
					this.reposition(event);
				}
			});
		}
	}

	// Adjust positions of the tooltip on window resize if enabled
	if(posOptions.adjust.resize || viewportTarget.length) {
		this._bind( $.event.special.resize ? viewportTarget : windowTarget, 'resize', repositionMethod );
	}

	// Adjust tooltip position on scroll of the window or viewport element if present
	if(posOptions.adjust.scroll) {
		this._bind( windowTarget.add(posOptions.container), 'scroll', repositionMethod );
	}
};

// Un-assignment method
PROTOTYPE._unassignEvents = function() {
	var targets = [
		this.options.show.target[0],
		this.options.hide.target[0],
		this.rendered && this.tooltip[0],
		this.options.position.container[0],
		this.options.position.viewport[0],
		this.options.position.container.closest('html')[0], // unfocus
		window,
		document
	];

	// Check if tooltip is rendered
	if(this.rendered) {
		this._unbind($([]).pushStack( $.grep(targets, function(i) {
			return typeof i === 'object';
		})));
	}

	// Tooltip isn't yet rendered, remove render event
	else { $(targets[0]).unbind('.'+this._id+'-create'); }
};

;// Initialization method
function init(elem, id, opts)
{
	var obj, posOptions, attr, config, title,

	// Setup element references
	docBody = $(document.body),

	// Use document body instead of document element if needed
	newTarget = elem[0] === document ? docBody : elem,

	// Grab metadata from element if plugin is present
	metadata = (elem.metadata) ? elem.metadata(opts.metadata) : NULL,

	// If metadata type if HTML5, grab 'name' from the object instead, or use the regular data object otherwise
	metadata5 = opts.metadata.type === 'html5' && metadata ? metadata[opts.metadata.name] : NULL,

	// Grab data from metadata.name (or data-qtipopts as fallback) using .data() method,
	html5 = elem.data(opts.metadata.name || 'qtipopts');

	// If we don't get an object returned attempt to parse it manualyl without parseJSON
	try { html5 = typeof html5 === 'string' ? $.parseJSON(html5) : html5; } catch(e) {}

	// Merge in and sanitize metadata
	config = $.extend(TRUE, {}, QTIP.defaults, opts,
		typeof html5 === 'object' ? sanitizeOptions(html5) : NULL,
		sanitizeOptions(metadata5 || metadata));

	// Re-grab our positioning options now we've merged our metadata and set id to passed value
	posOptions = config.position;
	config.id = id;

	// Setup missing content if none is detected
	if('boolean' === typeof config.content.text) {
		attr = elem.attr(config.content.attr);

		// Grab from supplied attribute if available
		if(config.content.attr !== FALSE && attr) { config.content.text = attr; }

		// No valid content was found, abort render
		else { return FALSE; }
	}

	// Setup target options
	if(!posOptions.container.length) { posOptions.container = docBody; }
	if(posOptions.target === FALSE) { posOptions.target = newTarget; }
	if(config.show.target === FALSE) { config.show.target = newTarget; }
	if(config.show.solo === TRUE) { config.show.solo = posOptions.container.closest('body'); }
	if(config.hide.target === FALSE) { config.hide.target = newTarget; }
	if(config.position.viewport === TRUE) { config.position.viewport = posOptions.container; }

	// Ensure we only use a single container
	posOptions.container = posOptions.container.eq(0);

	// Convert position corner values into x and y strings
	posOptions.at = new CORNER(posOptions.at, TRUE);
	posOptions.my = new CORNER(posOptions.my);

	// Destroy previous tooltip if overwrite is enabled, or skip element if not
	if(elem.data(NAMESPACE)) {
		if(config.overwrite) {
			elem.qtip('destroy');
		}
		else if(config.overwrite === FALSE) {
			return FALSE;
		}
	}

	// Add has-qtip attribute
	elem.attr(ATTR_HAS, id);

	// Remove title attribute and store it if present
	if(config.suppress && (title = elem.attr('title'))) {
		// Final attr call fixes event delegatiom and IE default tooltip showing problem
		elem.removeAttr('title').attr(oldtitle, title).attr('title', '');
	}

	// Initialize the tooltip and add API reference
	obj = new QTip(elem, config, id, !!attr);
	elem.data(NAMESPACE, obj);

	// Catch remove/removeqtip events on target element to destroy redundant tooltip
	elem.one('remove.qtip-'+id+' removeqtip.qtip-'+id, function() { 
		var api; if((api = $(this).data(NAMESPACE))) { api.destroy(); }
	});

	return obj;
}

// jQuery $.fn extension method
QTIP = $.fn.qtip = function(options, notation, newValue)
{
	var command = ('' + options).toLowerCase(), // Parse command
		returned = NULL,
		args = $.makeArray(arguments).slice(1),
		event = args[args.length - 1],
		opts = this[0] ? $.data(this[0], NAMESPACE) : NULL;

	// Check for API request
	if((!arguments.length && opts) || command === 'api') {
		return opts;
	}

	// Execute API command if present
	else if('string' === typeof options)
	{
		this.each(function()
		{
			var api = $.data(this, NAMESPACE);
			if(!api) { return TRUE; }

			// Cache the event if possible
			if(event && event.timeStamp) { api.cache.event = event; }

			// Check for specific API commands
			if(notation && (command === 'option' || command === 'options')) {
				if(newValue !== undefined || $.isPlainObject(notation)) {
					api.set(notation, newValue);
				}
				else {
					returned = api.get(notation);
					return FALSE;
				}
			}

			// Execute API command
			else if(api[command]) {
				api[command].apply(api, args);
			}
		});

		return returned !== NULL ? returned : this;
	}

	// No API commands. validate provided options and setup qTips
	else if('object' === typeof options || !arguments.length)
	{
		opts = sanitizeOptions($.extend(TRUE, {}, options));

		// Bind the qTips
		return QTIP.bind.call(this, opts, event);
	}
};

// $.fn.qtip Bind method
QTIP.bind = function(opts, event)
{
	return this.each(function(i) {
		var options, targets, events, namespace, api, id;

		// Find next available ID, or use custom ID if provided
		id = $.isArray(opts.id) ? opts.id[i] : opts.id;
		id = !id || id === FALSE || id.length < 1 || QTIP.api[id] ? QTIP.nextid++ : id;

		// Setup events namespace
		namespace = '.qtip-'+id+'-create';

		// Initialize the qTip and re-grab newly sanitized options
		api = init($(this), id, opts);
		if(api === FALSE) { return TRUE; }
		else { QTIP.api[id] = api; }
		options = api.options;

		// Initialize plugins
		$.each(PLUGINS, function() {
			if(this.initialize === 'initialize') { this(api); }
		});

		// Determine hide and show targets
		targets = { show: options.show.target, hide: options.hide.target };
		events = {
			show: $.trim('' + options.show.event).replace(/ /g, namespace+' ') + namespace,
			hide: $.trim('' + options.hide.event).replace(/ /g, namespace+' ') + namespace
		};

		/*
		 * Make sure hoverIntent functions properly by using mouseleave as a hide event if
		 * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
		 */
		if(/mouse(over|enter)/i.test(events.show) && !/mouse(out|leave)/i.test(events.hide)) {
			events.hide += ' mouseleave' + namespace;
		}

		/*
		 * Also make sure initial mouse targetting works correctly by caching mousemove coords
		 * on show targets before the tooltip has rendered.
		 *
		 * Also set onTarget when triggered to keep mouse tracking working
		 */
		targets.show.bind('mousemove'+namespace, function(event) {
			api._storeMouse(event);
			api.cache.onTarget = TRUE;
		});

		// Define hoverIntent function
		function hoverIntent(event) {
			function render() {
				// Cache mouse coords,render and render the tooltip
				api.render(typeof event === 'object' || options.show.ready);

				// Unbind show and hide events
				targets.show.add(targets.hide).unbind(namespace);
			}

			// Only continue if tooltip isn't disabled
			if(api.disabled) { return FALSE; }

			// Cache the event data
			api.cache.event = $.extend({}, event);
			api.cache.target = event ? $(event.target) : [undefined];

			// Start the event sequence
			if(options.show.delay > 0) {
				clearTimeout(api.timers.show);
				api.timers.show = setTimeout(render, options.show.delay);
				if(events.show !== events.hide) {
					targets.hide.bind(events.hide, function() { clearTimeout(api.timers.show); });
				}
			}
			else { render(); }
		}

		// Bind show events to target
		targets.show.bind(events.show, hoverIntent);

		// Prerendering is enabled, create tooltip now
		if(options.show.ready || options.prerender) { hoverIntent(event); }
	});
};

// Populated in render method
QTIP.api = {};
;$.each({
	/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
	attr: function(attr, val) {
		if(this.length) {
			var self = this[0],
				title = 'title',
				api = $.data(self, 'qtip');

			if(attr === title && api && 'object' === typeof api && api.options.suppress) {
				if(arguments.length < 2) {
					return $.attr(self, oldtitle);
				}

				// If qTip is rendered and title was originally used as content, update it
				if(api && api.options.content.attr === title && api.cache.attr) {
					api.set('content.text', val);
				}

				// Use the regular attr method to set, then cache the result
				return this.attr(oldtitle, val);
			}
		}

		return $.fn['attr'+replaceSuffix].apply(this, arguments);
	},

	/* Allow clone to correctly retrieve cached title attributes */
	clone: function(keepData) {
		var titles = $([]), title = 'title',

		// Clone our element using the real clone method
		elems = $.fn['clone'+replaceSuffix].apply(this, arguments);

		// Grab all elements with an oldtitle set, and change it to regular title attribute, if keepData is false
		if(!keepData) {
			elems.filter('['+oldtitle+']').attr('title', function() {
				return $.attr(this, oldtitle);
			})
			.removeAttr(oldtitle);
		}

		return elems;
	}
}, function(name, func) {
	if(!func || $.fn[name+replaceSuffix]) { return TRUE; }

	var old = $.fn[name+replaceSuffix] = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || old.apply(this, arguments);
	};
});

/* Fire off 'removeqtip' handler in $.cleanData if jQuery UI not present (it already does similar).
 * This snippet is taken directly from jQuery UI source code found here:
 *     http://code.jquery.com/ui/jquery-ui-git.js
 */
if(!$.ui) {
	$['cleanData'+replaceSuffix] = $.cleanData;
	$.cleanData = function( elems ) {
		for(var i = 0, elem; (elem = $( elems[i] )).length && elem.attr(ATTR_ID); i++) {
			try { elem.triggerHandler('removeqtip'); }
			catch( e ) {}
		}
		$['cleanData'+replaceSuffix]( elems );
	};
}

;// qTip version
QTIP.version = '2.0.1-101';

// Base ID for all qTips
QTIP.nextid = 0;

// Inactive events array
QTIP.inactiveEvents = INACTIVE_EVENTS;

// Base z-index for all qTips
QTIP.zindex = 15000;

// Define configuration defaults
QTIP.defaults = {
	prerender: FALSE,
	id: FALSE,
	overwrite: TRUE,
	suppress: TRUE,
	content: {
		text: TRUE,
		attr: 'title',
		title: FALSE,
		button: FALSE
	},
	position: {
		my: 'top left',
		at: 'bottom right',
		target: FALSE,
		container: FALSE,
		viewport: FALSE,
		adjust: {
			x: 0, y: 0,
			mouse: TRUE,
			scroll: TRUE,
			resize: TRUE,
			method: 'flipinvert flipinvert'
		},
		effect: function(api, pos, viewport) {
			$(this).animate(pos, {
				duration: 200,
				queue: FALSE
			});
		}
	},
	show: {
		target: FALSE,
		event: 'mouseenter',
		effect: TRUE,
		delay: 90,
		solo: FALSE,
		ready: FALSE,
		autofocus: FALSE
	},
	hide: {
		target: FALSE,
		event: 'mouseleave',
		effect: TRUE,
		delay: 0,
		fixed: FALSE,
		inactive: FALSE,
		leave: 'window',
		distance: FALSE
	},
	style: {
		classes: '',
		widget: FALSE,
		width: FALSE,
		height: FALSE,
		def: TRUE
	},
	events: {
		render: NULL,
		move: NULL,
		show: NULL,
		hide: NULL,
		toggle: NULL,
		visible: NULL,
		hidden: NULL,
		focus: NULL,
		blur: NULL
	}
};

;PLUGINS.viewport = function(api, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight)
{
	var target = posOptions.target,
		tooltip = api.elements.tooltip,
		my = posOptions.my,
		at = posOptions.at,
		adjust = posOptions.adjust,
		method = adjust.method.split(' '),
		methodX = method[0],
		methodY = method[1] || method[0],
		viewport = posOptions.viewport,
		container = posOptions.container,
		cache = api.cache,
		tip = api.plugins.tip,
		adjusted = { left: 0, top: 0 },
		fixed, newMy, newClass;

	// If viewport is not a jQuery element, or it's the window/document or no adjustment method is used... return
	if(!viewport.jquery || target[0] === window || target[0] === document.body || adjust.method === 'none') {
		return adjusted;
	}

	// Cache our viewport details
	fixed = tooltip.css('position') === 'fixed';
	viewport = {
		elem: viewport,
		width: viewport[0] === window ? viewport.width() : viewport.outerWidth(FALSE),
		height: viewport[0] === window ? viewport.height() : viewport.outerHeight(FALSE),
		scrollleft: fixed ? 0 : viewport.scrollLeft(),
		scrolltop: fixed ? 0 : viewport.scrollTop(),
		offset: viewport.offset() || { left: 0, top: 0 }
	};
	container = {
		elem: container,
		scrollLeft: container.scrollLeft(),
		scrollTop: container.scrollTop(),
		offset: container.offset() || { left: 0, top: 0 }
	};

	// Generic calculation method
	function calculate(side, otherSide, type, adjust, side1, side2, lengthName, targetLength, elemLength) {
		var initialPos = position[side1],
			mySide = my[side], atSide = at[side],
			isShift = type === SHIFT,
			viewportScroll = -container.offset[side1] + viewport.offset[side1] + viewport['scroll'+side1],
			myLength = mySide === side1 ? elemLength : mySide === side2 ? -elemLength : -elemLength / 2,
			atLength = atSide === side1 ? targetLength : atSide === side2 ? -targetLength : -targetLength / 2,
			tipLength = tip && tip.size ? tip.size[lengthName] || 0 : 0,
			tipAdjust = tip && tip.corner && tip.corner.precedance === side && !isShift ? tipLength : 0,
			overflow1 = viewportScroll - initialPos + tipAdjust,
			overflow2 = initialPos + elemLength - viewport[lengthName] - viewportScroll + tipAdjust,
			offset = myLength - (my.precedance === side || mySide === my[otherSide] ? atLength : 0) - (atSide === CENTER ? targetLength / 2 : 0);

		// shift
		if(isShift) {
			tipAdjust = tip && tip.corner && tip.corner.precedance === otherSide ? tipLength : 0;
			offset = (mySide === side1 ? 1 : -1) * myLength - tipAdjust;

			// Adjust position but keep it within viewport dimensions
			position[side1] += overflow1 > 0 ? overflow1 : overflow2 > 0 ? -overflow2 : 0;
			position[side1] = Math.max(
				-container.offset[side1] + viewport.offset[side1] + (tipAdjust && tip.corner[side] === CENTER ? tip.offset : 0),
				initialPos - offset,
				Math.min(
					Math.max(-container.offset[side1] + viewport.offset[side1] + viewport[lengthName], initialPos + offset),
					position[side1]
				)
			);
		}

		// flip/flipinvert
		else {
			// Update adjustment amount depending on if using flipinvert or flip
			adjust *= (type === FLIPINVERT ? 2 : 0);

			// Check for overflow on the left/top
			if(overflow1 > 0 && (mySide !== side1 || overflow2 > 0)) {
				position[side1] -= offset + adjust;
				newMy.invert(side, side1);
			}

			// Check for overflow on the bottom/right
			else if(overflow2 > 0 && (mySide !== side2 || overflow1 > 0)  ) {
				position[side1] -= (mySide === CENTER ? -offset : offset) + adjust;
				newMy.invert(side, side2);
			}

			// Make sure we haven't made things worse with the adjustment and reset if so
			if(position[side1] < viewportScroll && -position[side1] > overflow2) {
				position[side1] = initialPos; newMy = my.clone();
			}
		}

		return position[side1] - initialPos;
	}

	// Set newMy if using flip or flipinvert methods
	if(methodX !== 'shift' || methodY !== 'shift') { newMy = my.clone(); }

	// Adjust position based onviewport and adjustment options
	adjusted = {
		left: methodX !== 'none' ? calculate( X, Y, methodX, adjust.x, LEFT, RIGHT, WIDTH, targetWidth, elemWidth ) : 0,
		top: methodY !== 'none' ? calculate( Y, X, methodY, adjust.y, TOP, BOTTOM, HEIGHT, targetHeight, elemHeight ) : 0
	};

	// Set tooltip position class if it's changed
	if(newMy && cache.lastClass !== (newClass = NAMESPACE + '-pos-' + newMy.abbrev())) {
		tooltip.removeClass(api.cache.lastClass).addClass( (api.cache.lastClass = newClass) );
	}

	return adjusted;
};;})(jQuery);





/*!
 * jQuery imagesLoaded plugin v2.1.1
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

/*jshint curly: true, eqeqeq: true, noempty: true, strict: true, undef: true, browser: true */
/*global jQuery: false */

;(function($, undefined) {


// blank image data-uri bypasses webkit log warning (thx doug jones)
var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function( callback ) {
	var $this = this,
		deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
		hasNotify = $.isFunction(deferred.notify),
		$images = $this.find('img').add( $this.filter('img') ),
		loaded = [],
		proper = [],
		broken = [];

	// Register deferred callbacks
	if ($.isPlainObject(callback)) {
		$.each(callback, function (key, value) {
			if (key === 'callback') {
				callback = value;
			} else if (deferred) {
				deferred[key](value);
			}
		});
	}

	function doneLoading() {
		var $proper = $(proper),
			$broken = $(broken);

		if ( deferred ) {
			if ( broken.length ) {
				deferred.reject( $images, $proper, $broken );
			} else {
				deferred.resolve( $images );
			}
		}

		if ( $.isFunction( callback ) ) {
			callback.call( $this, $images, $proper, $broken );
		}
	}

	function imgLoadedHandler( event ) {
		imgLoaded( event.target, event.type === 'error' );
	}

	function imgLoaded( img, isBroken ) {
		// don't proceed if BLANK image, or image is already loaded
		if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
			return;
		}

		// store element in loaded images array
		loaded.push( img );

		// keep track of broken and properly loaded images
		if ( isBroken ) {
			broken.push( img );
		} else {
			proper.push( img );
		}

		// cache image and its state for future calls
		$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

		// trigger deferred progress method if present
		if ( hasNotify ) {
			deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
		}

		// call doneLoading and clean listeners if all images are loaded
		if ( $images.length === loaded.length ) {
			setTimeout( doneLoading );
			$images.unbind( '.imagesLoaded', imgLoadedHandler );
		}
	}

	// if no images, trigger immediately
	if ( !$images.length ) {
		doneLoading();
	} else {
		$images.bind( 'load.imagesLoaded error.imagesLoaded', imgLoadedHandler )
		.each( function( i, el ) {
			var src = el.src;

			// find out if this image has been already checked for status
			// if it was, and src has not changed, call imgLoaded on it
			var cached = $.data( el, 'imagesLoaded' );
			if ( cached && cached.src === src ) {
				imgLoaded( el, cached.isBroken );
				return;
			}

			// if complete is true and browser supports natural sizes, try
			// to check for image status manually
			if ( el.complete && el.naturalWidth !== undefined ) {
				imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
				return;
			}

			// cached images don't fire load sometimes, so we reset src, but only when
			// dealing with IE, or image is complete (loaded) and failed manual check
			// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
			if ( el.readyState || el.complete ) {
				el.src = BLANK;
				el.src = src;
			}
		});
	}

	return deferred ? deferred.promise( $this ) : $this;
};

})(jQuery);
define("plugins/tooltip/jquery.qtip", function(){});

/**
 *  Zebra_DatePicker
 *
 *  Zebra_DatePicker is a small, compact and highly configurable date picker plugin for jQuery
 *
 *  Visit {@link http://stefangabos.ro/jquery/zebra-datepicker/} for more information.
 *
 *  For more resources visit {@link http://stefangabos.ro/}
 *
 *  @author     Stefan Gabos <contact@stefangabos.ro>
 *  @version    1.7.7 (last revision: May 26, 2013)
 *  @copyright  (c) 2011 - 2013 Stefan Gabos
 *  @license    http://www.gnu.org/licenses/lgpl-3.0.txt GNU LESSER GENERAL PUBLIC LICENSE
 *  @package    Zebra_DatePicker
 */
;(function($) {

    $.Zebra_DatePicker = function(element, options) {

        var defaults = {

            //  by default, the button for clearing a previously selected date is shown only if a previously selected date
            //  already exists; this means that if the input the date picker is attached to is empty, and the user selects
            //  a date for the first time, this button will not be visible; once the user picked a date and opens the date
            //  picker again, this time the button will be visible.
            //
            //  setting this property to TRUE will make this button visible all the time
            always_show_clear: false,

            //  setting this property to a jQuery element, will result in the date picker being always visible, the indicated
            //  element being the date picker's container;
            //  note that when this property is set to TRUE, the "always_show_clear" property will automatically be set to TRUE
            always_visible: false,

            //  days of the week; Sunday to Saturday
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

            //  by default, the abbreviated name of a day consists of the first 2 letters from the day's full name;
            //  while this is common for most languages, there are also exceptions for languages like Thai, Loa, Myanmar,
            //  etc. where this is not correct; for these cases, specify an array with the abbreviations to be used for
            //  the 7 days of the week; leave it FALSE to use the first 2 letters of a day's name as the abbreviation.
            //
            //  default is FALSE
            days_abbr: false,

            //  direction of the calendar
            //
            //  a positive or negative integer: n (a positive integer) creates a future-only calendar beginning at n days
            //  after today; -n (a negative integer); if n is 0, the calendar has no restrictions. use boolean true for
            //  a future-only calendar starting with today and use boolean false for a past-only calendar ending today.
            //
            //  you may also set this property to an array with two elements in the following combinations:
            //
            //  -   first item is boolean TRUE (calendar starts today), an integer > 0 (calendar starts n days after
            //      today), or a valid date given in the format defined by the "format" attribute, using English for
            //      month names (calendar starts at the specified date), and the second item is boolean FALSE (the calendar
            //      has no ending date), an integer > 0 (calendar ends n days after the starting date), or a valid date
            //      given in the format defined by the "format" attribute, using English for month names, and which occurs
            //      after the starting date (calendar ends at the specified date)
            //
            //  -   first item is boolean FALSE (calendar ends today), an integer < 0 (calendar ends n days before today),
            //      or a valid date given in the format defined by the "format" attribute, using English for month names
            //      (calendar ends at the specified date), and the second item is an integer > 0 (calendar ends n days
            //      before the ending date), or a valid date given in the format defined by the "format" attribute, using
            //      English for month names  and which occurs before the starting date (calendar starts at the specified
            //      date)
            //
            //  [1, 7] - calendar starts tomorrow and ends seven days after that
            //  [true, 7] - calendar starts today and ends seven days after that
            //  ['2013-01-01', false] - calendar starts on January 1st 2013 and has no ending date ("format" is YYYY-MM-DD)
            //  [false, '2012-01-01'] - calendar ends today and starts on January 1st 2012 ("format" is YYYY-MM-DD)
            //
            //  note that "disabled_dates" property will still apply!
            //
            //  default is 0 (no restrictions)
            direction: 0,

            //  an array of disabled dates in the following format: 'day month year weekday' where "weekday" is optional
            //  and can be 0-6 (Saturday to Sunday); the syntax is similar to cron's syntax: the values are separated by
            //  spaces and may contain * (asterisk) - (dash) and , (comma) delimiters:
            //
            //  ['1 1 2012'] would disable January 1, 2012;
            //  ['* 1 2012'] would disable all days in January 2012;
            //  ['1-10 1 2012'] would disable January 1 through 10 in 2012;
            //  ['1,10 1 2012'] would disable January 1 and 10 in 2012;
            //  ['1-10,20,22,24 1-3 *'] would disable 1 through 10, plus the 22nd and 24th of January through March for every year;
            //  ['* * * 0,6'] would disable all Saturdays and Sundays;
            //  ['01 07 2012', '02 07 2012', '* 08 2012'] would disable 1st and 2nd of July 2012, and all of August of 2012
            //
            //  default is FALSE, no disabled dates
            disabled_dates: false,

            //  an array of enabled dates in the same format as required for "disabled_dates" property.
            //  to be used together with the "disabled_dates" property by first setting the "disabled_dates" property to
            //  something like "[* * * *]" (which will disable everything) and the setting the "enabled_dates" property to,
            //  say, "[* * * 0,6]" to enable just weekends.
            enabled_dates: false,

            //  week's starting day
            //
            //  valid values are 0 to 6, Sunday to Saturday
            //
            //  default is 1, Monday
            first_day_of_week: 1,

            //  format of the returned date
            //
            //  accepts the following characters for date formatting: d, D, j, l, N, w, S, F, m, M, n, Y, y borrowing
            //  syntax from (PHP's date function)
            //
            //  note that when setting a date format without days ('d', 'j'), the users will be able to select only years
            //  and months, and when setting a format without months and days ('F', 'm', 'M', 'n', 'd', 'j'), the
            //  users will be able to select only years; likewise, when setting a date format with just months ('F', 'm',
            //  'M', 'n') or just years ('Y', 'y'), users will be able to select only months and years, respectively.
            //
            //  also note that the value of the "view" property (see below) may be overridden if it is the case: a value of
            //  "days" for the "view" property makes no sense if the date format doesn't allow the selection of days.
            //
            //  default is Y-m-d
            format: 'Y-m-d',

            //  should the icon for opening the datepicker be inside the element?
            //  if set to FALSE, the icon will be placed to the right of the parent element, while if set to TRUE it will
            //  be placed to the right of the parent element, but *inside* the element itself
            //
            //  default is TRUE
            inside: true,

            //  the caption for the "Clear" button
            lang_clear_date: 'Clear',

            //  months names
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

            //  by default, the abbreviated name of a month consists of the first 3 letters from the month's full name;
            //  while this is common for most languages, there are also exceptions for languages like Thai, Loa, Myanmar,
            //  etc. where this is not correct; for these cases, specify an array with the abbreviations to be used for
            //  the months of the year; leave it FALSE to use the first 3 letters of a month's name as the abbreviation.
            //
            //  default is FALSE
            months_abbr: false,

            //  the offset, in pixels (x, y), to shift the date picker's position relative to the top-right of the icon
            //  that toggles the date picker or, if the icon is disabled, relative to the top-right corner of the element
            //  the plugin is attached to.
            //
            //  note that this only applies if the position of element relative to the browser's viewport doesn't require
            //  the date picker to be placed automatically so that it is visible!
            //
            //  default is [5, -5]
            offset: [5, -5],

            //  if set as a jQuery element with a Zebra_Datepicker attached, that particular date picker will use the
            //  current date picker's value as starting date
            //  note that the rules set in the "direction" property will still apply, only that the reference date will
            //  not be the current system date but the value selected in the current date picker
            //  default is FALSE (not paired with another date picker)
            pair: false,

            //  should the element the calendar is attached to, be read-only?
            //  if set to TRUE, a date can be set only through the date picker and cannot be entered manually
            //
            //  default is TRUE
            readonly_element: true,

            //  should days from previous and/or next month be selectable when visible?
            //  note that if the value of this property is set to TRUE, the value of "show_other_months" will be considered
            //  TRUE regardless of the actual value!
            //
            //  default is FALSE
            select_other_months: false,

            //  should a calendar icon be added to the elements the plugin is attached to?
            //
            //  default is TRUE
            show_icon: true,

            //  should days from previous and/or next month be visible?
            //
            //  default is TRUE
            show_other_months: true,

            //  should an extra column be shown, showing the number of each week?
            //  anything other than FALSE will enable this feature, and use the given value as column title
            //  i.e. show_week_number: 'Wk' would enable this feature and have "Wk" as the column's title
            //
            //  default is FALSE
            show_week_number: false,

            //  a default date to start the date picker with
            //  must be specified in the format defined by the "format" property, or it will be ignored!
            //  note that this value is used only if there is no value in the field the date picker is attached to!
            start_date: false,

            //  how should the date picker start; valid values are "days", "months" and "years"
            //  note that the date picker is always cycling days-months-years when clicking in the date picker's header,
            //  and years-months-days when selecting dates (unless one or more of the views are missing due to the date's
            //  format)
            //
            //  also note that the value of the "view" property may be overridden if the date's format requires so! (i.e.
            //  "days" for the "view" property makes no sense if the date format doesn't allow the selection of days)
            //
            //  default is "days"
            view: 'days',

            //  days of the week that are considered "weekend days"
            //  valid values are 0 to 6, Sunday to Saturday
            //
            //  default values are 0 and 6 (Saturday and Sunday)
            weekend_days: [0, 6],

            //  when set to TRUE, day numbers < 10 will be prefixed with 0; set to FALSE if you don't want that
            //
            //  default is TRUE
            zero_pad: false,

            //  callback function to be executed whenever the user changes the view (days/months/years), as well as when
            //  the user navigates by clicking on the "next"/"previous" icons in any of the views;
            //
            //  the callback function called by this event takes 3 arguments - the first argument represents the current
            //  view (can be "days", "months" or "years"), the second argument represents an array containing the "active"
            //  elements (not disabled) from the view, as jQuery elements, allowing for easy customization and interaction
            //  with particular cells in the date picker's view, while the third argument is a reference to the element
            //  the date picker is attached to, as a jQuery object
            //
            //  for simplifying searching for particular dates, each element in the second argument will also have a
            //  "date" data attribute whose format depends on the value of the "view" argument:
            //  - YYYY-MM-DD for elements in the "days" view
            //  - YYYY-MM for elements in the "months" view
            //  - YYYY for elements in the "years" view
            onChange: null,

            //  callback function to be executed when the user clicks the "Clear" button
            //  the callback function takes a single argument:
            //  -   a reference to the element the date picker is attached to, as a jQuery object
            onClear: null,

            //  callback function to be executed when a date is selected
            //  the callback function takes 4 arguments:
            //  -   the date in the format specified by the "format" attribute;
            //  -   the date in YYYY-MM-DD format
            //  -   the date as a JavaScript Date object
            //  -   a reference to the element the date picker is attached to, as a jQuery object
            onSelect: null

        }

        // private properties
        var view, datepicker, icon, header, daypicker, monthpicker, yearpicker, footer, current_system_month, current_system_year,
            current_system_day, first_selectable_month, first_selectable_year, first_selectable_day, selected_month, selected_year,
            default_day, default_month, default_year, enabled_dates, disabled_dates, shim, start_date, end_date, last_selectable_day,
            last_selectable_year, last_selectable_month, daypicker_cells, monthpicker_cells, yearpicker_cells, views, clickables;

        var plugin = this;

        plugin.settings = {}

        // the jQuery version of the element
        // "element" (without the $) will point to the DOM element
        var $element = $(element);

        /**
         *  Constructor method. Initializes the date picker.
         *
         *  @return void
         */
        var init = function(update) {

            // merge default settings with user-settings (unless we're just updating settings)
            if (!update) plugin.settings = $.extend({}, defaults, options);

            // if the element should be read-only, set the "readonly" attribute
            if (plugin.settings.readonly_element) $element.attr('readonly', 'readonly');

            // determine the views the user can cycle through, depending on the format
            // that is, if the format doesn't contain the day, the user will be able to cycle only through years and months,
            // whereas if the format doesn't contain months nor days, the user will only be able to select years

            var

                // the characters that may be present in the date format and that represent days, months and years
                date_chars = {
                    days:   ['d', 'j', 'D'],
                    months: ['F', 'm', 'M', 'n', 't'],
                    years:  ['o', 'Y', 'y']
                },

                // some defaults
                has_days = false,
                has_months = false,
                has_years = false;

            // iterate through all the character blocks
            for (type in date_chars)

                // iterate through the characters of each block
                $.each(date_chars[type], function(index, character) {

                    // if current character exists in the "format" property
                    if (plugin.settings.format.indexOf(character) > -1)

                        // set to TRUE the appropriate flag
                        if (type == 'days') has_days = true;
                        else if (type == 'months') has_months = true;
                        else if (type == 'years') has_years = true;

                });

            // if user can cycle through all the views, set the flag accordingly
            if (has_days && has_months && has_years) views = ['years', 'months', 'days'];

            // if user can cycle only through year and months, set the flag accordingly
            else if (!has_days && has_months && has_years) views = ['years', 'months'];

            // if user can only see the year picker, set the flag accordingly
            else if (!has_days && !has_months && has_years) views = ['years'];

            // if user can only see the month picker, set the flag accordingly
            else if (!has_days && has_months && !has_years) views = ['months'];

            // if invalid format (no days, no months, no years) use the default where the user is able to cycle through
            // all the views
            else views = ['years', 'months', 'days'];

            // if the starting view is not amongst the views the user can cycle through, set the correct starting view
            if ($.inArray(plugin.settings.view, views) == -1) plugin.settings.view = views[views.length - 1];

            // parse the rules for disabling dates and turn them into arrays of arrays

            // array that will hold the rules for enabling/disabling dates
            disabled_dates = []; enabled_dates = [];

            var dates;

            // it's the same logic for preparing the enabled/disable dates...
            for (var l = 0; l < 2; l++) {

                // first time we're doing disabled dates,
                if (l == 0) dates = plugin.settings.disabled_dates;

                // second time we're doing enabled_dates
                else dates = plugin.settings.enabled_dates;

                // if we have a non-empty array
                if ($.isArray(dates) && dates.length > 0)

                    // iterate through the rules
                    $.each(dates, function() {

                        // split the values in rule by white space
                        var rules = this.split(' ');

                        // there can be a maximum of 4 rules (days, months, years and, optionally, day of the week)
                        for (var i = 0; i < 4; i++) {

                            // if one of the values is not available
                            // replace it with a * (wildcard)
                            if (!rules[i]) rules[i] = '*';

                            // if rule contains a comma, create a new array by splitting the rule by commas
                            // if there are no commas create an array containing the rule's string
                            rules[i] = (rules[i].indexOf(',') > -1 ? rules[i].split(',') : new Array(rules[i]));

                            // iterate through the items in the rule
                            for (var j = 0; j < rules[i].length; j++)

                                // if item contains a dash (defining a range)
                                if (rules[i][j].indexOf('-') > -1) {

                                    // get the lower and upper limits of the range
                                    var limits = rules[i][j].match(/^([0-9]+)\-([0-9]+)/);

                                    // if range is valid
                                    if (null != limits) {

                                        // iterate through the range
                                        for (var k = to_int(limits[1]); k <= to_int(limits[2]); k++)

                                            // if value is not already among the values of the rule
                                            // add it to the rule
                                            if ($.inArray(k, rules[i]) == -1) rules[i].push(k + '');

                                        // remove the range indicator
                                        rules[i].splice(j, 1);

                                    }

                                }

                            // iterate through the items in the rule
                            // and make sure that numbers are numbers
                            for (j = 0; j < rules[i].length; j++) rules[i][j] = (isNaN(to_int(rules[i][j])) ? rules[i][j] : to_int(rules[i][j]));

                        }

                        // add to the correct list of processed rules
                        // first time we're doing disabled dates,
                        if (l == 0) disabled_dates.push(rules);

                        // second time we're doing enabled_dates
                        else enabled_dates.push(rules);

                    });

            }

            var

                // cache the current system date
                date = new Date(),

                // when the date picker's starting date depends on the value of another date picker, this value will be
                // set by the other date picker
                // this value will be used as base for all calculations (if not set, will be the same as the current
                // system date)
                reference_date = (!plugin.settings.reference_date ? ($element.data('zdp_reference_date') && undefined != $element.data('zdp_reference_date') ? $element.data('zdp_reference_date') : date) : plugin.settings.reference_date),

                tmp_start_date, tmp_end_date;

            // reset these values here as this method might be called more than once during a date picker's lifetime
            // (when the selectable dates depend on the values from another date picker)
            start_date = undefined; end_date = undefined;

            // extract the date parts
            // also, save the current system month/day/year - we'll use them to highlight the current system date
            first_selectable_month = reference_date.getMonth();
            current_system_month = date.getMonth();
            first_selectable_year = reference_date.getFullYear();
            current_system_year = date.getFullYear();
            first_selectable_day = reference_date.getDate();
            current_system_day = date.getDate();

            // check if the calendar has any restrictions

            // calendar is future-only, starting today
            // it means we have a starting date (the current system date), but no ending date
            if (plugin.settings.direction === true) start_date = reference_date;

            // calendar is past only, ending today
            else if (plugin.settings.direction === false) {

                // it means we have an ending date (the reference date), but no starting date
                end_date = reference_date;

                // extract the date parts
                last_selectable_month = end_date.getMonth();
                last_selectable_year = end_date.getFullYear();
                last_selectable_day = end_date.getDate();

            } else if (

                // if direction is not given as an array and the value is an integer > 0
                (!$.isArray(plugin.settings.direction) && is_integer(plugin.settings.direction) && to_int(plugin.settings.direction) > 0) ||

                // or direction is given as an array
                ($.isArray(plugin.settings.direction) && (

                    // and first entry is a valid date
                    (tmp_start_date = check_date(plugin.settings.direction[0])) ||
                    // or a boolean TRUE
                    plugin.settings.direction[0] === true ||
                    // or an integer > 0
                    (is_integer(plugin.settings.direction[0]) && plugin.settings.direction[0] > 0)

                ) && (

                    // and second entry is a valid date
                    (tmp_end_date = check_date(plugin.settings.direction[1])) ||
                    // or a boolean FALSE
                    plugin.settings.direction[1] === false ||
                    // or integer >= 0
                    (is_integer(plugin.settings.direction[1]) && plugin.settings.direction[1] >= 0)

                ))

            ) {

                // if an exact starting date was given, use that as a starting date
                if (tmp_start_date) start_date = tmp_start_date;

                // otherwise
                else

                    // figure out the starting date
                    // use the Date object to normalize the date
                    // for example, 2011 05 33 will be transformed to 2011 06 02
                    start_date = new Date(
                        first_selectable_year,
                        first_selectable_month,
                        first_selectable_day + (!$.isArray(plugin.settings.direction) ? to_int(plugin.settings.direction) : to_int(plugin.settings.direction[0] === true ? 0 : plugin.settings.direction[0]))
                    );

                // re-extract the date parts
                first_selectable_month = start_date.getMonth();
                first_selectable_year = start_date.getFullYear();
                first_selectable_day = start_date.getDate();

                // if an exact ending date was given and the date is after the starting date, use that as a ending date
                if (tmp_end_date && +tmp_end_date >= +start_date) end_date = tmp_end_date;

                // if have information about the ending date
                else if (!tmp_end_date && plugin.settings.direction[1] !== false && $.isArray(plugin.settings.direction))

                    // figure out the ending date
                    // use the Date object to normalize the date
                    // for example, 2011 05 33 will be transformed to 2011 06 02
                    end_date = new Date(
                        first_selectable_year,
                        first_selectable_month,
                        first_selectable_day + to_int(plugin.settings.direction[1])
                    );

                // if a valid ending date exists
                if (end_date) {

                    // extract the date parts
                    last_selectable_month = end_date.getMonth();
                    last_selectable_year = end_date.getFullYear();
                    last_selectable_day = end_date.getDate();

                }

            } else if (

                // if direction is not given as an array and the value is an integer < 0
                (!$.isArray(plugin.settings.direction) && is_integer(plugin.settings.direction) && to_int(plugin.settings.direction) < 0) ||

                // or direction is given as an array
                ($.isArray(plugin.settings.direction) && (

                    // and first entry is boolean FALSE
                    plugin.settings.direction[0] === false ||
                    // or an integer < 0
                    (is_integer(plugin.settings.direction[0]) && plugin.settings.direction[0] < 0)

                ) && (

                    // and second entry is a valid date
                    (tmp_start_date = check_date(plugin.settings.direction[1])) ||
                    // or an integer >= 0
                    (is_integer(plugin.settings.direction[1]) && plugin.settings.direction[1] >= 0)

                ))

            ) {

                // figure out the ending date
                // use the Date object to normalize the date
                // for example, 2011 05 33 will be transformed to 2011 06 02
                end_date = new Date(
                    first_selectable_year,
                    first_selectable_month,
                    first_selectable_day + (!$.isArray(plugin.settings.direction) ? to_int(plugin.settings.direction) : to_int(plugin.settings.direction[0] === false ? 0 : plugin.settings.direction[0]))
                );

                // re-extract the date parts
                last_selectable_month = end_date.getMonth();
                last_selectable_year = end_date.getFullYear();
                last_selectable_day = end_date.getDate();

                // if an exact starting date was given, and the date is before the ending date, use that as a starting date
                if (tmp_start_date && +tmp_start_date < +end_date) start_date = tmp_start_date;

                // if have information about the starting date
                else if (!tmp_start_date && $.isArray(plugin.settings.direction))

                    // figure out the staring date
                    // use the Date object to normalize the date
                    // for example, 2011 05 33 will be transformed to 2011 06 02
                    start_date = new Date(
                        last_selectable_year,
                        last_selectable_month,
                        last_selectable_day - to_int(plugin.settings.direction[1])
                    );

                // if a valid starting date exists
                if (start_date) {

                    // extract the date parts
                    first_selectable_month = start_date.getMonth();
                    first_selectable_year = start_date.getFullYear();
                    first_selectable_day = start_date.getDate();

                }

            // if there are disabled dates
            } else if ($.isArray(plugin.settings.disabled_dates) && plugin.settings.disabled_dates.length > 0)

                // iterate through the rules for disabling dates
                for (var interval in disabled_dates)

                    // only if there is a rule that disables *everything*
                    if (disabled_dates[interval][0] == '*' && disabled_dates[interval][1] == '*' && disabled_dates[interval][2] == '*' && disabled_dates[interval][3] == '*') {

                        var tmpDates = [];

                        // iterate through the rules for enabling dates
                        // looking for the minimum/maximum selectable date (if it's the case)
                        $.each(enabled_dates, function() {

                            var rule = this;

                            // if the rule doesn't apply to all years
                            if (rule[2][0] != '*')

                                // format date and store it in our stack
                                tmpDates.push(parseInt(
                                    rule[2][0] +
                                    (rule[1][0] == '*' ? '12' : str_pad(rule[1][0], 2)) +
                                    (rule[0][0] == '*' ? (rule[1][0] == '*' ? '31' : new Date(rule[2][0], rule[1][0], 0).getDate()) : str_pad(rule[0][0], 2))
                                , 10));

                        });

                        // sort dates ascending
                        tmpDates.sort();

                        // if we have any rules
                        if (tmpDates.length > 0) {

                            // get date parts
                            var matches = (tmpDates[0] + '').match(/([0-9]{4})([0-9]{2})([0-9]{2})/);

                            // assign the date parts to the appropriate variables
                            first_selectable_year = parseInt(matches[1], 10);
                            first_selectable_month = parseInt(matches[2], 10) - 1;
                            first_selectable_day = parseInt(matches[3], 10);

                        }

                        // don't look further
                        break;

                    }

            // if first selectable date exists but is disabled, find the actual first selectable date
            if (is_disabled(first_selectable_year, first_selectable_month, first_selectable_day)) {

                // loop until we find the first selectable year
                while (is_disabled(first_selectable_year)) {

                    // if calendar is past-only,
                    if (!start_date) {

                        // decrement the year
                        first_selectable_year--;

                        // because we've changed years, reset the month to December
                        first_selectable_month = 11;

                    // otherwise
                    } else {

                        // increment the year
                        first_selectable_year++;

                        // because we've changed years, reset the month to January
                        first_selectable_month = 0;

                    }

                }

                // loop until we find the first selectable month
                while (is_disabled(first_selectable_year, first_selectable_month)) {

                    // if calendar is past-only
                    if (!start_date) {

                        // decrement the month
                        first_selectable_month--;

                        // because we've changed months, reset the day to the last day of the month
                        first_selectable_day = new Date(first_selectable_year, first_selectable_month + 1, 0).getDate();

                    // otherwise
                    } else {

                        // increment the month
                        first_selectable_month++;

                        // because we've changed months, reset the day to the first day of the month
                        first_selectable_day = 1;

                    }

                    // if we moved to a following year
                    if (first_selectable_month > 11) {

                        // increment the year
                        first_selectable_year++;

                        // reset the month to January
                        first_selectable_month = 0;

                        // because we've changed months, reset the day to the first day of the month
                        first_selectable_day = 1;

                    // if we moved to a previous year
                    } else if (first_selectable_month < 0) {

                        // decrement the year
                        first_selectable_year--;

                        // reset the month to December
                        first_selectable_month = 11;

                        // because we've changed months, reset the day to the last day of the month
                        first_selectable_day = new Date(first_selectable_year, first_selectable_month + 1, 0).getDate();

                    }

                }

                // loop until we find the first selectable day
                while (is_disabled(first_selectable_year, first_selectable_month, first_selectable_day))

                    // if calendar is past-only, decrement the day
                    if (!start_date) first_selectable_day--;

                    // otherwise, increment the day
                    else first_selectable_day++;

                // use the Date object to normalize the date
                // for example, 2011 05 33 will be transformed to 2011 06 02
                date = new Date(first_selectable_year, first_selectable_month, first_selectable_day);

                // re-extract date parts from the normalized date
                // as we use them in the current loop
                first_selectable_year = date.getFullYear();
                first_selectable_month = date.getMonth();
                first_selectable_day = date.getDate();

            }

            // get the default date, from the element, and check if it represents a valid date, according to the required format
            var default_date = check_date($element.val() || (plugin.settings.start_date ? plugin.settings.start_date : ''));

            // if there is a default date but it is disabled
            if (default_date && is_disabled(default_date.getFullYear(), default_date.getMonth(), default_date.getDate()))

                // clear the value of the parent element
                $element.val('');

            // updates value for the date picker whose starting date depends on the selected date (if any)
            update_dependent(default_date);

            // if date picker is not always visible
            if (!plugin.settings.always_visible) {

                // if we're just creating the date picker
                if (!update) {

                    // if a calendar icon should be added to the element the plugin is attached to, create the icon now
                    if (plugin.settings.show_icon) {

                        // create the calendar icon (show a disabled icon if the element is disabled)
                        var html = '<button type="button" class="Zebra_DatePicker_Icon' + ($element.attr('disabled') == 'disabled' ? ' Zebra_DatePicker_Icon_Disabled' : '') + '">Pick a date</button>';

                        // convert to a jQuery object
                        icon = $(html);

                        // a reference to the icon, as a global property
                        plugin.icon = icon;

                        // the date picker will open when clicking both the icon and the element the plugin is attached to
                        clickables = icon.add($element);

                    // if calendar icon is not visible, the date picker will open when clicking the element
                    } else clickables = $element;

                    // attach the click event to the clickable elements (icon and/or element)
                    clickables.bind('click', function(e) {

                        e.preventDefault();

                        // if element is not disabled
                        if (!$element.attr('disabled'))

                            // if the date picker is visible, hide it
                            if (datepicker.css('display') != 'none') plugin.hide();

                            // if the date picker is not visible, show it
                            else plugin.show();

                    });

                    // if icon exists, inject it into the DOM
                    if (undefined != icon) icon.insertAfter(element);

                }

                // if calendar icon exists
                if (undefined != icon) {

                    // needed when updating: remove any inline style set previously by library,
                    // so we get the right values below
                    icon.attr('style', '');

                    // if calendar icon is to be placed *inside* the element
                    // add an extra class to the icon
                    if (plugin.settings.inside) icon.addClass('Zebra_DatePicker_Icon_Inside');

                    var

                        // get element's position, width, height and margins
                        element_position = $element.position(),
                        element_width = $element.outerWidth(false),
                        element_height = $element.outerHeight(false),
                        element_margin_top = parseInt($element.css('marginTop'), 10) || 0,
                        element_margin_right = parseInt($element.css('marginRight'), 10) || 0,

                        // get icon's position, width, height and margins
                        icon_position = icon.position(),
                        icon_width = icon.outerWidth(true),
                        icon_height = icon.outerHeight(true),
                        icon_margin_left = parseInt(icon.css('marginLeft'), 10) || 0;

                    // if icon is to be placed *inside* the element
                    // position the icon accordingly
                    if (plugin.settings.inside)

                        icon.css({
                            'marginLeft':   (icon_position.left <= element_position.left + element_width ? element_position.left + element_width - icon_position.left : 0) - (element_margin_right + icon_width)
                        });

                    // if icon is to be placed to the right of the element
                    // position the icon accordingly
                    else

                        icon.css({
                            'marginLeft':   (icon_position.left <= element_position.left + element_width ? element_position.left + element_width - icon_position.left : 0) - element_margin_right + icon_margin_left
                        });

                    // now adjust the right margin accordingly
                    icon.css({'marginRight' : -parseInt(icon.css('marginLeft'), 10)});

                    // vertically center the icon
                    icon.css({
                        'marginTop':    (icon_position.top > element_position.top ? element_position.top - icon_position.top : icon_position.top - element_position.top) + element_margin_top + ((element_height - icon_height) / 2)
                    });

                }

            }

            // if calendar icon exists (there's no icon if the date picker is always visible or it is specifically hidden)
            if (undefined != icon)

                // if parent element is not visible (has display: none, width and height are explicitly set to 0, an ancestor
                // element is hidden, so the element is not shown on the page), hide the icon, or show it otherwise
                if (!($element.is(':visible'))) icon.hide(); else icon.show();

            // if we just needed to recompute the things above, return now
            if (update) return;

            // generate the container that will hold everything
            var html = '' +
                '<div class="Zebra_DatePicker">' +
                    '<table class="dp_header">' +
                        '<tr>' +
                            '<td class="dp_previous">&#171;</td>' +
                            '<td class="dp_caption">&#032;</td>' +
                            '<td class="dp_next">&#187;</td>' +
                        '</tr>' +
                    '</table>' +
                    '<table class="dp_daypicker"></table>' +
                    '<table class="dp_monthpicker"></table>' +
                    '<table class="dp_yearpicker"></table>' +
                    '<table class="dp_footer">' +
                        '<tr><td>' + plugin.settings.lang_clear_date + '</td></tr>' +
                    '</table>' +
                '</div>';

            // create a jQuery object out of the HTML above and create a reference to it
            datepicker = $(html);

            // a reference to the calendar, as a global property
            plugin.datepicker = datepicker;

            // create references to the different parts of the date picker
            header = $('table.dp_header', datepicker);
            daypicker = $('table.dp_daypicker', datepicker);
            monthpicker = $('table.dp_monthpicker', datepicker);
            yearpicker = $('table.dp_yearpicker', datepicker);
            footer = $('table.dp_footer', datepicker);

            // if date picker is not always visible
            if (!plugin.settings.always_visible)

                // inject the container into the DOM
                $('body').append(datepicker);

            // otherwise, if element is not disabled
            else if (!$element.attr('disabled')) {

                // inject the date picker into the designated container element
                plugin.settings.always_visible.append(datepicker);

                // and make it visible right away
                plugin.show();

            }

            // add the mouseover/mousevents to all to the date picker's cells
            // except those that are not selectable
            datepicker.
                delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked, .dp_week_number)', 'mouseover', function() {
                    $(this).addClass('dp_hover');
                }).
                delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked, .dp_week_number)', 'mouseout', function() {
                    $(this).removeClass('dp_hover');
                });

            // prevent text highlighting for the text in the header
            // (for the case when user keeps clicking the "next" and "previous" buttons)
            disable_text_select($('td', header));

            // event for when clicking the "previous" button
            $('.dp_previous', header).bind('click', function() {

                // if button is not disabled
                if (!$(this).hasClass('dp_blocked')) {

                    // if view is "months"
                    // decrement year by one
                    if (view == 'months') selected_year--;

                    // if view is "years"
                    // decrement years by 12
                    else if (view == 'years') selected_year -= 12;

                    // if view is "days"
                    // decrement the month and
                    // if month is out of range
                    else if (--selected_month < 0) {

                        // go to the last month of the previous year
                        selected_month = 11;
                        selected_year--;

                    }

                    // generate the appropriate view
                    manage_views();

                }

            });

            // attach a click event to the caption in header
            $('.dp_caption', header).bind('click', function() {

                // if current view is "days", take the user to the next view, depending on the format
                if (view == 'days') view = ($.inArray('months', views) > -1 ? 'months' : ($.inArray('years', views) > -1 ? 'years' : 'days'));

                // if current view is "months", take the user to the next view, depending on the format
                else if (view == 'months') view = ($.inArray('years', views) > -1 ? 'years' : ($.inArray('days', views) > -1 ? 'days' : 'months'));

                // if current view is "years", take the user to the next view, depending on the format
                else view = ($.inArray('days', views) > -1 ? 'days' : ($.inArray('months', views) > -1 ? 'months' : 'years'));

                // generate the appropriate view
                manage_views();

            });

            // event for when clicking the "next" button
            $('.dp_next', header).bind('click', function() {

                // if button is not disabled
                if (!$(this).hasClass('dp_blocked')) {

                    // if view is "months"
                    // increment year by 1
                    if (view == 'months') selected_year++;

                    // if view is "years"
                    // increment years by 12
                    else if (view == 'years') selected_year += 12;

                    // if view is "days"
                    // increment the month and
                    // if month is out of range
                    else if (++selected_month == 12) {

                        // go to the first month of the next year
                        selected_month = 0;
                        selected_year++;

                    }

                    // generate the appropriate view
                    manage_views();

                }

            });

            // attach a click event for the cells in the day picker
            daypicker.delegate('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_week_number)', 'click', function() {

                // if other months are selectable and currently clicked cell contains a class with the cell's date
                if (plugin.settings.select_other_months && null != (matches = $(this).attr('class').match(/date\_([0-9]{4})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])/)))

                    // use the stored date
                    select_date(matches[1], matches[2], matches[3], 'days', $(this));

                // put selected date in the element the plugin is attached to, and hide the date picker
                else select_date(selected_year, selected_month, to_int($(this).html()), 'days', $(this));

            });

            // attach a click event for the cells in the month picker
            monthpicker.delegate('td:not(.dp_disabled)', 'click', function() {

                // get the month we've clicked on
                var matches = $(this).attr('class').match(/dp\_month\_([0-9]+)/);

                // set the selected month
                selected_month = to_int(matches[1]);

                // if user can select only years and months
                if ($.inArray('days', views) == -1)

                    // put selected date in the element the plugin is attached to, and hide the date picker
                    select_date(selected_year, selected_month, 1, 'months', $(this));

                else {

                    // direct the user to the "days" view
                    view = 'days';

                    // if date picker is always visible
                    // empty the value in the text box the date picker is attached to
                    if (plugin.settings.always_visible) $element.val('');

                    // generate the appropriate view
                    manage_views();

                }

            });

            // attach a click event for the cells in the year picker
            yearpicker.delegate('td:not(.dp_disabled)', 'click', function() {

                // set the selected year
                selected_year = to_int($(this).html());

                // if user can select only years
                if ($.inArray('months', views) == -1)

                    // put selected date in the element the plugin is attached to, and hide the date picker
                    select_date(selected_year, 1, 1, 'years', $(this));

                else {

                    // direct the user to the "months" view
                    view = 'months';

                    // if date picker is always visible
                    // empty the value in the text box the date picker is attached to
                    if (plugin.settings.always_visible) $element.val('');

                    // generate the appropriate view
                    manage_views();

                }

            });

            // bind a function to the onClick event on the table cell in the footer (the "Clear" button)
            $('td', footer).bind('click', function(e) {

                e.preventDefault();

                // clear the element's value
                $element.val('');

                // if date picker is not always visible
                if (!plugin.settings.always_visible) {

                    // reset these values
                    default_day = null; default_month = null; default_year = null; selected_month = null; selected_year = null;

                    // remove the footer element
                    footer.css('display', 'none');

                }

                // hide the date picker
                plugin.hide();

                // if a callback function exists for when clearing a date
                if (plugin.settings.onClear && typeof plugin.settings.onClear == 'function')

                    // execute the callback function and pass as argument the element the plugin is attached to
                    plugin.settings.onClear($element);

            });

            // if date picker is not always visible
            if (!plugin.settings.always_visible)

                // bind some events to the document
                $(document).bind({

                    //whenever anything is clicked on the page or a key is pressed
                    'mousedown': plugin._mousedown,
                    'keyup': plugin._keyup

                });

            // last thing is to pre-render some of the date picker right away
            manage_views();

        }

        /**
         *  Hides the date picker.
         *
         *  @return void
         */
        plugin.hide = function() {

            // if date picker is not always visible
            if (!plugin.settings.always_visible) {

                // hide the iFrameShim in Internet Explorer 6
                iframeShim('hide');

                // hide the date picker
                datepicker.css('display', 'none');

            }

        }

        /**
         *  Shows the date picker.
         *
         *  @return void
         */
        plugin.show = function() {

            // always show the view defined in settings
            view = plugin.settings.view;

            // get the default date, from the element, and check if it represents a valid date, according to the required format
            var default_date = check_date($element.val() || (plugin.settings.start_date ? plugin.settings.start_date : ''));

            // if the value represents a valid date
            if (default_date) {

                // extract the date parts
                // we'll use these to highlight the default date in the date picker and as starting point to
                // what year and month to start the date picker with
                // why separate values? because selected_* will change as user navigates within the date picker
                default_month = default_date.getMonth();
                selected_month = default_date.getMonth();
                default_year = default_date.getFullYear();
                selected_year = default_date.getFullYear();
                default_day = default_date.getDate();

                // if the default date represents a disabled date
                if (is_disabled(default_year, default_month, default_day)) {

                    // clear the value of the parent element
                    $element.val('');

                    // the calendar will start with the first selectable year/month
                    selected_month = first_selectable_month;
                    selected_year = first_selectable_year;

                }

            // if a default value is not available, or value does not represent a valid date
            } else {

                // the calendar will start with the first selectable year/month
                selected_month = first_selectable_month;
                selected_year = first_selectable_year;

            }

            // generate the appropriate view
            manage_views();

            // if date picker is not always visible and the calendar icon is visible
            if (!plugin.settings.always_visible) {

                var

                    // get the date picker width and height
                    datepicker_width = datepicker.outerWidth(),
                    datepicker_height = datepicker.outerHeight(),

                    // compute the date picker's default left and top
                    // this will be computed relative to the icon's top-right corner (if the calendar icon exists), or
                    // relative to the element's top-right corner otherwise, to which the offsets given at initialization
                    // are added/subtracted
                    left = (undefined != icon ? icon.offset().left + icon.outerWidth(true) : $element.offset().left + $element.outerWidth(true)) + plugin.settings.offset[0],
                    top = (undefined != icon ? icon.offset().top : $element.offset().top) - datepicker_height + plugin.settings.offset[1],

                    // get browser window's width and height
                    window_width = $(window).width(),
                    window_height = $(window).height(),

                    // get browser window's horizontal and vertical scroll offsets
                    window_scroll_top = $(window).scrollTop(),
                    window_scroll_left = $(window).scrollLeft();

                // if date picker is outside the viewport, adjust its position so that it is visible
                if (left + datepicker_width > window_scroll_left + window_width) left = window_scroll_left + window_width - datepicker_width;
                if (left < window_scroll_left) left = window_scroll_left;
                if (top + datepicker_height > window_scroll_top + window_height) top = window_scroll_top + window_height - datepicker_height;
                if (top < window_scroll_top) top = window_scroll_top;

                // make the date picker visible
                datepicker.css({
                    'left':     left,
                    'top':      top
                });

                // fade-in the date picker
                // for Internet Explorer < 9 show the date picker instantly or fading alters the font's weight
                datepicker.fadeIn(browser.name == 'explorer' && browser.version < 9 ? 0 : 150, 'linear');

                // show the iFrameShim in Internet Explorer 6
                iframeShim();

            // if date picker is always visible, show it
            } else datepicker.css('display', 'block');

        }

        /**
         *  Updates the configuration options given as argument
         *
         *  @param  object  values  An object containing any number of configuration options to be updated
         *
         *  @return void
         */
        plugin.update = function(values) {

            // if original direction not saved, save it now
            if (plugin.original_direction) plugin.original_direction = plugin.direction;

            // update configuration options
            plugin.settings = $.extend(plugin.settings, values);

            // reinitialize the object with the new options
            init(true);

        }

        /**
         *  Checks if a string represents a valid date according to the format defined by the "format" property.
         *
         *  @param  string  str_date    A string representing a date, formatted accordingly to the "format" property.
         *                              For example, if "format" is "Y-m-d" the string should look like "2011-06-01"
         *
         *  @return mixed               Returns a JavaScript Date object if string represents a valid date according
         *                              formatted according to the "format" property, or FALSE otherwise.
         *
         *  @access private
         */
        var check_date = function(str_date) {

            // treat argument as a string
            str_date += '';

            // if value is given
            if ($.trim(str_date) != '') {

                var

                    // prepare the format by removing white space from it
                    // and also escape characters that could have special meaning in a regular expression
                    format = escape_regexp(plugin.settings.format),

                    // allowed characters in date's format
                    format_chars = ['d','D','j','l','N','S','w','F','m','M','n','Y','y'],

                    // "matches" will contain the characters defining the date's format
                    matches = new Array,

                    // "regexp" will contain the regular expression built for each of the characters used in the date's format
                    regexp = new Array;

                // iterate through the allowed characters in date's format
                for (var i = 0; i < format_chars.length; i++)

                    // if character is found in the date's format
                    if ((position = format.indexOf(format_chars[i])) > -1)

                        // save it, alongside the character's position
                        matches.push({character: format_chars[i], position: position});

                // sort characters defining the date's format based on their position, ascending
                matches.sort(function(a, b){ return a.position - b.position });

                // iterate through the characters defining the date's format
                $.each(matches, function(index, match) {

                    // add to the array of regular expressions, based on the character
                    switch (match.character) {

                        case 'd': regexp.push('0[1-9]|[12][0-9]|3[01]'); break;
                        case 'D': regexp.push('[a-z]{3}'); break;
                        case 'j': regexp.push('[1-9]|[12][0-9]|3[01]'); break;
                        case 'l': regexp.push('[a-z]+'); break;
                        case 'N': regexp.push('[1-7]'); break;
                        case 'S': regexp.push('st|nd|rd|th'); break;
                        case 'w': regexp.push('[0-6]'); break;
                        case 'F': regexp.push('[a-z]+'); break;
                        case 'm': regexp.push('0[1-9]|1[012]+'); break;
                        case 'M': regexp.push('[a-z]{3}'); break;
                        case 'n': regexp.push('[1-9]|1[012]'); break;
                        case 'Y': regexp.push('[0-9]{4}'); break;
                        case 'y': regexp.push('[0-9]{2}'); break;

                    }

                });

                // if we have an array of regular expressions
                if (regexp.length) {

                    // we will replace characters in the date's format in reversed order
                    matches.reverse();

                    // iterate through the characters in date's format
                    $.each(matches, function(index, match) {

                        // replace each character with the appropriate regular expression
                        format = format.replace(match.character, '(' + regexp[regexp.length - index - 1] + ')');

                    });

                    // the final regular expression
                    regexp = new RegExp('^' + format + '$', 'ig');

                    // if regular expression was matched
                    if ((segments = regexp.exec(str_date))) {

                        // check if date is a valid date (i.e. there's no February 31)

                        var tmpdate = new Date(),
                            original_day = tmpdate.getDate(),
                            original_month = tmpdate.getMonth() + 1,
                            original_year = tmpdate.getFullYear(),
                            english_days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                            english_months = ['January','February','March','April','May','June','July','August','September','October','November','December'],
                            iterable,

                            // by default, we assume the date is valid
                            valid = true;

                        // reverse back the characters in the date's format
                        matches.reverse();

                        // iterate through the characters in the date's format
                        $.each(matches, function(index, match) {

                            // if the date is not valid, don't look further
                            if (!valid) return true;

                            // based on the character
                            switch (match.character) {

                                case 'm':
                                case 'n':

                                    // extract the month from the value entered by the user
                                    original_month = to_int(segments[index + 1]);

                                    break;

                                case 'd':
                                case 'j':

                                    // extract the day from the value entered by the user
                                    original_day = to_int(segments[index + 1]);

                                    break;

                                case 'D':
                                case 'l':
                                case 'F':
                                case 'M':

                                    // if day is given as day name, we'll check against the names in the used language
                                    if (match.character == 'D' || match.character == 'l') iterable = plugin.settings.days;

                                    // if month is given as month name, we'll check against the names in the used language
                                    else iterable = plugin.settings.months;

                                    // by default, we assume the day or month was not entered correctly
                                    valid = false;

                                    // iterate through the month/days in the used language
                                    $.each(iterable, function(key, value) {

                                        // if month/day was entered correctly, don't look further
                                        if (valid) return true;

                                        // if month/day was entered correctly
                                        if (segments[index + 1].toLowerCase() == value.substring(0, (match.character == 'D' || match.character == 'M' ? 3 : value.length)).toLowerCase()) {

                                            // extract the day/month from the value entered by the user
                                            switch (match.character) {

                                                case 'D': segments[index + 1] = english_days[key].substring(0, 3); break;
                                                case 'l': segments[index + 1] = english_days[key]; break;
                                                case 'F': segments[index + 1] = english_months[key]; original_month = key + 1; break;
                                                case 'M': segments[index + 1] = english_months[key].substring(0, 3); original_month = key + 1; break;

                                            }

                                            // day/month value is valid
                                            valid = true;

                                        }

                                    });

                                    break;

                                case 'Y':

                                    // extract the year from the value entered by the user
                                    original_year = to_int(segments[index + 1]);

                                    break;

                                case 'y':

                                    // extract the year from the value entered by the user
                                    original_year = '19' + to_int(segments[index + 1]);

                                    break;

                            }
                        });

                        // if everything is ok so far
                        if (valid) {

                            // generate a Date object using the values entered by the user
                            // (handle also the case when original_month and/or original_day are undefined - i.e date format is "Y-m" or "Y")
                            var date = new Date(original_year, (original_month || 1) - 1, original_day || 1);

                            // if, after that, the date is the same as the date entered by the user
                            if (date.getFullYear() == original_year && date.getDate() == (original_day || 1) && date.getMonth() == ((original_month || 1) - 1))

                                // return the date as JavaScript date object
                                return date;

                        }

                    }

                }

                // if script gets this far, return false as something must've went wrong
                return false;

            }

        }

        /**
         *  Prevents the possibility of selecting text on a given element. Used on the "previous" and "next" buttons
         *  where text might get accidentally selected when user quickly clicks on the buttons.
         *
         *  Code by http://chris-barr.com/index.php/entry/disable_text_selection_with_jquery/
         *
         *  @param  jQuery Element  el  A jQuery element on which to prevents text selection.
         *
         *  @return void
         *
         *  @access private
         */
        var disable_text_select = function(el) {

            // if browser is Firefox
            if (browser.name == 'firefox') el.css('MozUserSelect', 'none');

            // if browser is Internet Explorer
            else if (browser.name == 'explorer') el.bind('selectstart', function() { return false });

            // for the other browsers
            else el.mousedown(function() { return false });

        }

        /**
         *  Escapes special characters in a string, preparing it for use in a regular expression.
         *
         *  @param  string  str     The string in which special characters should be escaped.
         *
         *  @return string          Returns the string with escaped special characters.
         *
         *  @access private
         */
        var escape_regexp = function(str) {

            // return string with special characters escaped
            return str.replace(/([-.,*+?^${}()|[\]\/\\])/g, '\\$1');

        }

        /**
         *  Formats a JavaScript date object to the format specified by the "format" property.
         *  Code taken from http://electricprism.com/aeron/calendar/
         *
         *  @param  date    date    A valid JavaScript date object
         *
         *  @return string          Returns a string containing the formatted date
         *
         *  @access private
         */
        var format = function(date) {

            var result = '',

                // extract parts of the date:
                // day number, 1 - 31
                j = date.getDate(),

                // day of the week, 0 - 6, Sunday - Saturday
                w = date.getDay(),

                // the name of the day of the week Sunday - Saturday
                l = plugin.settings.days[w],

                // the month number, 1 - 12
                n = date.getMonth() + 1,

                // the month name, January - December
                f = plugin.settings.months[n - 1],

                // the year (as a string)
                y = date.getFullYear() + '';

            // iterate through the characters in the format
            for (var i = 0; i < plugin.settings.format.length; i++) {

                // extract the current character
                var chr = plugin.settings.format.charAt(i);

                // see what character it is
                switch(chr) {

                    // year as two digits
                    case 'y': y = y.substr(2);

                    // year as four digits
                    case 'Y': result += y; break;

                    // month number, prefixed with 0
                    case 'm': n = str_pad(n, 2);

                    // month number, not prefixed with 0
                    case 'n': result += n; break;

                    // month name, three letters
                    case 'M': f = ($.isArray(plugin.settings.months_abbr) && undefined != plugin.settings.months_abbr[n - 1] ? plugin.settings.months_abbr[n - 1] : plugin.settings.months[n - 1].substr(0, 3));

                    // full month name
                    case 'F': result += f; break;

                    // day number, prefixed with 0
                    case 'd': j = str_pad(j, 2);

                    // day number not prefixed with 0
                    case 'j': result += j; break;

                    // day name, three letters
                    case 'D': l = ($.isArray(plugin.settings.days_abbr) && undefined != plugin.settings.days_abbr[w] ? plugin.settings.days_abbr[w] : plugin.settings.days[w].substr(0, 3));

                    // full day name
                    case 'l': result += l; break;

                    // ISO-8601 numeric representation of the day of the week, 1 - 7
                    case 'N': w++;

                    // day of the week, 0 - 6
                    case 'w': result += w; break;

                    // English ordinal suffix for the day of the month, 2 characters
                    // (st, nd, rd or th (works well with j))
                    case 'S':

                        if (j % 10 == 1 && j != '11') result += 'st';

                        else if (j % 10 == 2 && j != '12') result += 'nd';

                        else if (j % 10 == 3 && j != '13') result += 'rd';

                        else result += 'th';

                        break;

                    // this is probably the separator
                    default: result += chr;

                }

            }

            // return formated date
            return result;

        }

        /**
         *  Generates the day picker view, and displays it
         *
         *  @return void
         *
         *  @access private
         */
        var generate_daypicker = function() {

            var

                // get the number of days in the selected month
                days_in_month = new Date(selected_year, selected_month + 1, 0).getDate(),

                // get the selected month's starting day (from 0 to 6)
                first_day = new Date(selected_year, selected_month, 1).getDay(),

                // how many days are there in the previous month
                days_in_previous_month = new Date(selected_year, selected_month, 0).getDate(),

                // how many days are there to be shown from the previous month
                days_from_previous_month = first_day - plugin.settings.first_day_of_week;

            // the final value of how many days are there to be shown from the previous month
            days_from_previous_month = days_from_previous_month < 0 ? 7 + days_from_previous_month : days_from_previous_month;

            // manage header caption and enable/disable navigation buttons if necessary
            manage_header(plugin.settings.months[selected_month] + ', ' + selected_year);

            // start generating the HTML
            var html = '<tr>';

            // if a column featuring the number of the week is to be shown
            if (plugin.settings.show_week_number)

                // column title
                html += '<th>' + plugin.settings.show_week_number + '</th>';

            // name of week days
            // show the abbreviated day names (or only the first two letters of the full name if no abbreviations are specified)
            // and also, take in account the value of the "first_day_of_week" property
            for (var i = 0; i < 7; i++)

                html += '<th>' + ($.isArray(plugin.settings.days_abbr) && undefined != plugin.settings.days_abbr[(plugin.settings.first_day_of_week + i) % 7] ? plugin.settings.days_abbr[(plugin.settings.first_day_of_week + i) % 7] : plugin.settings.days[(plugin.settings.first_day_of_week + i) % 7].substr(0, 2)) + '</th>';

            html += '</tr><tr>';

            // the calendar shows a total of 42 days
            for (var i = 0; i < 42; i++) {

                // seven days per row
                if (i > 0 && i % 7 == 0) html += '</tr><tr>';

                // if week number is to be shown
                if (i % 7 == 0 && plugin.settings.show_week_number)

                    // show ISO 8601 week number
                    html += '<td class="dp_week_number">' + getWeekNumber(new Date(selected_year, selected_month, (i - days_from_previous_month + 1))) + '</td>';

                // the number of the day in month
                var day = (i - days_from_previous_month + 1);

                // if dates in previous/next month can be selected, and this is one of those days
                if (plugin.settings.select_other_months && (i < days_from_previous_month || day > days_in_month)) {

                    // use the Date object to normalize the date
                    // for example, 2011 05 33 will be transformed to 2011 06 02
                    var real_date = new Date(selected_year, selected_month, day),
                        real_year = real_date.getFullYear(),
                        real_month = real_date.getMonth(),
                        real_day = real_date.getDate();

                    // extract normalized date parts and merge them
                    real_date =  real_year + str_pad(real_month, 2) + str_pad(real_day, 2);

                }

                // if this is a day from the previous month
                if (i < days_from_previous_month)

                    html += '<td class="' + (plugin.settings.select_other_months && !is_disabled(real_year, real_month, real_day) ? 'dp_not_in_month_selectable date_' + real_date : 'dp_not_in_month') + '">' + (plugin.settings.select_other_months || plugin.settings.show_other_months ? str_pad(days_in_previous_month - days_from_previous_month + i + 1, plugin.settings.zero_pad ? 2 : 0) : '&#032;') + '</td>';

                // if this is a day from the next month
                else if (day > days_in_month)

                    html += '<td class="' + (plugin.settings.select_other_months && !is_disabled(real_year, real_month, real_day) ? 'dp_not_in_month_selectable date_' + real_date : 'dp_not_in_month') + '">' + (plugin.settings.select_other_months || plugin.settings.show_other_months ? str_pad(day - days_in_month, plugin.settings.zero_pad ? 2 : 0) : '&#032;') + '</td>';

                // if this is a day from the current month
                else {

                    var

                        // get the week day (0 to 6, Sunday to Saturday)
                        weekday = (plugin.settings.first_day_of_week + i) % 7,

                        class_name = '';

                    // if date needs to be disabled
                    if (is_disabled(selected_year, selected_month, day)) {

                        // if day is in weekend
                        if ($.inArray(weekday, plugin.settings.weekend_days) > -1) class_name = 'dp_weekend_disabled';

                        // if work day
                        else class_name += ' dp_disabled';

                        // highlight the current system date
                        if (selected_month == current_system_month && selected_year == current_system_year && current_system_day == day) class_name += ' dp_disabled_current';

                    // if there are no restrictions
                    } else {

                        // if day is in weekend
                        if ($.inArray(weekday, plugin.settings.weekend_days) > -1) class_name = 'dp_weekend';

                        // highlight the currently selected date
                        if (selected_month == default_month && selected_year == default_year && default_day == day) class_name += ' dp_selected';

                        // highlight the current system date
                        if (selected_month == current_system_month && selected_year == current_system_year && current_system_day == day) class_name += ' dp_current';

                    }

                    // print the day of the month
                    html += '<td' + (class_name != '' ? ' class="' + $.trim(class_name) + '"' : '') + '>' + (plugin.settings.zero_pad ? str_pad(day, 2) : day) + '</td>';

                }

            }

            // wrap up generating the day picker
            html += '</tr>';

            // inject the day picker into the DOM
            daypicker.html($(html));

            // if date picker is always visible
            if (plugin.settings.always_visible)

                // cache all the cells
                // (we need them so that we can easily remove the "dp_selected" class from all of them when user selects a date)
                daypicker_cells = $('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked, .dp_week_number)', daypicker);

            // make the day picker visible
            daypicker.css('display', '');

        }

        /**
         *  Generates the month picker view, and displays it
         *
         *  @return void
         *
         *  @access private
         */
        var generate_monthpicker = function() {

            // manage header caption and enable/disable navigation buttons if necessary
            manage_header(selected_year);

            // start generating the HTML
            var html = '<tr>';

            // iterate through all the months
            for (var i = 0; i < 12; i++) {

                // three month per row
                if (i > 0 && i % 3 == 0) html += '</tr><tr>';

                var class_name = 'dp_month_' + i;

                // if month needs to be disabled
                if (is_disabled(selected_year, i)) class_name += ' dp_disabled';

                // else, if a date is already selected and this is that particular month, highlight it
                else if (default_month !== false && default_month == i) class_name += ' dp_selected';

                // else, if this the current system month, highlight it
                else if (current_system_month == i && current_system_year == selected_year) class_name += ' dp_current';

                // first three letters of the month's name
                html += '<td class="' + $.trim(class_name) + '">' + ($.isArray(plugin.settings.months_abbr) && undefined != plugin.settings.months_abbr[i] ? plugin.settings.months_abbr[i] : plugin.settings.months[i].substr(0, 3)) + '</td>';

            }

            // wrap up
            html += '</tr>';

            // inject into the DOM
            monthpicker.html($(html));

            // if date picker is always visible
            if (plugin.settings.always_visible)

                // cache all the cells
                // (we need them so that we can easily remove the "dp_selected" class from all of them when user selects a month)
                monthpicker_cells = $('td:not(.dp_disabled)', monthpicker);

            // make the month picker visible
            monthpicker.css('display', '');

        }

        /**
         *  Generates the year picker view, and displays it
         *
         *  @return void
         *
         *  @access private
         */
        var generate_yearpicker = function() {

            // manage header caption and enable/disable navigation buttons if necessary
            manage_header(selected_year - 7 + ' - ' + (selected_year + 4));

            // start generating the HTML
            var html = '<tr>';

            // we're showing 9 years at a time, current year in the middle
            for (var i = 0; i < 12; i++) {

                // three years per row
                if (i > 0 && i % 3 == 0) html += '</tr><tr>';

                var class_name = '';

                // if year needs to be disabled
                if (is_disabled(selected_year - 7 + i)) class_name += ' dp_disabled';

                // else, if a date is already selected and this is that particular year, highlight it
                else if (default_year && default_year == selected_year - 7 + i) class_name += ' dp_selected'

                // else, if this is the current system year, highlight it
                else if (current_system_year == (selected_year - 7 + i)) class_name += ' dp_current';

                // first three letters of the month's name
                html += '<td' + ($.trim(class_name) != '' ? ' class="' + $.trim(class_name) + '"' : '') + '>' + (selected_year - 7 + i) + '</td>';

            }

            // wrap up
            html += '</tr>';

            // inject into the DOM
            yearpicker.html($(html));

            // if date picker is always visible
            if (plugin.settings.always_visible)

                // cache all the cells
                // (we need them so that we can easily remove the "dp_selected" class from all of them when user selects a year)
                yearpicker_cells = $('td:not(.dp_disabled)', yearpicker);

            // make the year picker visible
            yearpicker.css('display', '');

        }

        /**
         *  Generates an iFrame shim in Internet Explorer 6 so that the date picker appears above select boxes.
         *
         *  @return void
         *
         *  @access private
         */
        var iframeShim = function(action) {

            // this is necessary only if browser is Internet Explorer 6
    		if (browser.name == 'explorer' && browser.version == 6) {

                // if the iFrame was not yet created
                // "undefined" evaluates as FALSE
                if (!shim) {

                    // the iFrame has to have the element's zIndex minus 1
                    var zIndex = to_int(datepicker.css('zIndex')) - 1;

                    // create the iFrame
                    shim = jQuery('<iframe>', {
                        'src':                  'javascript:document.write("")',
                        'scrolling':            'no',
                        'frameborder':          0,
                        'allowtransparency':    'true',
                        css: {
                            'zIndex':       zIndex,
                            'position':     'absolute',
                            'top':          -1000,
                            'left':         -1000,
                            'width':        datepicker.outerWidth(),
                            'height':       datepicker.outerHeight(),
                            'filter':       'progid:DXImageTransform.Microsoft.Alpha(opacity=0)',
                            'display':      'none'
                        }
                    });

                    // inject iFrame into DOM
                    $('body').append(shim);

                }

                // what do we need to do
                switch (action) {

                    // hide the iFrame?
                    case 'hide':

                        // set the iFrame's display property to "none"
                        shim.css('display', 'none');

                        break;

                    // show the iFrame?
                    default:

                        // get date picker top and left position
                        var offset = datepicker.offset();

                        // position the iFrame shim right underneath the date picker
                        // and set its display to "block"
                        shim.css({
                            'top':      offset.top,
                            'left':     offset.left,
                            'display':  'block'
                        });

                }

            }

        }

        /**
         *  Checks if, according to the restrictions of the calendar and/or the values defined by the "disabled_dates"
         *  property, a day, a month or a year needs to be disabled.
         *
         *  @param  integer     year    The year to check
         *  @param  integer     month   The month to check
         *  @param  integer     day     The day to check
         *
         *  @return boolean         Returns TRUE if the given value is not disabled or FALSE otherwise
         *
         *  @access private
         */
        var is_disabled = function(year, month, day) {

            // don't check bogus values
            if ((undefined == year || isNaN(year)) && (undefined == month || isNaN(month)) && (undefined == day || isNaN(day))) return false;

            // if calendar has direction restrictions
            if (!(!$.isArray(plugin.settings.direction) && to_int(plugin.settings.direction) === 0)) {

                var
                    // normalize and merge arguments then transform the result to an integer
                    now = to_int(str_concat(year, (typeof month != 'undefined' ? str_pad(month, 2) : ''), (typeof day != 'undefined' ? str_pad(day, 2) : ''))),

                    // get the length of the argument
                    len = (now + '').length;

                // if we're checking days
                if (len == 8 && (

                    // day is before the first selectable date
                    (typeof start_date != 'undefined' && now < to_int(str_concat(first_selectable_year, str_pad(first_selectable_month, 2), str_pad(first_selectable_day, 2)))) ||

                    // or day is after the last selectable date
                    (typeof end_date != 'undefined' && now > to_int(str_concat(last_selectable_year, str_pad(last_selectable_month, 2), str_pad(last_selectable_day, 2))))

                // day needs to be disabled
                )) return true;

                // if we're checking months
                else if (len == 6 && (

                    // month is before the first selectable month
                    (typeof start_date != 'undefined' && now < to_int(str_concat(first_selectable_year, str_pad(first_selectable_month, 2)))) ||

                    // or day is after the last selectable date
                    (typeof end_date != 'undefined' && now > to_int(str_concat(last_selectable_year, str_pad(last_selectable_month, 2))))

                // month needs to be disabled
                )) return true;

                // if we're checking years
                else if (len == 4 && (

                    // year is before the first selectable year
                    (typeof start_date != 'undefined' && now < first_selectable_year) ||

                    // or day is after the last selectable date
                    (typeof end_date != 'undefined'  && now > last_selectable_year)

                // year needs to be disabled
                )) return true;

            }

            // if month is given as argument, increment it (as JavaScript uses 0 for January, 1 for February...)
            if (typeof month != 'undefined') month = month + 1;

            // by default, we assume the day/month/year is not enabled nor disabled
            var disabled = false, enabled = false;

            // if there are rules for disabling dates
            if (disabled_dates)

                // iterate through the rules for disabling dates
                $.each(disabled_dates, function() {

                    // if the date is to be disabled, don't look any further
                    if (disabled) return;

                    var rule = this;

                    // if the rules apply for the current year
                    if ($.inArray(year, rule[2]) > -1 || $.inArray('*', rule[2]) > -1)

                        // if the rules apply for the current month
                        if ((typeof month != 'undefined' && $.inArray(month, rule[1]) > -1) || $.inArray('*', rule[1]) > -1)

                            // if the rules apply for the current day
                            if ((typeof day != 'undefined' && $.inArray(day, rule[0]) > -1) || $.inArray('*', rule[0]) > -1) {

                                // if day is to be disabled whatever the day
                                // don't look any further
                                if (rule[3] == '*') return (disabled = true);

                                // get the weekday
                                var weekday = new Date(year, month - 1, day).getDay();

                                // if weekday is to be disabled
                                // don't look any further
                                if ($.inArray(weekday, rule[3]) > -1) return (disabled = true);

                            }

                });

            // if there are rules that explicitly enable dates
            if (enabled_dates)

                // iterate through the rules for enabling dates
                $.each(enabled_dates, function() {

                    // if the date is to be enabled, don't look any further
                    if (enabled) return;

                    var rule = this;

                    // if the rules apply for the current year
                    if ($.inArray(year, rule[2]) > -1 || $.inArray('*', rule[2]) > -1) {

                        // the year is enabled
                        enabled = true;

                        // if we're also checking months
                        if (typeof month != 'undefined') {

                            // we assume the month is enabled
                            enabled = true;

                            // if the rules apply for the current month
                            if ($.inArray(month, rule[1]) > -1 || $.inArray('*', rule[1]) > -1) {

                                // if we're also checking days
                                if (typeof day != 'undefined') {

                                    // we assume the day is enabled
                                    enabled = true;

                                    // if the rules apply for the current day
                                    if ($.inArray(day, rule[0]) > -1 || $.inArray('*', rule[0]) > -1) {

                                        // if day is to be enabled whatever the day
                                        // don't look any further
                                        if (rule[3] == '*') return (enabled = true);

                                        // get the weekday
                                        var weekday = new Date(year, month - 1, day).getDay();

                                        // if weekday is to be enabled
                                        // don't look any further
                                        if ($.inArray(weekday, rule[3]) > -1) return (enabled = true);

                                        // if we get this far, it means the day is not enabled
                                        enabled = false;

                                    // if day is not enabled
                                    } else enabled = false;

                                }

                            // if month is not enabled
                            } else enabled = false;

                        }

                    }

                });

            // if checked date is enabled, return false
            if (enabled_dates && enabled) return false;

            // if checked date is disabled return false
            else if (disabled_dates && disabled) return true;

            // if script gets this far it means that the day/month/year doesn't need to be disabled
            return false;

        }

        /**
         *  Checks whether a value is an integer number.
         *
         *  @param  mixed   value   Value to check
         *
         *  @return                 Returns TRUE if the value represents an integer number, or FALSE otherwise
         *
         *  @access private
         */
        var is_integer = function(value) {

            // return TRUE if value represents an integer number, or FALSE otherwise
            return (value + '').match(/^\-?[0-9]+$/) ? true : false;

        }

        /**
         *  Sets the caption in the header of the date picker and enables or disables navigation buttons when necessary.
         *
         *  @param  string  caption     String that needs to be displayed in the header
         *
         *  @return void
         *
         *  @access private
         */
        var manage_header = function(caption) {

            // update the caption in the header
            $('.dp_caption', header).html(caption);

            // if calendar has direction restrictions or we're looking only at months
            if (!(!$.isArray(plugin.settings.direction) && to_int(plugin.settings.direction) === 0) || (views.length == 1 && views[0] == 'months')) {

                // get the current year and month
                var year = selected_year,
                    month = selected_month,
                    next, previous;

                // if current view is showing days
                if (view == 'days') {

                    // clicking on "previous" should take us to the previous month
                    // (will check later if that particular month is available)
                    previous = (month - 1 < 0 ? str_concat(year - 1, '11') : str_concat(year, str_pad(month - 1, 2)));

                    // clicking on "next" should take us to the next month
                    // (will check later if that particular month is available)
                    next = (month + 1 > 11 ? str_concat(year + 1, '00') : str_concat(year, str_pad(month + 1, 2)));

                // if current view is showing months
                } else if (view == 'months') {

                    // clicking on "previous" should take us to the previous year
                    // (will check later if that particular year is available)
                    previous = year - 1;

                    // clicking on "next" should take us to the next year
                    // (will check later if that particular year is available)
                    next = year + 1;

                // if current view is showing years
                } else if (view == 'years') {

                    // clicking on "previous" should show a list with some previous years
                    // (will check later if that particular list of years contains selectable years)
                    previous = year - 7;

                    // clicking on "next" should show a list with some following years
                    // (will check later if that particular list of years contains selectable years)
                    next = year + 7;

                }

                // if we're looking only at months or
                // if the previous month/year is not selectable or, in case of years, if the list doesn't contain selectable years
                if ((views.length == 1 && views[0] == 'months') || is_disabled(previous)) {

                    // disable the "previous" button
                    $('.dp_previous', header).addClass('dp_blocked');
                    $('.dp_previous', header).removeClass('dp_hover');

                // otherwise enable the "previous" button
                } else $('.dp_previous', header).removeClass('dp_blocked');

                // if we're looking only at months or
                // if the next month/year is not selectable or, in case of years, if the list doesn't contain selectable years
                if ((views.length == 1 && views[0] == 'months') || is_disabled(next)) {

                    // disable the "next" button
                    $('.dp_next', header).addClass('dp_blocked');
                    $('.dp_next', header).removeClass('dp_hover');

                // otherwise enable the "next" button
                } else $('.dp_next', header).removeClass('dp_blocked');

            }

        }

        /**
         *  Shows the appropriate view (days, months or years) according to the current value of the "view" property.
         *
         *  @return void
         *
         *  @access private
         */
		var manage_views = function() {

            // if the day picker was not yet generated
            if (daypicker.text() == '' || view == 'days') {

                // if the day picker was not yet generated
                if (daypicker.text() == '') {

                    // if date picker is not always visible
                    if (!plugin.settings.always_visible)

                        // temporarily set the date picker's left outside of view
                        // so that we can later grab its width and height
                        datepicker.css('left', -1000);

                    // temporarily make the date picker visible
                    // so that we can later grab its width and height
                    datepicker.css({
                        'display':  'block'
                    });

    				// generate the day picker
    				generate_daypicker();

                    // get the day picker's width and height
                    var width = daypicker.outerWidth(),
                        height = daypicker.outerHeight();

                    // adjust the size of the header
                    header.css('width', width);

                    // make the month picker have the same size as the day picker
                    monthpicker.css({
                        'width':    width,
                        'height':   height
                    });

                    // make the year picker have the same size as the day picker
                    yearpicker.css({
                        'width':    width,
                        'height':   height
                    });

                    // adjust the size of the footer
                    footer.css('width', width);

                    // hide the date picker again
                    datepicker.css({
                        'display':  'none'
                    });

                // if the day picker was previously generated at least once
				// generate the day picker
                } else generate_daypicker();

                // hide the year and the month pickers
                monthpicker.css('display', 'none');
                yearpicker.css('display', 'none');

            // if the view is "months"
            } else if (view == 'months') {

                // generate the month picker
                generate_monthpicker();

                // hide the day and the year pickers
                daypicker.css('display', 'none');
                yearpicker.css('display', 'none');

            // if the view is "years"
            } else if (view == 'years') {

                // generate the year picker
                generate_yearpicker();

                // hide the day and the month pickers
                daypicker.css('display', 'none');
                monthpicker.css('display', 'none');

            }

            // if a callback function exists for when navigating through months/years
            if (plugin.settings.onChange && typeof plugin.settings.onChange == 'function' && undefined != view) {

                // get the "active" elements in the view (ignoring the disabled ones)
                var elements = (view == 'days' ?
                                    daypicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked)') :
                                        (view == 'months' ?
                                            monthpicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked)') :
                                                yearpicker.find('td:not(.dp_disabled, .dp_weekend_disabled, .dp_not_in_month, .dp_blocked)')));

                // iterate through the active elements
                // and attach a "date" data attribute to each element in the form of
                // YYYY-MM-DD if the view is "days"
                // YYYY-MM if the view is "months"
                // YYYY if the view is "years"
                // so it's easy to identify elements in the list
                elements.each(function() {

                    // if view is "days"
                    if (view == 'days')

                        // attach a "date" data attribute to each element in the form of of YYYY-MM-DD for easily identifying sought elements
                        $(this).data('date', selected_year + '-' + str_pad(selected_month + 1, 2) + '-' + str_pad(to_int($(this).text()), 2));

                    // if view is "months"
                    else if (view == 'months') {

                        // get the month's number for the element's class
                        var matches = $(this).attr('class').match(/dp\_month\_([0-9]+)/);

                        // attach a "date" data attribute to each element in the form of of YYYY-MM for easily identifying sought elements
                        $(this).data('date', selected_year + '-' + str_pad(to_int(matches[1]) + 1, 2));

                    // if view is "years"
                    } else

                        // attach a "date" data attribute to each element in the form of of YYYY for easily identifying sought elements
                        $(this).data('date', to_int($(this).text()));

                });

                // execute the callback function and send as arguments the current view, the elements in the view, and
                // the element the plugin is attached to
                plugin.settings.onChange(view, elements, $element);

            }

            // if the button for clearing a previously selected date needs to be visible all the time,
            // or the date picker is always visible - case in which the "clear" button is always visible -
            // or there is content in the element the date picker is attached to
            // and the footer is not visible
            if ((plugin.settings.always_show_clear || plugin.settings.always_visible || $element.val() != ''))

                // show the footer
                footer.css('display', '');

            // hide the footer otherwise
            else footer.css('display', 'none');

		}

        /**
         *  Puts the specified date in the element the plugin is attached to, and hides the date picker.
         *
         *  @param  integer     year    The year
         *
         *  @param  integer     month   The month
         *
         *  @param  integer     day     The day
         *
         *  @param  string      view    The view from where the method was called
         *
         *  @param  object      cell    The element that was clicked
         *
         *  @return void
         *
         *  @access private
         */
        var select_date = function(year, month, day, view, cell) {

            var

                // construct a new date object from the arguments
                default_date = new Date(year, month, day, 12, 0, 0),

                // pointer to the cells in the current view
                view_cells = (view == 'days' ? daypicker_cells : (view == 'months' ? monthpicker_cells : yearpicker_cells)),

                // the selected date, formatted correctly
                selected_value = format(default_date);

            // set the currently selected and formated date as the value of the element the plugin is attached to
            $element.val(selected_value);

            // if date picker is always visible
            if (plugin.settings.always_visible) {

                // extract the date parts and reassign values to these variables
                // so that everything will be correctly highlighted
                default_month = default_date.getMonth();
                selected_month = default_date.getMonth();
                default_year = default_date.getFullYear();
                selected_year = default_date.getFullYear();
                default_day = default_date.getDate();

                // remove the "selected" class from all cells in the current view
                view_cells.removeClass('dp_selected');

                // add the "selected" class to the currently selected cell
                cell.addClass('dp_selected');

            }

            // hide the date picker
            plugin.hide();

            // updates value for the date picker whose starting date depends on the selected date (if any)
            update_dependent(default_date);

            // if a callback function exists for when selecting a date
            if (plugin.settings.onSelect && typeof plugin.settings.onSelect == 'function')

                // execute the callback function
                plugin.settings.onSelect(selected_value, year + '-' + str_pad(month + 1, 2) + '-' + str_pad(day, 2), default_date, $element);

            $element.focus();

        }

        /**
         *  Concatenates any number of arguments and returns them as string.
         *
         *  @return string  Returns the concatenated values.
         *
         *  @access private
         */
        var str_concat = function() {

            var str = '';

            // concatenate as string
            for (var i = 0; i < arguments.length; i++) str += (arguments[i] + '');

            // return the concatenated values
            return str;

        }

        /**
         *  Left-pad a string to a certain length with zeroes.
         *
         *  @param  string  str     The string to be padded.
         *
         *  @param  integer len     The length to which the string must be padded
         *
         *  @return string          Returns the string left-padded with leading zeroes
         *
         *  @access private
         */
        var str_pad = function(str, len) {

            // make sure argument is a string
            str += '';

            // pad with leading zeroes until we get to the desired length
            while (str.length < len) str = '0' + str;

            // return padded string
            return str;

        }

        /**
         *  Returns the integer representation of a string
         *
         *  @return int     Returns the integer representation of the string given as argument
         *
         *  @access private
         */
        var to_int = function(str) {

            // return the integer representation of the string given as argument
            return parseInt(str , 10);

        }

        /**
         *  Updates the paired date picker (whose starting date depends on the value of the current date picker)
         *
         *  @param  date    date    A JavaScript date object representing the currently selected date
         *
         *  @return void
         *
         *  @access private
         */
        var update_dependent = function(date) {

            // if the pair element exists
            if (plugin.settings.pair) {

                // iterate through the pair elements (as there may be more than just one)
                $.each(plugin.settings.pair, function() {

                    var $pair = $(this);

                    // chances are that in the beginning the pair element doesn't have the Zebra_DatePicker attached to it yet
                    // (as the "start" element is usually created before the "end" element)
                    // so we'll have to rely on "data" to send the starting date to the pair element

                    // therefore, if Zebra_DatePicker is not yet attached
                    if (!($pair.data && $pair.data('Zebra_DatePicker')))

                        // set the starting date like this
                        $pair.data('zdp_reference_date', date);

                    // if Zebra_DatePicker is attached to the pair element
                    else {

                        // reference the date picker object attached to the other element
                        var dp = $pair.data('Zebra_DatePicker');

                        // update the other date picker's starting date
                        // the value depends on the original value of the "direction" attribute
                        // (also, if the pair date picker does not have a direction, set it to 1)
                        dp.update({
                            'reference_date':   date,
                            'direction':        dp.settings.direction == 0 ? 1 : dp.settings.direction
                        });

                        // if the other date picker is always visible, update the visuals now
                        if (dp.settings.always_visible) dp.show()

                    }

                });

            }

        }

        /**
         *  Calculate the ISO 8601 week number for a given date.
         *
         *  Code is based on the algorithm at http://www.tondering.dk/claus/cal/week.php#calcweekno
         */
        var getWeekNumber = function(date) {

            var y = date.getFullYear(),
                m = date.getMonth() + 1,
                d = date.getDate(),
                a, b, c, s, e, f, g, d, n, w;

            // If month jan. or feb.
            if (m < 3) {

                a = y - 1;
                b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
                c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
                s = b - c;
                e = 0;
                f = d - 1 + 31 * (m - 1);

            // If month mar. through dec.
            } else {

                a = y;
                b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
                c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
                s = b - c;
                e = s + 1;
                f = d + ((153 * (m - 3) + 2) / 5 | 0) + 58 + s;

            }

            g = (a + b) % 7;
            // ISO Weekday (0 is monday, 1 is tuesday etc.)
            d = (f + g - e) % 7;
            n = f + 3 - d;

            if (n < 0) w = 53 - ((g - s) / 5 | 0);

            else if (n > 364 + s) w = 1;

            else w = (n / 7 | 0) + 1;

            return w;

        }

        /**
         *  Function to be called when the "onKeyUp" event occurs
         *
         *  Why as a separate function and not inline when binding the event? Because only this way we can "unbind" it
         *  if the date picker is destroyed
         *
         *  @return boolean     Returns TRUE
         *
         *  @access private
         */
        plugin._keyup = function(e) {

            // if the date picker is visible
            // and the pressed key is ESC
            // hide the date picker
            if (datepicker.css('display') == 'block' || e.which == 27) plugin.hide();

            return true;

        }

        /**
         *  Function to be called when the "onMouseDown" event occurs
         *
         *  Why as a separate function and not inline when binding the event? Because only this way we can "unbind" it
         *  if the date picker is destroyed
         *
         *  @return boolean     Returns TRUE
         *
         *  @access private
         */
        plugin._mousedown = function(e) {

            // if the date picker is visible
            if (datepicker.css('display') == 'block') {

                // if the calendar icon is visible and we clicked it, let the onClick event of the icon to handle the event
                // (we want it to toggle the date picker)
                if (plugin.settings.show_icon && $(e.target).get(0) === icon.get(0)) return true;

                // if what's clicked is not inside the date picker
                // hide the date picker
                if ($(e.target).parents().filter('.Zebra_DatePicker').length == 0) plugin.hide();

            }

            return true;

        }

        // since with jQuery 1.9.0 the $.browser object was removed, we rely on this piece of code from
        // http://www.quirksmode.org/js/detect.html to detect the browser
        var browser = {
        	init: function () {
        		this.name = this.searchString(this.dataBrowser) || '';
        		this.version = this.searchVersion(navigator.userAgent)
        			|| this.searchVersion(navigator.appVersion)
        			|| '';
        	},
        	searchString: function (data) {
        		for (var i=0;i<data.length;i++)	{
        			var dataString = data[i].string;
        			var dataProp = data[i].prop;
        			this.versionSearchString = data[i].versionSearch || data[i].identity;
        			if (dataString) {
        				if (dataString.indexOf(data[i].subString) != -1)
        					return data[i].identity;
        			}
        			else if (dataProp)
        				return data[i].identity;
        		}
        	},
        	searchVersion: function (dataString) {
        		var index = dataString.indexOf(this.versionSearchString);
        		if (index == -1) return;
        		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
        	},
        	dataBrowser: [
        		{
        			string: navigator.userAgent,
        			subString: 'Firefox',
        			identity: 'firefox'
        		},
        		{
        			string: navigator.userAgent,
        			subString: 'MSIE',
        			identity: 'explorer',
        			versionSearch: 'MSIE'
        		}
        	]
        }
        browser.init();

        // initialize the plugin
        init();

    }

    $.fn.Zebra_DatePicker = function(options) {

        return this.each(function() {

            // if element has a date picker already attached
            if (undefined != $(this).data('Zebra_DatePicker')) {

                // get reference to the previously attached date picker
                var plugin = $(this).data('Zebra_DatePicker');

                // remove the attached icon (if it exists)...
                if (undefined != plugin.icon) plugin.icon.remove();
                // ...and the calendar
                plugin.datepicker.remove();

                // remove associated event handlers from the document
                $(document).unbind('keyup', plugin._keyup);
                $(document).unbind('mousedown', plugin._mousedown);

            }

            // create a new instance of the plugin
            var plugin = new $.Zebra_DatePicker(this, options);

            // save a reference to the newly created object
            $(this).data('Zebra_DatePicker', plugin);

        });

    }

})(jQuery);

define("plugins/misc/zebra_datepicker.src", function(){});

// Generated by CoffeeScript 1.6.2

/*
 # --- jQuery outer-click Plugin --------------------------
 # 
 # @see https://gist.github.com/kkosuge/3669605
 # 
 #  指定した要素以外のクリックでイベントを発火させる
 #  例： $("#notification-list").outerClick(function (event) { ... });
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($, elements, OUTER_CLICK) {
  var check;

  check = function(event) {
    var el, i, l, target, _results;

    i = 0;
    l = elements.length;
    target = event.target;
    el = void 0;
    _results = [];
    while (i < l) {
      el = elements[i];
      if (el !== target && !(el.contains ? el.contains(target) : (el.compareDocumentPosition ? el.compareDocumentPosition(target) & 16 : 1))) {
        $.event.trigger(OUTER_CLICK, event, el);
      }
      _results.push(i++);
    }
    return _results;
  };
  $.event.special[OUTER_CLICK] = {
    setup: function() {
      var i;

      i = elements.length;
      if (!i) {
        $.event.add(document, "click", check);
      }
      if ($.inArray(this, elements) < 0) {
        return elements[i] = this;
      }
    },
    teardown: function() {
      var i;

      i = $.inArray(this, elements);
      if (i >= 0) {
        elements.splice(i, 1);
        if (!elements.length) {
          return jQuery(this).unbind("click", check);
        }
      }
    }
  };
  return $.fn[OUTER_CLICK] = function(fn) {
    if (fn) {
      return this.bind(OUTER_CLICK, fn);
    } else {
      return this.trigger(OUTER_CLICK);
    }
  };
})(jQuery, [], "outerClick");

(function($) {
  /*
  	 # select ranges within input fields
  	 #
  	 # @param int start
  	 # @param int end
  */

  var DateEditable, InlineEditable, JJEditable, JJEditor, JJPopoverEditable, MarkdownEditable, ModalEditable, SelectEditable, SelectListConfirmEditable, SelectListEditable, SelectPersonEditable, SplitMarkdownEditable, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;

  $.fn._selectRange = function(start, end) {
    if (!end) {
      end = start;
    }
    return this.each(function() {
      var range;

      if (this['setSelectionRange']) {
        this.focus();
        return this.setSelectionRange(start, end);
      } else if (this.createTextRange) {
        range = this.createTextRange();
        range.collapse(true);
        range.moveEnd("character", end);
        range.moveStart("character", start);
        return range.select();
      }
    });
  };
  JJEditor = (function() {
    var addComponent, addContentType, createComponent, destroyComponent, extractScope, getComponentByContentType, trimObject;

    JJEditor.prototype.members = function() {
      this._contentTypes = {};
      this._components = {};
      this._storage = {};
      this._events = {};
      this.debug = false;
      return this.attr = {
        _namespace: 'editor-',
        type: 'type',
        name: 'name',
        scope: 'scope',
        placeholder: 'placeholder',
        options: 'options',
        handledBy: 'handled-by',
        componentId: 'component-id'
      };
    };

    function JJEditor(scope, components) {
      var _this = this;

      this.members();
      if (components === void 0) {
        components = scope;
        scope = $(document);
      }
      this.scope = scope instanceof jQuery ? scope : $(scope);
      if (this.debug) {
        console.group('EDITOR: add Components');
      }
      $.map(components, function(component) {
        if (_this.debug) {
          console.log('- ' + component);
        }
        return addComponent.call(_this, component);
      });
      if (this.debug) {
        console.groupEnd();
      }
      this.on('change:\\', function(e) {
        return _this.updateState(e.fullName, e.value, false, e.replace);
      });
      this.on('editor.removeComponent', function(fullName) {
        return _this.updateState(fullName, null, false, true);
      });
      this.updateElements();
    }

    JJEditor.prototype.getAttr = function(name) {
      if (this.attr[name]) {
        return this.attr._namespace + this.attr[name];
      } else {
        return false;
      }
    };

    /*
    		 # on, off, trigger via $.Callbacks() 
    		 #
    		 # @see http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
    */


    JJEditor.prototype.on = function(name, callback) {
      if (!this._events[name]) {
        this._events[name] = $.Callbacks('unique');
      }
      return this._events[name].add(callback);
    };

    JJEditor.prototype.off = function(name, callback) {
      if (!this._events[name]) {
        return;
      }
      return this._events[name].remove(callback);
    };

    JJEditor.prototype.trigger = function(name, eventData) {
      if (this.debug && name.indexOf(':' !== -1)) {
        console.group('EDITOR: trigger ' + name);
        console.log(eventData);
        console.groupEnd();
      }
      if (this._events[name]) {
        return this._events[name].fire(eventData);
      }
    };

    JJEditor.prototype.updateState = function(scope, value, silent, replace) {
      var i, name, obj, replaced, scopeParts, tmp, _i, _len;

      if (this.debug) {
        console.group('EDITOR: update state');
      }
      if (this.debug) {
        console.log('scope: %s -> %O', scope, value);
      }
      replaced = false;
      if (replace) {
        scopeParts = scope.split('.');
        name = scopeParts.splice(-1)[0];
        tmp = this._storage;
        for (_i = 0, _len = scopeParts.length; _i < _len; _i++) {
          i = scopeParts[_i];
          if (!tmp[i]) {
            break;
          }
          tmp = tmp[i];
        }
        if (tmp[name]) {
          tmp[name] = value;
          replaced = true;
        }
      }
      if (!replaced) {
        obj = {};
        obj[scope] = value;
        this._storage = $.extend(true, this._storage, extractScope.call(this, obj));
      }
      if (this.debug) {
        console.log(this._storage);
      }
      if (this.debug) {
        console.groupEnd();
      }
      if (!silent) {
        if (this.debug) {
          console.log(this._storage);
        }
        if (this.debug) {
          console.log(this.getState());
        }
        return this.trigger('stateUpdate', this._storage);
      }
    };

    JJEditor.prototype.getState = function() {
      return this._storage;
    };

    /*
    		 # adds a new component with the settings of the DOM element to the editor.
    		 #
    		 # @param $el jQuery element
    		 #
    		 # @return JJEditable
    */


    JJEditor.prototype.addElement = function($el) {
      var component, contentType;

      contentType = $el.data(this.getAttr('type'));
      component = false;
      if ($el.attr(this.getAttr('handledBy'))) {
        if (this.debug) {
          console.log('already handled by the editor!');
        }
        return component;
      }
      if (-1 !== $.inArray(contentType, Object.keys(this._contentTypes))) {
        component = getComponentByContentType.call(this, contentType);
        $el.data(this.getAttr('componentId'), component.id);
        component.init($el);
        if (this.debug) {
          console.log('added element: %s', component.getDataFullName());
        }
      }
      return component;
    };

    /*
    		 # removes the component instance associated with the given element
    */


    JJEditor.prototype.removeElement = function($el) {
      var component, componentId;

      if (this.debug) {
        console.group('EDITOR: remove component');
      }
      componentId = $el.data(this.getAttr('componentId'));
      component = this.getComponent(componentId);
      if (component) {
        destroyComponent.call(this, component);
        if (this.debug) {
          console.groupEnd();
        }
        return true;
      }
      return false;
    };

    /*
    		 # removes an element by scope
    		 #
    		 # @example editor.removeElementByScope('Foo.Bar.Title');
    */


    JJEditor.prototype.removeElementByScope = function(fullName) {
      var component, components, i, removed;

      components = this.getComponents();
      removed = false;
      if (this.debug) {
        console.group('EDITOR: remove component by scope: %s', fullName);
      }
      for (i in components) {
        component = components[i];
        if (fullName === component.getDataFullName()) {
          destroyComponent.call(this, component);
          removed = true;
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return removed;
    };

    /*
    		 # remove elements by scope
    		 #
    		 # @example editor.removeElementsByScope('Foo.Bar');
    		 # @example editor.removeElementsByScope('Foo.Bar', ['Title, Description']);
    */


    JJEditor.prototype.removeElementsByScope = function(scope, names) {
      var all, component, components, i, removed;

      if (names == null) {
        names = [];
      }
      components = this.getComponents();
      removed = false;
      if (!names.length) {
        all = true;
      }
      if (this.debug) {
        console.group('EDITOR: remove components by scope: %s, names: %O', scope, names);
      }
      for (i in components) {
        component = components[i];
        if (scope === component.getDataScope()) {
          if (all || -1 !== $.inArray(component.getDataName(), names)) {
            destroyComponent.call(this, component);
            removed = true;
          }
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return removed;
    };

    /*
    		 # syncs the editor components with the current DOM-Structure
    */


    JJEditor.prototype.updateElements = function() {
      var component, handledBy, id, _ref,
        _this = this;

      handledBy = this.getAttr('handledBy');
      if (this.debug) {
        console.group('EDITOR: update Elements');
      }
      $('[data-' + this.getAttr('type') + ']', this.scope).each(function(i, el) {
        var $el;

        $el = $(el);
        if (!$el.attr(handledBy)) {
          return _this.addElement($el);
        }
      });
      _ref = this.getComponents();
      for (id in _ref) {
        component = _ref[id];
        if (!component.elementExists()) {
          destroyComponent.call(this, component);
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return null;
    };

    /*
    		 # removes all component bindings and destroys the editor.
    */


    JJEditor.prototype.destroy = function() {
      var callbacks, component, id, name, _ref, _ref1;

      if (this.debug) {
        console.log('going to destroy the editor and remove all');
      }
      this.off();
      _ref = this._events;
      for (name in _ref) {
        callbacks = _ref[name];
        callbacks.disable();
        callbacks.empty();
      }
      _ref1 = this.getComponents();
      for (id in _ref1) {
        component = _ref1[id];
        destroyComponent.call(this, component);
      }
      return false;
    };

    /*
    		 # registers a new component
    		 #
    		 # @private
    		 # @param [string] name
    */


    addComponent = function(name) {
      var component,
        _this = this;

      if (!window.editorComponents[name]) {
        throw new ReferenceError("The Component '" + name + "' doesn't exists. Maybe you forgot to add it to the global 'window.editorComponents' namespace?");
      }
      component = new window.editorComponents[name](this);
      return $.map(component.contentTypes, function(type) {
        return addContentType.call(_this, type, name);
      });
    };

    /*
    		 # @private
    */


    getComponentByContentType = function(type) {
      var componentName, lowerType;

      lowerType = type.toLowerCase();
      componentName = this._contentTypes[lowerType];
      if (componentName) {
        return createComponent.call(this, componentName);
      } else {
        return null;
      }
    };

    /*
    		 # @private
    */


    createComponent = function(name) {
      var component;

      if (window.editorComponents[name]) {
        component = new window.editorComponents[name](this);
        component.name = name.toLowerCase();
        this._components[component.id] = component;
        return component;
      } else {
        return null;
      }
    };

    /*
    		 # @private
    		 #
    */


    destroyComponent = function(component) {
      var id,
        _this = this;

      id = component.getId();
      if (this.debug) {
        console.log('EDITOR: destroy component %s', component.getDataFullName());
      }
      component.destroy();
      this._components[id] = null;
      $.map(component.contentTypes, function(type) {
        if (_this._contentTypes[type]) {
          return delete _this._contentTypes[type];
        }
      });
      return delete this._components[id];
    };

    JJEditor.prototype.getComponent = function(id) {
      if (this._components[id]) {
        return this._components[id];
      } else {
        return null;
      }
    };

    JJEditor.prototype.getComponents = function() {
      return this._components;
    };

    /*
    		 # returns an array with all components from the given className
    		 #
    		 # @param [string] type
    		 #
    		 # @return array
    */


    JJEditor.prototype.getComponentsByClassName = function(className) {
      var component, components, id, results;

      components = this.getComponents();
      results = [];
      for (id in components) {
        component = components[id];
        if (component.name === className) {
          results.push(component);
        }
      }
      return results;
    };

    /*
    		 # returns an array with all components from the given type
    		 #
    		 # @param [string] type
    		 #
    		 # @return array
    */


    JJEditor.prototype.getComponentsByType = function(type) {
      var component, components, id, results;

      components = this.getComponents();
      results = [];
      for (id in components) {
        component = components[id];
        if (-1 !== $.inArray(type.toLowerCase(), component.contentTypes)) {
          results.push(component);
        }
      }
      return results;
    };

    /*
    		 # returns a Editor-Component by name
    		 #
    		 # @param [string] fullName
    		 #
    		 # @return JJEditable
    */


    JJEditor.prototype.getComponentByName = function(fullName) {
      var component, components, id;

      components = this.getComponents();
      for (id in components) {
        component = components[id];
        if (component.getDataFullName() === fullName) {
          return component;
        }
      }
      return null;
    };

    /*
    		 #
    		 # @private
    		 #
    		 # @param [string] content type
    		 # @param [string] component name
    */


    addContentType = function(type, componentName) {
      var lowerType;

      lowerType = type.toLowerCase();
      if (this._contentTypes[lowerType]) {
        return console.error('Another Component (' + this._contentTypes[lowerType] + ') is already handling the content-type "' + type + '"');
      } else {
        return this._contentTypes[lowerType] = componentName;
      }
    };

    /*
    		 #
    		 # @private
    		 #
    		 # @param [object] Object
    */


    trimObject = function(obj) {
      var key, value;

      for (key in obj) {
        value = obj[key];
        if (typeof value === 'object') {
          value = trimObject(value);
        }
        if (value === null || value === void 0 || $.isEmptyObject(obj[key])) {
          delete obj[key];
        }
      }
      return obj;
    };

    /*
    		 # keys with dot syntax are divided into multi-dimensional objects.
    		 #
    		 # @private
    		 #
    		 # @param [object] Object
    		 #
    */


    extractScope = function(o) {
      var k, key, oo, part, parts, t;

      oo = {};
      t = void 0;
      parts = void 0;
      part = void 0;
      for (k in o) {
        t = oo;
        parts = k.split('.');
        key = parts.pop();
        while (parts.length) {
          part = parts.shift();
          t = t[part] = t[part] || {};
        }
        t[key] = o[k];
      }
      return oo;
    };

    return JJEditor;

  })();
  /*
  	 # Abstract Editable Class
  	 #
  	 # @param [Editor] editor
  	 # 
  	 #
  	 # Custom event names can be easily created and destroyed with the 'getNamespacedEventName' function
  	 # @example
  	 # 		$foo.on(this.getNamespacedEventName('click'), function() {
  	 #			console.log('clicked');
  	 #		});
  	 #
  	 #		$foo.off(this.getNamespacedEventName('click'));
  	 #
  */

  JJEditable = (function() {
    var getEventName;

    JJEditable.prototype.members = function() {
      this._prevValue = '';
      this._value = '';
      this._options = {};
      this._dataName = '';
      this._dataFullName = '';
      this.contentTypes = [];
      return this.name = '';
    };

    function JJEditable(editor) {
      this.editor = editor;
      this.members();
      this.id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r, v;

        r = Math.random() * 16 | 0;
        v = (c === "x" ? r : r & 0x3 | 0x8);
        return v.toString(16);
      });
      if (this.constructor.name === 'Editable') {
        throw new ReferenceError('"Editable" is an abstract class. Please use one of the subclasses instead.');
      }
    }

    JJEditable.prototype.init = function(element) {
      var val;

      this.element = element;
      if (!this.element) {
        console.log('JJEditabel: no element found.');
        return;
      }
      this.setDataName(element.data(this.editor.getAttr('name')));
      this.updateOptions(element.data(this.editor.getAttr('options')), true);
      element.attr(this.editor.getAttr('handledBy'), this.id);
      if (this._options.elementClasses) {
        element.addClass(this._options.elementClasses);
      }
      this.updateValue(true);
      val = this.getValue();
      if (val && this.isValidValue(val)) {
        return this.setValueToContent(val);
      } else {
        return this.setValueToContent(this.getPlaceholder(), true);
      }
    };

    /*
    		 # returns a namespaced event name
    		 # 
    		 # @param [string] event name
    		 # @return string
    */


    getEventName = function(name) {
      return name = -1 !== name.indexOf('.') ? name : this.name + '.' + name;
    };

    JJEditable.prototype.getNamespacedEventName = function(name) {
      var eventNames, n, names, _i, _len;

      names = name.split(' ');
      eventNames = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        n = names[_i];
        eventNames.push("" + n + "." + this.id);
      }
      return eventNames.join(' ');
    };

    JJEditable.prototype.trigger = function(name, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      name = getEventName.call(this, name);
      return this.editor.trigger(name, eventData);
    };

    JJEditable.prototype.triggerScopeEvent = function(type, eventData) {
      var currScope, i, prefix, scope, scopeName, scopeNames, _results;

      if (eventData == null) {
        eventData = {};
      }
      scope = this.getDataScope();
      scope;
      $.extend(eventData, {
        name: this.getDataName(),
        scope: scope,
        fullName: this.getDataFullName(),
        senderId: this.id
      });
      scopeNames = scope.split('.');
      scopeNames.unshift('\\');
      _results = [];
      for (i in scopeNames) {
        scopeName = scopeNames[i];
        prefix = scopeNames.slice(0, i).join('.');
        if (prefix) {
          prefix += '.';
        }
        currScope = prefix + scopeName;
        currScope = currScope.replace('\\.', '');
        _results.push(this.editor.trigger(type + ':' + currScope, eventData));
      }
      return _results;
    };

    JJEditable.prototype.triggerDataEvent = function(type, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      return this.editor.trigger(type + ':' + this.getDataFullName(), eventData);
    };

    JJEditable.prototype.on = function(name, callback) {
      name = getEventName.call(this, name);
      name = this.getNamespacedEventName(name);
      if (!this.editor) {
        return this.editor.on(name, callback);
      }
    };

    JJEditable.prototype.off = function(name, callback) {
      name = getEventName.call(this, name);
      name = this.getNamespacedEventName(name);
      if (!this.editor) {
        return this.editor.off(name, callback);
      }
    };

    JJEditable.prototype.getElement = function() {
      return this.element;
    };

    /*
    		 # returns true if the element is still present in the documents DOM
    		 # @see http://stackoverflow.com/a/4040848/520544
    		 #
    		 # @return boolean
    */


    JJEditable.prototype.elementExists = function() {
      return this.element.closest('body').length > 0;
    };

    JJEditable.prototype.getId = function() {
      return this.id;
    };

    /*
    		 # sets the value of the component
    		 #
    		 # @param [object] value
    		 # @param [boolean] silent
    */


    JJEditable.prototype.setValue = function(value, silent, replace) {
      var prevVal, val;

      if (!silent && this._prevValue === value) {
        return;
      }
      this._prevValue = this._value;
      this._value = value;
      if (silent) {
        this.editor.updateState(this.getDataFullName(), this.getValue(), silent, replace);
      } else {
        prevVal = this.getPrevValue();
        val = this.getValue();
        this.triggerScopeEvent('change', {
          value: val,
          prevValue: prevVal,
          replace: replace
        });
        this.triggerDataEvent('change', {
          value: val,
          prevValue: prevVal,
          replace: replace
        });
        if (typeof value === 'string') {
          this.render();
        }
      }
      return true;
    };

    JJEditable.prototype.getValue = function() {
      return this._value;
    };

    JJEditable.prototype.getPrevValue = function() {
      return this._prevValue;
    };

    /*
    		 # use this method if you're going bind an element property to the component value.
    		 #
    		 # @use DateEditable.updateValue as an example
    		 #
    */


    JJEditable.prototype.updateValue = function(silent) {
      return this.setValue(this.getValueFromContent(), silent);
    };

    JJEditable.prototype.getValueFromContent = function() {
      return null;
    };

    JJEditable.prototype.setValueToContent = function(val, isPlaceholder) {};

    JJEditable.prototype.isValidValue = function(val) {
      if (val) {
        return true;
      } else {
        return false;
      }
    };

    JJEditable.prototype.getPlaceholder = function() {
      var placeholder;

      placeholder = this.element.data(this.editor.getAttr('placeholder'));
      if (placeholder) {
        return placeholder;
      } else {
        return this.getDataName();
      }
    };

    JJEditable.prototype.getValueOrPlaceholder = function() {
      var value;

      value = this.getValue();
      if (this.debug) {
        console.log('value or placeholder: ' + value);
      }
      if (value) {
        return value;
      } else {
        return this.getPlaceholder();
      }
    };

    JJEditable.prototype.setDataName = function(dataName) {
      var getElementScope, getName, getNamespace, name, scope,
        _this = this;

      getName = function(dataName) {
        return dataName.split('.').slice(-1)[0];
      };
      getNamespace = function(dataName) {
        var prefix;

        prefix = '.';
        if (dataName[0] === '\\') {
          prefix = '';
          dataName = dataName.slice(1);
        }
        if (dataName.lastIndexOf('.') !== -1) {
          return prefix + dataName.slice(0, dataName.lastIndexOf('.'));
        } else {
          return '';
        }
      };
      getElementScope = function() {
        var cleanUpScopeName, crawlDom, scopeDataName;

        scopeDataName = _this.editor.getAttr('scope');
        cleanUpScopeName = function(name) {
          if (name[0] === '\\') {
            return name.slice(1);
          } else {
            return name;
          }
        };
        crawlDom = function($el, currentScope) {
          var $scopeEl, scopeName;

          $scopeEl = $el.closest("[data-" + scopeDataName + "]");
          if ($scopeEl.length) {
            scopeName = $scopeEl.data(scopeDataName);
            currentScope = scopeName + currentScope;
            if (scopeName[0] !== '\\') {
              return currentScope = crawlDom($scopeEl.parent(), '.' + currentScope);
            } else {
              return cleanUpScopeName(currentScope);
            }
          } else if (currentScope[0] === '\\') {
            return cleanUpScopeName(currentScope);
          } else {
            throw new Error("Couldn't find a complete scope for " + (getName(dataName)) + ". Maybe you forgot to add a Backslash at the beginning of your stack? \Foo.Bar.FooBar");
          }
        };
        return crawlDom(_this.element, getNamespace(dataName));
      };
      if (!dataName) {
        throw new Error('Please add a data-' + this.editor.getAttr('name') + ' attribute');
      }
      if (dataName[0] === '\\') {
        scope = getNamespace(dataName);
      } else {
        scope = getElementScope();
      }
      name = getName(dataName);
      this._dataScope = scope;
      return this._dataName = name;
    };

    JJEditable.prototype.getDataScope = function() {
      return this._dataScope;
    };

    JJEditable.prototype.getDataFullName = function() {
      return "" + this._dataScope + "." + this._dataName;
    };

    JJEditable.prototype.getDataName = function() {
      return this._dataName;
    };

    JJEditable.prototype.getOptions = function() {
      return this._options;
    };

    JJEditable.prototype.updateOptions = function(options, silent) {
      this._options = $.extend(true, this._options, options);
      if (!silent) {
        return this.onOptionsUpdate();
      }
    };

    JJEditable.prototype.onOptionsUpdate = function() {};

    JJEditable.prototype.render = function() {
      if (this.element) {
        return this.element.html(this.getValueOrPlaceholder());
      }
    };

    JJEditable.prototype.destroy = function() {
      this.element.removeAttr(this.editor.getAttr('handledBy'));
      this.trigger('editor.removeComponent', this.getDataFullName());
      this.editor.off(this.getNamespacedEventName('editor'));
      return this.editor = null;
    };

    return JJEditable;

  })();
  /*
  	 # Abstract Popover Class
  	 
  	 # @options:
  	 #	repositionOnChange: true/false auto update popover position
  */

  JJPopoverEditable = (function(_super) {
    __extends(JJPopoverEditable, _super);

    JJPopoverEditable.prototype.members = function() {
      JJPopoverEditable.__super__.members.call(this);
      this._popoverContent = '';
      this.popoverClasses = [];
      this.closeOnOuterClick = true;
      return this.repositionOnChangeTimeout = null;
    };

    function JJPopoverEditable(editor) {
      this.editor = editor;
      if (this.constructor.name === 'PopoverEditable') {
        throw new ReferenceError('"PopoverEditable" is an abstract class. Please use one of the subclasses instead.');
      }
      JJPopoverEditable.__super__.constructor.call(this, editor);
    }

    JJPopoverEditable.prototype.init = function(element) {
      var _this = this;

      if (!element) {
        console.log('JJPopoverEditable: no element found.');
        return;
      }
      if (!this._options.position) {
        this._options.position = {
          at: 'right center',
          my: 'left center',
          adjust: {
            x: 10,
            resize: true,
            method: 'flip shift'
          }
        };
      }
      if (this._options.repositionOnChange === void 0) {
        this._options.repositionOnChange = true;
      }
      JJPopoverEditable.__super__.init.call(this, element);
      element.qtip({
        events: {
          render: function(event, api) {},
          visible: function() {
            var $input, e;

            $input = $('input, textarea', _this.api.tooltip).eq(0);
            try {
              $input._selectRange($input.val().length);
            } catch (_error) {
              e = _error;
              false;
            }
            if (_this.closeOnOuterClick) {
              _this.api.tooltip.one(_this.getNamespacedEventName('outerClick'), function() {
                return _this.close();
              });
            }
            return true;
          },
          move: function(event, api) {
            _this.onMove(event);
            return true;
          }
        },
        content: {
          text: function() {
            return _this.getPopoverContent();
          },
          title: ''
        },
        position: this.getPosition(),
        show: {
          event: false
        },
        hide: {
          event: false,
          fixed: true
        },
        prerender: true,
        style: {
          classes: this.getPopOverClasses(),
          tip: {
            width: 20,
            height: 10
          }
        }
      });
      this.api = element.qtip('api');
      this.editor.on('editor.closepopovers', function(eventData) {
        if (!eventData || !eventData.senderId || eventData.senderId !== _this.id) {
          return _this.close();
        }
      });
      element.on(this.getNamespacedEventName('click'), function(e) {
        e.preventDefault();
        _this.toggle();
        return false;
      });
      $(window).on(this.getNamespacedEventName('resize'), function() {
        return _this.updateTooltipDimensions();
      });
      return $('body').on(this.getNamespacedEventName('toggle.editor-sidebar'), function(e) {
        if (e.name === 'opened' || e.name === 'close') {
          return _this.autoReposition();
        }
      });
    };

    JJPopoverEditable.prototype.getValueFromContent = function() {
      var placeholder, value;

      placeholder = this.getPlaceholder();
      value = this.element.html();
      if (placeholder === value) {
        return "";
      } else {
        return value;
      }
    };

    JJPopoverEditable.prototype.setValueToContent = function(val, isPlaceholder) {
      return this.element.html(val);
    };

    JJPopoverEditable.prototype.onOptionsUpdate = function() {
      var key, pos, _i, _len, _ref, _results;

      pos = this.getPosition();
      _ref = Object.keys(pos);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(this.element.qtip('option', "position." + key, pos[key]));
      }
      return _results;
    };

    JJPopoverEditable.prototype.getPosition = function() {
      var pos;

      pos = this._options.position ? this._options.position : this.position;
      pos = $.extend(true, pos, {
        adjust: {
          screen: true,
          resize: true
        },
        viewport: $(window)
      });
      return pos;
    };

    JJPopoverEditable.prototype.open = function() {
      this.element.addClass('active');
      this.trigger('editor.closepopovers');
      return this.api.show();
    };

    JJPopoverEditable.prototype.close = function() {
      this.element.removeClass('active');
      this.api.tooltip.unbind(this.getNamespacedEventName('outerClick'));
      return this.api.hide();
    };

    JJPopoverEditable.prototype.toggle = function() {
      if (this.api.tooltip && $(this.api.tooltip).hasClass('qtip-focus')) {
        return this.close();
      } else {
        return this.open();
      }
    };

    JJPopoverEditable.prototype.getPopOverClasses = function() {
      var dataName;

      dataName = (this.getDataFullName()).toLowerCase().replace('.', '-');
      return ['editor-popover'].concat([this.name, dataName], this.popoverClasses).join(' ');
    };

    JJPopoverEditable.prototype.getPopoverContent = function() {
      var types;

      types = this.contentTypes.join(', ');
      if (this._popoverContent) {
        return this._popoverContent;
      } else {
        return "<input placeholder='" + types + " Editor'>";
      }
    };

    /*
    		 # @todo: update current popover content
    */


    JJPopoverEditable.prototype.setPopoverContent = function(value) {
      return this._popoverContent = value;
    };

    /*
    		 #
    */


    JJPopoverEditable.prototype.autoReposition = function() {
      var _this = this;

      if (!this._options.repositionOnChange) {
        return;
      }
      if (this.repositionOnChangeTimeout) {
        clearTimeout(this.repositionOnChangeTimeout);
      }
      this.repositionOnChangeTimeout = setTimeout(function() {
        if (_this.debug) {
          console.log('JJPopoverEditable: Popover reposition');
        }
        _this.updateTooltipDimensions();
        return _this.element.qtip('reposition');
      }, 100);
      return true;
    };

    JJPopoverEditable.prototype.onMove = function(e) {};

    JJPopoverEditable.prototype.updateTooltipDimensions = function() {};

    JJPopoverEditable.prototype.destroy = function() {
      if (this.api && this.api.tooltip) {
        this.api.tooltip.unbind(this.getNamespacedEventName('outerClick'));
      }
      this.element.off(this.getNamespacedEventName('click'));
      $('body').off(this.getNamespacedEventName('toggle.editor-sidebar'));
      $(window).on(this.getNamespacedEventName('resize'));
      return JJPopoverEditable.__super__.destroy.call(this);
    };

    return JJPopoverEditable;

  })(JJEditable);
  /*
  	 #
  */

  InlineEditable = (function(_super) {
    __extends(InlineEditable, _super);

    function InlineEditable() {
      _ref = InlineEditable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    InlineEditable.prototype.members = function() {
      InlineEditable.__super__.members.call(this);
      return this.contentTypes = ['inline'];
    };

    InlineEditable.prototype.init = function(element) {
      var _this = this;

      InlineEditable.__super__.init.call(this, element);
      return element.attr('contenteditable', true).on(this.getNamespacedEventName('blur'), function(e) {
        return _this.updateValue();
      }).on(this.getNamespacedEventName('click focus'), function() {
        return _this.trigger('editor.closepopovers');
      });
    };

    InlineEditable.prototype.getValueFromContent = function() {
      return this.element.text();
    };

    InlineEditable.prototype.setValueToContent = function(val, isPlaceholder) {
      return this.element.html(val);
    };

    InlineEditable.prototype.destroy = function() {
      this.element.removeAttr('contenteditable');
      this.element.off(this.getNamespacedEventName('keyup click focus'));
      return InlineEditable.__super__.destroy.call(this);
    };

    return InlineEditable;

  })(JJEditable);
  /*
  	 # Date Component
  */

  DateEditable = (function(_super) {
    __extends(DateEditable, _super);

    function DateEditable() {
      _ref1 = DateEditable.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DateEditable.prototype.members = function() {
      DateEditable.__super__.members.call(this);
      this.contentTypes = ['date'];
      return this.contentFormattedValue = '';
    };

    DateEditable.prototype.init = function(element) {
      var $content, $datepicker,
        _this = this;

      this.$input = $('<input type="text">');
      $datepicker = $('<div class="datepicker">');
      $content = $('<div>').append(this.$input).append($datepicker);
      this._options.position = {
        my: 'top right',
        at: 'top left',
        adjust: {
          x: -5,
          y: -18,
          method: 'flip shift'
        }
      };
      DateEditable.__super__.init.call(this, element);
      this.contentFormattedValue = this.getPlaceholder();
      this.$input.Zebra_DatePicker({
        format: this.getContentFormat(),
        always_visible: $datepicker,
        onChange: function() {
          if (_this.api) {
            return _this.api.reposition();
          }
        },
        onClear: function() {
          _this.contentFormattedValue = _this.getPlaceholder();
          _this.setValue(null);
          return _this.render();
        },
        onSelect: function(format, ymd, date) {
          _this.contentFormattedValue = format;
          return _this.setValue(ymd);
        }
      });
      return this.setPopoverContent($content);
    };

    DateEditable.prototype.updateValue = function(silent) {
      DateEditable.__super__.updateValue.call(this, silent);
      return this.element.html(this.getValueOrPlaceholder());
    };

    DateEditable.prototype.render = function() {
      return this.element.html(this.contentFormattedValue);
    };

    DateEditable.prototype.setValueToContent = function(val, isPlaceholder) {
      if (this.$input.length && !isPlaceholder) {
        return this.$input.val(val);
      }
    };

    DateEditable.prototype.getFormat = function() {
      return this.getOptions().format || 'Y-m-d';
    };

    DateEditable.prototype.getContentFormat = function() {
      return this.getOptions().contentFormat || this.getFormat();
    };

    DateEditable.prototype.destroy = function() {
      this.$input.off(this.getNamespacedEventName('keyup'));
      return DateEditable.__super__.destroy.call(this);
    };

    return DateEditable;

  })(JJPopoverEditable);
  /*
  	 # Markdown Component
  */

  MarkdownEditable = (function(_super) {
    __extends(MarkdownEditable, _super);

    function MarkdownEditable() {
      _ref2 = MarkdownEditable.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    MarkdownEditable.prototype.members = function() {
      MarkdownEditable.__super__.members.call(this);
      this.contentTypes = ['markdown'];
      this.markdown = null;
      this.markdownChangeTimeout = null;
      this.previewClass = 'preview';
      return this.popoverClasses = ['markdown'];
    };

    MarkdownEditable.prototype.init = function(element) {
      var $preview, $text, initialTriggerDone, options, value,
        _this = this;

      MarkdownEditable.__super__.init.call(this, element);
      element.on(this.getNamespacedEventName('focus'), function() {
        return _this.trigger('editor.closepopovers');
      });
      $text = $('<textarea>', {
        'class': this.previewClass
      });
      value = this.getValue();
      $text.val(value.raw);
      $preview = $('<div>', {
        'class': this.previewClass
      });
      this.setPopoverContent($text);
      initialTriggerDone = false;
      options = {
        placeholder: this.getPlaceholder(),
        preview: element,
        contentGetter: 'val',
        onChange: function(val) {
          if (!initialTriggerDone) {
            initialTriggerDone = true;
            return;
          }
          if (_this.markdownChangeTimeout) {
            clearTimeout(_this.markdownChangeTimeout);
          }
          _this.autoReposition();
          return _this.markdownChangeTimeout = setTimeout(function() {
            _this.setValue(val);
            if (!val.raw) {
              return _this.element.html(_this.getPlaceholder());
            }
          }, 500);
        }
      };
      $.extend(options, this._options || {});
      return this.markdown = new JJMarkdownEditor($text, options);
    };

    MarkdownEditable.prototype.isValidValue = function(val) {
      if (val && val.raw) {
        return true;
      } else {
        return false;
      }
    };

    MarkdownEditable.prototype.getValueFromContent = function() {
      var placeholder, value;

      placeholder = this.getPlaceholder();
      value = this.element.text();
      if (placeholder !== value) {
        return {
          raw: value
        };
      } else {
        return {
          raw: ''
        };
      }
    };

    MarkdownEditable.prototype.destroy = function() {
      this.element.off(this.getNamespacedEventName('focus'));
      this.markdown.cleanup();
      this.markdown = null;
      return MarkdownEditable.__super__.destroy.call(this);
    };

    return MarkdownEditable;

  })(JJPopoverEditable);
  SplitMarkdownEditable = (function(_super) {
    __extends(SplitMarkdownEditable, _super);

    function SplitMarkdownEditable() {
      _ref3 = SplitMarkdownEditable.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    SplitMarkdownEditable.prototype.members = function() {
      SplitMarkdownEditable.__super__.members.call(this);
      this.contentTypes = ['markdown-split'];
      return this.previewClass = 'preview split';
    };

    SplitMarkdownEditable.prototype.init = function(element) {
      this._options.position = {
        my: 'top left',
        at: 'top left',
        type: 'fixed',
        target: [0, 0],
        adjust: {
          x: 0,
          y: 0,
          method: 'none'
        }
      };
      return SplitMarkdownEditable.__super__.init.call(this, element);
    };

    SplitMarkdownEditable.prototype.open = function() {
      this.trigger('editor.open-split-markdown');
      this.updateTooltipDimensions();
      return SplitMarkdownEditable.__super__.open.call(this);
    };

    SplitMarkdownEditable.prototype.close = function() {
      this.trigger('editor.close-split-markdown');
      return SplitMarkdownEditable.__super__.close.call(this);
    };

    SplitMarkdownEditable.prototype.updateTooltipDimensions = function(e) {
      var elPos;

      elPos = this.element.offset();
      this.api.set('style.height', $(window).height() + top);
      this.api.set('style.width', elPos.left - 10);
      return true;
    };

    return SplitMarkdownEditable;

  })(MarkdownEditable);
  SelectEditable = (function(_super) {
    __extends(SelectEditable, _super);

    function SelectEditable() {
      _ref4 = SelectEditable.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    SelectEditable.prototype.members = function() {
      SelectEditable.__super__.members.call(this);
      this.contentTypes = ['select'];
      this.popoverClasses = ['selectable'];
      this.contentSeperator = ', ';
      return this._source = {};
    };

    SelectEditable.prototype.init = function(element) {
      if (!this._options.position) {
        this._options.position = {
          my: 'top left',
          at: 'bottom left',
          adjust: {
            x: 0,
            y: 0,
            method: 'flip shift'
          }
        };
      }
      this._source = element.data(this.editor.attr._namespace + 'source') || {};
      SelectEditable.__super__.init.call(this, element);
      this.$set = $('<div class="selectable-set">');
      this.setPopoverContent(this.$set);
      return this.setSource(this._source);
    };

    SelectEditable.prototype.onElementChange = function(e, $el, value, id) {
      return true;
    };

    SelectEditable.prototype.createPopupContent = function() {
      var $input, $label, i, id, idAttr, source, title, _ref5,
        _this = this;

      this.$set.empty();
      _ref5 = this.getSource();
      for (i in _ref5) {
        source = _ref5[i];
        id = source.id || source.ID;
        title = source.title || source.Title;
        idAttr = this.getDataName().toLowerCase() + '-item-' + id;
        $label = $('<label class="selectable-item" for="' + idAttr + '">' + title + '<label>');
        $input = $('<input type="checkbox" name="' + this.getDataName() + '" value="' + id + '" id="' + idAttr + '">');
        if (-1 !== this.getValueIndex(id)) {
          $input.prop('checked', true);
        }
        $input.on(this.getNamespacedEventName('change'), function(e) {
          var $target, changed, index, isChecked, value;

          value = _this.getValue();
          $target = $(e.target);
          id = $target.val();
          if (!isNaN(id)) {
            id = parseInt(id, 10);
          }
          index = _this.getValueIndex(id);
          isChecked = $target.prop('checked');
          changed = false;
          if (false === _this.onElementChange(e, $target, value, id)) {
            e.preventDefault();
            $target.prop('checked', !isChecked);
            return false;
          }
          if ($target.is(':checked')) {
            if (-1 === index) {
              value.push(id);
              changed = true;
            }
          } else if (-1 !== index) {
            value.splice(index, 1);
            changed = true;
          }
          if (changed) {
            _this.setValue(value);
          }
          return true;
        });
        this.$set.append($label.prepend($input));
      }
      return true;
    };

    SelectEditable.prototype.onOptionsUpdate = function() {
      if (this._options.source) {
        this.setSource(this._options.source);
      }
      if (this._options.contentSeperator) {
        return this.contentSeperator = this._options.contentSeperator;
      }
    };

    SelectEditable.prototype.getSeperator = function() {
      return this.contentSeperator;
    };

    SelectEditable.prototype.getSource = function() {
      return this._source;
    };

    SelectEditable.prototype.setSource = function(_source, silent) {
      this._source = _source;
      this.cleanupValue(silent);
      return this.createPopupContent();
    };

    SelectEditable.prototype.getValue = function() {
      return SelectEditable.__super__.getValue.call(this).slice();
    };

    SelectEditable.prototype.getPrevValue = function() {
      return SelectEditable.__super__.getPrevValue.call(this).slice();
    };

    SelectEditable.prototype.getValueIndex = function(id) {
      return $.inArray(id, this.getValue());
    };

    SelectEditable.prototype.isValidValue = function(val) {
      if (val && val.length) {
        return true;
      } else {
        return false;
      }
    };

    SelectEditable.prototype.getValueFromContent = function() {
      var i, source, title, titles, values, _ref5;

      titles = this.element.text().split(this.getSeperator());
      values = [];
      _ref5 = this.getSource();
      for (i in _ref5) {
        source = _ref5[i];
        title = source.title || source.Title;
        if (-1 !== $.inArray(title, titles)) {
          values.push(source.id);
        }
      }
      return values;
    };

    SelectEditable.prototype.cleanupValue = function(silent) {
      var found, i, id, j, source, val, value, _ref5;

      value = this.getValue();
      for (i in value) {
        val = value[i];
        found = false;
        _ref5 = this.getSource();
        for (j in _ref5) {
          source = _ref5[j];
          id = source.id || source.ID;
          if (val === id) {
            found = true;
          }
        }
        if (!found) {
          value.splice(i, 1);
        }
      }
      return this.setValue(value, silent);
    };

    SelectEditable.prototype.setValue = function(value, silent, replace) {
      if (replace == null) {
        replace = true;
      }
      SelectEditable.__super__.setValue.call(this, value, silent, replace);
      return this.render();
    };

    SelectEditable.prototype.setValueToContent = function(val, isPlaceholder) {
      var checked, i, id, source, title, titles, _ref5;

      titles = [];
      if (val) {
        _ref5 = this.getSource();
        for (i in _ref5) {
          source = _ref5[i];
          id = source.id || source.ID;
          checked = false;
          if (-1 !== $.inArray(id, val)) {
            title = source.title || source.Title;
            titles.push(title);
            checked = true;
          }
          this.updatePopoverContent(title, id, checked);
        }
        return this.updateContent(titles);
      }
    };

    SelectEditable.prototype.updatePopoverContent = function(title, id, checked) {
      var input;

      if (this.$set) {
        input = this.$set.find('#' + this.getDataName().toLowerCase() + '-item-' + id);
        return input.prop('checked', checked);
      }
    };

    SelectEditable.prototype.updateContent = function(titles) {
      return this.element.html(titles.join(this.getSeperator()));
    };

    SelectEditable.prototype.render = function() {
      var value;

      value = this.getValue();
      if (value && this.isValidValue(value)) {
        return this.setValueToContent(value);
      } else {
        return this.element.html(this.getPlaceholder());
      }
    };

    return SelectEditable;

  })(JJPopoverEditable);
  SelectPersonEditable = (function(_super) {
    __extends(SelectPersonEditable, _super);

    function SelectPersonEditable() {
      _ref5 = SelectPersonEditable.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    SelectPersonEditable.prototype.members = function() {
      SelectPersonEditable.__super__.members.call(this);
      return this.contentTypes = ['select-person'];
    };

    SelectPersonEditable.prototype.updateContent = function(titles) {
      var prefix;

      prefix = titles ? ' &amp; ' : '';
      return this.element.html(prefix + titles.join(this.getSeperator()));
    };

    return SelectPersonEditable;

  })(SelectEditable);
  SelectListEditable = (function(_super) {
    __extends(SelectListEditable, _super);

    function SelectListEditable() {
      _ref6 = SelectListEditable.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    SelectListEditable.prototype.members = function() {
      SelectListEditable.__super__.members.call(this);
      return this.contentTypes = ['select-list'];
    };

    SelectListEditable.prototype.init = function(element) {
      if (!this._options.position) {
        this._options.position = {
          my: 'top right',
          at: 'top left',
          adjust: {
            x: -10,
            y: -16,
            method: 'flip shift'
          }
        };
      }
      return SelectListEditable.__super__.init.call(this, element);
    };

    SelectListEditable.prototype.updateContent = function(titles) {
      var html, title, _i, _len;

      html = '';
      for (_i = 0, _len = titles.length; _i < _len; _i++) {
        title = titles[_i];
        html += '<li>' + title + '</li>';
      }
      return this.element.html(html);
    };

    SelectListEditable.prototype.render = function() {
      var value;

      value = this.getValue();
      if (value && this.isValidValue(value)) {
        return this.setValueToContent(value);
      } else {
        return this.element.html('<li>' + this.getPlaceholder() + '</li>');
      }
    };

    return SelectListEditable;

  })(SelectEditable);
  SelectListConfirmEditable = (function(_super) {
    __extends(SelectListConfirmEditable, _super);

    function SelectListConfirmEditable() {
      _ref7 = SelectListConfirmEditable.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    SelectListConfirmEditable.prototype.members = function() {
      SelectListConfirmEditable.__super__.members.call(this);
      this.contentTypes = ['select-list-confirm'];
      return this._options = {
        confirm: 'Are you sure to do this?'
      };
    };

    SelectListConfirmEditable.prototype.init = function(element) {
      var confirmOpts, confirmTxt;

      confirmTxt = element.data(this.editor.attr._namespace + 'confirm');
      if (confirmTxt) {
        confirmOpts = {
          confirm: confirmTxt
        };
        this.updateOptions(confirmOpts, true);
      }
      return SelectListConfirmEditable.__super__.init.call(this, element);
    };

    SelectListConfirmEditable.prototype.getConfirm = function() {
      return this.getOptions().confirm;
    };

    SelectListConfirmEditable.prototype.onElementChange = function(e, $el, value, id) {
      return confirm(this.getConfirm());
    };

    return SelectListConfirmEditable;

  })(SelectListEditable);
  ModalEditable = (function(_super) {
    __extends(ModalEditable, _super);

    function ModalEditable() {
      _ref8 = ModalEditable.__super__.constructor.apply(this, arguments);
      return _ref8;
    }

    ModalEditable.prototype.members = function() {
      ModalEditable.__super__.members.call(this);
      this.contentTypes = ['modal'];
      this.inputs = [];
      return this.buttons = [];
    };

    ModalEditable.prototype.init = function(element) {
      ModalEditable.__super__.init.call(this, element);
      this._options = {
        fields: {
          Foo: {
            placeholder: 'Bar'
          }
        },
        buttons: {
          Submit: {
            type: 'submit'
          },
          Cancel: {
            type: 'cancel'
          }
        }
      };
      this.setFields(element.data(this.editor.attr._namespace + 'fields'));
      return this.setButtons(element.data(this.editor.attr._namespace + 'buttons'));
    };

    ModalEditable.prototype.getForm = function() {
      var $buttons, $form,
        _this = this;

      $form = $('<form>').submit(function(e) {
        e.preventDefault();
        return _this.submit();
      });
      $.each(this.inputs, function(i, $input) {
        return $form.append($input);
      });
      $buttons = $('<div class="buttons">');
      $.each(this.buttons, function(i, $button) {
        return $buttons.append($button);
      });
      return $form.append($buttons);
    };

    ModalEditable.prototype.getFields = function() {
      return this.getOptions().fields;
    };

    ModalEditable.prototype.setFields = function(fields) {
      var $input, data, name, _ref9;

      if (fields) {
        this._options.fields = fields;
      }
      if (this._options.fields) {
        _ref9 = this._options.fields;
        for (name in _ref9) {
          data = _ref9[name];
          if (!data.type) {
            data.type = 'text';
          }
          if (!data.placeholder) {
            data.placeholder = name;
          }
          $input = $('<input type="' + data.type + '"name="' + name + '" placeholder="' + data.placeholder + '"/>');
          this.inputs.push($input);
        }
      }
      return this.setPopoverContent();
    };

    ModalEditable.prototype.getButtons = function() {
      return this.getOptions().buttons;
    };

    ModalEditable.prototype.setButtons = function(buttons) {
      var $btn, data, name, _ref9;

      if (buttons) {
        this._options.buttons = buttons;
      }
      if (this._options.buttons) {
        _ref9 = this._options.buttons;
        for (name in _ref9) {
          data = _ref9[name];
          if (data.type === 'submit' || 'cancel') {
            $btn = $('<button type="' + data.type + '">' + name + '</button>');
            if (data.type === 'submit') {
              this._addSubmitEvent($btn);
            } else if (data.type === 'cancel') {
              this._addCancelEvent($btn);
            }
            this.buttons.push($btn);
          }
        }
      }
      return this.setPopoverContent();
    };

    ModalEditable.prototype._addSubmitEvent = function($btn, type) {
      var _this = this;

      if (type == null) {
        type = 'click';
      }
      return $btn.on(type, function(e) {
        e.preventDefault();
        _this.submit();
        return false;
      });
    };

    ModalEditable.prototype.submit = function() {
      var data,
        _this = this;

      data = {};
      $.each(this.inputs, function(i, input) {
        var $input;

        $input = $(input);
        return data[$input.attr('name')] = $input.val();
      });
      this.setValue(data);
      return this.close();
    };

    ModalEditable.prototype._addCancelEvent = function($btn) {
      var _this = this;

      return $btn.on('click', function(e) {
        e.preventDefault();
        _this.close();
        return false;
      });
    };

    ModalEditable.prototype.close = function() {
      ModalEditable.__super__.close.call(this);
      return $('input, textarea', this.api.tooltip).val('');
    };

    ModalEditable.prototype.getPopoverButtons = function() {
      console.log($buttons);
      return $buttons;
    };

    ModalEditable.prototype.setPopoverContent = function(value) {
      if (!value) {
        value = this.getForm();
      }
      return ModalEditable.__super__.setPopoverContent.call(this, value);
    };

    ModalEditable.prototype.setValue = function(value, silent) {
      if (!silent) {
        return this.triggerDataEvent('submit', value);
      }
    };

    return ModalEditable;

  })(JJPopoverEditable);
  window.JJEditor = JJEditor;
  window.editorComponents = {};
  window.editorComponents.JJEditable = JJEditable;
  window.editorComponents.JJPopoverEditable = JJPopoverEditable;
  window.editorComponents.InlineEditable = InlineEditable;
  window.editorComponents.DateEditable = DateEditable;
  window.editorComponents.MarkdownEditable = MarkdownEditable;
  window.editorComponents.SplitMarkdownEditable = SplitMarkdownEditable;
  window.editorComponents.SelectEditable = SelectEditable;
  window.editorComponents.SelectListEditable = SelectListEditable;
  window.editorComponents.SelectPersonEditable = SelectPersonEditable;
  window.editorComponents.SelectListConfirmEditable = SelectListConfirmEditable;
  return window.editorComponents.ModalEditable = ModalEditable;
  /*
  	# init file transfer
  	jQuery.event.props.push 'dataTransfer'
  	# disable drag'n'drop for whole document
  	
  	$(document).on 'dragover drop', (e) ->
  		e.preventDefault()
  
  
  	editor = new JJEditor [
  		'InlineEditable'
  		'DateEditable'
  		'MarkdownEditable',
  		'SplitMarkdownEditable'
  	]
  
  	editor.on 'change:Foo.My.Fucki.Image', (e) ->
  		console.log "changed '#{e.name}' within #{e.scope} from #{e.prevValue} to #{e.value}"
  
  	editor.on 'change:Foo.My.Fucki.Image.Test', (e) ->
  		console.log "changed Test from #{e.prevValue} to #{e.value}"
  
  	window.$test = $test = $ '<h1 data-editor-type="inline" data-editor-name="\My.Fucki.Image.TestTitle">FooBar</h1>'
  	$('.overview').prepend $test
  	editor.updateElements()
  */

  /*
  	testComponent = editor.addElement $test
  	console.log testComponent
  	console.log testComponent.getId()
  */

})(jQuery);

define("plugins/editor/jquery.editor-popover", function(){});

// Generated by CoffeeScript 1.6.2
define('modules/UserSidebar',['app', 'modules/DataRetrieval', 'modules/RecycleBin', 'modules/Website', 'plugins/misc/spin.min', 'plugins/misc/jquery.list', 'plugins/editor/jquery.jjdropzone', 'plugins/editor/jquery.jjmarkdown', 'plugins/editor/jquery.editor-popover'], function(app, DataRetrieval, RecycleBin, Website, Spinner) {
  
  var UserSidebar;

  UserSidebar = app.module();
  UserSidebar.config = {};
  UserSidebar.config.spinner = {
    lines: 13,
    length: 6,
    width: 2,
    radius: 7,
    corners: 1,
    rotate: 0,
    direction: 1,
    color: '#fff',
    speed: 1,
    trail: 70,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: 'auto'
  };
  UserSidebar.construct = function() {
    var view;

    view = new UserSidebar.Views.Main();
    view.$el.appendTo('#editor-sidebar');
    view.render();
    return view;
  };
  UserSidebar.setPendingReq = function(req) {
    var _this = this;

    if (this.pendingRequest) {
      this.pendingRequest.reject();
    }
    this.pendingRequest = req;
    return this.pendingRequest.always(function() {
      return _this.pendingRequest = null;
    });
  };
  UserSidebar.Views.Main = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-sidebar',
    template: 'security/editor-sidebar',
    availableSubViews: {
      'user': 'UserSidebar',
      'gallery': 'GallerySidebar'
    },
    subView: null,
    events: {
      'click nav a': 'blurAfterClick',
      'click [data-editor-sidebar-content]': 'toggleSidebarCheck',
      'click .icon-switch': 'switchEditorView',
      'click .icon-publish': 'clickPublish'
    },
    initialize: function() {
      return Backbone.Events.on('projectEdited', this.handlePublishActive, this);
    },
    cleanup: function() {
      return Backbone.Events.off('projectEdited', this.handlePublishActive);
    },
    blurAfterClick: function(e) {
      e.preventDefault();
      $(e.target).blur();
      return false;
    },
    switchEditorView: function(e) {
      e.preventDefault();
      if (app.isEditor) {
        app.ProjectEditor.toggleView();
      }
      return false;
    },
    clickPublish: function(e) {
      var $target, method, toSet;

      e.preventDefault();
      $target = $(e.target);
      if (app.isEditor) {
        toSet = app.ProjectEditor.model.get('IsPublished') ? false : true;
        method = toSet ? 'add' : 'remove';
        $target.addClass('publishing');
        app.ProjectEditor.model.rejectAndSave('IsPublished', toSet).always(function() {
          return $target.removeClass('publishing');
        });
        $target[method + 'Class']('published');
      }
      return false;
    },
    handlePublishActive: function(model) {
      var method;

      method = model.get('IsPublished') ? 'add' : 'remove';
      return this.$el.find('.icon-publish')[method + 'Class']('published');
    },
    toggleSidebarCheck: function(e) {
      var $target, subViewName, toShow;

      e.preventDefault();
      $target = $(e.target);
      toShow = $target.data('editor-sidebar-content');
      subViewName = this.getSubviewName(toShow);
      if (this.subViewName === subViewName) {
        if (!this.subView.__manager__.hasRendered) {
          return false;
        }
        $target.toggleClass('active');
        this.toggle();
      } else if (subViewName) {
        $target.parents('nav').find('.active').removeClass('active').end().end().addClass('active');
        this.setSubview(subViewName, true);
        this.open(true);
      }
      return false;
    },
    toggleEditorClass: function(isEditor) {
      var method;

      method = isEditor ? 'addClass' : 'removeClass';
      if (method === 'removeClass' && this.$el.hasClass('is-editor')) {
        this.close();
        this.setSubview();
      }
      return this.$el[method]('is-editor');
    },
    triggerSubview: function(method) {
      var args, methodName;

      args = Array.prototype.slice.call(arguments);
      methodName = 'on' + method.charAt(0).toUpperCase() + method.slice(1);
      if (this.subView) {
        if (this.subView[methodName]) {
          return this.subView[methodName].apply(this.subView, args.slice(1));
        }
      }
    },
    getSubviewName: function(toShow) {
      if (this.availableSubViews[toShow]) {
        return this.availableSubViews[toShow];
      } else {
        return false;
      }
    },
    setSubview: function(subViewName, doRender) {
      if (subViewName) {
        this.subViewName = subViewName;
        this.subView = new UserSidebar.Views[subViewName]();
        this.subView.parentView = this;
        this.startSpinner();
        this.setView('#editor-sidebar-container', this.subView);
        if (doRender) {
          return this.subView.render();
        }
      } else {
        if (this.subView) {
          this.subView.remove();
        }
        this.subView = null;
        return this.subViewName = null;
      }
    },
    open: function(switched) {
      var _this = this;

      this.$el.addClass('open');
      this.$body.addClass('editor-sidebar-open').trigger({
        type: 'toggle.editor-sidebar',
        name: 'open'
      });
      return setTimeout(function() {
        _this.triggerSubview('opened', switched);
        _this.$el.addClass('opened');
        return _this.$body.trigger({
          type: 'toggle.editor-sidebar',
          name: 'opened'
        });
      }, 300);
    },
    close: function() {
      var _this = this;

      this.triggerSubview('close');
      this.$body.removeClass('editor-sidebar-open').trigger({
        type: 'toggle.editor-sidebar',
        name: 'closing'
      });
      this.$el.removeClass('open').find('nav .active').removeClass('active');
      return setTimeout(function() {
        _this.$el.removeClass('opened');
        return _this.$body.trigger({
          type: 'toggle.editor-sidebar',
          name: 'close'
        });
      }, 300);
    },
    toggle: function() {
      if (this.$el.hasClass('open')) {
        return this.close();
      } else {
        return this.open();
      }
    },
    initSpinner: function() {
      return this.spinner = {
        inst: new Spinner(UserSidebar.config.spinner),
        target: $('#editor-sidebar-spinner', this.$el)[0]
      };
    },
    startSpinner: function() {
      var spinner;

      spinner = this.spinner;
      $(spinner.target).addClass('active');
      return spinner.inst.spin(spinner.target);
    },
    stopSpinner: function() {
      var spinner;

      spinner = this.spinner;
      $(spinner.target).removeClass('active');
      return spinner.inst.stop();
    },
    afterRender: function() {
      this.$body = $('body');
      return this.initSpinner();
    }
  });
  UserSidebar.Views.SidebarContainer = Backbone.View.extend({
    $sidebarHeader: null,
    $sidebarContent: null,
    parentView: null,
    className: 'editor-sidebar-container',
    columnsPrefix: 'columns-',
    galleryData: {},
    initSidebar: function() {
      var _this = this;

      this.$sidebarHeader = $('> header', this.$el);
      this.$sidebarContent = $('section.editor-sidebar-content', this.$el);
      this.setSidebarHeight();
      return $.addOnWindowResize('editor.sidebar.height', function() {
        _this.setSidebarHeight();
        return _this._setColumnCount();
      });
    },
    hideSpinner: function() {
      if (this.parentView) {
        return this.parentView.stopSpinner();
      }
    },
    _cleanup: function() {
      if (this.uploadZone) {
        this.uploadZone.cleanup();
      }
      return $.removeOnWindowResize('editor.sidebar.height');
    },
    setSidebarHeight: function() {
      return this.$sidebarContent.css({
        'height': $(window).height() - this.$sidebarHeader.outerHeight()
      });
    },
    _getColumnsCount: function() {
      return this.$sidebarContent.data('columns');
    },
    _setColumnCount: function() {
      var columnsCount, prefColumnsCount, width;

      if (!this.$sidebarContent) {
        return;
      }
      width = parseInt(this.$sidebarContent.width(), 10);
      prefColumnsCount = this._getColumnsCount();
      columnsCount = Math.floor(width / 75);
      if (columnsCount) {
        return this.$sidebarContent.removeClass(this.columnsPrefix + prefColumnsCount).addClass(this.columnsPrefix + columnsCount).data('columns', columnsCount);
      }
    },
    _afterRender: function() {
      var _this = this;

      this.hideSpinner();
      this.initSidebar();
      (_.once(function() {
        _this.$sidebarContent = $('.editor-sidebar-content', _this.$el);
        if (_this.isOpen) {
          return _this._setColumnCount();
        }
      }))();
      if (this.isOpen) {
        this._setColumnCount();
      }
      if (this.$sidebarContent.hasClass('scrollbox')) {
        this.$sidebarContent.list({
          headerSelector: 'header'
        });
        return $('.ui-list', this.$sidebarContent).scroll(function(e) {
          return _this.onContentScroll();
        });
      }
    },
    onContentScroll: function() {},
    _onOpened: function(switched) {
      var delay,
        _this = this;

      delay = switched ? 0 : 300;
      this.isOpen = true;
      return setTimeout(function() {
        return _this._setColumnCount();
      }, delay);
    },
    onOpened: function(switched) {
      return this._onOpened(switched);
    },
    _onClose: function() {
      var prefColumnsCount,
        _this = this;

      this.isOpen = false;
      prefColumnsCount = this._getColumnsCount();
      return setTimeout(function() {
        if (_this.$sidebarContent) {
          return _this.$sidebarContent.removeClass(_this.columnsPrefix + prefColumnsCount);
        }
      }, 300);
    },
    onClose: function() {
      return this._onClose();
    }
  });
  /**
  		 * @todo : cleanup function!
  		 *
  */

  UserSidebar.Views.UserSidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-user',
    events: {
      'submit form.user-settings': 'changeUserCredentials'
    },
    cleanup: function() {
      this._cleanup();
      return this.metaEditor.destroy();
    },
    render: function(template, context) {
      var done, req;

      if (context == null) {
        context = {};
      }
      done = this.async();
      req = DataRetrieval.forUserGallery('Person').done(function(gallery) {
        context.PersonImages = gallery.images.Person;
        context.Person = app.CurrentMemberPerson.toJSON();
        context.Member = app.CurrentMember;
        _.each(context.PersonImages, function(img) {
          if (context.Person.Image && img.id === context.Person.Image.ID) {
            return context.CurrentImage = img;
          }
        });
        return done(template(context));
      });
      return UserSidebar.setPendingReq(req);
    },
    /*
    			 # @todo add active class to current item
    */

    initProjectList: function() {
      var projects, type, _i, _len, _ref,
        _this = this;

      projects = [];
      _ref = ['Projects', 'Exhibitions', 'Excursions', 'Workshops'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        projects = projects.concat(app.CurrentMemberPerson.get(type).toJSON());
      }
      projects = _.sortBy(projects, function(project) {
        return project.Title.toLowerCase();
      });
      return _.each(projects.reverse(), function(project) {
        var view;

        if (project.EditableByMember) {
          view = new UserSidebar.Views.ProjectItem({
            model: project
          });
          _this.insertView('.editor-sidebar-content .project-list', view);
          return view.render();
        }
      });
    },
    initPersonImageList: function() {
      var sortedImgs,
        _this = this;

      sortedImgs = _.sortBy(app.Cache.UserGallery.images.Person, 'id');
      return _.each(sortedImgs, function(image) {
        return _this.insertPersonImage(image);
      });
    },
    insertPersonImage: function(image) {
      var uploadZone, view;

      uploadZone = this.uploadZone;
      view = new UserSidebar.Views.PersonImage({
        model: image
      });
      this.insertView('.editor-sidebar-content .image-list', view);
      view.afterRender = function() {
        this._afterRender();
        return uploadZone.setAsDraggable(this.$el.find('[data-id]'));
      };
      return view.render();
    },
    initDropzone: function() {
      var _this = this;

      return this.uploadZone = new JJSingleImageUploadZone('#current-person-image', {
        url: app.Config.PersonImageUrl,
        getFromCache: function(id) {
          var result;

          result = null;
          _.each(app.Cache.UserGallery.images.Person, function(image) {
            if (image.id === id) {
              return result = image;
            }
          });
          console.log(result);
          return [result];
        },
        responseHandler: function(data) {
          var id, img, personImg;

          img = data[0];
          if (img.UploadedToClass) {
            app.updateGalleryCache(data);
            _this.insertPersonImage(img);
          }
          console.log(img);
          if (id = img.id) {
            _this.uploadZone.$dropzone.html('<img src="' + img.url + '">');
            personImg = app.CurrentMemberPerson.get('Image');
            if (id !== personImg && (!personImg || id !== personImg.id)) {
              return app.CurrentMemberPerson.rejectAndSave('Image', id);
            }
          }
        }
      });
    },
    onContentScroll: function() {
      var bio;

      bio = this.metaEditor.getComponentByName('CurrentPerson.Bio');
      return bio.api.reposition();
    },
    initMetaEditor: function() {
      var _this = this;

      this.metaEditor = new JJEditor($('.meta-info'), ['InlineEditable', 'MarkdownEditable', 'ModalEditable']);
      this.metaEditor.on('stateUpdate', function(e) {
        var key, val, _changed, _ref;

        _changed = false;
        _ref = e.CurrentPerson;
        for (key in _ref) {
          val = _ref[key];
          if (key === 'Bio' && val) {
            val = val.raw;
          }
          if (val === null) {
            val = "";
          }
          if (app.CurrentMemberPerson.get(key) !== val) {
            _changed = true;
            app.CurrentMemberPerson.set(key, val);
          }
        }
        if (_changed) {
          return app.CurrentMemberPerson.rejectAndSave();
        }
      });
      return this.metaEditor.on('submit:CurrentPerson.Website', function(val) {
        var MType, website;

        if (val.Title && val.Link) {
          MType = JJRestApi.Model('Website');
          website = new MType({
            Title: val.Title,
            Link: val.Link
          });
          app.CurrentMemberPerson.get('Websites').add(website);
          _this.addWebsiteView(website, true);
          return app.CurrentMemberPerson.save();
        }
      });
    },
    addWebsiteView: function(model, render) {
      var view;

      view = new Website.Views.ListView({
        model: model
      });
      this.insertView('.websites', view);
      if (render) {
        view.render();
      }
      return true;
    },
    beforeRender: function() {
      var _this = this;

      return app.CurrentMemberPerson.get('Websites').each(function(website) {
        return _this.addWebsiteView(website);
      });
    },
    afterRender: function() {
      this._afterRender();
      this.initDropzone();
      this.initPersonImageList();
      this.initProjectList();
      return this.initMetaEditor();
    },
    changeUserCredentials: function(e) {
      var $form, data, dfd,
        _this = this;

      e.preventDefault();
      $form = $(e.target);
      data = $form.serialize();
      dfd = $.ajax({
        url: app.Config.ChangeCredentialsUrl,
        data: data,
        type: 'POST'
      });
      dfd.done(function(res) {
        var msg;

        if (res.email) {
          $form.find('[name="email"]').val(res.email);
          _this.$el.find('.editor-header .email').text(res.email);
          app.CurrentMember.Email = res.email;
        }
        if (msg = res.msg) {
          return _this.showMessageAt(msg.text, $form.parent(), msg.type);
        }
      });
      return false;
    }
  });
  UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-gallery',
    isGallery: true,
    $sidebarContent: null,
    initialize: function() {
      return Backbone.Events.on('DocImageAdded', this.handleUploadedImageData, this);
    },
    cleanup: function() {
      this._cleanup();
      this.$el.parent().off('dragenter');
      return Backbone.Events.off('DocImageAdded', this.handleUploadedImageData);
    },
    initImageList: function() {
      /*
      				@.$imageList = $ '.image-list', @.$el unless @.$imageList
      
      				if @.$imageList.length
      					$('a', @.$imageList).on 'click', (e) ->
      						e.preventDefault()
      						$('.selected', @.$imageList).not(@).removeClass 'selected'
      
      						$(@).blur().toggleClass 'selected'
      
      
      					false
      */

      var _this = this;

      return _.each(app.Cache.UserGallery.images.Projects, function(proj) {
        return _.each(proj.Images, function(img) {
          return _this.insertGalleryImage(proj.FilterID, img);
        });
      });
    },
    insertGalleryImage: function(filterID, img) {
      var view;

      view = new UserSidebar.Views.GalleryImage({
        model: img
      });
      this.insertView('[data-filter-id="' + filterID + '"] .image-list', view);
      return view.render();
    },
    initFilter: function() {
      var _this = this;

      if (!this.$filter) {
        this.$filter = $('select.filter', this.$el);
      }
      if (this.$filter.length) {
        return this.$filter.on('change', function(e) {
          var $filtered, val;

          val = $(e.target).blur().val();
          if (val) {
            $filtered = $("[data-filter-id=" + val + "]", _this.$sidebarContent);
            if ($filtered.length) {
              _this.$sidebarContent.addClass('filtered');
              $filtered.addClass('active').siblings().removeClass('active');
              return $filtered.prev('header').addClass('active');
            }
          } else {
            return _this.$sidebarContent.removeClass('filtered').find('.active').removeClass('active');
          }
        });
      }
    },
    initDropzone: function() {
      var _this = this;

      this.uploadZone = new JJSimpleImagesUploadZone('#uploadzone', {
        url: app.Config.DocImageUrl,
        additionalData: {
          projectId: app.ProjectEditor.model.id,
          projectClass: app.ProjectEditor.model.get('ClassName')
        },
        responseHandler: function(data) {
          app.updateGalleryCache(data);
          return _this.handleUploadedImageData(data);
        }
      });
      return this.$el.parent().on('dragenter', function(e) {
        if (!$('body').hasClass('drag-inline')) {
          _this.uploadZone.$dropzone.addClass('dragover');
          return $.fireGlobalDragEvent('dragstart', e.target, 'file');
        }
      });
    },
    handleUploadedImageData: function(data) {
      var _this = this;

      console.log(data);
      return _.each(data, function(img) {
        _this.insertGalleryImage(img.FilterID, img);
        return app.ProjectEditor.model.get('Images').add(img.id);
      });
    },
    render: function(template, context) {
      var done, req,
        _this = this;

      if (context == null) {
        context = {};
      }
      done = this.async();
      req = DataRetrieval.forUserGallery('Projects').done(function(gallery) {
        var currentProj, editFilter, old_i, projects;

        projects = _.sortBy(gallery.images.Projects, function(project) {
          return project.Title.toLowerCase();
        });
        currentProj = app.ProjectEditor.model;
        editFilter = currentProj.get('ClassName') + '-' + currentProj.id;
        old_i = 0;
        _.each(projects, function(project, i) {
          if (project.FilterID === editFilter) {
            return old_i = i;
          }
        });
        if (old_i) {
          projects.splice(0, 0, projects.splice(old_i, 1)[0]);
        }
        context.Projects = projects;
        return done(template(context));
      });
      return UserSidebar.setPendingReq(req);
    },
    afterRender: function() {
      this._afterRender();
      this.initFilter();
      this.initDropzone();
      return this.initImageList();
    }
  });
  UserSidebar.Views.ListItem = Backbone.View.extend({
    tagName: 'li',
    _cleanup: function() {
      this.$el.data('recyclable', null);
      return this.$el.off('dragstart dragend');
    },
    cleanup: function() {
      return this._cleanup();
    },
    serialize: function() {
      return this.model;
    },
    insert: function(root, child) {
      return $(root).prepend(child);
    },
    _afterRender: function() {
      return RecycleBin.setViewAsRecyclable(this);
    },
    afterRender: function() {
      return this._afterRender();
    }
  });
  UserSidebar.Views.GalleryImage = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-gallery-image',
    className: 'DocImage',
    cleanup: function() {
      this.$el.find('[data-md-tag]').trigger('dragend');
      return this._cleanup();
    },
    afterRender: function() {
      var getSiblings,
        _this = this;

      this._afterRender();
      this.$img = this.$el.find('[data-md-tag]');
      getSiblings = function() {
        var elementType, id;

        id = _this.$img.data('id');
        elementType = _this.$img[0].tagName.toLowerCase();
        return _this.$el.closest('.editor-sidebar-content').find('[data-id=' + id + ']').filter(function(index) {
          return this.tagName.toLowerCase() === elementType;
        });
      };
      JJMarkdownEditor.setAsDraggable(this.$img);
      app.ProjectEditor.PreviewImageZone.setAsDraggable(this.$img);
      return this.$img.on('mouseover', function() {
        var $siblings;

        $siblings = getSiblings();
        if ($siblings.length) {
          return $siblings.addClass('active');
        }
      }).on('mouseleave', function() {
        var $siblings;

        $siblings = getSiblings();
        if ($siblings.length) {
          return $siblings.removeClass('active');
        }
      });
    },
    liveRemoval: function() {
      var _this = this;

      app.ProjectEditor.galleryImageRemoved(this.model.id);
      _.each(this.__manager__.parent.views, function(viewGroups) {
        return _.each(viewGroups, function(view) {
          if (view.model.id === _this.model.id && view !== _this) {
            return view.remove();
          }
        });
      });
      return this.remove();
    }
  });
  UserSidebar.Views.PersonImage = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-person-image',
    className: 'PersonImage',
    cleanup: function() {
      this.$el.find('[data-id]').trigger('dragend');
      return this._cleanup();
    },
    liveRemoval: function() {
      var personImg;

      personImg = app.CurrentMemberPerson.get('Image');
      if (personImg.id === this.model.id) {
        $('#current-person-image').empty();
      }
      return this.remove();
    }
  });
  UserSidebar.Views.ProjectItem = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-project-item',
    cleanup: function() {
      this._cleanup();
      return Backbone.Events.off('projectEdited', this.handleActive);
    },
    initialize: function() {
      return Backbone.Events.on('projectEdited', this.handleActive, this);
    },
    afterRender: function() {
      this._afterRender();
      if (app.isEditor) {
        return this.handleActive(app.ProjectEditor.model);
      }
    },
    handleActive: function(model) {
      this.$el.find('a').removeClass('active');
      if (model.get('ClassName') === this.model.ClassName && model.id === this.model.ID) {
        return this.$el.find('a').addClass('active');
      }
    }
  });
  return UserSidebar;
});

// Generated by CoffeeScript 1.6.2
define('modules/Auth',['app', 'modules/UserSidebar'], function(app, UserSidebar) {
  /**
  		 * This module handles all authentication stuff like login/logout, logged_in-ping
  		 * if someone can edit a project etc.
  		 *
  */

  var Auth;

  Auth = app.module();
  Auth.ping = {
    url: JJRestApi.setObjectUrl('User'),
    interval: 200000
  };
  Auth.loginUrl = 'api/v2/Auth/login/';
  Auth.logoutUrl = 'api/v2/Auth/logout/';
  Auth.canEditUrl = 'api/v2/Auth/canEdit/';
  Auth.Cache = {
    userWidget: null
  };
  Auth.redirectTo = function(slug) {
    var url;

    url = app.origin + '/' + slug + '/';
    return window.location.replace(url);
  };
  Auth.logout = function() {
    return $.post(Auth.logoutUrl).pipe(function(res) {
      if (res.success) {
        return res;
      } else {
        return $.Deferred().reject(res);
      }
    }).done(function(res) {
      console.log('cancelling login ping, redirecting...');
      app.CurrentMember = {};
      Auth.cancelLoginPing();
      return Auth.redirectTo('login');
    }).promise();
  };
  Auth.handleUserServerResponse = function(data) {
    if (data.Email) {
      Auth.kickOffLoginPing();
      if (!app.CurrentMember.Email) {
        app.CurrentMember = data;
        return Auth.fetchMembersPerson().done(function() {
          return Auth.updateUserWidget();
        });
      } else if (data.Email !== app.CurrentMember.Email) {
        return Auth.redirectTo('login');
      }
    } else {
      return app.CurrentMember = {};
    }
  };
  Auth.performLoginCheck = function() {
    return $.getJSON(this.ping.url).done(Auth.handleUserServerResponse).promise();
  };
  Auth.canEdit = function(data) {
    var att, d, i;

    att = '?';
    for (i in data) {
      d = data[i];
      att += i + '=' + d + '&';
    }
    return $.getJSON(this.canEditUrl + att).pipe(function(res) {
      if (res.allowed) {
        return res;
      } else {
        return $.Deferred().reject();
      }
    }).promise();
  };
  Auth.kickOffLoginPing = function() {
    var _this = this;

    this.cancelLoginPing;
    return this.loginPing = window.setTimeout(function() {
      return _this.performLoginCheck().done(function() {
        if (!app.CurrentMember.Email) {
          return Auth.redirectTo('login');
        }
      });
    }, this.ping.interval);
  };
  Auth.cancelLoginPing = function() {
    if (this.loginPing) {
      window.clearTimeout(this.loginPing);
      return delete this.loginPing;
    }
  };
  Auth.updateUserWidget = function() {
    var widget;

    if (app.CurrentMember.Email) {
      widget = this.Cache.userWidget = this.Cache.userWidget || UserSidebar.construct();
      return widget.toggleEditorClass(app.isEditor);
    }
  };
  Auth.fetchMembersPerson = function() {
    var dfd, existModel, id;

    dfd = new $.Deferred();
    if (app.CurrentMemberPerson) {
      dfd.resolve();
      return dfd.promise();
    }
    id = app.CurrentMember.PersonID;
    if (!id) {
      dfd.reject();
      return dfd.promise();
    }
    existModel = app.Collections.Person.get(id);
    if (existModel) {
      if (existModel._isFetchedWhenLoggedIn) {
        app.CurrentMemberPerson = existModel;
        dfd.resolve();
      } else {
        existModel.fetch({
          success: function(model) {
            model._isCompletelyFetched = true;
            model._isFetchedWhenLoggedIn = true;
            app.CurrentMemberPerson = model;
            return dfd.resolve();
          }
        });
      }
    } else {
      JJRestApi.getFromDomOrApi('Person', {
        name: 'current-member-person',
        id: id
      }).done(function(data) {
        var model;

        if (_.isObject(data)) {
          model = app.handleFetchedModel('Person', data);
          model._isCompletelyFetched = true;
          model._isFetchedWhenLoggedIn = true;
          app.CurrentMemberPerson = model;
          return dfd.resolve();
        } else {
          return dfd.reject();
        }
      });
    }
    return dfd.promise();
  };
  Auth.Views.Login = Backbone.View.extend({
    tagName: 'section',
    idAttribute: 'login-form',
    template: 'security/login-form',
    events: {
      'submit form': 'submitLoginForm'
    },
    submitLoginForm: function(e) {
      var email, pass, rem,
        _this = this;

      e.preventDefault();
      pass = this.$el.find('[name="password"]').val();
      email = this.$el.find('[name="email"]').val();
      rem = this.$el.find('[name="remember"]').is(':checked') === true ? 1 : 0;
      $.post(Auth.loginUrl, {
        pass: pass,
        email: email,
        remember: rem
      }).done(function(member) {
        Auth.handleUserServerResponse(member);
        return _this.render();
      });
      return false;
    },
    serialize: function() {
      return app.CurrentMember;
    }
  });
  Auth.Views.Logout = Backbone.View.extend({
    tagName: 'section',
    idAttribute: 'logging-out',
    template: 'security/logging-out',
    serialize: function() {
      return app.CurrentMember;
    }
  });
  return Auth;
});

// Generated by CoffeeScript 1.6.2
define('modules/SuperProject',['app'], function(app) {
  var SuperProject;

  SuperProject = app.module();
  SuperProject.Model = Backbone.JJRelationalModel.extend({
    idArrayOfRelationToClass: function(classType, relKey) {
      if (relKey == null) {
        relKey = void 0;
      }
      if (this.get('ClassName') === 'Project' && classType === 'Project') {
        return this.get('ChildProjects').getIDArray().concat(this.get('ParentProjects').getIDArray());
      } else if (this.get('ClassName') === classType) {
        return [];
      }
      relKey = relKey ? relKey : classType + 's';
      return this.get(relKey).getIDArray();
    },
    /* @deprecated
    			hasRelationTo: (classType, id) ->
    				idArray = @idArrayOfRelationToClass classType
    				if _.indexOf(idArray, id) < 0 then false else true
    */

    setRelCollByIds: function(relKey, ids) {
      var className, idArrayOfRelationToClass, relColl, _changed,
        _this = this;

      _changed = false;
      if (relColl = this.get(relKey)) {
        className = relColl.model.prototype.storeIdentifier;
        idArrayOfRelationToClass = this.idArrayOfRelationToClass(className, relKey);
        _.each(ids, function(id) {
          if (_.indexOf(idArrayOfRelationToClass, id) < 0) {
            _changed = true;
            return relColl.add(id);
          }
        });
        _.each(_.difference(idArrayOfRelationToClass, ids), function(id) {
          var model;

          _changed = true;
          model = relColl.get(id);
          if (model) {
            return relColl.remove(model);
          } else if (relKey === 'Projects') {
            relColl = _this.get('ParentProjects');
            return relColl.remove(relColl.get(id));
          }
        });
      }
      return _changed;
    },
    basicListWithoutCurrentMember: function(relKey) {
      var out;

      out = [];
      _.each(this.get(relKey).toJSON(), function(person) {
        var obj;

        obj = {
          ID: person.ID,
          Title: person.FirstName + ' ' + (person.Surname ? person.Surname : '')
        };
        if (obj.ID !== app.CurrentMemberPerson.id) {
          return out.push(obj);
        }
      });
      return out;
    },
    getEditorsKey: function() {
      if (this.get('ClassName') === 'Project') {
        return 'BlockedEditors';
      } else {
        return 'Editors';
      }
    }
  });
  return SuperProject;
});

// Generated by CoffeeScript 1.6.2
define('modules/Project',['app', 'modules/SuperProject'], function(app, SuperProject) {
  var Project;

  Project = app.module();
  JJRestApi.Modules.extend(Project, function(Project) {
    JJRestApi.extendModel('Project', SuperProject.Model, {
      foo: 'bar'
    });
    JJRestApi.extendCollection('Project', {
      foo: 'bar'
    });
    return Project.Views.Test = Backbone.View.extend({
      template: 'head',
      tagName: 'div',
      className: 'head'
    });
  });
  return Project;
});

/*!
 * Packery PACKAGED v1.0.6
 * bin-packing layout library
 * http://packery.metafizzy.co
 *
 * Commercial use requires one-time purchase of a commercial license
 * http://packery.metafizzy.co/license.html
 *
 * Non-commercial use is licensed under the MIT License
 *
 * Copyright 2013 Metafizzy
 */

/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

( function( window ) {



// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else {
  // browser global
  window.classie = classie;
}*/
window.classie = classie;

})( window );

/*!
 * eventie v1.0.3
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false */

( function( window ) {



var docElem = document.documentElement;

var bind = function() {};

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement;
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement;
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else {
  // browser global
  window.eventie = eventie;
}*/
window.eventie = eventie;
})( this );

/*!
 * docReady
 * Cross browser DOMContentLoaded event emitter
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false */

( function( window ) {



var document = window.document;
// collection of functions to be triggered on ready
var queue = [];

function docReady( fn ) {
  // throw out non-functions
  if ( typeof fn !== 'function' ) {
    return;
  }

  if ( docReady.isReady ) {
    // ready now, hit it
    fn();
  } else {
    // queue function when ready
    queue.push( fn );
  }
}

docReady.isReady = false;

// triggered on various doc ready events
function init( event ) {
  // bail if IE8 document is not ready just yet
  var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
  if ( docReady.isReady || isIE8NotReady ) {
    return;
  }
  docReady.isReady = true;

  // process queue
  for ( var i=0, len = queue.length; i < len; i++ ) {
    var fn = queue[i];
    fn();
  }
}

function defineDocReady( eventie ) {
  eventie.bind( document, 'DOMContentLoaded', init );
  eventie.bind( document, 'readystatechange', init );
  eventie.bind( window, 'load', init );

  return docReady;
}

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  //define( [ 'eventie' ], defineDocReady );
} else {
  // browser global
  window.docReady = defineDocReady( window.eventie );
}*/
window.docReady = defineDocReady( window.eventie );
})( this );

/*!
 * EventEmitter v4.1.0 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function (exports) {
	// Place the script in strict mode
	

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size

	// Easy access to the prototype
	var proto = EventEmitter.prototype,
		nativeIndexOf = Array.prototype.indexOf ? true : false;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function} listener Method to look for.
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listener, listeners) {
		// Return the index via the native method if possible
		if (nativeIndexOf) {
			return listeners.indexOf(listener);
		}

		// There is no native method
		// Use a manual loop to find the index
		var i = listeners.length;
		while (i--) {
			// If the listener matches, return it's index
			if (listeners[i] === listener) {
				return i;
			}
		}

		// Default to returning -1
		return -1;
	}

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function () {
		return this._events || (this._events = {});
	};

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function (evt) {
		// Create a shortcut to the storage object
		// Initialise it if it does not exists yet
		var events = this._getEvents(),
			response,
			key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function (evt) {
		var listeners = this.getListeners(evt),
			response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function (evt, listener) {
		var listeners = this.getListenersAsObject(evt),
			key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) &&
				indexOfListener(listener, listeners[key]) === -1) {
				listeners[key].push(listener);
			}
		}

		// Return the instance of EventEmitter to allow chaining
		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = proto.addListener;

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function (evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function (evts)
	{
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function (evt, listener) {
		var listeners = this.getListenersAsObject(evt),
			index,
			key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listener, listeners[key]);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		// Return the instance of EventEmitter to allow chaining
		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = proto.removeListener;

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function (evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function (evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function (remove, evt, listeners) {
		// Initialise any required variables
		var i,
			value,
			single = remove ? this.removeListener : this.addListener,
			multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		// Return the instance of EventEmitter to allow chaining
		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function (evt) {
		var type = typeof evt,
			events = this._getEvents(),
			key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (type === 'object') {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		// Return the instance of EventEmitter to allow chaining
		return this;
	};

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function (evt, args) {
		var listeners = this.getListenersAsObject(evt),
			i,
			key,
			response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					response = args ? listeners[key][i].apply(null, args) : listeners[key][i]();
					if (response === true) {
						this.removeListener(evt, listeners[key][i]);
					}
				}
			}
		}

		// Return the instance of EventEmitter to allow chaining
		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = proto.emitEvent;

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function (evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	// Expose the class either via AMD or the global object
	/*if (typeof _define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else {
		exports.EventEmitter = EventEmitter;
	}*/
	exports.EventEmitter = EventEmitter;
}(this));
/*!
 * getStyleProperty by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 */

/*jshint browser: true, strict: true, undef: true */
/*globals define: false */

( function( window ) {



var prefixes = 'Webkit Moz ms Ms O'.split(' ');
var docElemStyle = document.documentElement.style;

function getStyleProperty( propName ) {
  if ( !propName ) {
    return;
  }

  // test standard property first
  if ( typeof docElemStyle[ propName ] === 'string' ) {
    return propName;
  }

  // capitalize
  propName = propName.charAt(0).toUpperCase() + propName.slice(1);

  // test vendor specific properties
  var prefixed;
  for ( var i=0, len = prefixes.length; i < len; i++ ) {
    prefixed = prefixes[i] + propName;
    if ( typeof docElemStyle[ prefixed ] === 'string' ) {
      return prefixed;
    }
  }
}

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  define( function() {
    return getStyleProperty;
  });
} else {
  // browser global
  window.getStyleProperty = getStyleProperty;
}*/
window.getStyleProperty = getStyleProperty;
})( window );

/**
 * getSize v1.1.2
 * measure size of elements
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false */

( function( window, undefined ) {



// -------------------------- helpers -------------------------- //

var defView = document.defaultView;

var getStyle = defView && defView.getComputedStyle ?
  function( elem ) {
    return defView.getComputedStyle( elem, null );
  } :
  function( elem ) {
    return elem.currentStyle;
  };

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') === -1 && !isNaN( num );
  return isValid && num;
}

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}



function defineGetSize( getStyleProperty ) {

// -------------------------- box sizing -------------------------- //

var boxSizingProp = getStyleProperty('boxSizing');
var isBoxSizeOuter;

/**
 * WebKit measures the outer-width on style.width on border-box elems
 * IE & Firefox measures the inner-width
 */
( function() {
  if ( !boxSizingProp ) {
    return;
  }

  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style[ boxSizingProp ] = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  isBoxSizeOuter = getStyleSize( style.width ) === 200;
  body.removeChild( div );
})();


// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  // do not proceed on non-objects
  if ( typeof elem !== 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display === 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = !!( boxSizingProp &&
    style[ boxSizingProp ] && style[ boxSizingProp ] === 'border-box' );

  // get all measurements
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

}

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  //define( [ 'get-style-property' ], defineGetSize );
} else {
  // browser global
  window.getSize = defineGetSize( window.getStyleProperty );
}*/
window.getSize = defineGetSize( window.getStyleProperty );
})( window );

/**
 * Bridget makes jQuery widgets
 * v1.0.0
 */

( function( window ) {



// -------------------------- utils -------------------------- //

var slice = Array.prototype.slice;

function noop() {}

// -------------------------- definition -------------------------- //

function defineBridget( $ ) {

// bail if no jQuery
if ( !$ ) {
  return;
}

// -------------------------- addOptionMethod -------------------------- //

/**
 * adds option method -> $().plugin('option', {...})
 * @param {Function} PluginClass - constructor class
 */
function addOptionMethod( PluginClass ) {
  // don't overwrite original option method
  if ( PluginClass.prototype.option ) {
    return;
  }

  // option setter
  PluginClass.prototype.option = function( opts ) {
    // bail out if not an object
    if ( !$.isPlainObject( opts ) ){
      return;
    }
    this.options = $.extend( true, this.options, opts );
  };
}


// -------------------------- plugin bridge -------------------------- //

// helper function for logging errors
// $.error breaks jQuery chaining
var logError = typeof console === 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

/**
 * jQuery plugin bridge, access methods like $elem.plugin('method')
 * @param {String} namespace - plugin name
 * @param {Function} PluginClass - constructor class
 */
function bridge( namespace, PluginClass ) {
  // add to jQuery fn namespace
  $.fn[ namespace ] = function( options ) {
    if ( typeof options === 'string' ) {
      // call plugin method when first argument is a string
      // get arguments for method
      var args = slice.call( arguments, 1 );

      for ( var i=0, len = this.length; i < len; i++ ) {
        var elem = this[i];
        var instance = $.data( elem, namespace );
        if ( !instance ) {
          logError( "cannot call methods on " + namespace + " prior to initialization; " +
            "attempted to call '" + options + "'" );
          continue;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === '_' ) {
          logError( "no such method '" + options + "' for " + namespace + " instance" );
          continue;
        }

        // trigger method with arguments
        var returnValue = instance[ options ].apply( instance, args );

        // break look and return first value if provided
        if ( returnValue !== undefined ) {
          return returnValue;
        }
      }
      // return this if no return value
      return this;
    } else {
      return this.each( function() {
        var instance = $.data( this, namespace );
        if ( instance ) {
          // apply options & init
          instance.option( options );
          instance._init();
        } else {
          // initialize new instance
          instance = new PluginClass( this, options );
          $.data( this, namespace, instance );
        }
      });
    }
  };

}

// -------------------------- bridget -------------------------- //

/**
 * converts a Prototypical class into a proper jQuery plugin
 *   the class must have a ._init method
 * @param {String} namespace - plugin name, used in $().pluginName
 * @param {Function} PluginClass - constructor class
 */
$.bridget = function( namespace, PluginClass ) {
  addOptionMethod( PluginClass );
  bridge( namespace, PluginClass );
};

}

// transport
/*if ( typeof _define === 'function' && define.amd ) {
  // AMD
  //define( [ 'jquery' ], defineBridget );
} else {
  // get jquery from browser global
  defineBridget( window.jQuery );
}*/
defineBridget( window.jQuery );
})( window );

/**
 * matchesSelector helper v1.0.1
 *
 * @name matchesSelector
 *   @param {Element} elem
 *   @param {String} selector
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false */

( function( global, ElemProto ) {

  

  var matchesMethod = ( function() {
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0, len = prefixes.length; i < len; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  // ----- match ----- //

  function match( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  }

  // ----- appendToFragment ----- //

  function checkParent( elem ) {
    // not needed if already has parent
    if ( elem.parentNode ) {
      return;
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild( elem );
  }

  // ----- query ----- //

  // fall back to using QSA
  // thx @jonathantneal https://gist.github.com/3062955
  function query( elem, selector ) {
    // append to fragment if no parent
    checkParent( elem );

    // match elem with all selected elems of parent
    var elems = elem.parentNode.querySelectorAll( selector );
    for ( var i=0, len = elems.length; i < len; i++ ) {
      // return true if match
      if ( elems[i] === elem ) {
        return true;
      }
    }
    // otherwise return false
    return false;
  }

  // ----- matchChild ----- //

  function matchChild( elem, selector ) {
    checkParent( elem );
    return match( elem, selector );
  }

  // ----- matchesSelector ----- //

  var matchesSelector;

  if ( matchesMethod ) {
    // IE9 supports matchesSelector, but doesn't work on orphaned elems
    // check for that
    var div = document.createElement('div');
    var supportsOrphans = match( div, 'div' );
    matchesSelector = supportsOrphans ? match : matchChild;
  } else {
    matchesSelector = query;
  }

  // transport
  /*if ( typeof _define === 'function' && define.amd ) {
    // AMD
    define( function() {
      return matchesSelector;
    });
  } else {
    // browser global
    window.matchesSelector = matchesSelector;
  }*/
 window.matchesSelector = matchesSelector;
})( this, Element.prototype );

/**
 * Rect
 * low-level utility class for basic geometry
 */

( function( window ) {



// -------------------------- Packery -------------------------- //

// global namespace
var Packery = window.Packery = function() {};

// -------------------------- Rect -------------------------- //

function Rect( props ) {
  // extend properties from defaults
  for ( var prop in Rect.defaults ) {
    this[ prop ] = Rect.defaults[ prop ];
  }

  for ( prop in props ) {
    this[ prop ] = props[ prop ];
  }

}

// make available
Packery.Rect = Rect;

Rect.defaults = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

/**
 * Determines whether or not this rectangle wholly encloses another rectangle or point.
 * @param {Rect} rect
 * @returns {Boolean}
**/
Rect.prototype.contains = function( rect ) {
  // points don't have width or height
  var otherWidth = rect.width || 0;
  var otherHeight = rect.height || 0;
  return this.x <= rect.x &&
    this.y <= rect.y &&
    this.x + this.width >= rect.x + otherWidth &&
    this.y + this.height >= rect.y + otherHeight;
};

/**
 * Determines whether or not the rectangle intersects with another.
 * @param {Rect} rect
 * @returns {Boolean}
**/
Rect.prototype.overlaps = function( rect ) {
  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;

  // http://stackoverflow.com/a/306332
  return this.x < rectRight &&
    thisRight > rect.x &&
    this.y < rectBottom &&
    thisBottom > rect.y;
};

/**
 * @param {Rect} rect - the overlapping rect
 * @returns {Array} freeRects - rects representing the area around the rect
**/
Rect.prototype.getMaximalFreeRects = function( rect ) {

  // if no intersection, return false
  if ( !this.overlaps( rect ) ) {
    return false;
  }

  var freeRects = [];
  var freeRect;

  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;

  // top
  if ( this.y < rect.y ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: rect.y - this.y
    });
    freeRects.push( freeRect );
  }

  // right
  if ( thisRight > rectRight ) {
    freeRect = new Rect({
      x: rectRight,
      y: this.y,
      width: thisRight - rectRight,
      height: this.height
    });
    freeRects.push( freeRect );
  }

  // bottom
  if ( thisBottom > rectBottom ) {
    freeRect = new Rect({
      x: this.x,
      y: rectBottom,
      width: this.width,
      height: thisBottom - rectBottom
    });
    freeRects.push( freeRect );
  }

  // left
  if ( this.x < rect.x ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: rect.x - this.x,
      height: this.height
    });
    freeRects.push( freeRect );
  }

  return freeRects;
};

Rect.prototype.canFit = function( rect ) {
  return this.width >= rect.width && this.height >= rect.height;
};



})( window );

( function( window ) {



var Packery = window.Packery;
var Rect = Packery.Rect;


// -------------------------- Packer -------------------------- //

function Packer( width, height ) {
  this.width = width || 0;
  this.height = height || 0;

  this.reset();
}

Packer.prototype.reset = function() {
  this.spaces = [];
  this.newSpaces = [];

  var initialSpace = new Rect({
    x: 0,
    y: 0,
    width: this.width,
    height: this.height
  });

  this.spaces.push( initialSpace );
};

// change x and y of rect to fit with in Packer's available spaces
Packer.prototype.pack = function( rect ) {
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    if ( space.canFit( rect ) ) {
      this.placeInSpace( rect, space );
      break;
    }
  }
};

Packer.prototype.placeInSpace = function( rect, space ) {
  // place rect in space
  rect.x = space.x;
  rect.y = space.y;

  this.placed( rect );
};

// update spaces with placed rect
Packer.prototype.placed = function( rect ) {
  // update spaces
  var revisedSpaces = [];
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    var newSpaces = space.getMaximalFreeRects( rect );
    // add either the original space or the new spaces to the revised spaces
    if ( newSpaces ) {
      revisedSpaces.push.apply( revisedSpaces, newSpaces );
    } else {
      revisedSpaces.push( space );
    }
  }

  this.spaces = revisedSpaces;

  // remove redundant spaces
  Packer.mergeRects( this.spaces );

  this.spaces.sort( Packer.spaceSorterTopLeft );
};

// -------------------------- utility functions -------------------------- //

/**
 * Remove redundant rectangle from array of rectangles
 * @param {Array} rects: an array of Rects
 * @returns {Array} rects: an array of Rects
**/
Packer.mergeRects = function( rects ) {
  for ( var i=0, len = rects.length; i < len; i++ ) {
    var rect = rects[i];
    // skip over this rect if it was already removed
    if ( !rect ) {
      continue;
    }
    // clone rects we're testing, remove this rect
    var compareRects = rects.slice(0);
    // do not compare with self
    compareRects.splice( i, 1 );
    // compare this rect with others
    var removedCount = 0;
    for ( var j=0, jLen = compareRects.length; j < jLen; j++ ) {
      var compareRect = compareRects[j];
      // if this rect contains another,
      // remove that rect from test collection
      var indexAdjust = i > j ? 0 : 1;
      if ( rect.contains( compareRect ) ) {
        // console.log( 'current test rects:' + testRects.length, testRects );
        // console.log( i, j, indexAdjust, rect, compareRect );
        rects.splice( j + indexAdjust - removedCount, 1 );
        removedCount++;
      }
    }
  }

  return rects;
};

// top down, then left to right
Packer.spaceSorterTopLeft = function( a, b ) {
  return a.y - b.y || a.x - b.x;
};

// left to right, then top down
Packer.spaceSorterLeftTop = function( a, b ) {
  return a.x - b.x || a.y - b.y;
};

// -----  ----- //

Packery.Packer = Packer;

})( window );

/**
 * Packery Item Element
**/

( function( window ) {



// dependencies
var Packery = window.Packery;
var Rect = Packery.Rect;
var getSize = window.getSize;
var getStyleProperty = window.getStyleProperty;
var EventEmitter = window.EventEmitter;

// ----- get style ----- //

var defView = document.defaultView;

var getStyle = defView && defView.getComputedStyle ?
  function( elem ) {
    return defView.getComputedStyle( elem, null );
  } :
  function( elem ) {
    return elem.currentStyle;
  };


// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

// -------------------------- CSS3 support -------------------------- //

var transitionProperty = getStyleProperty('transition');
var transformProperty = getStyleProperty('transform');
var supportsCSS3 = transitionProperty && transformProperty;
var is3d = !!getStyleProperty('perspective');

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  MozTransition: 'transitionend',
  OTransition: 'otransitionend',
  transition: 'transitionend'
}[ transitionProperty ];

var transformCSSProperty = {
  WebkitTransform: '-webkit-transform',
  MozTransform: '-moz-transform',
  OTransform: '-o-transform',
  transform: 'transform'
}[ transformProperty ];

// -------------------------- Item -------------------------- //

function Item( element, packery ) {
  this.element = element;
  this.packery = packery;
  this.position = {
    x: 0,
    y: 0
  };

  this.rect = new Rect();
  // rect used for placing, in drag or Packery.fit()
  this.placeRect = new Rect();

  // style initial style
  this.element.style.position = 'absolute';
}

// inherit EventEmitter
extend( Item.prototype, EventEmitter.prototype );

// trigger specified handler for event type
Item.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

Item.prototype.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * apply CSS styles to element
 * @param {Object} style
 */
Item.prototype.css = function( style ) {
  var elemStyle = this.element.style;
  for ( var prop in style ) {
    elemStyle[ prop ] = style[ prop ];
  }
};

 // measure position, and sets it
Item.prototype.getPosition = function() {
  var style = getStyle( this.element );

  var x = parseInt( style.left, 10 );
  var y = parseInt( style.top, 10 );

  // clean up 'auto' or other non-integer values
  x = isNaN( x ) ? 0 : x;
  y = isNaN( y ) ? 0 : y;
  // remove padding from measurement
  var packerySize = this.packery.elementSize;
  x -= packerySize.paddingLeft;
  y -= packerySize.paddingTop;

  this.position.x = x;
  this.position.y = y;
};

// transform translate function
var translate = is3d ?
  function( x, y ) {
    return 'translate3d( ' + x + 'px, ' + y + 'px, 0)';
  } :
  function( x, y ) {
    return 'translate( ' + x + 'px, ' + y + 'px)';
  };


Item.prototype._transitionTo = function( x, y ) {
  this.getPosition();
  // get current x & y from top/left
  var curX = this.position.x;
  var curY = this.position.y;

  var compareX = parseInt( x, 10 );
  var compareY = parseInt( y, 10 );
  var didNotMove = compareX === this.position.x && compareY === this.position.y;

  // save end position
  this.setPosition( x, y );

  // if did not move and not transitioning, just go to layout
  if ( didNotMove && !this.isTransitioning ) {
    this.layoutPosition();
    return;
  }

  var transX = x - curX;
  var transY = y - curY;
  var transitionStyle = {};
  transitionStyle[ transformCSSProperty ] = translate( transX, transY );

  this.transition( transitionStyle, this.layoutPosition );
};

// non transition + transform support
Item.prototype.goTo = function( x, y ) {
  this.setPosition( x, y );
  this.layoutPosition();
};

// use transition and transforms if supported
Item.prototype.moveTo = supportsCSS3 ?
  Item.prototype._transitionTo : Item.prototype.goTo;

Item.prototype.setPosition = function( x, y ) {
  this.position.x = parseInt( x, 10 );
  this.position.y = parseInt( y, 10 );
};

Item.prototype.layoutPosition = function() {
  var packerySize = this.packery.elementSize;
  this.css({
    // set settled position, apply padding
    left: ( this.position.x + packerySize.paddingLeft ) + 'px',
    top : ( this.position.y + packerySize.paddingTop ) + 'px'
  });
  this.emitEvent( 'layout', [ this ] );
};

/**
 * @param {Object} style - CSS
 * @param {Function} onTransitionEnd
 */

// non transition, just trigger callback
Item.prototype._nonTransition = function( style, onTransitionEnd ) {
  this.css( style );
  if ( onTransitionEnd ) {
    onTransitionEnd.call( this );
  }
};

// proper transition
Item.prototype._transition = function( style, onTransitionEnd ) {
  this.transitionStyle = style;

  var transitionValue = [];
  for ( var prop in style ) {
    transitionValue.push( prop );
  }

  // enable transition
  var transitionStyle = {};
  transitionStyle[ transitionProperty + 'Property' ] = transitionValue.join(',');
  transitionStyle[ transitionProperty + 'Duration' ] = this.packery.options.transitionDuration;

  this.element.addEventListener( transitionEndEvent, this, false );

  // bind callback to transition end
  if ( onTransitionEnd ) {
    this.on( 'transitionEnd', function( _this ) {
      onTransitionEnd.call( _this );
      return true; // bind once
    });
  }

  // set transition styles
  this.css( transitionStyle );
  // set styles that are transitioning
  this.css( style );

  this.isTransitioning = true;
};

Item.prototype.transition = Item.prototype[ transitionProperty ? '_transition' : '_nonTransition' ];

Item.prototype.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

Item.prototype.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

Item.prototype.ontransitionend = function( event ) {
  // console.log('transition end');
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }

  // trigger callback
  if ( this.onTransitionEnd ) {
    this.onTransitionEnd();
    delete this.onTransitionEnd;
  }

  this.removeTransitionStyles();
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in this.transitionStyle ) {
    cleanStyle[ prop ] = '';
  }

  this.css( cleanStyle );

  this.element.removeEventListener( transitionEndEvent, this, false );

  delete this.transitionStyle;

  this.isTransitioning = false;

  this.emitEvent( 'transitionEnd', [ this ] );
};

Item.prototype.removeTransitionStyles = function() {
  var noTransStyle = {};
  // remove transition
  noTransStyle[ transitionProperty + 'Property' ] = '';
  noTransStyle[ transitionProperty + 'Duration' ] = '';
  this.css( noTransStyle );
};

Item.prototype.remove = function() {
  // start transition
  var hiddenStyle = {
    opacity: 0
  };
  hiddenStyle[ transformCSSProperty ] = 'scale(0.001)';

  this.transition( hiddenStyle, this.removeElem );
};


// remove element from DOM
Item.prototype.removeElem = function() {
  this.element.parentNode.removeChild( this.element );
  this.emitEvent( 'remove', [ this ] );
};

Item.prototype.reveal = !transitionProperty ? function() {} : function() {
  // hide item
  var hiddenStyle = {
    opacity: 0
  };
  hiddenStyle[ transformCSSProperty ] = 'scale(0.001)';
  this.css( hiddenStyle );
  // force redraw. http://blog.alexmaccaw.com/css-transitions
  var h = this.element.offsetHeight;
  // transition to revealed
  var visibleStyle = {
    opacity: 1
  };
  visibleStyle[ transformCSSProperty ] = 'scale(1)';
  this.transition( visibleStyle );
  // hack for JSHint to hush about unused var
  h = null;
};

Item.prototype.destroy = function() {
  this.css({
    position: '',
    left: '',
    top: ''
  });
};

// -------------------------- drag -------------------------- //

Item.prototype.dragStart = function() {
  this.getPosition();
  this.removeTransitionStyles();
  // remove transform property from transition
  if ( this.isTransitioning && transformProperty ) {
    this.element.style[ transformProperty ] = 'none';
  }
  this.getSize();
  // create place rect, used for position when dragged then dropped
  // or when positioning
  this.isPlacing = true;
  this.needsPositioning = false;
  this.positionPlaceRect( this.position.x, this.position.y );
  this.isTransitioning = false;
  this.didDrag = false;
};

/**
 * handle item when it is dragged
 * @param {Number} x - horizontal position of dragged item
 * @param {Number} y - vertical position of dragged item
 */
Item.prototype.dragMove = function( x, y ) {
  this.didDrag = true;
  var packerySize = this.packery.elementSize;
  x -= packerySize.paddingLeft;
  y -= packerySize.paddingTop;
  this.positionPlaceRect( x, y );
};

Item.prototype.dragStop = function() {
  this.getPosition();
  var isDiffX = this.position.x !== this.placeRect.x;
  var isDiffY = this.position.y !== this.placeRect.y;
  // set post-drag positioning flag
  this.needsPositioning = isDiffX || isDiffY;
  // reset flag
  this.didDrag = false;
};

// -------------------------- placing -------------------------- //

/**
 * position a rect that will occupy space in the packer
 * @param {Number} x
 * @param {Number} y
 * @param {Boolean} isMaxYContained
 */
Item.prototype.positionPlaceRect = function( x, y, isMaxYOpen ) {
  this.placeRect.x = this.getPlaceRectCoord( x, true );
  this.placeRect.y = this.getPlaceRectCoord( y, false, isMaxYOpen );
};

/**
 * get x/y coordinate for place rect
 * @param {Number} coord - x or y
 * @param {Boolean} isX
 * @param {Boolean} isMaxOpen - does not limit value to outer bound
 * @returns {Number} coord - processed x or y
 */
Item.prototype.getPlaceRectCoord = function( coord, isX, isMaxOpen ) {
  var measure = isX ? 'Width' : 'Height';
  var size = this.size[ 'outer' + measure ];
  var segment = this.packery[ isX ? 'columnWidth' : 'rowHeight' ];
  var parentSize = this.packery.elementSize[ 'inner' + measure ];

  // additional parentSize calculations for Y
  if ( !isX ) {
    parentSize = Math.max( parentSize, this.packery.maxY );
    // prevent gutter from bumping up height when non-vertical grid
    if ( !this.packery.rowHeight ) {
      parentSize -= this.packery.gutter;
    }
  }

  var max;

  if ( segment ) {
    segment += this.packery.gutter;
    // allow for last column to reach the edge
    parentSize += isX ? this.packery.gutter : 0;
    // snap to closest segment
    coord = Math.round( coord / segment );
    // contain to outer bound
    // x values must be contained, y values can grow box by 1
    var maxSegments = Math[ isX ? 'floor' : 'ceil' ]( parentSize / segment );
    maxSegments -= Math.ceil( size / segment );
    max = maxSegments;
  } else {
    max = parentSize - size;
  }

  coord = isMaxOpen ? coord : Math.min( coord, max );
  coord *= segment || 1;

  return Math.max( 0, coord );
};

Item.prototype.copyPlaceRectPosition = function() {
  this.rect.x = this.placeRect.x;
  this.rect.y = this.placeRect.y;
};

// --------------------------  -------------------------- //

// publicize
Packery.Item = Item;

})( window );


/*!
 * Packery v1.0.6
 * bin-packing layout library
 * http://packery.metafizzy.co
 *
 * Commercial use requires one-time purchase of a commercial license
 * http://packery.metafizzy.co/license.html
 *
 * Non-commercial use is licensed under the MIT License
 *
 * Copyright 2013 Metafizzy
 */

( function( window ) {



// Packery classes
var _Packery = window.Packery;
var Rect = _Packery.Rect;
var Packer = _Packery.Packer;
var Item = _Packery.Item;

// dependencies
var classie = window.classie;
var docReady = window.docReady;
var EventEmitter = window.EventEmitter;
var eventie = window.eventie;
var getSize = window.getSize;
var matchesSelector = window.matchesSelector;

// ----- vars ----- //

var document = window.document;
var console = window.console;
var jQuery = window.jQuery;

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( typeof obj.length === 'number' ) {
    // convert nodeList to array
    for ( var i=0, len = obj.length; i < len; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

// http://stackoverflow.com/a/384380/182183
var isElement = ( typeof HTMLElement === 'object' ) ?
  function isElementDOM2( obj ) {
    return obj instanceof HTMLElement;
  } :
  function isElementQuirky( obj ) {
    return obj && typeof obj === 'object' &&
      obj.nodeType === 1 && typeof obj.nodeName === 'string';
  };

// index of helper cause IE8
var indexOf = Array.prototype.indexOf ? function( ary, obj ) {
    return ary.indexOf( obj );
  } : function( ary, obj ) {
    for ( var i=0, len = ary.length; i < len; i++ ) {
      if ( ary[i] === obj ) {
        return i;
      }
    }
    return -1;
  };


// -------------------------- Packery -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Packery intances
var packeries = {};

function Packery( element, options ) {
  // bail out if not proper element
  if ( !element || !isElement( element ) ) {
    if ( console ) {
      console.error( 'bad Packery element: ' + element );
    }
    return;
  }

  this.element = element;

  // options
  this.options = extend( {}, this.options );
  extend( this.options, options );

  // add id for Packery.getFromElement
  var id = ++GUID;
  this.element.packeryGUID = id; // expando
  packeries[ id ] = this; // associate via id

  // kick it off
  this._create();

  if ( this.options.isInitLayout ) {
    this.layout();
  }
}

// inherit EventEmitter
extend( Packery.prototype, EventEmitter.prototype );

// default options
Packery.prototype.options = {
  containerStyle: {
    position: 'relative'
  },
  isInitLayout: true,
  isResizeBound: true,
  transitionDuration: '0.4s'
};

Packery.prototype._create = function() {
  // initial properties
  this.packer = new Packer();
  // get items from children
  this.reloadItems();
  // collection of element that don't get laid out
  this.stampedElements = [];
  this.stamp( this.options.stamped );

  var containerStyle = this.options.containerStyle;
  extend( this.element.style, containerStyle );

  // bind resize method
  if ( this.options.isResizeBound ) {
    this.bindResize();
  }

  // create drag handlers
  var _this = this;
  this.handleDraggabilly = {
    dragStart: function( draggie ) {
      _this.itemDragStart( draggie.element );
    },
    dragMove: function( draggie ) {
      _this.itemDragMove( draggie.element, draggie.position.x, draggie.position.y );
    },
    dragEnd: function( draggie ) {
      _this.itemDragEnd( draggie.element );
    }
  };

  this.handleUIDraggable = {
    start: function handleUIDraggableStart( event ) {
      _this.itemDragStart( event.currentTarget );
    },
    drag: function handleUIDraggableDrag( event, ui ) {
      _this.itemDragMove( event.currentTarget, ui.position.left, ui.position.top );
    },
    stop: function handleUIDraggableStop( event ) {
      _this.itemDragEnd( event.currentTarget );
    }
  };

};

// goes through all children again and gets bricks in proper order
Packery.prototype.reloadItems = function() {
  // collection of item elements
  this.items = this._getItems( this.element.children );
};


/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Packery Items
 */
Packery.prototype._getItems = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );

  // create new Packery Items for collection
  var items = [];
  for ( var i=0, len = itemElems.length; i < len; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    items.push( item );
  }

  return items;
};

/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - item elements
 */
Packery.prototype._filterFindItemElements = function( elems ) {
  // make array of elems
  elems = makeArray( elems );
  var itemSelector = this.options.itemSelector;

  if ( !itemSelector ) {
    return elems;
  }

  var itemElems = [];

  // filter & find items if we have an item selector
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    // filter siblings
    if ( matchesSelector( elem, itemSelector ) ) {
      itemElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( itemSelector );
    // concat childElems to filterFound array
    for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
      itemElems.push( childElems[j] );
    }
  }

  return itemElems;
};

/**
 * getter method for getting item elements
 * @returns {Array} elems - collection of item elements
 */
Packery.prototype.getItemElements = function() {
  var elems = [];
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    elems.push( this.items[i].element );
  }
  return elems;
};

// ----- init & layout ----- //

/**
 * lays out all items
 */
Packery.prototype.layout = function() {
  this._prelayout();

  // don't animate first layout
  var isInstant = this.options.isLayoutInstant !== undefined ?
    this.options.isLayoutInstant : !this._isLayoutInited;
  this.layoutItems( this.items, isInstant );

  // flag for initalized
  this._isLayoutInited = true;
};

// _init is alias for layout
Packery.prototype._init = Packery.prototype.layout;

/**
 * logic before any new layout
 */
Packery.prototype._prelayout = function() {
  // reset packer
  this.elementSize = getSize( this.element );

  this._getMeasurements();

  this.packer.width = this.elementSize.innerWidth + this.gutter;
  this.packer.height = Number.POSITIVE_INFINITY;
  this.packer.reset();

  // layout
  this.maxY = 0;
  this.placeStampedElements();
};

/**
 * update columnWidth, rowHeight, & gutter
 * @private
 */
Packery.prototype._getMeasurements = function() {
  this._getMeasurement( 'columnWidth', 'width' );
  this._getMeasurement( 'rowHeight', 'height' );
  this._getMeasurement( 'gutter', 'width' );
};

/**
 * get measurement from option, for columnWidth, rowHeight, gutter
 * if option is String -> get element from selector string, & get size of element
 * if option is Element -> get size of element
 * else use option as a number
 *
 * @param {String} measurement
 * @param {String} size - width or height
 * @private
 */
Packery.prototype._getMeasurement = function( measurement, size ) {
  var option = this.options[ measurement ];
  var elem;
  if ( !option ) {
    // default to 0
    this[ measurement ] = 0;
  } else {
    if ( typeof option === 'string' ) {
      elem = this.element.querySelector( option );
    } else if ( isElement( option ) ) {
      elem = option;
    }
    // use size of element, if element
    this[ measurement ] = elem ? getSize( elem )[ size ] : option;
  }
};

/**
 * layout a collection of item elements
 * @param {Array} items - array of Packery.Items
 * @param {Boolean} isInstant - disable transitions for setting item position
 */
Packery.prototype.layoutItems = function( items, isInstant ) {
  // console.log('layout Items');
  var layoutItems = this._getLayoutItems( items );

  if ( !layoutItems || !layoutItems.length ) {
    // no items, just emit layout complete with empty array
    this.emitEvent( 'layoutComplete', [ this, [] ] );
  } else {
    this._itemsOn( layoutItems, 'layout', function onItemsLayout() {
      this.emitEvent( 'layoutComplete', [ this, layoutItems ] );
    });

    for ( var i=0, len = layoutItems.length; i < len; i++ ) {
      var item = layoutItems[i];
      // listen to layout events for callback
      this._packItem( item );
      this._layoutItem( item, isInstant );
    }
  }

  // set container size
  var elemSize = this.elementSize;
  var elemH = this.maxY - this.gutter;
  // add padding and border width if border box
  if ( elemSize.isBorderBox ) {
    elemH += elemSize.paddingBottom + elemSize.paddingTop +
      elemSize.borderTopWidth + elemSize.borderBottomWidth;
  }
  // prevent negative size, which causes error in IE
  elemH = Math.max( elemH, 0 );
  this.element.style.height = elemH + 'px';
};

/**
 * filters items for non-ignored items
 * @param {Array} items
 * @returns {Array} layoutItems
 */
Packery.prototype._getLayoutItems = function( items ) {
  var layoutItems = [];
  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    if ( !item.isIgnored ) {
      layoutItems.push( item );
    }
  }
  return layoutItems;
};

/**
 * layout item in packer
 * @param {Packery.Item} item
 */
Packery.prototype._packItem = function( item ) {
  this._setRectSize( item.element, item.rect );
  // pack the rect in the packer
  this.packer.pack( item.rect );
  this._setMaxY( item.rect );
};

/**
 * set max Y value, for height of container
 * @param {Packery.Rect} rect
 * @private
 */
Packery.prototype._setMaxY = function( rect ) {
  this.maxY = Math.max( rect.y + rect.height, this.maxY );
};

/**
 * set the width and height of a rect, applying columnWidth and rowHeight
 * @param {Element} elem
 * @param {Packery.Rect} rect
 */
Packery.prototype._setRectSize = function( elem, rect ) {
  var size = getSize( elem );
  var w = size.outerWidth;
  var h = size.outerHeight;
  // size for columnWidth and rowHeight, if available
  var colW = this.columnWidth + this.gutter;
  var rowH = this.rowHeight + this.gutter;
  w = this.columnWidth ? Math.ceil( w / colW ) * colW : w + this.gutter;
  h = this.rowHeight ? Math.ceil( h / rowH ) * rowH : h + this.gutter;
  // rect must fit in packer
  rect.width = Math.min( w, this.packer.width );
  rect.height = h;
};

/**
 * Sets position of item in DOM
 * @param {Packery.Item} item
 * @param {Boolean} isInstant - disables transitions
 */
Packery.prototype._layoutItem = function( item, isInstant ) {

  // copy over position of packed rect to item element
  var rect = item.rect;
  if ( isInstant ) {
    // if not transition, just set CSS
    item.goTo( rect.x, rect.y );
  } else {
    item.moveTo( rect.x, rect.y );
  }

};

/**
 * trigger a callback for a collection of items events
 * @param {Array} items - Packery.Items
 * @param {String} eventName
 * @param {Function} callback
 */
Packery.prototype._itemsOn = function( items, eventName, callback ) {
  var doneCount = 0;
  var count = items.length;
  // event callback
  var _this = this;
  function tick() {
    doneCount++;
    if ( doneCount === count ) {
      callback.call( _this );
    }
    return true; // bind once
  }
  // bind callback
  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    item.on( eventName, tick );
  }
};

// -------------------------- stamp -------------------------- //

/**
 * adds elements to stampedElements
 * @param {NodeList, Array, Element, or String} elems
 */
Packery.prototype.stamp = function( elems ) {
  if ( !elems ) {
    return;
  }
  // if string, use argument as selector string
  if ( typeof elems === 'string' ) {
    elems = this.element.querySelectorAll( elems );
  }
  elems = makeArray( elems );
  this.stampedElements.push.apply( this.stampedElements, elems );
  // ignore
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    this.ignore( elem );
  }
};

/**
 * removes elements to stampedElements
 * @param {NodeList, Array, or Element} elems
 */
Packery.prototype.unstamp = function( elems ) {
  if ( !elems ){
    return;
  }
  elems = makeArray( elems );

  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    // filter out removed stamp elements
    var index = indexOf( this.stampedElements, elem );
    if ( index !== -1 ) {
      this.stampedElements.splice( index, 1 );
    }
    this.unignore( elem );
  }

};

// make spaces for stamped elements
Packery.prototype.placeStampedElements = function() {
  if ( !this.stampedElements || !this.stampedElements.length ) {
    return;
  }

  this._getBounds();

  for ( var i=0, len = this.stampedElements.length; i < len; i++ ) {
    var elem = this.stampedElements[i];
    this.placeStamp( elem );
  }
};

// update boundingLeft / Top
Packery.prototype._getBounds = function() {
  // get bounding rect for container element
  var elementBoundingRect = this.element.getBoundingClientRect();
  this._boundingLeft = elementBoundingRect.left + this.elementSize.paddingLeft;
  this._boundingTop  = elementBoundingRect.top  + this.elementSize.paddingTop;
};

/**
 * makes space for element
 * @param {Element} elem
 */
Packery.prototype.placeStamp = function( elem ) {
  var item = this.getItem( elem );
  var rect;
  if ( item && item.isPlacing ) {
    rect = item.placeRect;
  } else {
    rect = this._getElementOffsetRect( elem );
  }

  this._setRectSize( elem, rect );
  // save its space in the packer
  this.packer.placed( rect );
  this._setMaxY( rect );
};

/**
 * get x/y position of element relative to container element
 * @param {Element} elem
 * @returns {Rect} rect
 */
Packery.prototype._getElementOffsetRect = function( elem ) {
  var boundingRect = elem.getBoundingClientRect();
  var rect = new Rect({
    x: boundingRect.left - this._boundingLeft,
    y: boundingRect.top - this._boundingTop
  });
  rect.x -= this.elementSize.borderLeftWidth;
  rect.y -= this.elementSize.borderTopWidth;
  return rect;
};

// -------------------------- resize -------------------------- //

// enable event handlers for listeners
// i.e. resize -> onresize
Packery.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

/**
 * Bind layout to window resizing
 */
Packery.prototype.bindResize = function() {
  // bind just one listener
  if ( this.isResizeBound ) {
    return;
  }
  eventie.bind( window, 'resize', this );
  this.isResizeBound = true;
};

/**
 * Unbind layout to window resizing
 */
Packery.prototype.unbindResize = function() {
  eventie.unbind( window, 'resize', this );
  this.isResizeBound = false;
};

// original debounce by John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/

// this fires every resize
Packery.prototype.onresize = function() {
  if ( this.resizeTimeout ) {
    clearTimeout( this.resizeTimeout );
  }

  var _this = this;
  function delayed() {
    _this.resize();
  }

  this.resizeTimeout = setTimeout( delayed, 100 );
};

// debounced, layout on resize
Packery.prototype.resize = function() {
  // don't trigger if size did not change
  var size = getSize( this.element );
  // check that elementSize and size are there
  // IE8 triggers resize on body size change, so they might not be
  var hasSizes = this.elementSize && size;
  if ( hasSizes && size.innerWidth === this.elementSize.innerWidth ) {
    return;
  }

  this.layout();

  delete this.resizeTimeout;
};


// -------------------------- methods -------------------------- //

/**
 * add items to Packery instance
 * @param {Array or NodeList or Element} elems
 * @returns {Array} items - Packery.Items
**/
Packery.prototype.addItems = function( elems ) {
  var items = this._getItems( elems );
  if ( !items.length ) {
    return;
  }
  // add items to collection
  this.items.push.apply( this.items, items );
  return items;
};

/**
 * Layout newly-appended item elements
 * @param {Array or NodeList or Element} elems
 */
Packery.prototype.appended = function( elems ) {
  var items = this.addItems( elems );
  if ( !items.length ) {
    return;
  }
  // layout and reveal just the new items
  this.layoutItems( items, true );
  this.reveal( items );
};

/**
 * Layout prepended elements
 * @param {Array or NodeList or Element} elems
 */
Packery.prototype.prepended = function( elems ) {
  var items = this._getItems( elems );
  if ( !items.length ) {
    return;
  }
  // add items to beginning of collection
  var previousItems = this.items.slice(0);
  this.items = items.concat( previousItems );
  // start new layout
  this._prelayout();
  // layout new stuff without transition
  this.layoutItems( items, true );
  this.reveal( items );
  // layout previous items
  this.layoutItems( previousItems );
};

// reveal a collection of items
Packery.prototype.reveal = function( items ) {
  if ( !items || !items.length ) {
    return;
  }
  for ( var i=0, len = items.length; i < len; i++ ) {
    var item = items[i];
    item.reveal();
  }
};

/**
 * get Packery.Item, given an Element
 * @param {Element} elem
 * @param {Function} callback
 * @returns {Packery.Item} item
 */
Packery.prototype.getItem = function( elem ) {
  // loop through items to get the one that matches
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    var item = this.items[i];
    if ( item.element === elem ) {
      // return item
      return item;
    }
  }
};

/**
 * get collection of Packery.Items, given Elements
 * @param {Array} elems
 * @returns {Array} items - Packery.Items
 */
Packery.prototype.getItems = function( elems ) {
  if ( !elems || !elems.length ) {
    return;
  }
  var items = [];
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    var item = this.getItem( elem );
    if ( item ) {
      items.push( item );
    }
  }

  return items;
};

/**
 * remove element(s) from instance and DOM
 * @param {Array or NodeList or Element} elems
 */
Packery.prototype.remove = function( elems ) {
  elems = makeArray( elems );

  var removeItems = this.getItems( elems );

  this._itemsOn( removeItems, 'remove', function() {
    this.emitEvent( 'removeComplete', [ this, removeItems ] );
  });

  for ( var i=0, len = removeItems.length; i < len; i++ ) {
    var item = removeItems[i];
    item.remove();
    // remove item from collection
    var index = indexOf( this.items, item );
    this.items.splice( index, 1 );
  }
};

/**
 * keep item in collection, but do not lay it out
 * @param {Element} elem
 */
Packery.prototype.ignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.isIgnored = true;
  }
};

/**
 * return item to layout collection
 * @param {Element} elem
 */
Packery.prototype.unignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    delete item.isIgnored;
  }
};

Packery.prototype.sortItemsByPosition = function() {
  // console.log('sortItemsByPosition');
  this.items.sort( function( a, b ) {
    return a.position.y - b.position.y || a.position.x - b.position.x;
  });
};

/**
 * Fit item element in its current position
 * Packery will position elements around it
 * useful for expanding elements
 *
 * @param {Element} elem
 * @param {Number} x - horizontal destination position, optional
 * @param {Number} y - vertical destination position, optional
 */
Packery.prototype.fit = function( elem, x, y ) {
  var item = this.getItem( elem );
  if ( !item ) {
    return;
  }

  // prepare internal properties
  this._getMeasurements();

  // stamp item to get it out of layout
  this.stamp( item.element );
  // required for positionPlaceRect
  item.getSize();
  // set placing flag
  item.isPlacing = true;
  // fall back to current position for fitting
  x = x === undefined ? item.rect.x: x;
  y = y === undefined ? item.rect.y: y;

  // position it best at its destination
  item.positionPlaceRect( x, y, true );

  // emit event when item is fit and other items are laid out
  var _this = this;
  var ticks = 0;
  function tick() {
    ticks++;
    if ( ticks !== 2 ) {
      return;
    }
    _this.emitEvent( 'fitComplete', [ _this, item ] );
  }
  item.on( 'layout', function() {
    tick();
    return true;
  });
  this.on( 'layoutComplete', function() {
    tick();
    return true;
  });
  item.moveTo( item.placeRect.x, item.placeRect.y );
  // layout everything else
  this.layout();

  // return back to regularly scheduled programming
  this.unstamp( item.element );
  this.sortItemsByPosition();
  // un set placing flag, back to normal
  item.isPlacing = false;
  // copy place rect position
  item.copyPlaceRectPosition();
};

// -------------------------- drag -------------------------- //

/**
 * handle an item drag start event
 * @param {Element} elem
 */
Packery.prototype.itemDragStart = function( elem ) {
  this.stamp( elem );
  var item = this.getItem( elem );
  if ( item ) {
    item.dragStart();
  }
};

/**
 * handle an item drag move event
 * @param {Element} elem
 * @param {Number} x - horizontal change in position
 * @param {Number} y - vertical change in position
 */
Packery.prototype.itemDragMove = function( elem, x, y ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.dragMove( x, y );
  }

  // debounce
  var _this = this;
  // debounce triggering layout
  function delayed() {
    _this.layout();
    delete _this.dragTimeout;
  }

  this.clearDragTimeout();

  this.dragTimeout = setTimeout( delayed, 40 );
};

Packery.prototype.clearDragTimeout = function() {
  if ( this.dragTimeout ) {
    clearTimeout( this.dragTimeout );
  }
};

/**
 * handle an item drag end event
 * @param {Element} elem
 */
Packery.prototype.itemDragEnd = function( elem ) {
  var item = this.getItem( elem );
  var itemDidDrag;
  if ( item ) {
    itemDidDrag = item.didDrag;
    item.dragStop();
  }
  // if elem didn't move, or if it doesn't need positioning
  // unignore and unstamp and call it a day
  if ( !item || ( !itemDidDrag && !item.needsPositioning ) ) {
    this.unstamp( elem );
    return;
  }
  // procced with dragged item

  classie.add( item.element, 'is-positioning-post-drag' );

  // save this var, as it could get reset in dragStart
  var itemNeedsPositioning = item.needsPositioning;
  var asyncCount = itemNeedsPositioning ? 2 : 1;
  var completeCount = 0;
  var _this = this;
  function onLayoutComplete() {
    completeCount++;
    // don't proceed if not complete
    if ( completeCount !== asyncCount ) {
      return true;
    }
    // reset item
    if ( item ) {
      classie.remove( item.element, 'is-positioning-post-drag' );
      item.isPlacing = false;
      item.copyPlaceRectPosition();
    }

    _this.unstamp( elem );
    // only sort when item moved
    _this.sortItemsByPosition();

    // emit item drag event now that everything is done
    if ( item && itemNeedsPositioning ) {
      _this.emitEvent( 'dragItemPositioned', [ _this, item ] );
    }
    // listen once
    return true;
  }

  if ( itemNeedsPositioning ) {
    item.on( 'layout', onLayoutComplete );
    item.moveTo( item.placeRect.x, item.placeRect.y );
  } else if ( item ) {
    // item didn't need placement
    item.copyPlaceRectPosition();
  }

  this.clearDragTimeout();
  this.on( 'layoutComplete', onLayoutComplete );
  this.layout();

};

/**
 * binds Draggabilly events
 * @param {Draggabilly} draggie
 */
Packery.prototype.bindDraggabillyEvents = function( draggie ) {
  draggie.on( 'dragStart', this.handleDraggabilly.dragStart );
  draggie.on( 'dragMove', this.handleDraggabilly.dragMove );
  draggie.on( 'dragEnd', this.handleDraggabilly.dragEnd );
};

/**
 * binds jQuery UI Draggable events
 * @param {jQuery} $elems
 */
Packery.prototype.bindUIDraggableEvents = function( $elems ) {
  $elems
    .on( 'dragstart', this.handleUIDraggable.start )
    .on( 'drag', this.handleUIDraggable.drag )
    .on( 'dragstop', this.handleUIDraggable.stop );
};

// ----- destroy ----- //

// remove and disable Packery instance
Packery.prototype.destroy = function() {
  // reset element styles
  this.element.style.position = '';
  this.element.style.height = '';
  delete this.element.packeryGUID;

  // destroy items
  for ( var i=0, len = this.items.length; i < len; i++ ) {
    var item = this.items[i];
    item.destroy();
  }

  this.unbindResize();
};

// -------------------------- data -------------------------- //

/**
 * get Packery instance from element
 * @param {Element} elem
 * @returns {Packery}
 */
Packery.data = function( elem ) {
  var id = elem.packeryGUID;
  return id && packeries[ id ];
};

// -------------------------- declarative -------------------------- //

/**
 * allow user to initialize Packery via .js-packery class
 * options are parsed from data-packery-option attribute
 */
docReady( function() {
  var elems = document.querySelectorAll('.js-packery');

  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    var attr = elem.getAttribute('data-packery-options');
    var options;
    try {
      options = attr && JSON.parse( attr );
    } catch ( error ) {
      // log error, do not initialize
      if ( console ) {
        console.error( 'Error parsing data-packery-options on ' +
          elem.nodeName.toLowerCase() + ( elem.id ? '#' + elem.id : '' ) + ': ' +
          error );
      }
      continue;
    }
    // initialize
    var pckry = new Packery( elem, options );
    // make available via $().data('packery')
    if ( jQuery ) {
      jQuery.data( elem, 'packery', pckry );
    }
  }
});

// -------------------------- jQuery bridge -------------------------- //

// make into jQuery plugin
if ( jQuery && jQuery.bridget ) {
  jQuery.bridget( 'packery', Packery );
}

// -------------------------- transport -------------------------- //

// back in global
Packery.Rect = Rect;
Packery.Packer = Packer;
Packery.Item = Item;
window.Packery = Packery;

})( window );
define("plugins/packery/packery.pkgd", function(){});

// Generated by CoffeeScript 1.6.2

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

(function($) {
  /*
  	layout a collection of item elements
  	@param {Array} items - array of Packery.Items
  	@param {Boolean} isInstant - disable transitions for setting item position
  */

  var JJPackery, JJPackeryMan, packery_layoutItems;

  packery_layoutItems = Packery.prototype.layoutItems;
  Packery.prototype.layoutItems = function(items, isInstant) {
    this.maxY = 0;
    return packery_layoutItems.call(this, items, isInstant);
  };
  JJPackery = (function() {
    /*
    		 # construct variables
    */
    JJPackery.prototype.members = function() {
      this.$window = $();
      this.$container = $();
      this.$sizing = $();
      this.$packeryEl = $();
      this.packery = null;
      this.resizeTimeout = null;
      this.updateLayout = true;
      this.fitInWindow = true;
      this.rendered = 0;
      this.onResizeLayout = false;
      this.layoutIsComplete = false;
      this.started = false;
      this.itemDimensions = [];
      this.transitionDuration = '.4s';
      return this.factor = .3;
    };

    function JJPackery() {
      this.onResize = __bind(this.onResize, this);      console.log('JJPackery');
      this.members();
      this.init();
      this.start();
    }

    /*
    		 # fill variables
    */


    JJPackery.prototype.init = function() {
      this.$window = $(window);
      this.$container = $('.packery-wrapper');
      this.$sizing = $('.packery-test', this.$container);
      this.$packeryEl = $('.packery', this.$container);
      if (this.fitInWindow) {
        return this.$packeryEl.addClass('fit-in-window').css('max-height', this.$window.height());
      }
    };

    JJPackery.prototype.calcAndLayout = function() {
      if (this.packery && this.updateLayout) {
        console.log('calc and relayout');
        if (this.fitInWindow) {
          this.calc();
        }
        return this.packery.layout();
      }
    };

    JJPackery.prototype.setToCenter = function() {
      var elHeight, winHeight;

      winHeight = this.$window.height();
      elHeight = this.$packeryEl.height();
      if (elHeight <= winHeight) {
        return this.$packeryEl.css('top', Math.floor((winHeight - elHeight) / 2));
      } else {
        return this.$packeryEl.css('top', 0);
      }
    };

    JJPackery.prototype.hiddenLayout = function(duration) {
      this.onResizeLayout = true;
      this.packery.layout();
      return this.onResizeLayout = false;
    };

    /*
    		 # on resize handler
    		 #
    */


    JJPackery.prototype.onResize = function() {
      if (this.fitInWindow) {
        this.calc();
        this.$packeryEl.css('max-height', this.$window.height());
      }
      if (!this.layoutIsComplete) {
        console.log('not layoutIsComplete');
        this.layoutIsComplete = true;
        this.packery.layout();
      }
      this.packery.layout();
      this.setToCenter();
      if (this.layoutIsComplete && !this.started) {
        console.log('started');
        this.started = true;
        return this.show();
      }
    };

    /*
    		 # returns the centered position of the given element
    		 #
    		 # @return [object] position
    */


    JJPackery.prototype.getCenterPos = function($el) {
      var elCenter, elPos;

      elPos = $el.offset();
      return elCenter = {
        top: elPos.top + $el.height() / 2,
        left: elPos.left + $el.width() / 2
      };
    };

    /*
    		 # returns the distance between two points
    		 #
    		 # @param p1 
    		 # @param p2
    		 #
    		 # @return Number
    */


    JJPackery.prototype.getLineDistance = function(p1, p2) {
      var xs, ys;

      xs = ys = 0;
      xs = p2.left - p1.left;
      xs *= xs;
      ys = p2.top - p1.top;
      ys *= ys;
      return Math.sqrt(xs + ys);
    };

    /*
    		 # applies the radial effect to all ItemElements
    		 #
    */


    JJPackery.prototype.applyRadialGravityEffect = function() {
      var packeryCenter,
        _this = this;

      packeryCenter = this.getCenterPos(this.$packeryEl);
      return $.each(this.packery.getItemElements(), function(i, el) {
        return _this._applyRadialGravityEffectToElement(el, packeryCenter);
      });
    };

    /*
    		 # applies the radial effect to the given element
    		 #
    		 # @param HTMLElement el
    		 # @param point gravity center
    */


    JJPackery.prototype._applyRadialGravityEffectToElement = function(el, center) {
      var $el, ba, bc, elPos, expFactor, margins, third, xFactor, yFactor;

      $el = $(el);
      elPos = this.getCenterPos($el);
      third = {
        top: elPos.top,
        left: center.left
      };
      ba = third.top - center.top;
      bc = elPos.left - third.left;
      expFactor = this.getLineDistance(center, elPos) * this.factor / 200;
      yFactor = (ba / Math.abs(ba)) * expFactor * this.getLineDistance(center, third);
      xFactor = (bc / Math.abs(bc)) * expFactor * this.getLineDistance(elPos, third);
      margins = {
        'margin-top': yFactor,
        'margin-left': xFactor
      };
      $el.css(margins);
      return true;
    };

    /*
    		 # init tooltip to all ItemElements
    		 #
    */


    JJPackery.prototype.initTooltips = function() {
      var _this = this;

      console.log('init tooltips');
      $.each(this.packery.getItemElements(), function(i, el) {
        return _this._initTooltip(el);
      });
      return false;
    };

    JJPackery.prototype._initTooltip = function(el) {
      var $el, $metaSection, api, foo, getMargin, hideTimeout, hideTip, marginOffset, mouseOutEl, mouseOutTip, showTimeout,
        _this = this;

      mouseOutEl = true;
      mouseOutTip = true;
      api = {};
      showTimeout = null;
      hideTimeout = null;
      hideTip = function() {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
        return hideTimeout = setTimeout(function() {
          console.log(mouseOutEl);
          console.log(mouseOutTip);
          if (mouseOutEl && mouseOutTip) {
            $el.add(api.tooltip).off('mouseleave.tooltip');
            return api.hide();
          }
        }, 200);
      };
      /*
      			showTip = =>
      				if showTimeout
      					clearTimeout showTimeout
      				
      				showTimeout = setTimeout =>
      					console.log 'show tip'
      					api.show()
      				, 500
      */

      $el = $(el);
      $metaSection = $('section[role=tooltip-content]', $el);
      marginOffset = -20;
      getMargin = function(api) {
        var $tooltip, margin;

        margin = marginOffset;
        $tooltip = $(api.tooltip);
        if ($tooltip.hasClass('qtip-pos-rb')) {
          console.log('inverse margin');
          margin *= -1;
        }
        return margin;
      };
      if ($metaSection.length) {
        foo = this;
        $el.qtip({
          content: {
            text: $metaSection.html()
          },
          show: {
            delay: 500,
            event: 'mouseenter',
            effect: function(api) {
              var _this = this;

              $el.addClass('has-tooltip');
              $(this).stop(true, true).css({
                'margin-left': getMargin(api)
              }).show().animate({
                'margin-left': 0,
                'opacity': 1
              }, 200);
              console.log(api.tooltip);
              if (api.tooltip) {
                $(api.tooltip).one('mouseenter.tooltip', function() {
                  return mouseOutTip = false;
                });
              }
              return $el.add(api.tooltip).one('mouseleave.tooltip', function(e) {
                if ($(e.target).closest('.qtip').length) {
                  mouseOutTip = true;
                } else {
                  mouseOutEl = true;
                }
                hideTip();
                return console.log('close tooltip');
              });
            }
          },
          hide: {
            event: false,
            effect: function(api) {
              return $(this).stop(true, true).animate({
                'margin-left': getMargin(api),
                'opacity': 0
              }, 200, function() {
                $el.removeClass('has-tooltip');
                return $(this).hide();
              });
            }
          },
          /*
          					events:
          						show: (e, api) ->
          							window.currentTooltip = 
          								tip			: @
          								target		: api.target
          								targetId	: $(api.target).attr 'data-gravity-item'
          								api			: api
          
          						hide: (e, api) ->
          							window.currentTooltip = {}
          */

          position: {
            at: "right bottom",
            my: "left bottom",
            viewport: this.$container,
            adjust: {
              method: 'flip shift',
              x: 0,
              y: 10
            }
          }
        });
        api = $el.qtip('api');
        console.log(api);
        /*
        				@api.tooltip.on('mouseenter', =>
        					mouseOutTip = false
        				)
        				.on('mouseleave', =>
        					mouseOutTip = true
        					hideTip()
        				)
        */

        return $('> a', $el).on('mouseleave', function() {
          console.log('leave');
          mouseOutEl = true;
          return hideTip();
        });
      }
    };

    JJPackery.prototype.update = function() {
      if (this.packery) {
        return this.packery.layout();
      }
    };

    JJPackery.prototype.destroy = function() {
      if (this.packery) {
        return this.packery.destroy();
      }
    };

    JJPackery.prototype.calc = function(rewind) {
      var $item, $stamps, buffer, dims, factor, i, imageSquare, item, itemSquare, items, limit, newWidth, square, stampSquare, width, _ref, _ref1, _results, _results1;

      limit = .7;
      buffer = .05;
      square = this.$window.height() * this.$window.width();
      itemSquare = 0;
      imageSquare = 0;
      stampSquare = 0;
      $stamps = this.$packeryEl.find('.stamp');
      $stamps.each(function(i, el) {
        var $item;

        $item = $(el);
        return stampSquare += $item.width() * $item.height();
      });
      _ref = this.packery.getItemElements();
      for (i in _ref) {
        item = _ref[i];
        $item = $(item);
        imageSquare += $item.width() * $item.height();
      }
      itemSquare = imageSquare + stampSquare;
      console.log(square);
      console.log(itemSquare);
      console.log(itemSquare / square);
      if (imageSquare / square > limit + buffer) {
        console.log('more than ' + limit + '%');
        items = this.packery.getItemElements();
        console.log(items.length);
        _results = [];
        for (i in items) {
          item = items[i];
          $item = $(item);
          $item.width($item.width() * limit);
          _results.push($item.height($item.height * limit));
        }
        return _results;
      } else if (imageSquare / square < limit - buffer) {
        factor = square / imageSquare - buffer;
        console.log(factor);
        _ref1 = this.packery.items;
        _results1 = [];
        for (i in _ref1) {
          item = _ref1[i];
          dims = item.initialDimensions;
          if (!dims) {
            continue;
          }
          $item = $(item.element);
          width = $item.width();
          console.log(width * factor);
          newWidth = Math.min(dims.width, width * factor);
          _results1.push($item.width(newWidth));
        }
        return _results1;
      }
    };

    JJPackery.prototype.saveItemDimensions = function() {
      var i, item, _ref;

      _ref = this.packery.items;
      for (i in _ref) {
        item = _ref[i];
        item.initialDimensions = {
          width: item.rect.width,
          height: item.rect.height
        };
      }
      return false;
    };

    JJPackery.prototype.show = function() {
      console.log('show');
      this.packery.options.transitionDuration = this.transitionDuration;
      this.saveItemDimensions();
      this.setToCenter();
      this.initTooltips();
      this.applyRadialGravityEffect();
      return this.$container.addClass('loaded').addClass('has-gravity');
    };

    JJPackery.prototype.start = function() {
      var _this = this;

      return this.$container.imagesLoaded(function() {
        console.log(_this.$packeryEl[0]);
        if (!_this.$packeryEl.length) {
          return;
        }
        _this.packery = new Packery(_this.$packeryEl[0], {
          containerStyle: null,
          itemSelector: '.packery-item',
          gutter: 0,
          stamped: '.stamp',
          transitionDuration: 0,
          isResizeBound: false,
          isInitLayout: false
        });
        _this.packery.maxY = _this.$window.height();
        _this.packery.on('layoutComplete', function() {
          _this.rendered++;
          if (_this.rendered === 1) {
            console.log('hidden trigger');
          } else {
            _this.layoutIsComplete = true;
          }
          console.log('layout is complete');
          return false;
        });
        _this.$window.on('resize', function() {
          if (_this.resizeTimeout) {
            clearTimeout(_this.resizeTimeout);
          }
          return _this.resizeTimeout = setTimeout(_this.onResize, 200);
        });
        return _this.onResize();
      });
    };

    return JJPackery;

  })();
  JJPackeryMan = function() {
    return new JJPackery;
  };
  window.JJPackeryClass = JJPackery;
  return window.JJPackeryMan = JJPackeryMan;
})(jQuery);

define("plugins/packery/packerytest", function(){});

// Generated by CoffeeScript 1.6.2
define('modules/JJPackery',['app', 'plugins/packery/packerytest'], function(app) {
  var JJPackery;

  JJPackery = app.module();
  JJPackery.Views.Container = Backbone.View.extend({
    tagName: 'section',
    className: 'packery-wrapper',
    template: 'packery-container',
    afterRender: function() {
      JJPackeryMan();
      if (this._afterRender) {
        return this._afterRender();
      }
    }
  });
  return JJPackery;
});

// Generated by CoffeeScript 1.6.2
define('modules/Portfolio',['app', 'modules/JJPackery'], function(app, JJPackery) {
  var Portfolio;

  Portfolio = app.module();
  Portfolio.Config = {
    person_group_length: 4,
    group_project_title: 'Group project'
  };
  Portfolio.Views.PackeryContainer = JJPackery.Views.Container.extend({
    cleanup: function() {
      return Backbone.Events.off('search', this.handleSearch);
    },
    initialize: function() {
      return Backbone.Events.on('search', this.handleSearch, this);
    },
    handleSearch: function(searchResults) {
      if (this.__manager__.hasRendered) {
        return this.triggerSearchOnChildren(searchResults);
      } else {
        this.searchResults = searchResults;
        return this.doSearchAfterRender = true;
      }
    },
    triggerSearchOnChildren: function(searchResults) {
      console.log(searchResults);
      return _.each(this.views['.packery'], function(childView) {
        var found, method, model;

        model = childView.model;
        if (!searchResults) {
          return childView.doShow();
        } else {
          found = _.find(searchResults, function(result) {
            return result === childView.model;
          });
          method = found ? 'doShow' : 'doHide';
          return childView[method]();
        }
      });
    },
    beforeRender: function() {
      var model, modelArray, _i, _len, _results;

      console.log('portfolio before render');
      modelArray = this.collection;
      if (modelArray) {
        _results = [];
        for (_i = 0, _len = modelArray.length; _i < _len; _i++) {
          model = modelArray[_i];
          _results.push(this.insertView('.packery', new Portfolio.Views.ListItem({
            model: model,
            linkTo: this.options.linkTo
          })));
        }
        return _results;
      }
    },
    _afterRender: function() {
      if (this.doSearchAfterRender) {
        this.triggerSearchOnChildren(this.searchResults);
        this.doSearchAfterRender = false;
        return this.searchResults = null;
      }
    }
  });
  Portfolio.Views.ListItem = Backbone.View.extend({
    tagName: 'article',
    className: 'packery-item resizable',
    template: 'packery-list-item',
    doShow: function() {
      console.log('showing %o', this.model);
      return this.$el.removeClass('hidden');
    },
    doHide: function() {
      console.log('hiding %o', this.model);
      return this.$el.addClass('hidden');
    },
    serialize: function() {
      var data;

      data = this.model ? this.model.toJSON() : {};
      data.Persons = _.sortBy(data.Persons, function(person) {
        return person.Surname;
      });
      data.LinkTo = this.options.linkTo;
      return data;
    }
  });
  Portfolio.Views.Detail = Backbone.View.extend({
    tagName: 'article',
    className: 'portfolio-detail',
    template: 'portfolio-detail',
    beforeRender: function() {
      this._codeEv = $.Event('code:kickoff', {
        bubbles: false
      });
      return this._afterRenderEv = $.Event('portfoliodetail:rendered');
    },
    afterRender: function() {
      var $doc;

      window.picturefill();
      $doc = $(document);
      $doc.trigger(this._codeEv);
      return $doc.trigger(this._afterRenderEv);
    },
    serialize: function() {
      var json, types,
        _this = this;

      json = this.model ? this.model.toJSON() : {};
      types = ['Projects', 'ChildProjects', 'ParentProjects'];
      json.Persons = _.sortBy(json.Persons, function(person) {
        return person.Surname;
      });
      if (parseInt(json.Persons.length) > parseInt(Portfolio.Config.person_group_length)) {
        json.IsGroup = true;
      }
      console.log(json);
      json.combinedProjects = [];
      _.each(types, function(type) {
        if (_.isArray(json[type])) {
          return json.combinedProjects = json.combinedProjects.concat(json[type]);
        }
      });
      return json;
    }
  });
  Handlebars.registerHelper('nameSummary', function(persons) {
    var conf, length, out;

    conf = Portfolio.Config;
    if (!(persons.length <= conf.person_group_length)) {
      return conf.group_project_title;
    }
    out = '';
    length = persons.length;
    _.each(persons, function(person, i) {
      out += '<a href="/about/' + person.UrlSlug + '/">' + person.FirstName + ' ' + (person.Surname ? person.Surname : '') + '</a>';
      if (i < (length - 2)) {
        return out += ', ';
      } else if (i < (length - 1)) {
        return out += ' &amp; ';
      }
    });
    return out;
  });
  Handlebars.registerHelper('niceDate', function(model, forceYear) {
    var out;

    if (!(model.DateRangeNice || model.FrontendDate)) {
      return false;
    }
    out = '';
    if (model.DateRangeNice) {
      out += model.DateRangeNice;
    } else if (model.FrontendDate) {
      if (!forceYear) {
        out += model.FrontendDate;
      } else {
        out += model.FrontendDate.split(' ')[1];
      }
    }
    return out;
  });
  Handlebars.registerHelper('teaserMeta', function() {
    var nameSummary, niceDate;

    niceDate = Handlebars.helpers.niceDate(this, true);
    if (this.ClassName === 'Project') {
      nameSummary = Handlebars.helpers.nameSummary(this.Persons);
      return "" + nameSummary + " // " + niceDate;
    } else {
      return niceDate;
    }
  });
  Handlebars.registerHelper('SpaceAndLocation', function() {
    var out;

    out = [];
    if (this.Space) {
      out.push(this.Space);
    }
    if (this.Location) {
      out.push(this.Location);
    }
    out.join(', ');
    if (out) {
      return "<p>" + out + "</p>";
    }
  });
  Handlebars.registerHelper('portfoliolist', function(items, title, options) {
    var length, out;

    if (!options) {
      options = title;
      title = '';
    }
    length = 0;
    out = '<ul>';
    _.each(items, function(item) {
      if (item.IsPublished) {
        out += '<li><a href="/portfolio/' + item.UglyHash + '/">' + item.Title + '</a></li>';
        return length++;
      }
    });
    out += '</ul>';
    title += length > 1 ? 's' : '';
    if (length) {
      return ("<h4>" + title + "</h4>") + out;
    } else {
      return '';
    }
  });
  Handlebars.registerHelper('personlist', function(persons) {
    var out;

    out = '<ul>';
    _.each(persons, function(person) {
      return out += '<li><a href="/about/' + person.UrlSlug + '/">' + person.FirstName + ' ' + (person.Surname ? person.Surname : '') + '</a></li>';
    });
    out += '</ul>';
    return "<h4>Contributors</h4>" + out;
  });
  Handlebars.registerHelper('commaSeparatedWebsites', function(websites) {
    var a;

    a = [];
    _.each(websites, function(website) {
      return a.push("<a href=\"" + website.Link + "\">" + website.Title + "</a>");
    });
    return a.join(', ');
  });
  return Portfolio;
});

// Generated by CoffeeScript 1.6.2
define('modules/Person',['app', 'modules/JJPackery', 'modules/Portfolio'], function(app, JJPackery, Portfolio) {
  var Person;

  Person = app.module();
  JJRestApi.Modules.extend('Person', function(Person) {
    JJRestApi.extendModel('Person', {
      /**
      				 * @return {String} either 'student' or 'alumni' or 'employee'
      */

      getLinkingSlug: function() {
        if (this.get('IsEmployee')) {
          return 'employee';
        }
        if (this.get('IsStudent')) {
          return 'student';
        }
        if (this.get('IsAlumni')) {
          return 'alumni';
        }
        return '';
      },
      getFullName: function() {
        if (this.get('FullName')) {
          return this.get('FullName');
        }
        return (this.get('FirstName') ? this.get('FirstName') : '') + ' ' + (this.get('Surname') ? this.get('Surname') : '');
      }
    });
    return JJRestApi.extendCollection('Person', {
      foo: 'bar'
    });
  });
  Person.Views.PackeryContainer = JJPackery.Views.Container.extend({
    beforeRender: function() {
      var model, modelArray, projectType, rel, rels, _i, _j, _k, _len, _len1, _len2, _ref, _results;

      console.log('render person page with normal view');
      modelArray = [];
      rels = this.model.relations;
      _ref = app.Config.ProjectTypes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        projectType = _ref[_i];
        for (_j = 0, _len1 = rels.length; _j < _len1; _j++) {
          rel = rels[_j];
          if (rel.collectionType === projectType) {
            modelArray = modelArray.concat(this.model.get(rel.key).models);
          }
        }
      }
      this.insertView('.packery', new Person.Views.InfoItem({
        model: this.model
      }));
      _results = [];
      for (_k = 0, _len2 = modelArray.length; _k < _len2; _k++) {
        model = modelArray[_k];
        if (model.get('IsPublished')) {
          _results.push(this.insertView('.packery', new Portfolio.Views.ListItem({
            model: model,
            linkTo: 'about/' + this.model.get('UrlSlug')
          })));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });
  Person.Views.InfoItem = Backbone.View.extend({
    tagName: 'article',
    className: 'packery-item person-info',
    template: 'person-info-item',
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      }
    }
  });
  Person.Views.Custom = Backbone.View.extend({
    tagName: 'div',
    className: 'custom-templ',
    initialize: function(options) {
      if (options.template) {
        return this.template = options.template;
      }
    },
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    },
    beforeRender: function() {
      return this._ev = $.Event('template:ready', {
        bubbles: false
      });
    },
    afterRender: function() {
      return $(document).trigger(this._ev);
    }
  });
  Handlebars.registerHelper('personMeta', function() {
    var addDate, out, stats;

    out = '';
    stats = [];
    addDate = false;
    if (this.IsStudent) {
      stats.push('Student');
    }
    if (this.IsAlumni) {
      stats.push('Alumni');
    }
    if (this.IsEmployee) {
      stats.push('Employee');
    }
    if (this.IsExternal) {
      stats.push('External');
    }
    if (!stats.length) {
      return '';
    }
    out += stats.join(', ');
    if (this.GraduationYear) {
      out += ' // ';
      out += this.MasterYear ? this.MasterYear : this.GraduationYear;
    }
    return out;
  });
  Handlebars.registerHelper('website', function() {
    var href, title;

    href = this.Link || '#';
    title = this.Title || href;
    return '<a href="' + href + '">' + title + '</a>';
  });
  return Person;
});

// Generated by CoffeeScript 1.6.2
define('modules/Excursion',['app', 'modules/SuperProject'], function(app, SuperProject) {
  var Excursion;

  Excursion = app.module();
  JJRestApi.Modules.extend('Excursion', function(Excursion) {
    JJRestApi.extendModel('Excursion', SuperProject.Model, {
      foo: 'bar'
    });
    return JJRestApi.extendCollection('Excursion', {
      foo: 'bar'
    });
  });
  return Excursion;
});

// Generated by CoffeeScript 1.6.2
define('modules/Workshop',['app', 'modules/SuperProject'], function(app, SuperProject) {
  var Workshop;

  Workshop = app.module();
  JJRestApi.Modules.extend('Workshop', function(Workshop) {
    JJRestApi.extendModel('Workshop', SuperProject.Model, {
      foo: 'bar'
    });
    return JJRestApi.extendCollection('Workshop', {
      foo: 'bar'
    });
  });
  return Workshop;
});

// Generated by CoffeeScript 1.6.2
define('modules/Exhibition',['app', 'modules/SuperProject'], function(app, SuperProject) {
  var Exhibition;

  Exhibition = app.module();
  JJRestApi.Modules.extend('Exhibition', function(Exhibition) {
    JJRestApi.extendModel('Exhibition', SuperProject.Model, {
      foo: 'bar'
    });
    return JJRestApi.extendCollection('Exhibition', {
      foo: 'bar'
    });
  });
  return Exhibition;
});

// Generated by CoffeeScript 1.6.2
define('modules/CalendarEntry',['app'], function(app) {
  var CalendarEntry;

  CalendarEntry = app.module();
  JJRestApi.Modules.extend('CalendarEntry', function(CalendarEntry) {
    JJRestApi.extendModel('CalendarEntry', {
      foo: 'bar'
    });
    return JJRestApi.extendCollection('CalendarEntry', {
      foo: 'bar'
    });
  });
  return CalendarEntry;
});

// Generated by CoffeeScript 1.6.2
define('modules/PageError',['app'], function(app) {
  var PageError;

  PageError = app.module();
  PageError.Views.FourOhFour = Backbone.View.extend({
    template: '404',
    tagName: 'div',
    className: 'page-error',
    serialize: function() {
      return {
        url: this.attributes['data-url']
      };
    }
  });
  return PageError;
});

// Generated by CoffeeScript 1.6.2
define('modules/Calendar',['app'], function(app) {
  var Calendar;

  Calendar = app.module();
  Calendar.Views.Container = Backbone.View.extend({
    id: 'calendar-container',
    template: 'calendar-container',
    initialize: function(options) {
      return this.upcomingEvents = this.collection.where({
        IsUpcoming: true
      });
    },
    serialize: function() {
      var json;

      json = {};
      if (this.upcomingEvents && this.upcomingEvents.length) {
        json.HasItems = true;
      }
      return json;
    },
    beforeRender: function() {
      var model, _i, _len, _ref, _results;

      _ref = this.upcomingEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(this.insertView('#calendar-list', new Calendar.Views.ListItem({
          model: model
        })));
      }
      return _results;
    }
  });
  Calendar.Views.ListItem = Backbone.View.extend({
    tagName: 'li',
    className: 'calendar-list-item',
    template: 'calendar-list-item',
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    }
  });
  Calendar.Views.Detail = Backbone.View.extend({
    tagName: 'article',
    className: 'portfolio-detail',
    template: 'calendar-detail',
    afterRender: function() {
      return window.picturefill();
    },
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    }
  });
  return Calendar;
});

// Generated by CoffeeScript 1.6.2
define('modules/About',['app', 'modules/JJPackery'], function(app, JJPackery) {
  var About;

  About = app.module();
  About.Views.PackeryContainer = JJPackery.Views.Container.extend({
    template: 'about-packery',
    initialize: function(options) {
      this.groupImage = options.groupImage;
      return this.persons = options.persons;
    },
    beforeRender: function() {
      var alumni, employee, student, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;

      if (this.persons) {
        _ref = this.persons.students;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          student = _ref[_i];
          this.insertView('#student-list', new About.Views.PersonListItem({
            model: student
          }));
        }
        _ref1 = this.persons.alumnis;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          alumni = _ref1[_j];
          this.insertView('#alumni-list', new About.Views.PersonListItem({
            model: alumni
          }));
        }
        _ref2 = this.persons.employees;
        _results = [];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          employee = _ref2[_k];
          _results.push(this.insertView('.packery', new About.Views.EmployeeItem({
            model: employee
          })));
        }
        return _results;
      }
    },
    afterRender: function() {
      $(document).trigger($.Event('about:rendered'));
      return JJPackeryMan();
    },
    serialize: function() {
      return {
        GroupImage: this.groupImage
      };
    }
  });
  About.Views.PersonListItem = Backbone.View.extend({
    tagName: 'li',
    template: 'person-list-item',
    serialize: function() {
      return this.model.toJSON();
    }
  });
  About.Views.EmployeeItem = Backbone.View.extend({
    tagName: 'section',
    className: 'person packery-item',
    template: 'employee-item',
    serialize: function() {
      return this.model.toJSON();
    }
  });
  return About;
});

// Generated by CoffeeScript 1.6.2
define('modules/NewProject',['app'], function(app) {
  var NewProject;

  NewProject = app.module();
  NewProject.Views.NewProject = Backbone.View.extend({
    tagName: 'div',
    template: 'security/create-project',
    events: {
      'submit form.create-project': 'createNewProject',
      'click .project-type-list a': 'setProjectType'
    },
    hideForm: function() {
      this.$field.blur();
      this.formError('');
      return this.$form.removeClass('active');
    },
    showForm: function() {
      this.$submit.text('Create ' + this.projectType);
      this.$field.attr('placeholder', this.projectType + ' Title').removeAttr('disabled').val('').focus();
      this.formError('');
      return this.$form.addClass('active');
    },
    formError: function(msg) {
      if (msg) {
        return this.$error.html(msg).addClass('active');
      } else {
        return this.$error.removeClass('active');
      }
    },
    setProjectType: function(e) {
      var $link, type;

      $link = $(e.target);
      $link.closest('ul').find('.active').not($link).removeClass('active').end().end().end().toggleClass('active');
      if ($link.hasClass('active')) {
        this.$list.addClass('active');
        type = $(e.currentTarget).data('type');
        if (type) {
          this.projectType = type;
        }
        this.showForm();
      } else {
        this.$list.removeClass('active');
        this.projectType = null;
        this.hideForm();
      }
      return false;
    },
    afterRender: function() {
      var _this = this;

      this.$list = $('ul.project-type-list');
      this.$form = $('form.create-project');
      this.$field = $('input', this.$form);
      this.$error = $('.form-error', this.$form);
      this.$submit = $('button[type=submit]', this.$form);
      return this.$field.on('keyup', function() {
        if (_this.$error.hasClass('active') && _this.$field.val()) {
          return _this.formError('');
        }
      });
    },
    createNewProject: function(e) {
      var errorMsg, m, model, person, title,
        _this = this;

      e.preventDefault();
      title = this.$field.val();
      errorMsg = '';
      if (!title) {
        errorMsg = 'Please fill in a title!';
      }
      if (!this.projectType) {
        errorMsg = 'Please choose the type of your project!';
      }
      if (errorMsg) {
        this.formError(errorMsg);
        this.$field.focus();
      } else {
        if (person = app.CurrentMemberPerson) {
          this.$field.attr('disabled', 'disabled');
          m = JJRestApi.Model(this.projectType);
          model = new m({
            Title: title,
            Persons: person
          });
          model.save(null, {
            success: function() {
              _this.$field.removeAttr('disabled');
              model._isCompletelyFetched = true;
              model._isFetchedWhenLoggedIn = true;
              return Backbone.history.navigate('/secured/edit/' + model.get('UglyHash') + '/', true);
            },
            error: function(e) {
              var msg;

              msg = '<h1>' + e.status + ': ' + e.statusText + '</h1><p>' + e.responseText + '</p>';
              _this.formError(msg);
              return _this.$field.removeAttr('disabled');
            }
          });
        }
      }
      return false;
    }
  });
  return NewProject;
});

// Generated by CoffeeScript 1.6.2
define('modules/DocImage',['app'], function(app, Gravity, Portfolio) {
  var DocImage;

  DocImage = app.module();
  return JJRestApi.Modules.extend('DocImage', function(DocImage) {
    JJRestApi.extendModel('DocImage', {
      /**
      			 * used for Image markdown parser to determine if the member may see this image or not
      			 * @return {boolean}
      */

      isVisibleForMember: function() {
        var isVisible,
          _this = this;

        isVisible = false;
        _.each(['Projects', 'Workshops', 'Exhibitions', 'Excursions'], function(type) {
          if (_this.get(type).findWhere({
            EditableByMember: true
          })) {
            return isVisible = true;
          }
        });
        return isVisible;
      }
    });
    return JJRestApi.extendCollection('DocImage', {
      foo: 'bar'
    });
  });
});

// Generated by CoffeeScript 1.6.2
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('modules/NMMarkdownParser',['app', 'modules/DataRetrieval', 'modules/DocImage'], function(app, DataRetrieval, DocImage) {
  var ImageMarkdownParser, OEmbedMarkdownParser, _ref, _ref1;

  ImageMarkdownParser = (function(_super) {
    __extends(ImageMarkdownParser, _super);

    function ImageMarkdownParser() {
      _ref = ImageMarkdownParser.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageMarkdownParser.prototype.className = 'DocImage';

    ImageMarkdownParser.prototype.rule = /\[img\s{1,}(.*?)\]/gi;

    ImageMarkdownParser.prototype.parseFound = function(found) {
      return parseInt(found);
    };

    ImageMarkdownParser.prototype.isVisibleForMember = function(model) {
      return _.each;
    };

    ImageMarkdownParser.prototype.getData = function(ids) {
      var dfd,
        _this = this;

      this.data = [];
      dfd = new $.Deferred();
      DataRetrieval.forMultipleDocImages(ids).done(function(models) {
        var toShow;

        toShow = [];
        _.each(models, function(model) {
          if (model.isVisibleForMember()) {
            return toShow.push(model);
          }
        });
        _.each(toShow, function(img) {
          var src;

          src = img.get('Urls')._1200.Url;
          return _this.data.push({
            id: img.id,
            tag: "<span><img src=\"" + src + "\" /></span>"
          });
        });
        return dfd.resolve();
      });
      return dfd;
    };

    return ImageMarkdownParser;

  })(CustomMarkdownParser);
  OEmbedMarkdownParser = (function(_super) {
    __extends(OEmbedMarkdownParser, _super);

    function OEmbedMarkdownParser() {
      _ref1 = OEmbedMarkdownParser.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    OEmbedMarkdownParser.prototype.rule = /\[embed\s{1,}(.*?)\]/gi;

    OEmbedMarkdownParser.prototype.url = '/_md_/oembed/';

    return OEmbedMarkdownParser;

  })(CustomMarkdownParser);
  window.ImageMarkdownParser = ImageMarkdownParser;
  return window.OEmbedMarkdownParser = OEmbedMarkdownParser;
});

// Generated by CoffeeScript 1.6.2
define('modules/ProjectEditor',['app', 'modules/DataRetrieval', 'modules/Auth', 'modules/Portfolio', 'modules/Website', 'modules/NMMarkdownParser'], function(app, DataRetrieval, Auth, Portfolio, Website) {
  var ProjectEditor;

  ProjectEditor = app.module();
  ProjectEditor.Inst = (function() {
    function Inst(model) {
      this.model = model;
      this.containerView = new ProjectEditor.Views.Container({
        model: this.model
      });
      this.previewView = new ProjectEditor.Views.Preview({
        model: this.model
      });
      this.mainView = new ProjectEditor.Views.Main({
        model: this.model
      });
      this.modelJSON = _.extend(this.model.toJSON(), {
        CurrentMemberPerson: app.CurrentMemberPerson.toJSON()
      });
      Backbone.Events.trigger('projectEdited', this.model);
      this.model.on('saved', this.modelHasSaved, this);
    }

    Inst.prototype.kickOffRender = function() {
      return app.layout.setViewAndRenderMaybe('#project-editor', this.containerView);
    };

    Inst.prototype.getFilterID = function() {
      return "" + (this.model.get('ClassName')) + "-" + this.model.id;
    };

    Inst.prototype.toggleView = function() {
      return this.containerView.toggleView();
    };

    Inst.prototype.galleryImageRemoved = function(id) {
      var previewImage;

      previewImage = this.model.get('PreviewImage');
      if (previewImage && previewImage.id === id) {
        return this.previewView.removePreviewImage();
      }
    };

    Inst.prototype.modelHasSaved = function() {
      var selector, title;

      title = this.model.get('Title');
      selector = '[data-editor-name="Title"]';
      this.previewView.$el.find(selector).text(title);
      return this.mainView.$el.find(selector).text(title);
    };

    Inst.prototype.cleanup = function() {
      return this.model.off('saved', this.modelHasChanged);
    };

    return Inst;

  })();
  ProjectEditor.Views.Container = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-project-container',
    template: 'security/editor-project-container',
    ACTIVE: 'active',
    beforeRender: function() {
      this.setView('.editor-project-main', app.ProjectEditor.mainView);
      return this.setView('.editor-project-preview', app.ProjectEditor.previewView);
    },
    toggleView: function() {
      var name, view, _ref;

      _ref = this.views;
      for (name in _ref) {
        view = _ref[name];
        if (view.editor) {
          view.editor.trigger('editor.closepopovers');
        }
      }
      return $('.editor-project-main, .editor-project-preview').toggleClass(this.ACTIVE);
    }
  });
  ProjectEditor.Views.Preview = Backbone.View.extend({
    tagName: 'article',
    template: 'security/editor-project-preview',
    FILLED: 'filled',
    cleanup: function() {
      return this.uploadZone.cleanup();
    },
    initDropzone: function() {
      var _this = this;

      app.ProjectEditor.PreviewImageZone = this.uploadZone = new JJSingleImageUploadZone('.preview-image', {
        url: app.Config.DocImageUrl,
        additionalData: {
          projectId: app.ProjectEditor.model.id,
          projectClass: app.ProjectEditor.model.get('ClassName')
        },
        getFromCache: function(id) {
          return DataRetrieval.forDocImage(id);
        },
        responseHandler: function(data) {
          var $img, setPreviewImage;

          setPreviewImage = function(model, thumbUrl) {
            var img;

            img = model.get('Urls')['_320'];
            _this.uploadZone.$dropzone.addClass(_this.FILLED).html("<img src=\"" + img.Url + "\" />");
            if (_.indexOf(_this.model.get('Images').getIDArray(), model.id) < 0) {
              img = [
                {
                  FilterID: app.ProjectEditor.getFilterID(),
                  UploadedToClass: 'DocImage',
                  id: model.id,
                  url: thumbUrl
                }
              ];
              app.updateGalleryCache(img);
              Backbone.Events.trigger('DocImageAdded', img);
            }
            if (_this.model.get('PreviewImage') !== model) {
              _this.model.set('PreviewImage', model);
              _this.model.get('Images').add(model);
              return _this.model.rejectAndSave();
            }
          };
          if (data instanceof Backbone.Model === true) {
            $img = $("#editor-sidebar").find("li.DocImage img[data-id=\"" + data.id + "\"]");
            return setPreviewImage(data, $img.attr('src'));
          } else {
            return DataRetrieval.forDocImage(data[0].id).done(function(model) {
              return setPreviewImage(model, data[0].url);
            });
          }
        }
      });
      return this;
    },
    initEditor: function() {
      var _this = this;

      this.editor = new JJEditor($('.meta'), ['InlineEditable', 'DateEditable', 'MarkdownEditable']);
      this.editor.on('stateUpdate', function(e) {
        var key, val, _changed, _ref;

        _changed = false;
        _ref = e.ProjectPreview;
        for (key in _ref) {
          val = _ref[key];
          if (key === 'TeaserText' && val) {
            val = val.raw;
          }
          if (!val) {
            continue;
          }
          if (_this.model.get(key) !== val) {
            _changed = true;
            _this.model.set(key, val);
          }
        }
        if (_changed) {
          return _this.model.rejectAndSave();
        }
      });
      return this;
    },
    removePreviewImage: function() {
      return this.uploadZone.$dropzone.removeClass(this.FILLED).empty();
    },
    afterRender: function() {
      this.initDropzone();
      return this.initEditor();
    },
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    }
  });
  ProjectEditor.Views.Main = Backbone.View.extend({
    tagName: 'article',
    template: 'security/editor-project-main',
    initEditor: function() {
      var markdownEditor,
        _this = this;

      this.editor = new JJEditor(this.$el, ['InlineEditable', 'DateEditable', 'SplitMarkdownEditable', 'SelectEditable', 'SelectPersonEditable', 'SelectListEditable', 'SelectListConfirmEditable', 'ModalEditable']);
      markdownEditor = this.editor.getComponentByName('ProjectMain.Text').markdown;
      _.extend(markdownEditor.options, {
        additionalPOSTData: {
          projectId: app.ProjectEditor.model.id,
          projectClass: app.ProjectEditor.model.get('ClassName')
        },
        uploadResponseHandler: function(data) {
          app.updateGalleryCache(data);
          return Backbone.Events.trigger('DocImageAdded', data);
        }
      });
      this.editor.on('editor.open-split-markdown', function() {
        return $('#layout').addClass('open-split-markdown');
      });
      this.editor.on('editor.close-split-markdown', function() {
        return $('#layout').removeClass('open-split-markdown');
      });
      this.editor.on('stateUpdate', function(e) {
        return _this.stateUpdate(e);
      });
      this.editor.on('submit:ProjectMain.Website', function(val) {
        var MType, website;

        if (val.Title && val.Link) {
          MType = JJRestApi.Model('Website');
          website = new MType({
            Title: val.Title,
            Link: val.Link
          });
          _this.model.get('Websites').add(website);
          _this.addWebsiteView(website, true);
          return _this.model.save();
        }
      });
      return this;
    },
    stateUpdate: function(e) {
      var existPost, key, newPost, relKey, text, toPost, val, xhr, _changed, _populateEditors, _ref,
        _this = this;

      console.group('STATE UPDATE');
      console.log('this: %o', this);
      console.log('state: ', e.ProjectMain);
      _changed = false;
      _populateEditors = false;
      _ref = e.ProjectMain;
      for (key in _ref) {
        val = _ref[key];
        if (key === 'Text') {
          text = val.raw ? val.raw : '';
          if (text !== this.model.get('Text')) {
            _changed = true;
            this.model.set('Text', text);
          }
          if (val.images) {
            _.each(val.images.ids, function(id, i) {
              var found;

              found = false;
              _this.model.get('Images').each(function(projImage) {
                if (projImage.id === id) {
                  return found = true;
                }
              });
              if (!found) {
                return DataRetrieval.forDocImage(id).done(function(model) {
                  var existImg, theImg;

                  _this.model.get('Images').add(model);
                  existImg = app.getFromGalleryCache('DocImage', model.id);
                  theImg = [
                    {
                      FilterID: app.ProjectEditor.getFilterID(),
                      UploadedToClass: 'DocImage',
                      id: model.id,
                      url: existImg.url
                    }
                  ];
                  app.updateGalleryCache(theImg);
                  return Backbone.Events.trigger('DocImageAdded', theImg);
                });
              }
            });
          }
        } else if (_.indexOf(['Excursion', 'Exhibition', 'Workshop', 'Project'], key) >= 0) {
          relKey = key === 'Project' && this.model.get('ClassName') === 'Project' ? 'ChildProjects' : key + 's';
          if (this.model.setRelCollByIds(relKey, val)) {
            _changed = true;
          }
        } else if (key === 'Person') {
          val.push(app.CurrentMemberPerson.id);
          if (this.model.setRelCollByIds('Persons', val)) {
            _populateEditors = true;
            _changed = true;
          }
        } else if (key === 'Category') {
          if (this.model.setRelCollByIds('Categories', val)) {
            _changed = true;
          }
        } else if (key === 'BlockedEditors' || key === 'Editors') {
          if (_.difference(val, app.ProjectEditor[key]).length > 0 || _.difference(app.ProjectEditor[key], val).length > 0) {
            app.ProjectEditor[key] = val;
            toPost = {
              className: this.model.get('ClassName'),
              id: this.model.id,
              editors: val
            };
            existPost = app.ProjectEditor.ChangeEditorsPost;
            if (existPost && existPost.readyState !== 4) {
              existPost.abort();
            }
            newPost = app.ProjectEditor.ChangeEditorsPost = $.post(app.Config.ChangeEditorsUrl, toPost);
            newPost.done(function(confirmed) {
              if (_.difference(confirmed, app.ProjectEditor[key]).length > 0 || _.difference(app.ProjectEditor[key], confirmed).length > 0) {
                console.log('change to confirmed');
                app.ProjectEditor[key] = confirmed;
                return _populateEditors = true;
              }
            });
          }
        } else if (key === 'Title' && this.model.get('Title') !== val) {
          this.model.set('Title', val);
          _changed = true;
        }
      }
      console.groupEnd();
      if (_changed) {
        xhr = this.model.rejectAndSave();
        if (xhr) {
          return xhr.done(function(model) {
            if (_populateEditors) {
              return _this.populateEditorsSelectable(_this.model.getEditorsKey(), false);
            }
          });
        }
      }
    },
    populateSelectEditables: function() {
      var sanitize, type, _fn, _i, _j, _len, _len1, _ref, _ref1, _results,
        _this = this;

      sanitize = {
        'Person': function(list) {
          var personId, source, values;

          source = [];
          personId = app.CurrentMemberPerson.id;
          _.each(list, function(person) {
            if (person.ID !== personId) {
              return source.push(person);
            }
          });
          values = _.without(_this.model.get('Persons').getIDArray(), personId);
          return {
            source: source,
            values: values
          };
        },
        'Category': function(list) {
          return {
            source: list,
            values: _this.model.get('Categories').getIDArray()
          };
        }
      };
      _ref = ['Project', 'Excursion', 'Exhibition', 'Workshop'];
      _fn = function(type) {
        return sanitize[type] = function(list) {
          var source, values;

          source = [];
          _.each(list, function(obj) {
            if (!(_this.model.get('ClassName') === type && _this.model.id === obj.ID)) {
              return source.push(obj);
            }
          });
          values = _this.model.idArrayOfRelationToClass(type);
          return {
            source: source,
            values: values
          };
        };
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        _fn(type);
      }
      $.getJSON(app.Config.BasicListUrl).done(function(res) {
        var selectSubClasses, selectables, subClass, _j, _len1;

        if (_.isObject(res)) {
          _this.basicList = res;
        }
        selectSubClasses = ['select-list', 'select-person'];
        selectables = _this.editor.getComponentsByType('select');
        for (_j = 0, _len1 = selectSubClasses.length; _j < _len1; _j++) {
          subClass = selectSubClasses[_j];
          selectables = selectables.concat(_this.editor.getComponentsByType(subClass));
        }
        if (selectables && _this.basicList) {
          return $.each(selectables, function(i, selectable) {
            var name, source_vals;

            name = selectable.getDataName();
            if (_this.basicList[name]) {
              if (sanitize[name]) {
                source_vals = sanitize[name](_this.basicList[name]);
              }
              if (source_vals) {
                selectable.setSource(source_vals.source, true);
                return selectable.setValue(source_vals.values, true);
              }
            }
          });
        }
      });
      _ref1 = ['BlockedEditors', 'Editors'];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        type = _ref1[_j];
        _results.push((function(type) {
          var selectable;

          if (selectable = _this.editor.getComponentByName('ProjectMain.' + type)) {
            return $.getJSON(app.Config.GetEditorsUrl, {
              className: _this.model.get('ClassName'),
              id: _this.model.id
            }).done(function(ids) {
              if (_.isArray(ids)) {
                app.ProjectEditor[type] = ids;
                return _this.populateEditorsSelectable(type);
              }
            });
          }
        })(type));
      }
      return _results;
    },
    populateEditorsSelectable: function(type, silent) {
      var personsIdArray, personsIdList, selectable;

      if (silent == null) {
        silent = true;
      }
      if (selectable = this.editor.getComponentByName('ProjectMain.' + type)) {
        personsIdList = this.model.basicListWithoutCurrentMember('Persons');
        personsIdArray = _.map(personsIdList, function(o) {
          return o.ID;
        });
        selectable.setSource(personsIdList, silent);
        app.ProjectEditor[type] = _.intersection(app.ProjectEditor[type], personsIdArray);
        return selectable.setValue(app.ProjectEditor[type], silent);
      }
    },
    addWebsiteView: function(model, render) {
      var view;

      view = new Website.Views.ListView({
        model: model
      });
      this.insertView('.websites', view);
      if (render) {
        view.render();
      }
      return true;
    },
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    },
    beforeRender: function() {
      var _this = this;

      return this.model.get('Websites').each(function(website) {
        return _this.addWebsiteView(website);
      });
    },
    afterRender: function() {
      this.initEditor();
      return this.populateSelectEditables();
    }
  });
  return ProjectEditor;
});

// Generated by CoffeeScript 1.6.2
define('router',['app', 'modules/Auth', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'modules/PageError', 'modules/Portfolio', 'modules/Calendar', 'modules/About', 'modules/ProjectSearch', 'modules/DataRetrieval', 'modules/NewProject', 'modules/ProjectEditor'], function(app, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About, ProjectSearch, DataRetrieval, NewProject, ProjectEditor) {
  /**
  	 *
  	 *	All the URL routing is done here.
  	 *	Our router also serves as the data retrieving interface. All data getting logic is
  	 *	handled here. 
  	 *
  */

  var Router;

  Router = Backbone.Router.extend({
    /**
    		 * All routes should result in a `done` function of this deferred variable
    		 * @type {$.Deferred}
    */

    mainDeferred: null,
    /**
    		 * All pending ajax requests
    		 *
    */

    pendingAjax: [],
    initialize: function(options) {
      var _this = this;

      return JJRestApi.Events.bind('dfdAjax', function(dfd) {
        return _this.pendingAjax.push(dfd);
      });
    },
    /**
    		 * This method breaks off the current route if another one is called in order to prevent deferreds to trigger
    		 * when another route has already been called
    		 * 
    		 * @return {$.Deferred}
    */

    rejectAndHandle: function(options) {
      var deferred,
        _this = this;

      app.isEditor = false;
      if (app.ProjectEditor) {
        app.ProjectEditor.cleanup();
        app.ProjectEditor = null;
      }
      options = options || {};
      app.handleLinks();
      if (!options.noFadeOut) {
        app.addLoadingClasses();
        app.startSpinner();
      }
      deferred = this.mainDeferred;
      if (deferred) {
        deferred.reject();
      }
      _.each(this.pendingAjax, function(pending) {
        if (pending.readyState !== 4) {
          return pending.abort();
        }
      });
      this.pending = [];
      this.mainDeferred = $.Deferred();
      return this.mainDeferred.done(function() {
        Auth.updateUserWidget();
        _this.mainDeferred = null;
        app.removeLoadingClasses();
        return app.stopSpinner();
      });
    },
    routes: {
      '': 'index',
      'about/': 'showAboutPage',
      'about/:nameSlug/': 'showPersonPage',
      'about/:nameSlug/:uglyHash/': 'showPersonDetailed',
      'portfolio/': 'showPortfolio',
      'portfolio/search/:searchTerm/': 'showPortfolio',
      'portfolio/:uglyHash/': 'showPortfolioDetailed',
      'calendar/': 'showCalendar',
      'calendar/:urlHash/': 'showCalendarDetailed',
      'login/': 'showLoginForm',
      'logout/': 'doLogout',
      'secured/edit/:uglyHash/': 'showEditProjectPage',
      'secured/new/': 'showCreateProjectPage',
      '*url/': 'catchAllRoute'
    },
    index: function(hash) {
      var calDfd, config, mainDfd, projDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      config = app.Config;
      if (app.Cache.WholePortfolio) {
        config.Featured.present.flag = true;
      }
      projDfd = DataRetrieval.forProjectsOverview(config.Featured);
      calDfd = DataRetrieval.forCalendar('upcoming');
      $.when(projDfd, calDfd).done(function() {
        return mainDfd.resolve();
      });
      return mainDfd.done(function() {
        var calendarContainer, layout, modelsArray;

        layout = app.useLayout('index');
        if (!app.Cache.Featured) {
          app.Cache.Featured = _this.getProjectTypeModels({
            IsFeatured: true,
            IsPublished: true
          });
        }
        modelsArray = app.Cache.Featured;
        _this.showPackeryViewForModels(modelsArray, 'portfolio', layout);
        calendarContainer = new Calendar.Views.Container({
          collection: app.Collections.CalendarEntry
        });
        return layout.setViewAndRenderMaybe('#calendar', calendarContainer);
      });
    },
    showAboutPage: function() {
      var groupImageDfd, mainDfd, personsDfd;

      mainDfd = this.rejectAndHandle();
      groupImageDfd = DataRetrieval.forRandomGroupImage();
      personsDfd = DataRetrieval.forPersonsOverview();
      $.when(groupImageDfd, personsDfd).done(function(image) {
        return mainDfd.resolve(image);
      });
      return mainDfd.done(function(image) {
        var coll, layout, persons, view;

        layout = app.useLayout('main', {
          customClass: 'about'
        });
        coll = app.Collections['Person'];
        persons = {
          students: coll.where({
            IsStudent: true
          }),
          alumnis: coll.where({
            IsAlumni: true
          }),
          employees: coll.where({
            IsEmployee: true
          })
        };
        view = new About.Views.PackeryContainer({
          groupImage: image,
          persons: persons
        });
        return layout.setViewAndRenderMaybe('', view);
      });
    },
    showPersonPage: function(nameSlug) {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forDetailedObject('Person', nameSlug).done(function(model) {
        return mainDfd.resolve(model);
      });
      return mainDfd.done(function(model) {
        var layout, template, view;

        if (!model) {
          return _this.fourOhFour();
        }
        layout = app.useLayout('main');
        template = '';
        model.get('Templates').each(function(templ) {
          if (!templ.get('IsDetail')) {
            return template = templ.get('Url');
          }
        });
        view = !template ? new Person.Views.PackeryContainer({
          model: model
        }) : new Person.Views.Custom({
          model: model,
          template: template
        });
        return layout.setViewAndRenderMaybe('', view);
      });
    },
    showPersonDetailed: function(nameSlug, uglyHash) {
      return this.showPortfolioDetailed(uglyHash, nameSlug);
    },
    showPortfolio: function(searchTerm) {
      var justUpdate, mainDfd, seed1, seed2,
        _this = this;

      mainDfd = this.rejectAndHandle();
      seed1 = DataRetrieval.forCategories();
      seed2 = DataRetrieval.forProjectsOverview(app.Config.Portfolio);
      $.when(seed1, seed2).done(function() {
        return mainDfd.resolve();
      });
      if (searchTerm) {
        console.info('searching for: %s', searchTerm);
      }
      justUpdate = app.currentLayoutName === 'portfolio' ? true : false;
      return mainDfd.done(function() {
        var layout, modelsArray, searchedFor;

        if (!justUpdate) {
          layout = app.useLayout('portfolio');
        }
        if (!app.Cache.WholePortfolio) {
          app.Cache.WholePortfolio = _this.getProjectTypeModels({
            IsPortfolio: true,
            IsPublished: true
          });
        }
        modelsArray = app.Cache.WholePortfolio;
        if (!justUpdate) {
          _this.showPackeryViewForModels(modelsArray, 'portfolio', layout);
          layout.insertViewAndRenderMaybe('', new ProjectSearch.View({
            searchTerm: searchTerm
          }));
        }
        searchedFor = searchTerm ? DataRetrieval.filterProjectTypesBySearchTerm(searchTerm) : null;
        console.log('foobar');
        console.log(searchedFor);
        return Backbone.Events.trigger('search', searchedFor);
      });
    },
    showPortfolioDetailed: function(uglyHash, nameSlug) {
      var classType, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      classType = app.resolveClassTypeByHash(uglyHash);
      if (classType) {
        DataRetrieval.forDetailedObject(classType, uglyHash).done(function(model) {
          return mainDfd.resolve(model);
        });
        return mainDfd.done(function(model) {
          var detailView, layout, person, template;

          if (!model || (!model.get('IsPublished')) || (!nameSlug && !model.get('IsPortfolio'))) {
            return _this.fourOhFour();
          }
          layout = app.useLayout('main', {
            customClass: 'detail'
          });
          template = '';
          if (nameSlug) {
            person = model.get('Persons').where({
              UrlSlug: nameSlug
            });
            if (person.length) {
              person[0].get('Templates').each(function(templ) {
                if (templ.get('IsDetail')) {
                  return template = templ.get('Url');
                }
              });
            }
          }
          detailView = !template ? new Portfolio.Views.Detail({
            model: model
          }) : new Person.Views.Custom({
            model: model,
            template: template
          });
          return layout.setViewAndRenderMaybe('', detailView);
        });
      } else {
        mainDfd.done(function() {
          return _this.fourOhFour();
        });
        return mainDfd.resolve();
      }
    },
    showCalendar: function() {
      return console.info('show whole calendar');
    },
    showCalendarDetailed: function(urlHash) {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forDetailedObject('CalendarEntry', urlHash).done(function(model) {
        return mainDfd.resolve(model);
      });
      return mainDfd.done(function(model) {
        var detailView, layout;

        if (!model) {
          return _this.fourOhFour();
        }
        layout = app.useLayout('main', {
          customClass: 'detail'
        });
        detailView = new Calendar.Views.Detail({
          model: model
        });
        return layout.setViewAndRenderMaybe('', detailView);
      });
    },
    showLoginForm: function() {
      var mainDfd;

      mainDfd = this.rejectAndHandle();
      console.info('login form. if logged in, redirect to dashboard');
      Auth.performLoginCheck().done(function() {
        return mainDfd.resolve();
      });
      return mainDfd.done(function() {
        var layout;

        layout = app.useLayout('main');
        return layout.setViewAndRenderMaybe('', new Auth.Views.Login());
      });
    },
    doLogout: function() {
      var dfd, layout;

      if (this.mainDfd) {
        this.mainDfd.reject();
        this.mainDfd = null;
      }
      layout = app.useLayout('main');
      dfd = $.Deferred();
      if (app.CurrentMember) {
        layout.setViewAndRenderMaybe('', new Auth.Views.Logout());
        return dfd = Auth.logout();
      } else {
        return dfd.resolve();
      }
    },
    showCreateProjectPage: function() {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      Auth.performLoginCheck().done(function() {
        if (app.CurrentMember.Email) {
          return mainDfd.resolve();
        } else {
          return _this.fourOhFour();
        }
      });
      return mainDfd.done(function() {
        var layout;

        layout = app.useLayout('main');
        return layout.setViewAndRenderMaybe('', new NewProject.Views.NewProject());
      });
    },
    showEditProjectPage: function(uglyHash) {
      var className, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      app.isEditor = true;
      className = app.resolveClassTypeByHash(uglyHash);
      Auth.canEdit({
        className: className,
        UglyHash: uglyHash
      }).fail(function() {
        return Backbone.history.navigate('/login/', true);
      }).done(function() {
        return DataRetrieval.forDetailedObject(className, uglyHash, true).done(function(model) {
          return mainDfd.resolve(model);
        });
      });
      return mainDfd.fail(function() {
        return Backbone.history.navigate('/login/', true);
      }).done(function(model) {
        var layout;

        layout = app.useLayout('editor');
        app.ProjectEditor = new ProjectEditor.Inst(model);
        return app.ProjectEditor.kickOffRender();
      });
    },
    catchAllRoute: function(url) {
      return console.log('catch all route');
    },
    fourOhFour: function() {
      return this.rejectAndHandle().resolve().done(function() {
        var errorView, layout;

        layout = app.useLayout('main');
        errorView = new PageError.Views.FourOhFour({
          attributes: {
            'data-url': window.location.href
          }
        });
        return layout.setViewAndRenderMaybe('', errorView);
      });
    },
    showPackeryViewForModels: function(modelsArray, linkTo, layout) {
      var packeryContainer;

      packeryContainer = new Portfolio.Views.PackeryContainer({
        collection: modelsArray,
        linkTo: linkTo
      });
      return layout.setViewAndRenderMaybe('#packery-container', packeryContainer);
    },
    getProjectTypeModels: function(where) {
      var projectType, returnArray, _i, _len, _ref;

      returnArray = [];
      _ref = app.Config.ProjectTypes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        projectType = _ref[_i];
        returnArray = returnArray.concat(app.Collections[projectType].where(where));
      }
      return returnArray;
    }
  });
  return Router;
});

// Generated by CoffeeScript 1.6.2
(function($) {
  var resizeEvents, resizeIframes, resizeParentOrChilds;

  resizeEvents = {};
  $(window).on('resize', function() {
    var callback, key, _results;

    _results = [];
    for (key in resizeEvents) {
      callback = resizeEvents[key];
      if (callback && $.isFunction(callback)) {
        _results.push(callback());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });
  $.addOnWindowResize = function(key, callback) {
    if ($.isFunction(callback)) {
      return resizeEvents[key] = callback;
    }
  };
  $.removeOnWindowResize = function(key) {
    if (resizeEvents[key]) {
      return delete resizeEvents[key];
    }
  };
  /*
  	 # @example
  	 #	resizeParentOrChilds([
  	 #		# resize .group-image > img to .group-image.width()
  	 #		{
  	 #			parent: '.group-image'
  	 #			child: 'img'
  	 #			resize: 'child'
  	 #		},
  	 #		# resize .statement to (.statement > p).width()
  	 #		{
  	 #			parent: '.statement'
  	 #			child: 'p'
  	 #			resize: 'parent'
  	 #		}	 
  	 #	]);
  	 #
  */

  resizeParentOrChilds = function(els) {
    if (!els) {
      return;
    }
    return $.each(els, function(i, el) {
      var $child, $parent, childHeight, childWidth, parentHeight, parentWidth;

      $parent = $(el.parent);
      $child = $(el.child, $parent);
      if (!$child.length) {
        return;
      }
      parentWidth = $parent.width();
      parentHeight = $parent.height();
      childWidth = $child.outerWidth(true);
      if ($child.length > 1) {
        childHeight = 0;
        $child.each(function() {
          return childHeight += $(this).outerHeight(true);
        });
      } else {
        childHeight = $child.height();
      }
      if (el.resize === 'child') {
        return $child.height(parentWidth / childWidth * childHeight);
      } else if (el.resize === 'parent') {
        return $parent.height(childHeight);
      }
    });
  };
  resizeIframes = function() {
    var $iframes;

    $iframes = $('iframe', 'article.portfolio-detail');
    if (!$iframes.length) {
      return;
    }
    return $iframes.each(function(i, iframe) {
      var $iframe, attrHeight, attrWidth, scaleFactor, width;

      $iframe = $(iframe);
      attrWidth = $iframe.attr('width');
      attrHeight = $iframe.attr('height');
      if (!attrWidth || !attrHeight) {
        return;
      }
      width = $iframe.width();
      scaleFactor = width / attrWidth;
      return $iframe.height(attrHeight * scaleFactor);
    });
  };
  $(document).on('portfoliodetail:rendered', resizeIframes);
  $.addOnWindowResize('iframe', resizeIframes);
  return $(document).on('about:rendered', function() {
    return resizeParentOrChilds([
      {
        parent: '.group-image',
        child: 'img',
        resize: 'child'
      }, {
        parent: '.statement',
        child: 'p',
        resize: 'parent'
      }
    ]);
  });
})(jQuery);

define("plugins/misc/misc", function(){});

// Generated by CoffeeScript 1.6.2
require(['app', 'router', 'modules/Auth', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'modules/RecycleBin', 'plugins/misc/spin.min', 'plugins/misc/misc'], function(app, Router, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, RecycleBin, Spinner, misc) {
  Backbone.JJRelational.Config.work_with_store = true;
  app.ajaxCount = 0;
  app.Router = new Router();
  app.Layout;
  app.PageInfos = {};
  app.CategoriesFetched;
  app.Collections = {};
  app.Cache = {};
  app.Cache.UserGallery = {
    fetched: {
      Projects: false,
      Person: false
    },
    images: {
      Person: [],
      Projects: []
    }
  };
  app.CurrentMember = {};
  app.CurrentMemberPerson = null;
  app.ProjectEditor = null;
  app.origin = window.location.origin ? window.location.origin : window.location.protocol + '//' + window.location.host;
  console.log(app);
  app.Config = {
    ProjectTypes: ['Project', 'Excursion', 'Workshop', 'Exhibition'],
    StoreHooks: ['Project', 'Excursion', 'Workshop', 'Exhibition', 'Person', 'CalendarEntry', 'DocImage', 'Category'],
    ClassEnc: {
      '0': 'Project',
      '1': 'Excursion',
      '2': 'Exhibition',
      '3': 'Workshop'
    },
    GalleryUrl: 'imagery/gallery/',
    DocImageUrl: 'imagery/images/docimage/',
    PersonImageUrl: 'imagery/images/personimage/',
    BasicListUrl: 'lists/all/',
    GetEditorsUrl: 'api/v2/Editors/getEditors',
    ChangeEditorsUrl: 'api/v2/Editors/changeEditors',
    ChangeCredentialsUrl: 'api/v2/Auth/credentials/',
    UrlSuffixes: {
      about_persons: '?search=IsExternal:0'
    },
    Featured: {
      present: {
        flag: false,
        types: []
      },
      domName: function(className) {
        return 'featured-' + className.toLowerCase();
      },
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsFeatured: 1
        },
        context: 'view.portfolio_init'
      })
    },
    Portfolio: {
      present: {
        flag: false,
        types: []
      },
      domName: function(className) {
        return 'portfolio-' + className.toLowerCase();
      },
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsPortfolio: 1
        },
        context: 'view.portfolio_init'
      })
    },
    Calendar: {
      upcoming: {
        flag: false,
        url: 'api/v2/UpcomingEvents.json'
      },
      whole: {
        flag: false
      }
    },
    Person: {
      about_present: false,
      name: 'about-persons',
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsExternal: 0
        },
        context: 'view.about_init',
        sort: 'Surname'
      })
    },
    Detail: {
      CalendarEntry: {
        where: function(slug) {
          return {
            UrlHash: slug
          };
        },
        domName: 'detailed-calendar-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UrlHash: slug
            },
            limit: 1
          });
        }
      },
      Person: {
        where: function(slug) {
          return {
            UrlSlug: slug
          };
        },
        domName: 'detailed-person-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UrlSlug: slug
            },
            limit: 1
          });
        }
      },
      Project: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-project-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Excursion: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-excursion-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Workshop: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-workshop-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Exhibition: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-exhibition-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      }
    },
    Spinner: {
      lines: 13,
      length: 6,
      width: 2,
      radius: 7,
      corners: 1,
      rotate: 0,
      direction: 1,
      color: '#262626',
      speed: 1,
      trail: 70,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: 'auto',
      left: 'auto'
    }
  };
  app.bindListeners = function() {
    var storeHook, _fn, _i, _len, _ref;

    _ref = app.Config.StoreHooks;
    _fn = function(storeHook) {
      return Backbone.JJStore.Events.bind('added:' + storeHook, function(model) {
        var coll;

        coll = app.Collections[storeHook];
        if (coll) {
          return coll.add(model);
        }
      });
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      storeHook = _ref[_i];
      _fn(storeHook);
    }
    return true;
  };
  app.handleFetchedModels = function(type, data, options) {
    var MType, d, _i, _len, _results;

    options = options || {};
    MType = JJRestApi.Model(type);
    data = _.isArray(data) ? data : [data];
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      _results.push(new MType(d));
    }
    return _results;
  };
  app.handleFetchedModel = function(type, data, options) {
    var MType;

    options = options || {};
    MType = JJRestApi.Model(type);
    return new MType(data);
  };
  app.handleLinks = function() {
    var frag;

    frag = Backbone.history.fragment;
    frag = '/' + frag.substring(0, frag.indexOf('/') + 1);
    return $('#wrapper .badge').find('a').each(function(i, a) {
      var $a;

      $a = $(a);
      $a.removeClass('active');
      if ($a.attr('href') === frag) {
        return $a.addClass('active');
      }
    });
  };
  app.updateGalleryCache = function(dataArray) {
    var addTo,
      _this = this;

    addTo = function(array, obj) {
      return array.push({
        id: obj.id,
        tag: obj.tag,
        url: obj.url
      });
    };
    return _.each(dataArray, function(obj) {
      var className;

      if (className = obj.UploadedToClass) {
        if (className === 'DocImage') {
          _.each(_this.Cache.UserGallery.images.Projects, function(project) {
            if (project.FilterID === obj.FilterID) {
              return addTo(project.Images, obj);
            }
          });
        }
        if (className === 'PersonImage') {
          return addTo(_this.Cache.UserGallery.images.Person, obj);
        }
      } else {

      }
    });
  };
  app.removeFromGalleryCache = function(className, id) {
    var _this = this;

    if (className === 'PersonImage') {
      _.each(this.Cache.UserGallery.images.Person, function(img, i) {
        if (img.id === id) {
          return delete _this.Cache.UserGallery.images.Person[i];
        }
      });
    }
    if (className === 'DocImage') {
      _.each(this.Cache.UserGallery.images.Projects, function(project, i) {
        return _.each(project.Images, function(img, j) {
          if (img.id === id) {
            return delete _this.Cache.UserGallery.images.Projects[i].Images[j];
          }
        });
      });
    }
    return true;
  };
  app.getFromGalleryCache = function(className, id) {
    var found,
      _this = this;

    found = null;
    if (className === 'PersonImage') {
      _.each(this.Cache.UserGallery.images.Person, function(img, i) {
        if (img.id === id) {
          return found = _this.Cache.UserGallery.images.Person[i];
        }
      });
    }
    if (className === 'DocImage') {
      _.each(this.Cache.UserGallery.images.Projects, function(project, i) {
        return _.each(project.Images, function(img, j) {
          if (img.id === id) {
            return found = _this.Cache.UserGallery.images.Projects[i].Images[j];
          }
        });
      });
    }
    return found;
  };
  app.initialLoggedInCheck = function() {
    return JJRestApi.getFromDomOrApi('current-member', {
      noAjax: true
    }).done(function(data) {
      return Auth.handleUserServerResponse(data);
    });
  };
  app.setupSpinner = function() {
    this.$body = $('body');
    this.$main = $('#main');
    return this.spinner = {
      inst: new Spinner(app.Config.Spinner),
      target: document.getElementById('spinner-target')
    };
  };
  app.startSpinner = function() {
    var spinner;

    spinner = this.spinner;
    $(spinner.target).addClass('active');
    return spinner.inst.spin(spinner.target);
  };
  app.stopSpinner = function() {
    var spinner;

    spinner = this.spinner;
    $(spinner.target).removeClass('active');
    return spinner.inst.stop();
  };
  app.addLoadingClasses = function() {
    this.$body.addClass('isLoading');
    return this.$main.addClass('loading');
  };
  app.removeLoadingClasses = function() {
    this.$body.removeClass('isLoading');
    return this.$main.removeClass('loading');
  };
  app.resolveClassTypeByHash = function(uglyHash) {
    return this.Config.ClassEnc[uglyHash.substr(0, 1)];
  };
  app.wholePortfolioJSON = function() {
    var model, tmp, wholePortfolio, _i, _len;

    wholePortfolio = this.Cache.WholePortfolio;
    if (!this.Cache.WholePortfolioJSON) {
      tmp = [];
      for (_i = 0, _len = wholePortfolio.length; _i < _len; _i++) {
        model = wholePortfolio[_i];
        tmp.push(model.toJSON());
      }
      this.Cache.WholePortfolioJSON = tmp;
    }
    return this.Cache.WholePortfolioJSON;
  };
  app.bindListeners();
  Backbone.View.prototype.showMessageAt = function(msg, $appendTo, className) {
    var $el;

    $el = $('<p class="' + className + '">' + msg + '</p>');
    $el.appendTo($appendTo);
    return setTimeout(function() {
      return $el.fadeOut().remove();
    }, 2000);
  };
  Backbone.__pendingSaveReqs = [];
  Backbone.JJRelationalModel.prototype.rejectAndSave = function() {
    var found, xhr,
      _this = this;

    Array.prototype.push.call(arguments, null, {
      success: function(model) {
        return model.trigger('saved');
      }
    });
    xhr = this.save.apply(this, arguments);
    found = false;
    _.each(Backbone.__pendingSaveReqs, function(req) {
      if (req.cid === _this.cid) {
        found = true;
        if (req.xhr && req.xhr.readyState !== 4) {
          req.xhr.abort();
        }
        return req.xhr = xhr;
      }
    });
    if (!found) {
      Backbone.__pendingSaveReqs.push({
        cid: this.cid,
        xhr: xhr
      });
    }
    return xhr;
  };
  Handlebars.registerHelper('stringCompare', function(what1, what2, block) {
    if (what1 === what2) {
      return block(this);
    } else {
      return block.inverse(this);
    }
  });
  Handlebars.registerHelper('stringDiff', function(what1, what2, block) {
    if (what1 !== what2) {
      return block(this);
    } else {
      return block.inverse(this);
    }
  });
  Handlebars.registerHelper('console', function(what) {
    console.log(what);
    return 'logging...';
  });
  $(function() {
    app.$body = $('body');
    jQuery.event.props.push('dataTransfer');
    $(document).bind('ajaxSend', function(event, xhr, settings) {
      if (settings.type !== 'GET') {
        app.ajaxCount++;
        return app.$body.addClass('requesting');
      }
    });
    $(document).bind('ajaxComplete', function(event, xhr, settings) {
      if (settings.type !== 'GET') {
        app.ajaxCount--;
        if (app.ajaxCount === 0) {
          return app.$body.removeClass('requesting');
        }
      }
    });
    $(document).on('dragenter dragover dragleave drop', function(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        $.fireGlobalDragEvent('dragstart', e.target, 'file');
      } else {
        $.fireGlobalDragEvent(e.type, e.target, 'file');
      }
      return e.preventDefault();
    });
    RecycleBin.setup();
    app.setupSpinner();
    JJRestApi.hookSecurityToken();
    return JJRestApi.bootstrapWithStructure().done(function() {
      var buildCollections;

      buildCollections = function(names) {
        var CollClass, name, _i, _len, _results;

        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          CollClass = JJRestApi.Collection(name);
          _results.push(app.Collections[name] = new CollClass());
        }
        return _results;
      };
      buildCollections(app.Config.StoreHooks);
      app.initialLoggedInCheck();
      return Backbone.history.start({
        pushState: true
      });
    });
  });
  return $(document).on('click', 'a:not([data-bypass])', function(evt) {
    var href, protocol;

    href = $(this).attr('href');
    protocol = this.protocol + '//';
    if (href && href.slice(0, protocol.length) !== protocol && href.indexOf('javascript:') !== 0) {
      evt.preventDefault();
      return Backbone.history.navigate(href, true);
    }
  });
});

define("main", function(){});

// Generated by CoffeeScript 1.6.2
require.config({
  deps: ['main'],
  paths: {
    libs: '../assets/js/libs',
    plugins: '../assets/js/plugins',
    responsiveimage: '../../responsive-image/thirdparty/picturefill',
    jquery: '../assets/js/libs/jquery.min',
    underscore: '../assets/js/libs/underscore',
    backbone: '../assets/js/libs/backbone',
    handlebars: '../assets/js/libs/handlebars'
  },
  shim: {
    jquery: {
      exports: '$'
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    handlebars: {
      exports: 'Handlebars'
    },
    'plugins/tooltip/jquery.qtip': ['jquery'],
    'plugins/packery/packery.pkgd': ['jquery'],
    'plugins/packery/packerytest': ['plugins/packery/packery.pkgd', 'plugins/tooltip/jquery.qtip'],
    'modules/JJPackery': ['plugins/packery/packerytest'],
    'responsiveimage/picturefill': ['responsiveimage/external/matchmedia'],
    'plugins/misc/spin.min': ['jquery'],
    'plugins/misc/misc': ['jquery'],
    'plugins/misc/jquery.list': ['jquery'],
    'plugins/editor/jquery.jjfileupload': ['jquery'],
    'plugins/editor/jquery.tabby': ['jquery'],
    'plugins/misc/zebra_datepicker.src': ['jquery'],
    'plugins/editor/jquery.editor-sidebar': ['plugins/misc/misc'],
    'plugins/editor/jquery.jjdropzone': ['plugins/editor/jquery.jjfileupload'],
    'plugins/editor/jquery.jjmarkdown': ['plugins/editor/jquery.jjdropzone', 'plugins/editor/jquery.tabby', 'plugins/editor/jquery.jjfileupload', 'plugins/editor/marked_jjedit'],
    'plugins/editor/jquery.editor-popover': ['plugins/tooltip/jquery.qtip', 'plugins/editor/jquery.jjmarkdown', 'plugins/misc/zebra_datepicker.src'],
    'plugins/backbone.layoutmanager': ['backbone'],
    'plugins/backbone.JJRelational': ['backbone'],
    'plugins/backbone.JJRestApi': ['backbone'],
    'modules/NMMarkdownParser': ['plugins/editor/jquery.jjmarkdown']
  }
});

define("config", function(){});
