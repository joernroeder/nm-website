this["JST"] = this["JST"] || {};

this["JST"]["app/templates/404.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div style="margin-top:300px">\n\t<h2>Your lucky numbers for today: 4, 0, 4</h2>\n\t<p>A billion pages on the web, and you chose: {{url}}.<br/>Try again</p>\n</div>';
}
return __p;
};

this["JST"]["app/templates/about-gravity.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- section class="gravity" -->\n{{#if GroupImage}}\n<section class="gravity-item group-image">\n\t{{#with GroupImage.Urls._768}}\n\t\t<img src="{{Url}}" width="{{Width}}" height="{{Height}}" />\n\t{{/with}}\n</section>\n{{/if}}\n\n<section class="students gravity-item">\n\t<h1>Students</h1>\n\t<ul id="student-list"></ul>\n</section>\n<section class="alumni gravity-item">\n\t<h1>Alumni</h1>\n\t<ul id="alumni-list"></ul>\n</section>\n<section class="statement gravity-item">\n\t<p>The class <cite>New Media</cite> within the course <cite>Visual Communication</cite> at the <cite>School of Art and Design Kassel</cite> walks a fine line between art, design, provocation and study. The main focus lies on the media consumption of society and its perpetual obsession with technological progress, change and transformation; established processes and methods are permanently questioned and modified.</p>\n\t<p>The students in the class <cite>New Media</cite> see themselves as researchers, artists, designers and developers at the same time.</p>\n\t<p>Realising and publicly defending a deeply personal idea means also being able to realise the ideas of others. An outstanding developer of own concepts and ideas will have the ability to implement external ideas and concepts as well.</p>\n\t<p>There is no need to train service providers for an existing industry, but personalities who by discourse acquired skills which are constantly expanded and established – for oneself and others.</p>\n\t<p>By use of the Internet and support of the group these skills are exchanged, discussed and broadened self-educatedly. This provides a topicality and relevance which eludes institutions.</p>\n\t<p>To study “New Media” is to be an author. To learn from oneself, to learn seeing, speaking and thinking. To develop a culture of debate. To work on projects together. To mix media and ideas, to fail and learn from it. The aim is to shape a personal position and methodology.</p>\n</section>\n<!-- /section -->';
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

this["JST"]["app/templates/gravity-list-item.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<!-- article class="gravity-item" -->\n<!--<a href="/{{LinkTo}}/{{UglyHash}}/">\n\t<div>\n\t\t<p>{{ Title }}</p>\n\t\t{{#if PreviewImage}}\n\t\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t\t<div><img src="{{Url}}" width="{{Width}}" height="{{Height}}"/></div>\n\t\t\t{{/with}}\n\t\t{{/if}}\n\t</div>\n</a>-->\n\t{{#if PreviewImage}}\n\t\t<a href="/{{LinkTo}}/{{UglyHash}}/">\n\t\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t\t<img src="{{Url}}" width="{{Width}}" height="{{Height}}"/>\n\t\t\t{{/with}}\n\t\t</a>\n\t{{/if}}\n\t<section role="tooltip-content">\n\t\t<header>\n\t\t\t<h1>\n\t\t\t\t<a href="/{{LinkTo}}/{{UglyHash}}/">{{Title}}</a>\n\t\t\t</h1>\n\t\t\t<p>{{{teaserMeta}}}</p>\n\t\t</header>\n\t\t<p>\n\t\t\t{{{MarkdownedTeaser}}}\n\t\t</p>\n\t\t<a href="/{{LinkTo}}/{{UglyHash}}/" class="btn">Read More</a>\n\t</section>\n<!-- /article -->';
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
__p+='<div id="gravity-container"></div>\n<section id="calendar" class="calendar"></section>';
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
__p+='<div id="gravity-container"></div>';
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
__p+='<!-- article class="portfolio-detail" -->\n<header>\n\t<h1>{{Title}}</h1>\n\t<p>\n\t{{#if IsGroup}}\n\t\tGroup project\n\t{{else}}\n\t\t{{{nameSummary Persons}}}\n\t{{/if}}\n\t</p>\n\t<p>{{niceDate this}}</p>\n\t{{#if Websites}}\n\t\t<p>{{{commaSeparatedWebsites Websites}}}</p>\n\t{{/if}}\n</header>\n<section>\n\t{{{MarkdownedText}}}\n</section>\n<aside>\n\t{{#if combinedProjects}}\n\t\t{{{portfoliolist combinedProjects "Project"}}}\n\t{{/if}}\n\n\t{{#if Exhibitions}}\n\t\t{{{portfoliolist Exhibitions "Exhibition"}}}\n\t{{/if}}\n\t\n\t{{#if Workshops}}\n\t\t{{{portfoliolist Workshops "Workshop"}}}\n\t{{/if}}\n\t\n\t{{#if Excursions}}\n\t\t{{{portfoliolist Excursions "Excursion"}}}\n\t{{/if}}\n</aside>\n\n{{#if Code}}\n<script type="text/javascript">\n\t$(document).one(\'code:kickoff\', function (e) {\n\t\t{{{Code}}}\n\n\t\te.stopImmediatePropagation();\n\t});\n</script>\n{{/if}}\n\n<!-- /article -->';
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
__p+='<!-- article -->\n<header data-editor-scope="\\ProjectMain">\n\t<h1 data-editor-type="inline" data-editor-name="Title" data-editor-placeholder="Title">{{Title}}</h1>\n\t<div class="persons">\n\t\t{{#if CurrentMemberPerson}}\n\t\t\t{{#with CurrentMemberPerson}}\n\t\t\t\t{{FirstName}} {{Surname}}\n\t\t\t{{/with}}\n\t\t{{/if}}\n\t\t<div data-editor-type="select-person" data-editor-name="Person" data-editor-placeholder="Add Collaborators…"></div>\n\t</div>\n\t\n\t<!--<p>\n\t{{#if IsGroup}}\n\t\tGroup project\n\t{{else}}\n\t\t{{{nameSummary Persons}}}\n\t{{/if}}\n\t</p>-->\n\t<p>{{niceDate this}}</p>\n\t{{#if Websites}}\n\t\t<p>{{{commaSeparatedWebsites Websites}}}</p>\n\t{{/if}}\n</header>\n<section data-editor-scope="\\ProjectMain">\n\n\t<div data-editor-type="markdown-split" data-editor-name="Text" data-editor-options=\'{"customParsers": {"images": "ImageMarkdownParser", "embed": "OEmbedMarkdownParser"}}\'>{{Text}}</div>\n\n</section>\n<aside data-editor-scope="\\ProjectMain">\n\t<h1>Projects</h1>\n\t<ul data-editor-type="select-list" data-editor-name="Project" data-editor-placeholder="Add…"></ul>\n\n\t{{#stringDiff "Exhibition" ClassName}}\n\t\t<h1>Exhibitions</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Exhibition" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n\t{{#stringDiff "Workshop" ClassName}}\n\t\t<h1>Workshops</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Workshop" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n\t{{#stringDiff "Excursion" ClassName}}\n\t\t<h1>Excursions</h1>\n\t\t<ul data-editor-type="select-list" data-editor-name="Excursion" data-editor-placeholder="Add…"></ul>\n\t{{/stringDiff}}\n\n</aside>\n\n<!-- /article -->';
}
return __p;
};

this["JST"]["app/templates/security/editor-project-preview.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="preview-image {{#if PreviewImage}}filled{{/if}}">\n\t{{#if PreviewImage}}\n\t\t{{#with PreviewImage.Urls._320}}\n\t\t\t<img src="{{Url}}" />\n\t\t{{/with}}\n\t{{/if}}\n</div>\n<div class="meta" data-editor-scope="\\ProjectPreview">\n\t<header>\n\t\t<h1 data-editor-type="inline" data-editor-name="Title" data-editor-placeholder="Title">{{Title}}</h1>\n\t\t{{#stringCompare "Project" ClassName}}\n\t\t\t<p><span data-editor-type="date" data-editor-name="Date" data-editor-options=\'{ "contentFormat": "M Y"}\'>{{niceDate this}}</span></p>\n\t\t{{else}}\n\t\t\t<p>\n\t\t\t\t<span data-editor-type="date" data-editor-name="StartDate" data-editor-options=\'{"format": "d. M Y"}\'>{{StartDate}}</span> -\n\t\t\t\t<span data-editor-type="date" data-editor-name="EndDate" data-editor-options=\'{"format": "d. M Y"}\'>{{EndDate}}</span>\n\t\t\t</p>\n\t\t\t<p class="nice-date">{{niceDate this}}</p>\n\t\t{{/stringCompare}}\n\t</header>\n\t<p data-editor-type="markdown" data-editor-name="TeaserText" data-editor-placeholder="Teaser" data-editor-options=\'{"customParsers": {}, "position": {"my": "right top", "at": "right bottom", "adjust": {"x": 0, "y": 10}}, "repositionOnChange": true, "charlimit": 156}\'>{{TeaserText}}</p>\n</div>';
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
__p+='<header class="editor-header hideable">\n\t<div class="img" id="current-person-image">\n\t\t{{#if CurrentImage}}<img src="{{CurrentImage.url}}">{{/if}}\n\t</div>\n\t<hgroup>\n\t\t{{#if Person}}<h1>{{#with Person}}<a href="#">{{FirstName}} {{Surname}}</a>{{/with}}</h1>{{/if}}\n\n\t\t{{#if Member}}<p class="email">{{Member.Email}}</p>{{/if}}\n\t</hgroup>\n</header>\n<section class="editor-sidebar-content scrollbox">\n\t<header>\n\t\t<h2>Person Images</h2>\n\t</header>\n\t<section>\n\t\t<ul class="image-list">\n\t\t</ul>\n\t</section>\n\n\t<header>\n\t\t<h2>Projects</h2>\n\t</header>\n\t<section>\n\t\t<ul class="project-list">\n\t\t</ul>\n\t</section>\n\n\t<header>\n\t\t<h2>Personal Information</h2>\n\t</header>\n\t<section class="meta-info" data-editor-scope="\\CurrentPerson">\n\t\t<div id="bio">\n\t\t\t<h3>Bio</h3>\n\t\t\t<div data-editor-type="markdown" data-editor-name="Bio" data-editor-placeholder="your shitty life!" data-editor-options=\'{"customParsers":{}, "position":{"my": "right top", "at": "left top", "adjust": {"x": -24, "y": -15}}}\'>{{Person.Bio}}</div>\n\t\t</div>\n\t\t<div>\n\t\t\t<h3>Phone</h3>\n\t\t\t<p data-editor-type="inline" data-editor-placeholder="Phone" data-editor-name="Phone">{{Person.Phone}}</p>\n\t\t</div>\n\t\t<div>\n\t\t\t<h3>Email</h3>\n\t\t\t<p data-editor-type="inline" data-editor-email="Email" data-editor-name="Email">{{Person.Email}}</p>\n\t\t</div>\n\t</section>\n\n\t<header>\n\t\t<h2>Settings</h2>\n\t</header>\n\t<section>\n\t\t<form class="user-settings">\n\t\t\t<input name="email" type="email" placeholder="Email" value="{{Member.Email}}" required>\n\t\t\t<input name="password" type="password" placeholder="Password">\n\t\t\t<input name="passwordconfirmed" type="password" placeholder="Confirm Password">\n\n\t\t\t<button class="btn" type="submit">Update Settings</button>\n\t\t</form>\n\t</section>\n</section>';
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