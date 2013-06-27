// Generated by CoffeeScript 1.6.2
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['app', 'modules/DataRetrieval', 'modules/DocImage'], function(app, DataRetrieval, DocImage) {
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
          console.log(model);
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
