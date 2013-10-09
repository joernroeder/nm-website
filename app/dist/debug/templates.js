this["JST"] = this["JST"] || {};

this["JST"]["app/templates/404.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div style=\"margin-top:300px\">\n	<h2>Your lucky numbers for today: 4, 0, 4</h2>\n	<p>A billion pages on the web, and you chose: ";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ".<br/>Try again</p>\n</div>";
  return buffer;
  });

this["JST"]["app/templates/about-packery.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n		<section class=\"packery-item group-image\">\n			<div>\n				";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.GroupImage),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._768), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n			<div>\n		</section>\n		";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n					<img src=\"";
  if (stack1 = helpers.Url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=\"";
  if (stack1 = helpers.Width) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Width; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" height=\"";
  if (stack1 = helpers.Height) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Height; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n				";
  return buffer;
  }

  buffer += "<!-- section class=\"packery-wrapper\" -->\n<div class=\"packery-test about\">\n	<div class=\"packery\">\n\n		<!-- left top -->\n		<div class=\"stamp corner left top\"></div>\n		<div class=\"stamp top\"></div>\n		<div class=\"stamp left\"></div>\n\n		<!-- top center -->\n		<div class=\"stamp top center\"></div>\n\n		<!-- right top -->\n		<!--<div class=\"stamp corner right top\"></div>\n		<div class=\"stamp top right\"></div>\n		<div class=\"stamp right\"></div>-->\n\n		<!-- left center -->\n		<!--<div class=\"stamp left center\"></div>-->\n\n		<!-- left bottom -->\n		<!--<div class=\"stamp corner left bottom\"></div>\n		<div class=\"stamp bottom\"></div>\n		<div class=\"stamp left bottom\"></div>\n\n		<div class=\"stamp corner right bottom\"></div>\n		<div class=\"stamp bottom right-left\"></div>\n		<div class=\"stamp right bottom\"></div>-->	\n\n		";
  stack1 = helpers['if'].call(depth0, depth0.GroupImage, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n		<section class=\"statement packery-item\">\n			<div>\n				<p>The class <cite>New Media</cite> within the course <cite>Visual Communication</cite> at the <cite>School of Art and Design Kassel</cite> walks a fine line between art, design, provocation and study. The main focus lies on the media consumption of society and its perpetual obsession with technological progress, change and transformation; established processes and methods are permanently questioned and modified.</p>\n				<p>The students in the class <cite>New Media</cite> see themselves as researchers, artists, designers and developers at the same time.</p>\n				<p>Realising and publicly defending a deeply personal idea means also being able to realise the ideas of others. An outstanding developer of own concepts and ideas will have the ability to implement external ideas and concepts as well.</p>\n				<p>There is no need to train service providers for an existing industry, but personalities who by discourse acquired skills which are constantly expanded and established – for oneself and others.</p>\n				<p>By use of the Internet and support of the group these skills are exchanged, discussed and broadened self-educatedly. This provides a topicality and relevance which eludes institutions.</p>\n				<p>To study “New Media” is to be an author. To learn from oneself, to learn seeing, speaking and thinking. To develop a culture of debate. To work on projects together. To mix media and ideas, to fail and learn from it. The aim is to shape a personal position and methodology.</p>\n			</div>\n		</section>\n\n		<section class=\"students packery-item\">\n			<div>\n				<h1>Students</h1>\n				<ul id=\"student-list\"></ul>\n			</div>\n		</section>\n		<section class=\"alumni packery-item\">\n			<div>\n				<h1>Alumni</h1>\n				<ul id=\"alumni-list\"></ul>\n			</div>\n		</section>\n	</div>\n</div>\n\n<!-- /section -->";
  return buffer;
  });

this["JST"]["app/templates/calendar-container.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n	<h2>Calendar</h2>\n	<ul id=\"calendar-list\">\n\n	</ul>\n";
  }

  buffer += "<!-- div -->\n";
  stack1 = helpers['if'].call(depth0, depth0.HasItems, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<!-- /div -->";
  return buffer;
  });

this["JST"]["app/templates/calendar-detail.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, helperMissing=helpers.helperMissing, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		<p>";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.commaSeparatedWebsites || depth0.commaSeparatedWebsites),stack1 ? stack1.call(depth0, depth0.Websites, options) : helperMissing.call(depth0, "commaSeparatedWebsites", depth0.Websites, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</p>\n	";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.combinedProjects, "Project", options) : helperMissing.call(depth0, "portfoliolist", depth0.combinedProjects, "Project", options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Exhibitions, "Exhibition", options) : helperMissing.call(depth0, "portfoliolist", depth0.Exhibitions, "Exhibition", options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Workshops, "Workshop", options) : helperMissing.call(depth0, "portfoliolist", depth0.Workshops, "Workshop", options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Excursions, "Excursion", options) : helperMissing.call(depth0, "portfoliolist", depth0.Excursions, "Excursion", options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

  buffer += "<!-- article class=\"portfolio-detail\" -->\n<header>\n	<h1>";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n	<p>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.niceDate || depth0.niceDate),stack1 ? stack1.call(depth0, depth0, options) : helperMissing.call(depth0, "niceDate", depth0, options)))
    + "</p>\n	";
  stack2 = helpers['if'].call(depth0, depth0.Websites, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</header>\n<section>\n	";
  if (stack2 = helpers.MarkdownedText) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.MarkdownedText; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</section>\n<aside>\n	";
  stack2 = helpers['if'].call(depth0, depth0.combinedProjects, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  stack2 = helpers['if'].call(depth0, depth0.Exhibitions, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	\n	";
  stack2 = helpers['if'].call(depth0, depth0.Workshops, {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	\n	";
  stack2 = helpers['if'].call(depth0, depth0.Excursions, {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</aside>\n<!-- /article -->";
  return buffer;
  });

this["JST"]["app/templates/calendar-list-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- li class=\"upcoming-calendar-list-item\" -->\n<a href=\"/calendar/";
  if (stack1 = helpers.UrlHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UrlHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">\n	<time datetime=\"\">";
  if (stack1 = helpers.DateRangeNice) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.DateRangeNice; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</time>\n	";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n</a>\n<!-- /li -->";
  return buffer;
  });

this["JST"]["app/templates/employee-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n			";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.Image),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.programWithDepth(2, program2, data, depth0),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		";
  return buffer;
  }
function program2(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n				<a href=\"/about/"
    + escapeExpression(((stack1 = depth1.UrlSlug),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/\"><img src=\"";
  if (stack2 = helpers.Url) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.Url; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" /></a>\n			";
  return buffer;
  }

  buffer += "<!-- section class=\"person gravity-item\" -->\n<div>\n	<div class=\"img\">\n		";
  stack1 = helpers['if'].call(depth0, depth0.Image, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</div>\n	<h1><a href=\"/about/";
  if (stack1 = helpers.UrlSlug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UrlSlug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">";
  if (stack1 = helpers.FirstName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FirstName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.Surname) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Surname; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></h1>\n	<p>";
  if (stack1 = helpers.JobTitle) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.JobTitle; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n</div>\n<!-- /section -->";
  return buffer;
  });

this["JST"]["app/templates/layouts/auth.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "";


  return buffer;
  });

this["JST"]["app/templates/layouts/editor.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<section id=\"project-editor\"></section>";
  });

this["JST"]["app/templates/layouts/index.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div id=\"packery-container\"></div>\n<section id=\"calendar\" class=\"calendar\"></section>";
  });

this["JST"]["app/templates/layouts/main.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "";


  return buffer;
  });

this["JST"]["app/templates/layouts/portfolio.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div id=\"packery-container\"></div>";
  });

this["JST"]["app/templates/packery-container.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<!-- section class=\"packery-wrapper\" -->\n<div class=\"packery-test\">\n	<div class=\"packery\">\n\n		<!-- left top -->\n		<div class=\"stamp corner left top\"></div>\n		<div class=\"stamp top\"></div>\n		<div class=\"stamp left\"></div>\n\n		<!-- top center -->\n		<div class=\"stamp top center\"></div>\n\n		<!-- right top -->\n		<div class=\"stamp corner right top\"></div>\n		<div class=\"stamp top right\"></div>\n		<div class=\"stamp right\"></div>\n\n		<!-- left center -->\n		<div class=\"stamp left center\"></div>\n\n		<!-- left bottom -->\n		<div class=\"stamp corner left bottom\"></div>\n		<div class=\"stamp bottom\"></div>\n		<div class=\"stamp left bottom\"></div>\n\n		<div class=\"stamp corner right bottom\"></div>\n		<div class=\"stamp bottom right-left\"></div>\n		<div class=\"stamp right bottom\"></div>\n		\n	</div>\n</div>\n<!-- /section -->";
  });

this["JST"]["app/templates/packery-list-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n			";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.PreviewImage),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<div><img src=\"";
  if (stack1 = helpers.Url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=\"";
  if (stack1 = helpers.Width) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Width; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" height=\"";
  if (stack1 = helpers.Height) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Height; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/></div>\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n		<a href=\"/";
  if (stack1 = helpers.LinkTo) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.LinkTo; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/";
  if (stack1 = helpers.UglyHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UglyHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">\n			";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.PreviewImage),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		</a>\n	";
  return buffer;
  }
function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<img src=\"";
  if (stack1 = helpers.Url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=\"";
  if (stack1 = helpers.Width) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Width; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" height=\"";
  if (stack1 = helpers.Height) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Height; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n			";
  return buffer;
  }

  buffer += "<!-- article class=\"gravity-item\" -->\n<div>\n<!--<a href=\"/";
  if (stack1 = helpers.LinkTo) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.LinkTo; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/";
  if (stack1 = helpers.UglyHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UglyHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">\n	<div>\n		<p>";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n		";
  stack1 = helpers['if'].call(depth0, depth0.PreviewImage, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</div>\n</a>-->\n	";
  stack1 = helpers['if'].call(depth0, depth0.PreviewImage, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	<section role=\"tooltip-content\">\n		<header>\n			<h1>\n				<a href=\"/";
  if (stack1 = helpers.LinkTo) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.LinkTo; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/";
  if (stack1 = helpers.UglyHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UglyHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n			</h1>\n			<p>";
  if (stack1 = helpers.teaserMeta) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.teaserMeta; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n		</header>\n		<p>\n			";
  if (stack1 = helpers.MarkdownedTeaser) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.MarkdownedTeaser; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</p>\n		<a href=\"/";
  if (stack1 = helpers.LinkTo) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.LinkTo; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/";
  if (stack1 = helpers.UglyHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UglyHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\" class=\"btn\">Read More</a>\n	</section>\n<div>\n<!-- /article -->";
  return buffer;
  });

this["JST"]["app/templates/person-info-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n			";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.Image),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<img src=\"";
  if (stack1 = helpers.Url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=\"";
  if (stack1 = helpers.Width) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Width; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" height=\"";
  if (stack1 = helpers.Height) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Height; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"\">\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<p><a href=\"mailto:";
  if (stack1 = helpers.Email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.Email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></p>\n			";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<p>";
  if (stack1 = helpers.Phone) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Phone; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " <a class=\"vcf-download\" href=\"#\">(Download vcf)</a></p>\n			";
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<ul class=\"websites\">\n				";
  stack1 = helpers.each.call(depth0, depth0.Websites, {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n		";
  return buffer;
  }
function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n					<li>";
  if (stack1 = helpers.website) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.website; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</li>\n				";
  return buffer;
  }

  buffer += "<!-- article class=\"person-info\" -->\n<div>\n	<section>\n		";
  stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = depth0.Image),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</section>\n\n	<section>\n		<header>\n			<p>";
  if (stack2 = helpers.personMeta) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.personMeta; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</p>\n			<h1>";
  if (stack2 = helpers.FirstName) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.FirstName; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " ";
  if (stack2 = helpers.Surname) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.Surname; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h1>\n			";
  stack2 = helpers['if'].call(depth0, depth0.Email, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n			";
  stack2 = helpers['if'].call(depth0, depth0.Phone, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		</header>\n\n		";
  if (stack2 = helpers.MarkdownedBio) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.MarkdownedBio; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n		";
  stack2 = helpers['if'].call(depth0, depth0.Websites, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</section>\n</div>\n<!-- /article -->";
  return buffer;
  });

this["JST"]["app/templates/person-list-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- li -->\n<a href=\"/about/";
  if (stack1 = helpers.UrlSlug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UrlSlug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">\n	";
  if (stack1 = helpers.FirstName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FirstName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.Surname) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Surname; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n</a>\n<!-- /li -->";
  return buffer;
  });

this["JST"]["app/templates/portfolio-detail.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", helperMissing=helpers.helperMissing, self=this, escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  if (stack1 = helpers.SpaceAndLocation) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.SpaceAndLocation; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		<p>";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.commaSeparatedWebsites || depth0.commaSeparatedWebsites),stack1 ? stack1.call(depth0, depth0.Websites, options) : helperMissing.call(depth0, "commaSeparatedWebsites", depth0.Websites, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</p>\n	";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Exhibitions, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Workshops, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Excursions, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.combinedProjects, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }
function program6(depth0,data) {
  
  var stack1, stack2, options;
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Exhibitions, "Exhibition", options) : helperMissing.call(depth0, "portfoliolist", depth0.Exhibitions, "Exhibition", options));
  if(stack2 || stack2 === 0) { return stack2; }
  else { return ''; }
  }

function program8(depth0,data) {
  
  var stack1, stack2, options;
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Workshops, "Workshop", options) : helperMissing.call(depth0, "portfoliolist", depth0.Workshops, "Workshop", options));
  if(stack2 || stack2 === 0) { return stack2; }
  else { return ''; }
  }

function program10(depth0,data) {
  
  var stack1, stack2, options;
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.Excursions, "Excursion", options) : helperMissing.call(depth0, "portfoliolist", depth0.Excursions, "Excursion", options));
  if(stack2 || stack2 === 0) { return stack2; }
  else { return ''; }
  }

function program12(depth0,data) {
  
  var stack1, stack2, options;
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.portfoliolist || depth0.portfoliolist),stack1 ? stack1.call(depth0, depth0.combinedProjects, "Project", options) : helperMissing.call(depth0, "portfoliolist", depth0.combinedProjects, "Project", options));
  if(stack2 || stack2 === 0) { return stack2; }
  else { return ''; }
  }

function program14(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.combinedProjects, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Workshops, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Excursions, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }

function program16(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Exhibitions, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Workshops, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.combinedProjects, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }

function program18(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Exhibitions, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.Excursions, {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  stack1 = helpers['if'].call(depth0, depth0.combinedProjects, {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }

function program20(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<h4>Categories</h4>\n		<ul>\n		";
  stack1 = helpers.each.call(depth0, depth0.Categories, {hash:{},inverse:self.noop,fn:self.program(21, program21, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</ul>\n	";
  return buffer;
  }
function program21(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<li><a href=\"/portfolio/search/Category:";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n		";
  return buffer;
  }

function program23(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.personlist || depth0.personlist),stack1 ? stack1.call(depth0, depth0.Persons, options) : helperMissing.call(depth0, "personlist", depth0.Persons, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

function program25(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<script type=\"text/javascript\">\n	$(document).one('code:kickoff', function (e) {\n		";
  if (stack1 = helpers.Code) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Code; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n		e.stopImmediatePropagation();\n	});\n</script>\n";
  return buffer;
  }

  buffer += "<!-- article class=\"portfolio-detail\" -->\n<header>\n	<h1>";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n	<p>\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.nameSummary || depth0.nameSummary),stack1 ? stack1.call(depth0, depth0.Persons, options) : helperMissing.call(depth0, "nameSummary", depth0.Persons, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</p>\n	<p>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.niceDate || depth0.niceDate),stack1 ? stack1.call(depth0, depth0, true, options) : helperMissing.call(depth0, "niceDate", depth0, true, options)))
    + "</p>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.stringDiff || depth0.stringDiff),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringDiff", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  stack2 = helpers['if'].call(depth0, depth0.Websites, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</header>\n<section>\n	";
  if (stack2 = helpers.MarkdownedText) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.MarkdownedText; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</section>\n<aside>\n	\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Exhibition", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Exhibition", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Excursion", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Excursion", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Workshop", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Workshop", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	<hr/>\n\n	";
  stack2 = helpers['if'].call(depth0, depth0.Categories, {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  stack2 = helpers['if'].call(depth0, depth0.IsGroup, {hash:{},inverse:self.noop,fn:self.program(23, program23, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</aside>\n\n<!--";
  stack2 = helpers['if'].call(depth0, depth0.Code, {hash:{},inverse:self.noop,fn:self.program(25, program25, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "-->\n\n<!-- /article -->";
  return buffer;
  });

this["JST"]["app/templates/searchbar.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<ul>\n			";
  stack1 = helpers.each.call(depth0, depth0.Categories, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</ul>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<li><a href=\"#\" data-title=\"";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-id=\"";
  if (stack1 = helpers.ID) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.ID; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n			";
  return buffer;
  }

  buffer += "<!-- div id=\"projectsearch\" -->\n<section class=\"category-filter active\">\n	";
  stack1 = helpers['if'].call(depth0, depth0.Categories, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	<a href=\"#\" data-bypass class=\"btn\">Switch to Search</a>	\n</section>\n<section class=\"search\">\n  <div class=\"visualsearch\"></div>\n  <a href=\"#\" data-bypass class=\"btn\">Switch to Filters</a>\n</section>\n<!-- /div -->";
  return buffer;
  });

this["JST"]["app/templates/security/create-project.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<ul class=\"project-type-list\">\n	<li>\n		<a href=\"#\" data-type=\"Excursion\" class=\"excursion\">Excursion</a>\n	</li>\n\n	<li>\n		<a href=\"#\" data-type=\"Exhibition\" class=\"exhibition\">Exhibition</a>\n	</li>\n\n	<li>\n		<a href=\"#\" data-type=\"Project\" class=\"project\">Project</a>\n	</li>\n\n	<li>\n		<a href=\"#\" data-type=\"Workshop\" class=\"workshop\">Workshop</a>\n	</li>\n</ul>\n\n<form class=\"create-project\">\n	<input type=\"text\" name=\"title\" placeholder=\"Title\" autocomplete=\"off\" />\n	<button class=\"btn\" type=\"submit\">Create</button>\n	<div class=\"form-error\">Foo bar!</div>\n</form>\n";
  });

this["JST"]["app/templates/security/editor-project-container.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<section class=\"editor-project-preview overview active\">\n</section>\n\n<section class=\"editor-project-main detail\">\n</section>\n";
  });

this["JST"]["app/templates/security/editor-project-main.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			";
  stack1 = helpers['with'].call(depth0, depth0.CurrentMemberPerson, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				";
  if (stack1 = helpers.FirstName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FirstName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.Surname) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Surname; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  
  return "\n		Group project\n	";
  }

function program6(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n		";
  options = {hash:{},data:data};
  stack2 = ((stack1 = helpers.nameSummary || depth0.nameSummary),stack1 ? stack1.call(depth0, depth0.Persons, options) : helperMissing.call(depth0, "nameSummary", depth0.Persons, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }

function program8(depth0,data) {
  
  
  return "\n		<h1>Categories</h1>\n		<ul data-editor-type=\"select-list\" data-editor-name=\"Category\" data-editor-placeholder=\"Add...\"></ul>\n	";
  }

function program10(depth0,data) {
  
  
  return "\n		<h1>Exhibitions</h1>\n		<ul data-editor-type=\"select-list\" data-editor-name=\"Exhibition\" data-editor-placeholder=\"Add…\"></ul>\n	";
  }

function program12(depth0,data) {
  
  
  return "\n		<h1>Workshops</h1>\n		<ul data-editor-type=\"select-list\" data-editor-name=\"Workshop\" data-editor-placeholder=\"Add…\"></ul>\n	";
  }

function program14(depth0,data) {
  
  
  return "\n		<h1>Excursions</h1>\n		<ul data-editor-type=\"select-list\" data-editor-name=\"Excursion\" data-editor-placeholder=\"Add…\"></ul>\n	";
  }

function program16(depth0,data) {
  
  
  return "\n		<h1>Blocked editors</h1>\n		<ul data-editor-type=\"select-list-confirm\" data-editor-name=\"BlockedEditors\" data-editor-placeholder=\"Add…\" data-editor-confirm=\"Blocked Editors confirm text\"></ul>\n	";
  }

function program18(depth0,data) {
  
  
  return "\n		<h1>Additional editors</h1>\n		<ul data-editor-type=\"select-list\" data-editor-name=\"Editors\" data-editor-placeholder=\"Add…\" data-editor-confirm=\"Editors confirm text\"></ul>\n	";
  }

  buffer += "<!-- article -->\n<header data-editor-scope=\"\\ProjectMain\">\n	<h1 data-editor-type=\"inline\" data-editor-name=\"Title\" data-editor-placeholder=\"Title\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n	<div class=\"persons\">\n		";
  stack1 = helpers['if'].call(depth0, depth0.CurrentMemberPerson, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		<div data-editor-type=\"select-person\" data-editor-name=\"Person\" data-editor-placeholder=\"Add Collaborators…\"></div>\n	</div>\n	\n	<!--<p>\n	";
  stack1 = helpers['if'].call(depth0, depth0.IsGroup, {hash:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</p>-->\n</header>\n<section data-editor-scope=\"\\ProjectMain\">\n\n	<div data-editor-type=\"markdown-split\" data-editor-name=\"Text\" data-editor-options='{\"customParsers\": {\"images\": \"ImageMarkdownParser\", \"embed\": \"OEmbedMarkdownParser\"}}'>";
  if (stack1 = helpers.Text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Text; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\n\n</section>\n<aside data-editor-scope=\"\\ProjectMain\">\n	<div>\n		<h3>Websites</h3>\n			<ul class=\"websites\">\n			</ul>\n			<button data-editor-type=\"modal\" data-editor-name=\"Website\" data-editor-fields='{\"Title\": {\"type\": \"text\"}, \"Link\": {\"type\": \"text\"}}' class=\"btn\" data-editor-placeholder=\"Add Website\">Add Website</button>\n	</div>\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	<h1>Projects</h1>\n	<ul data-editor-type=\"select-list\" data-editor-name=\"Project\" data-editor-placeholder=\"Add…\"></ul>\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data};
  stack2 = ((stack1 = helpers.stringDiff || depth0.stringDiff),stack1 ? stack1.call(depth0, "Exhibition", depth0.ClassName, options) : helperMissing.call(depth0, "stringDiff", "Exhibition", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data};
  stack2 = ((stack1 = helpers.stringDiff || depth0.stringDiff),stack1 ? stack1.call(depth0, "Workshop", depth0.ClassName, options) : helperMissing.call(depth0, "stringDiff", "Workshop", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data};
  stack2 = ((stack1 = helpers.stringDiff || depth0.stringDiff),stack1 ? stack1.call(depth0, "Excursion", depth0.ClassName, options) : helperMissing.call(depth0, "stringDiff", "Excursion", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n	<hr />\n\n	";
  options = {hash:{},inverse:self.program(18, program18, data),fn:self.program(16, program16, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n</aside>\n\n<!-- /article -->";
  return buffer;
  });

this["JST"]["app/templates/security/editor-project-preview.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  return "filled";
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n		";
  stack2 = helpers['with'].call(depth0, ((stack1 = ((stack1 = depth0.PreviewImage),stack1 == null || stack1 === false ? stack1 : stack1.Urls)),stack1 == null || stack1 === false ? stack1 : stack1._320), {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	";
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<img src=\"";
  if (stack1 = helpers.Url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n		";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n			<p><span data-editor-type=\"date\" data-editor-name=\"Date\" data-editor-options='{ \"contentFormat\": \"M Y\"}'>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.niceDate || depth0.niceDate),stack1 ? stack1.call(depth0, depth0, options) : helperMissing.call(depth0, "niceDate", depth0, options)))
    + "</span></p>\n		";
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n			<p>\n				<span data-editor-type=\"date\" data-editor-name=\"StartDate\" data-editor-options='{\"format\": \"d. M Y\"}'>";
  if (stack1 = helpers.StartDate) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.StartDate; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span> -\n				<span data-editor-type=\"date\" data-editor-name=\"EndDate\" data-editor-options='{\"format\": \"d. M Y\"}'>";
  if (stack1 = helpers.EndDate) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.EndDate; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n			</p>\n			<p class=\"nice-date\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.niceDate || depth0.niceDate),stack1 ? stack1.call(depth0, depth0, options) : helperMissing.call(depth0, "niceDate", depth0, options)))
    + "</p>\n		";
  return buffer;
  }

function program10(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<p><span data-editor-type=\"inline\" data-editor-name=\"Space\" data-editor-placeholder=\"Space\">";
  if (stack1 = helpers.Space) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Space; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></p>\n			<p><span data-editor-type=\"inline\" data-editor-name=\"Location\" data-editor-placeholder=\"Location\">";
  if (stack1 = helpers.Location) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Location; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></p>\n		";
  return buffer;
  }

  buffer += "<div class=\"preview-image ";
  stack1 = helpers['if'].call(depth0, depth0.PreviewImage, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n	";
  stack1 = helpers['if'].call(depth0, depth0.PreviewImage, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n<div class=\"meta\" data-editor-scope=\"\\ProjectPreview\">\n	<header>\n		<h1 data-editor-type=\"inline\" data-editor-name=\"Title\" data-editor-placeholder=\"Title\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h1>\n		";
  options = {hash:{},inverse:self.program(8, program8, data),fn:self.program(6, program6, data),data:data};
  stack2 = ((stack1 = helpers.stringCompare || depth0.stringCompare),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringCompare", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data};
  stack2 = ((stack1 = helpers.stringDiff || depth0.stringDiff),stack1 ? stack1.call(depth0, "Project", depth0.ClassName, options) : helperMissing.call(depth0, "stringDiff", "Project", depth0.ClassName, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</header>\n	<p data-editor-type=\"markdown\" data-editor-name=\"TeaserText\" data-editor-placeholder=\"Teaser\" data-editor-options='{\"customParsers\": {}, \"position\": {\"my\": \"right top\", \"at\": \"right bottom\", \"adjust\": {\"x\": 0, \"y\": 10}}, \"repositionOnChange\": true, \"charlimit\": 156}'>";
  if (stack2 = helpers.TeaserText) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.TeaserText; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</p>\n</div>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar-gallery-image.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" data-bypass=\"\" data-md-tag=\"\\[img ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\\]\" data-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><img src=\"";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"\" data-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-md-tag=\"\\[img ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\\]\"></a>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar-gallery.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<select class=\"filter\">\n			<option value=\"\">--- Choose Project ---</option>\n			";
  stack1 = helpers.each.call(depth0, depth0.Projects, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</select>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<option value=\"";
  if (stack1 = helpers.FilterID) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FilterID; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</option>\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		";
  stack1 = helpers.each.call(depth0, depth0.Projects, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  return buffer;
  }
function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<header>\n				<h2>";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n			</header>\n			<section data-filter-id=\"";
  if (stack1 = helpers.FilterID) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FilterID; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n				<ul class=\"image-list\"></ul>\n					"
    + "\n			</section>\n		";
  return buffer;
  }

  buffer += "<div id=\"uploadzone\"></div>\n<header class=\"editor-header\">\n	<h1>Images</h1>\n	";
  stack1 = helpers['if'].call(depth0, depth0.Projects, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</header>\n<section class=\"editor-sidebar-content scrollbox\">\n	";
  stack1 = helpers['if'].call(depth0, depth0.Projects, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</section>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar-person-image.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" data-bypass data-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><img src=\"";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"\"></a>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar-project-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"/secured/edit/";
  if (stack1 = helpers.UglyHash) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UglyHash; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar-user.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<img src=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.CurrentImage),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<h1>";
  stack1 = helpers['with'].call(depth0, depth0.Person, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</h1>";
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<a href=\"/about/";
  if (stack1 = helpers.UrlSlug) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.UrlSlug; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "/\">";
  if (stack1 = helpers.FirstName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.FirstName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.Surname) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Surname; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<p class=\"email\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.Member),stack1 == null || stack1 === false ? stack1 : stack1.Email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>";
  return buffer;
  }

  buffer += "<header class=\"editor-header hideable\">\n	<div class=\"img\" id=\"current-person-image\">\n		";
  stack1 = helpers['if'].call(depth0, depth0.CurrentImage, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</div>\n	<hgroup>\n		";
  stack1 = helpers['if'].call(depth0, depth0.Person, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n		";
  stack1 = helpers['if'].call(depth0, depth0.Member, {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</hgroup>\n</header>\n<section class=\"editor-sidebar-content scrollbox\">\n	<header>\n		<h2>Person Images</h2>\n	</header>\n	<section>\n		<ul class=\"image-list\">\n		</ul>\n	</section>\n\n	<header>\n		<h2>Projects</h2>\n	</header>\n	<section>\n		<ul class=\"project-list\">\n		</ul>\n		<div>\n			<a class=\"btn new-project\" href=\"/secured/new/\">Create Project</a>\n		</div>\n	</section>\n\n	<header>\n		<h2>Personal Information</h2>\n	</header>\n	<section class=\"meta-info\" data-editor-scope=\"\\CurrentPerson\">\n		<div id=\"bio\">\n			<h3>Bio</h3>\n			<div data-editor-type=\"markdown\" data-editor-name=\"Bio\" data-editor-placeholder=\"your shitty life!\" data-editor-options='{\"customParsers\":{}, \"position\":{\"my\": \"right top\", \"at\": \"left top\", \"adjust\": {\"x\": -24, \"y\": -15}}}'>"
    + escapeExpression(((stack1 = ((stack1 = depth0.Person),stack1 == null || stack1 === false ? stack1 : stack1.Bio)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n		</div>\n		<div>\n			<h3>Phone</h3>\n			<p data-editor-type=\"inline\" data-editor-name=\"Phone\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.Person),stack1 == null || stack1 === false ? stack1 : stack1.Phone)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>\n		</div>\n		<div>\n			<h3>Email</h3>\n			<p data-editor-type=\"inline\" data-editor-name=\"Email\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.Person),stack1 == null || stack1 === false ? stack1 : stack1.Email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>\n		</div>\n	</section>\n\n	<header>\n		<h2>Websites</h2>\n	</header>\n	<section class=\"meta-info\" data-editor-scope=\"\\CurrentPerson\">\n		<div>\n			<ul class=\"websites website-list\">\n			</ul>\n			<a data-editor-type=\"modal\" data-editor-name=\"Website\" data-editor-fields='{\"Title\": {\"type\": \"text\"}, \"Link\": {\"type\": \"text\", \"placeholder\": \"http://\"}}' data-editor-options='{\"position\":{\"my\": \"right top\", \"at\": \"left top\", \"adjust\": {\"x\": -24, \"y\": -20}}}' class=\"btn\" href=\"#\" data-bypass data-editor-placeholder=\"Add Website\"></a>\n		</div>\n	</section>\n\n	<header>\n		<h2>Settings</h2>\n	</header>\n	<section>\n		<form class=\"user-settings\">\n			<input name=\"email\" type=\"email\" placeholder=\"Email\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.Member),stack1 == null || stack1 === false ? stack1 : stack1.Email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" required>\n			<input name=\"password\" type=\"password\" placeholder=\"Password\">\n			<input name=\"passwordconfirmed\" type=\"password\" placeholder=\"Confirm Password\">\n\n			<button class=\"btn\" type=\"submit\">Update Settings</button>\n		</form>\n	</section>\n</section>";
  return buffer;
  });

this["JST"]["app/templates/security/editor-sidebar.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<nav>\n	<ul>\n		<li>\n			<a href=\"#\" data-editor-sidebar-content=\"user\" class=\"icon-user\"><span>User</span></a>\n		</li>\n		<li>\n			<a href=\"/logout/\" class=\"icon-logout\"><span>Logout</span></a>\n		</li>\n	</ul>\n	<ul>\n		<li>\n			<a href=\"#\" data-editor-sidebar-content=\"gallery\" class=\"icon-editor\"><span>Editor</span></a>\n		</li>\n		<li>\n			<a href=\"#\" class=\"icon-switch\"><span>Switch view</span></a>\n		</li>\n		<li>\n			<a href=\"#\" class=\"icon-publish\"><span>Publish</span></a>\n		</li>\n	</ul>\n</nav>\n\n<div id=\"editor-sidebar-spinner\"></div>\n<div id=\"editor-sidebar-container\"></div>";
  });

this["JST"]["app/templates/security/logging-out.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<section class=\"logging-out\">\n		<a href=\"/\" class=\"logo\"><span></span></a>\n\n		<p>Logging out <strong>";
  if (stack1 = helpers.Email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>...</p>\n	</section>\n";
  return buffer;
  }

  stack1 = helpers['if'].call(depth0, depth0.Email, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["JST"]["app/templates/security/login-form.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<p>\n			You are logged in as <strong>";
  if (stack1 = helpers.Email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>.\n		</p>\n		<a href=\"/logout/\" class=\"btn\">Logout?</a>\n	";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n\n	<form>\n		<label for=\"login-email\">\n			<span>E-Mail</span>\n			<input type=\"text\" name=\"email\" placeholder=\"E-Mail\" id=\"login-email\" />\n		</label>\n		\n		<label for=\"login-password\">\n			<span>Password</span>\n			<input type=\"password\" name=\"password\" placeholder=\"Password\" id=\"login-password\" />\n		</label>\n		\n		<label for=\"login-remember\">\n			<input type=\"checkbox\" name=\"remember\" id=\"login-remember\" /> Remember me next time\n		</label>\n\n		<button class=\"doLogin btn\" type=\"submit\">\n			Log in\n		</button>\n	</form>\n	";
  }

  buffer += "<section class=\"login\">\n	<a href=\"/\" class=\"logo\"><span></span></a>\n\n	";
  stack1 = helpers['if'].call(depth0, depth0.Email, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</section>";
  return buffer;
  });

this["JST"]["app/templates/website-list-item.html"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- li class=\"website-item\" -->\n<a href=\"";
  if (stack1 = helpers.Link) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Link; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.Title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.Title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n<!-- /li -->";
  return buffer;
  });