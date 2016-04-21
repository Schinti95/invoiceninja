/* =============================================================
 * bootstrap-combobox.js v1.1.5
 * =============================================================
 * Copyright 2012 Daniel Farrell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function( $ ) {

 "use strict";

 /* COMBOBOX PUBLIC CLASS DEFINITION
  * ================================ */

  var Combobox = function ( element, options ) {
    this.options = $.extend({}, $.fn.combobox.defaults, options);
    this.$source = $(element);
    this.$container = this.setup();
    this.$element = this.$container.find('input[type=text]');
    this.$target = this.$container.find('input[type=hidden]');
    this.$button = this.$container.find('.dropdown-toggle');
    this.$menu = $(this.options.menu).appendTo('body');
    this.matcher = this.options.matcher || this.matcher;
    this.sorter = this.options.sorter || this.sorter;
    this.highlighter = this.options.highlighter || this.highlighter;
    this.shown = false;
    this.selected = false;
    this.refresh();
    this.transferAttributes();
    this.listen();
  };

  Combobox.prototype = {

    constructor: Combobox

  , setup: function () {
      var combobox = $(this.options.template);
      this.$source.before(combobox);
      this.$source.hide();
      return combobox;
    }

  , parse: function () {
      var that = this
        , map = {}
        , source = []
        , selected = false
        , selectedValue = '';
      this.$source.find('option').each(function() {
        var option = $(this);
        if (option.val() === '') {
          that.options.placeholder = option.text();
          return;
        }
        map[option.text()] = option.val();
        source.push(option.text());
        if (option.prop('selected')) {
          selected = option.text();
          selectedValue = option.val();
        }
      })
      this.map = map;
      if (selected) {
        this.$element.val(selected);
        this.$target.val(selectedValue);
        this.$container.addClass('combobox-selected');
        this.selected = true;
      }
      return source;
    }

  , transferAttributes: function() {
    this.options.placeholder = this.$source.attr('data-placeholder') || this.options.placeholder;
    this.$element.attr('placeholder', this.options.placeholder);
    this.$target.prop('name', this.$source.prop('name'));
    this.$target.val(this.$source.val());
    this.$source.removeAttr('name');  // Remove from source otherwise form will pass parameter twice.
    this.$element.attr('required', this.$source.attr('required'));
    this.$element.attr('rel', this.$source.attr('rel'));
    this.$element.attr('title', this.$source.attr('title'));
    this.$element.attr('class', this.$source.attr('class'));
    this.$element.attr('tabindex', this.$source.attr('tabindex'));
    this.$source.removeAttr('tabindex');
    this.$source.removeAttr('required');
  }

  , setSelected: function() {
    this.selected = true;
  }

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value');
      this.$element.val(this.updater(val));
      this.$target.val(this.map[val]);
      this.$source.val(this.map[val]);
      this.$element.trigger('change');
      this.$target.trigger('change');
      this.$source.trigger('change');
      this.$container.addClass('combobox-selected');
      this.selected = true;
      return this.hide();
    }

  , updater: function (item) {
      return item;
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      });

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show();

      this.shown = true;
      return this;
    }

  , hide: function () {
      this.$menu.hide();
      this.shown = false;
      return this;
    }

  , lookup: function (event) {
      this.query = this.$element.val();
      return this.process(this.source);
    }

  , process: function (items) {
      var that = this;

      items = $.grep(items, function (item) {
        return that.matcher(item);
      })

      items = this.sorter(items);

      if (!items.length) {
        return this.shown ? this.hide() : this;
      }

      return this.render(items.slice(0, this.options.items)).show();
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase());
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item;

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) {beginswith.push(item);}
        else if (~item.indexOf(this.query)) {caseSensitive.push(item);}
        else {caseInsensitive.push(item);}
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>';
      })
    }

  , render: function (items) {
      var that = this;

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item);
        i.find('a').html(that.highlighter(item));
        return i[0];
      })

      items.first().addClass('active');
      this.$menu.html(items);
      return this;
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next();

      if (!next.length) {
        next = $(this.$menu.find('li')[0]);
      }

      next.addClass('active');
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev();

      if (!prev.length) {
        prev = this.$menu.find('li').last();
      }

      prev.addClass('active');
    }

  , toggle: function () {
    if (this.$container.hasClass('combobox-selected')) {
      this.clearTarget();
      this.triggerChange();
      this.clearElement();
    } else {
      if (this.shown) {
        this.hide();
      } else {
        this.clearElement();
        this.lookup();
      }
    }

    this.$element.trigger('change');
    this.$target.trigger('change');
    this.$source.trigger('change');    
  }

  , clearElement: function () {
    this.$element.val('').focus();
  }

  , clearTarget: function () {
    this.$source.val('');
    this.$target.val('');
    this.$container.removeClass('combobox-selected');
    this.selected = false;
  }

  , triggerChange: function () {
    this.$source.trigger('change');
  }

  , refresh: function () {
    this.source = this.parse();
    this.options.items = this.source.length;
  }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this));

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this));
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this));

      this.$button
        .on('click', $.proxy(this.toggle, this));
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element;
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;');
        isSupported = typeof this.$element[eventName] === 'function';
      }
      return isSupported;
    }

  , move: function (e) {
      if (!this.shown) {return;}

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault();
          break;

        case 38: // up arrow
          e.preventDefault();
          this.prev();
          break;

        case 40: // down arrow
          e.preventDefault();
          this.next();
          break;
      }

      e.stopPropagation();
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27]);
      this.move(e);
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) {return;}
      this.move(e);
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 39: // right arrow
        case 38: // up arrow
        case 37: // left arrow
        case 36: // home
        case 35: // end
        case 33: // page up
        case 34: // page down
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
        case 20: // cap lock
          break;

        case 9: // tab
        case 13: // enter
          if (!this.shown) {return;}
          this.select();
          break;

        case 27: // escape
          if (!this.shown) {return;}
          this.hide();
          break;

        default:
          this.clearTarget();
          this.lookup();
      }

      e.stopPropagation();
      e.preventDefault();
  }

  , focus: function (e) {
      this.focused = true;
    }

  , blur: function (e) {
      var that = this;
      this.focused = false;
      var val = this.$element.val();
      if (!this.selected && val !== '' ) {
        this.$element.val('');
        this.$source.val('').trigger('change');
        this.$target.val('').trigger('change');
      }
      if (!this.mousedover && this.shown) {setTimeout(function () { that.hide(); }, 200);}
    }

  , click: function (e) {
      e.stopPropagation();
      e.preventDefault();
      this.select();
      this.$element.focus();
    }

  , mouseenter: function (e) {
      this.mousedover = true;
      this.$menu.find('.active').removeClass('active');
      $(e.currentTarget).addClass('active');
    }

  , mouseleave: function (e) {
      this.mousedover = false;
    }
  };

  /* COMBOBOX PLUGIN DEFINITION
   * =========================== */

  $.fn.combobox = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('combobox')
        , options = typeof option == 'object' && option;
      if(!data) {$this.data('combobox', (data = new Combobox(this, options)));}
      if (typeof option == 'string') {data[option]();}
    });
  };

  $.fn.combobox.defaults = {
  template: '<div class="combobox-container"> <input type="hidden" /> <div class="input-group"> <input type="text" autocomplete="off" /> <span class="input-group-addon dropdown-toggle" data-dropdown="dropdown"> <span class="caret" /> <i class="fa fa-times"></i> </span> </div> </div> '
  , menu: '<ul class="typeahead typeahead-long dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  };

  $.fn.combobox.Constructor = Combobox;

}( window.jQuery );

// http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isEdge = navigator.userAgent.indexOf('Edge/') >= 0;
var isChrome = !!window.chrome && !isOpera && !isEdge; // Chrome 1+
var isChromium = isChrome && navigator.userAgent.indexOf('Chromium') >= 0;
// https://code.google.com/p/chromium/issues/detail?id=574648
var isChrome48 = isChrome && navigator.userAgent.indexOf('Chrome/48') >= 0;
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

var refreshTimer;
function generatePDF(invoice, javascript, force, cb) {
  if (!invoice || !javascript) {
    return;
  }
  //console.log('== generatePDF - force: %s', force);
  if (force) {
    refreshTimer = null;
  } else {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(function() {
        generatePDF(invoice, javascript, true, cb);
      }, 500);
      return;
  }

  invoice = calculateAmounts(invoice);
  var pdfDoc = GetPdfMake(invoice, javascript, cb);

  if (cb) {
     pdfDoc.getDataUrl(cb);
  }

  return pdfDoc;
}

function copyObject(orig) {
  if (!orig) return false;
  return JSON.parse(JSON.stringify(orig));
}

/* Handle converting variables in the invoices (ie, MONTH+1) */
function processVariables(str) {
  if (!str) return '';
  var variables = ['MONTH','QUARTER','YEAR'];
  for (var i=0; i<variables.length; i++) {
    var variable = variables[i];
        var regexp = new RegExp(':' + variable + '[+-]?[\\d]*', 'g');
        var matches = str.match(regexp);
        if (!matches) {
             continue;
        }
        for (var j=0; j<matches.length; j++) {
            var match = matches[j];
            var offset = 0;
            if (match.split('+').length > 1) {
                offset = match.split('+')[1];
            } else if (match.split('-').length > 1) {
                offset = parseInt(match.split('-')[1]) * -1;
            }
            str = str.replace(match, getDatePart(variable, offset));
        }
  }

  return str;
}

function getDatePart(part, offset) {
    offset = parseInt(offset);
    if (!offset) {
        offset = 0;
    }
  if (part == 'MONTH') {
    return getMonth(offset);
  } else if (part == 'QUARTER') {
    return getQuarter(offset);
  } else if (part == 'YEAR') {
    return getYear(offset);
  }
}

function getMonth(offset) {
  var today = new Date();
  var months = [ "Januar", "Februar", "März", "April", "Mai", "Juni",
            "Juli", "August", "September", "Oktober", "November", "Dezember" ];
  var month = today.getMonth();
    month = parseInt(month) + offset;
    month = month % 12;
    if (month < 0) {
      month += 12;
    }
    return months[month];
}

function getYear(offset) {
  var today = new Date();
  var year = today.getFullYear();
  return parseInt(year) + offset;
}

function getQuarter(offset) {
  var today = new Date();
  var quarter = Math.floor((today.getMonth() + 3) / 3);
  quarter += offset;
    quarter = quarter % 4;
    if (quarter == 0) {
         quarter = 4;
    }
    return 'Q' + quarter;
}


/* Default class modification */
if ($.fn.dataTableExt) {
  $.extend( $.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
  } );


  /* API method to get paging information */
  $.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
  {
    return {
      "iStart":         oSettings._iDisplayStart,
      "iEnd":           oSettings.fnDisplayEnd(),
      "iLength":        oSettings._iDisplayLength,
      "iTotal":         oSettings.fnRecordsTotal(),
      "iFilteredTotal": oSettings.fnRecordsDisplay(),
      "iPage":          oSettings._iDisplayLength === -1 ?
        0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
      "iTotalPages":    oSettings._iDisplayLength === -1 ?
        0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
    };
  };


  /* Bootstrap style pagination control */
  $.extend( $.fn.dataTableExt.oPagination, {
    "bootstrap": {
      "fnInit": function( oSettings, nPaging, fnDraw ) {
        var oLang = oSettings.oLanguage.oPaginate;
        var fnClickHandler = function ( e ) {
          e.preventDefault();
          if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
            fnDraw( oSettings );
          }
        };

        $(nPaging).addClass('pagination').append(
          '<ul class="pagination">'+
            '<li class="prev disabled"><a href="#">&laquo;</a></li>'+
            '<li class="next disabled"><a href="#">&raquo;</a></li>'+
          '</ul>'
        );
        var els = $('a', nPaging);
        $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
        $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
      },

      "fnUpdate": function ( oSettings, fnDraw ) {
        var iListLength = 5;
        var oPaging = oSettings.oInstance.fnPagingInfo();
        var an = oSettings.aanFeatures.p;
        var i, ien, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

        if ( oPaging.iTotalPages < iListLength) {
          iStart = 1;
          iEnd = oPaging.iTotalPages;
        }
        else if ( oPaging.iPage <= iHalf ) {
          iStart = 1;
          iEnd = iListLength;
        } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
          iStart = oPaging.iTotalPages - iListLength + 1;
          iEnd = oPaging.iTotalPages;
        } else {
          iStart = oPaging.iPage - iHalf + 1;
          iEnd = iStart + iListLength - 1;
        }

        for ( i=0, ien=an.length ; i<ien ; i++ ) {
          // Remove the middle elements
          $('li:gt(0)', an[i]).filter(':not(:last)').remove();

          // Add the new list items and their event handlers
          for ( j=iStart ; j<=iEnd ; j++ ) {
            sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
            $('<li '+sClass+'><a href="#">'+j+'</a></li>')
              .insertBefore( $('li:last', an[i])[0] )
              .bind('click', function (e) {
                e.preventDefault();
                oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                fnDraw( oSettings );
              } );
          }

          // Add / remove disabled classes from the static elements
          if ( oPaging.iPage === 0 ) {
            $('li:first', an[i]).addClass('disabled');
          } else {
            $('li:first', an[i]).removeClass('disabled');
          }

          if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
            $('li:last', an[i]).addClass('disabled');
          } else {
            $('li:last', an[i]).removeClass('disabled');
          }
        }
      }
    }
  } );
}

/*
 * TableTools Bootstrap compatibility
 * Required TableTools 2.1+
 */
if ( $.fn.DataTable.TableTools ) {
  // Set the classes that TableTools uses to something suitable for Bootstrap
  $.extend( true, $.fn.DataTable.TableTools.classes, {
    "container": "DTTT btn-group",
    "buttons": {
      "normal": "btn",
      "disabled": "disabled"
    },
    "collection": {
      "container": "DTTT_dropdown dropdown-menu",
      "buttons": {
        "normal": "",
        "disabled": "disabled"
      }
    },
    "print": {
      "info": "DTTT_print_info modal"
    },
    "select": {
      "row": "active"
    }
  } );

  // Have the collection use a bootstrap compatible dropdown
  $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
    "collection": {
      "container": "ul",
      "button": "li",
      "liner": "a"
    }
  } );
}


function isStorageSupported() {
  try {
      return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
      return false;
  }
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
};

$(function() {
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });
});


function enableHoverClick($combobox, $entityId, url) {
  /*
  $combobox.mouseleave(function() {
    $combobox.css('text-decoration','none');
  }).on('mouseenter', function(e) {
    setAsLink($combobox, $combobox.closest('.combobox-container').hasClass('combobox-selected'));
  }).on('focusout mouseleave', function(e) {
    setAsLink($combobox, false);
  }).on('click', function() {
    var clientId = $entityId.val();
    if ($(combobox).closest('.combobox-container').hasClass('combobox-selected')) {
      if (parseInt(clientId) > 0) {
        window.open(url + '/' + clientId, '_blank');
      } else {
        $('#myModal').modal('show');
      }
    };
  });
  */
}

function setAsLink($input, enable) {
  if (enable) {
    $input.css('text-decoration','underline');
    $input.css('cursor','pointer');
  } else {
    $input.css('text-decoration','none');
    $input.css('cursor','text');
  }
}

function setComboboxValue($combobox, id, name) {
  $combobox.find('input').val(id);
  $combobox.find('input.form-control').val(name);
  if (id && name) {
    $combobox.find('select').combobox('setSelected');
    $combobox.find('.combobox-container').addClass('combobox-selected');
  } else {
    $combobox.find('.combobox-container').removeClass('combobox-selected');
  }
}


var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  return base64DecToArr(base64);
}

if (window.ko) {
  ko.bindingHandlers.dropdown = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var options = allBindingsAccessor().dropdownOptions|| {};
         var value = ko.utils.unwrapObservable(valueAccessor());
         var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
         if (id) $(element).val(id);
         //console.log("combo-init: %s", id);
         $(element).combobox(options);

         /*
          ko.utils.registerEventHandler(element, "change", function () {
            console.log("change: %s", $(element).val());
            //var
            valueAccessor($(element).val());
              //$(element).combobox('refresh');
          });
          */
      },
      update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
          //console.log("combo-update: %s", id);
        if (id) {
          $(element).val(id);
          $(element).combobox('refresh');
        } else {
          $(element).combobox('clearTarget');
          $(element).combobox('clearElement');
        }
      }
  };

  ko.bindingHandlers.combobox = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var options = allBindingsAccessor().dropdownOptions|| {};
         var value = ko.utils.unwrapObservable(valueAccessor());
         var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
         if (id) $(element).val(id);
         $(element).combobox(options);

          ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor();
            value($(element).val());
          });
      },
      update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var id = (value && value.public_id) ? value.public_id() : (value && value.id) ? value.id() : value ? value : false;
        if (id) {
          $(element).val(id);
          $(element).combobox('refresh');
        } else {
          $(element).combobox('clearTarget');
          $(element).combobox('clearElement');
        }
      }
  };

  ko.bindingHandlers.datePicker = {
      init: function (element, valueAccessor, allBindingsAccessor) {
         var value = ko.utils.unwrapObservable(valueAccessor());
         if (value) $(element).datepicker('update', value);
         $(element).change(function() {
            var value = valueAccessor();
            value($(element).val());
         })
      },
      update: function (element, valueAccessor) {
         var value = ko.utils.unwrapObservable(valueAccessor());
         if (value) $(element).datepicker('update', value);
      }
  };

  ko.bindingHandlers.placeholder = {
    init: function (element, valueAccessor, allBindingsAccessor) {
      var underlyingObservable = valueAccessor();
      ko.applyBindingsToNode(element, { attr: { placeholder: underlyingObservable } } );
    }
  };

  ko.bindingHandlers.tooltip = {
    init: function(element, valueAccessor) {
        var local = ko.utils.unwrapObservable(valueAccessor()),
        options = {};

        ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
        ko.utils.extend(options, local);

        $(element).tooltip(options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).tooltip("destroy");
        });
    },
    options: {
        placement: "bottom",
        trigger: "hover"
    }
  };
}

function getContactDisplayName(contact)
{
    if (contact.first_name || contact.last_name) {
        return (contact.first_name || '') + ' ' + (contact.last_name || '');
    } else {
        return contact.email;
    }
}

function getClientDisplayName(client)
{
  var contact = client.contacts ? client.contacts[0] : false;
  if (client.name) {
    return client.name;
  } else if (contact) {
    return getContactDisplayName(contact);
  }
  return '';
}

function populateInvoiceComboboxes(clientId, invoiceId) {
  var clientMap = {};
  var invoiceMap = {};
  var invoicesForClientMap = {};
  var $clientSelect = $('select#client');

  for (var i=0; i<invoices.length; i++) {
    var invoice = invoices[i];
    var client = invoice.client;

    if (!invoicesForClientMap.hasOwnProperty(client.public_id)) {
      invoicesForClientMap[client.public_id] = [];
    }

    invoicesForClientMap[client.public_id].push(invoice);
    invoiceMap[invoice.public_id] = invoice;
  }

  for (var i=0; i<clients.length; i++) {
    var client = clients[i];
    clientMap[client.public_id] = client;
  }

  $clientSelect.append(new Option('', ''));
  for (var i=0; i<clients.length; i++) {
    var client = clients[i];
    $clientSelect.append(new Option(getClientDisplayName(client), client.public_id));
  }

  if (clientId) {
    $clientSelect.val(clientId);
  }

  $clientSelect.combobox();
  $clientSelect.on('change', function(e) {
    var clientId = $('input[name=client]').val();
    var invoiceId = $('input[name=invoice]').val();
    var invoice = invoiceMap[invoiceId];
    if (invoice && invoice.client.public_id == clientId) {
      e.preventDefault();
      return;
    }
    setComboboxValue($('.invoice-select'), '', '');
    $invoiceCombobox = $('select#invoice');
    $invoiceCombobox.find('option').remove().end().combobox('refresh');
    $invoiceCombobox.append(new Option('', ''));
    var list = clientId ? (invoicesForClientMap.hasOwnProperty(clientId) ? invoicesForClientMap[clientId] : []) : invoices;
    for (var i=0; i<list.length; i++) {
      var invoice = list[i];
      var client = clientMap[invoice.client.public_id];
      if (!client) continue; // client is deleted/archived
      $invoiceCombobox.append(new Option(invoice.invoice_number + ' - ' + invoice.invoice_status.name + ' - ' +
                getClientDisplayName(client) + ' - ' + formatMoneyInvoice(invoice.amount, invoice) + ' | ' +
                formatMoneyInvoice(invoice.balance, invoice),  invoice.public_id));
    }
    $('select#invoice').combobox('refresh');
  });

  var $invoiceSelect = $('select#invoice').on('change', function(e) {
    $clientCombobox = $('select#client');
    var invoiceId = $('input[name=invoice]').val();
    if (invoiceId) {
      var invoice = invoiceMap[invoiceId];
      var client = clientMap[invoice.client.public_id];
      invoice.client = client;
      setComboboxValue($('.client-select'), client.public_id, getClientDisplayName(client));
      if (!parseFloat($('#amount').val())) {
        $('#amount').val(parseFloat(invoice.balance).toFixed(2));
      }
    }
  });

  $invoiceSelect.combobox();

  if (invoiceId) {
    var invoice = invoiceMap[invoiceId];
    var client = clientMap[invoice.client.public_id];
    invoice.client = client;
    setComboboxValue($('.invoice-select'), invoice.public_id, (invoice.invoice_number + ' - ' +
            invoice.invoice_status.name + ' - ' + getClientDisplayName(client) + ' - ' +
            formatMoneyInvoice(invoice.amount, invoice) + ' | ' + formatMoneyInvoice(invoice.balance, invoice)));
    $invoiceSelect.trigger('change');
  } else if (clientId) {
    var client = clientMap[clientId];
    setComboboxValue($('.client-select'), client.public_id, getClientDisplayName(client));
    $clientSelect.trigger('change');
  } else {
    $clientSelect.trigger('change');
  }
}


var CONSTS = {};
CONSTS.INVOICE_STATUS_DRAFT = 1;
CONSTS.INVOICE_STATUS_SENT = 2;
CONSTS.INVOICE_STATUS_VIEWED = 3;
CONSTS.INVOICE_STATUS_APPROVED = 4;
CONSTS.INVOICE_STATUS_PARTIAL = 5;
CONSTS.INVOICE_STATUS_PAID = 6;

$.fn.datepicker.defaults.autoclose = true;
$.fn.datepicker.defaults.todayHighlight = true;

function formatAddress(city, state, zip, swap) {
    var str = '';
    if (swap) {
        str += zip ? zip + ' ' : '';
        str += city ? city : '';
        str += (city && state) ? ', ' : (city ? ' ' : '');
        str += state;        
    } else {
        str += city ? city : '';
        str += (city && state) ? ', ' : (state ? ' ' : '');
        str += state + ' ' + zip;
    }
    return str;
}

function concatStrings() {
  var concatStr = '';
  var data = [];
  for (var i=0; i<arguments.length; i++) {
    var string = arguments[i];
    if (string) {
      data.push(string);
    }
  }
  for (var i=0; i<data.length; i++) {
    concatStr += data[i];
    if (i == 0 && data.length > 1) {
      concatStr += ', ';
    } else if (i < data.length -1) {
      concatStr += ' ';
    }
  }
  return data.length ? concatStr : "";
}

function calculateAmounts(invoice) {
  var total = 0;
  var hasTaxes = false;
  var taxes = {};
  invoice.has_product_key = false;

  // sum line item
  for (var i=0; i<invoice.invoice_items.length; i++) {
    var item = invoice.invoice_items[i];
    var lineTotal = roundToTwo(NINJA.parseFloat(item.cost)) * roundToTwo(NINJA.parseFloat(item.qty));
    lineTotal = roundToTwo(lineTotal);
    if (lineTotal) {
      total += lineTotal;
    }
  }

  for (var i=0; i<invoice.invoice_items.length; i++) {
    var item = invoice.invoice_items[i];
    var taxRate = 0;
    var taxName = '';

    if (item.product_key) {
        invoice.has_product_key = true;
    } else if (invoice.invoice_items.length == 1 && !item.qty) {
        invoice.has_product_key = true;
    }

    // the object structure differs if it's read from the db or created by knockoutJS
    if (item.tax && parseFloat(item.tax.rate)) {
      taxRate = parseFloat(item.tax.rate);
      taxName = item.tax.name;
    } else if (item.tax_rate && parseFloat(item.tax_rate)) {
      taxRate = parseFloat(item.tax_rate);
      taxName = item.tax_name;
    }

    // calculate line item tax
    var lineTotal = roundToTwo(NINJA.parseFloat(item.cost)) * roundToTwo(NINJA.parseFloat(item.qty));
    if (invoice.discount != 0) {
        if (parseInt(invoice.is_amount_discount)) {
            lineTotal -= roundToTwo((lineTotal/total) * invoice.discount);
        } else {
            lineTotal -= roundToTwo(lineTotal * (invoice.discount/100));
        }
    }
    var taxAmount = roundToTwo(lineTotal * taxRate / 100);

    if (taxRate) {
      var key = taxName + taxRate;
      if (taxes.hasOwnProperty(key)) {
        taxes[key].amount += taxAmount;
      } else {
        taxes[key] = {name: taxName, rate:taxRate, amount:taxAmount};
      }
    }

    if ((item.tax && item.tax.name) || item.tax_name) {
      hasTaxes = true;
    }
  }

  invoice.subtotal_amount = total;

  var discount = 0;
  if (invoice.discount != 0) {
    if (parseInt(invoice.is_amount_discount)) {
      discount = roundToTwo(invoice.discount);
    } else {
      discount = roundToTwo(total * (invoice.discount/100));
    }
    total -= discount;
  }

  // custom fields with taxes
  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 == '1') {
    total += roundToTwo(invoice.custom_value1);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 == '1') {
    total += roundToTwo(invoice.custom_value2);
  }

  var tax = 0;
  if (invoice.tax && parseFloat(invoice.tax.rate)) {
    tax = parseFloat(invoice.tax.rate);
  } else if (invoice.tax_rate && parseFloat(invoice.tax_rate)) {
    tax = parseFloat(invoice.tax_rate);
  }

  if (tax) {
    var tax = roundToTwo(total * (tax/100));
    total = parseFloat(total) + parseFloat(tax);
  }

  for (var key in taxes) {
    if (taxes.hasOwnProperty(key)) {
        total += taxes[key].amount;
    }
  }

  // custom fields w/o with taxes
  if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 != '1') {
    total += roundToTwo(invoice.custom_value1);
  }
  if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 != '1') {
    total += roundToTwo(invoice.custom_value2);
  }

  invoice.total_amount = roundToTwo(total) - (roundToTwo(invoice.amount) - roundToTwo(invoice.balance));
  invoice.discount_amount = discount;
  invoice.tax_amount = tax;
  invoice.item_taxes = taxes;
  
  if (NINJA.parseFloat(invoice.partial)) {
    invoice.balance_amount = roundToTwo(invoice.partial);
  } else {
    invoice.balance_amount = invoice.total_amount;
  }

  return invoice;
}

function getInvoiceTaxRate(invoice) {
  var tax = 0;
  if (invoice.tax && parseFloat(invoice.tax.rate)) {
    tax = parseFloat(invoice.tax.rate);
  } else if (invoice.tax_rate && parseFloat(invoice.tax_rate)) {
    tax = parseFloat(invoice.tax_rate);
  }
  return tax;
}

// http://stackoverflow.com/questions/11941876/correctly-suppressing-warnings-in-datatables
window.alert = (function() {
    var nativeAlert = window.alert;
    return function(message) {
        window.alert = nativeAlert;
        message && message.indexOf("DataTables warning") === 0 ?
            console.error(message) :
            nativeAlert(message);
    }
})();


// http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
function objectEquals(x, y) {
    // if both are function
    if (x instanceof Function) {
        if (y instanceof Function) {
            return x.toString() === y.toString();
        }
        return false;
    }
    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }

    // if one of them is date, they must had equal valueOf
    if (x instanceof Date) { return false; }
    if (y instanceof Date) { return false; }

    // if they are not function or strictly equal, they both need to be Objects
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) ?
            p.every(function (i) { return objectEquals(x[i], y[i]); }) : false;
}



/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
|*|
\*/

/* Array of bytes to base64 string decoding */

function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
      nUint6 + 65
    : nUint6 < 52 ?
      nUint6 + 71
    : nUint6 < 62 ?
      nUint6 - 4
    : nUint6 === 62 ?
      43
    : nUint6 === 63 ?
      47
    :
      65;

}

function base64EncArr (aBytes) {

  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
      nUint24 = 0;
    }
  }

  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

}

/* UTF-8 array to DOMString and vice versa */

function UTF8ArrToStr (aBytes) {

  var sView = "";

  for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCharCode(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
        /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
        (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
        (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
        (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
        (nPart - 192 << 6) + aBytes[++nIdx] - 128
      : /* nPart < 127 ? */ /* one byte */
        nPart
    );
  }

  return sView;

}

function strToUTF8Arr (sDOMStr) {

  var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

  /* mapping... */

  for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.charCodeAt(nMapIdx);
    nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
  }

  aBytes = new Uint8Array(nArrLen);

  /* transcription... */

  for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
    nChr = sDOMStr.charCodeAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else /* if (nChr <= 0x7fffffff) */ {
      /* six bytes */
      aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
      aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    }
  }

  return aBytes;

}



function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
function setDocHexColor(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setTextColor(r, g, b);
}
function setDocHexFill(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setFillColor(r, g, b);
}
function setDocHexDraw(doc, hex) {
  var r = hexToR(hex);
  var g = hexToG(hex);
  var b = hexToB(hex);
  return doc.setDrawColor(r, g, b);
}

function toggleDatePicker(field) {
  $('#'+field).datepicker('show');
}

function roundToTwo(num, toString) {
  var val = +(Math.round(num + "e+2")  + "e-2");
  return toString ? val.toFixed(2) : (val || 0);
}

function roundToFour(num, toString) {
  var val = +(Math.round(num + "e+4")  + "e-4");
  return toString ? val.toFixed(4) : (val || 0);
}

function truncate(str, length) {
  return (str && str.length > length) ? (str.substr(0, length-1) + '...') : str;
}

// http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// http://codeaid.net/javascript/convert-seconds-to-hours-minutes-and-seconds-%28javascript%29
function secondsToTime(secs)
{
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

function twoDigits(value) {
   if (value < 10) {
       return '0' + value;
   }
   return value;
}

function toSnakeCase(str) {
    if (!str) return '';
    return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
}

// https://coderwall.com/p/iprsng/convert-snake-case-to-camelcase
function snakeToCamel(s){
    return s.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

function getDescendantProp(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
}

function doubleDollarSign(str) {
    if (!str) return '';
    if (!str.replace) return str;
    return str.replace(/\$/g, '\$\$\$');
}

function truncate(string, length){
   if (string.length > length) {
      return string.substring(0, length) + '...';
   } else {
      return string;
   }
};

// Show/hide the 'Select' option in the datalists 
function actionListHandler() {
    $('tbody tr').mouseover(function() {
        $(this).closest('tr').find('.tr-action').show();
        $(this).closest('tr').find('.tr-status').hide();
    }).mouseout(function() {
        $dropdown = $(this).closest('tr').find('.tr-action');
        if (!$dropdown.hasClass('open')) {
          $dropdown.hide();
          $(this).closest('tr').find('.tr-status').show();
        }
    });
}

function loadImages(selector) {
    $(selector + ' img').each(function(index, item) {
        var src = $(item).attr('data-src');
        $(item).attr('src', src);
        $(item).attr('data-src', src);
    });
}

// http://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
function prettyJson(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        match = snakeToCamel(match);
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function searchData(data, key, fuzzy) {
    return function findMatches(q, cb) {
    var matches, substringRegex;
    if (fuzzy) {
        var options = {
          keys: [key],
        }
        var fuse = new Fuse(data, options);
        matches = fuse.search(q);
    } else {
        matches = [];
        substrRegex = new RegExp(q, 'i');
        $.each(data, function(i, obj) {
          if (substrRegex.test(obj[key])) {
            matches.push(obj);
          }
        });
    }
    cb(matches);
    }
}; 

var NINJA = NINJA || {};

NINJA.TEMPLATES = {
    CLEAN: "1",
    BOLD:"2",
    MODERN: "3",
    NORMAL:"4",
    BUSINESS:"5",
    CREATIVE:"6",
    ELEGANT:"7",
    HIPSTER:"8",
    PLAYFUL:"9",
    PHOTO:"10"
};

function GetPdfMake(invoice, javascript, callback) {    

    javascript = NINJA.decodeJavascript(invoice, javascript);

    function jsonCallBack(key, val) {

        // handle custom functions
        if (typeof val === 'string') {
            if (val.indexOf('$firstAndLast') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return (i === 0 || i === node.table.body.length) ? parseFloat(parts[1]) : 0;
                };
            } else if (val.indexOf('$none') === 0) {
                return function (i, node) {
                    return 0;
                };
            } else if (val.indexOf('$notFirstAndLastColumn') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 0 : parseFloat(parts[1]);
                };
            } else if (val.indexOf('$notFirst') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return i === 0 ? 0 : parseFloat(parts[1]);
                };
            } else if (val.indexOf('$amount') === 0) {
                var parts = val.split(':');
                return function (i, node) {
                    return parseFloat(parts[1]);
                };
            } else if (val.indexOf('$primaryColor') === 0) {
                var parts = val.split(':');
                return NINJA.primaryColor || parts[1];
            } else if (val.indexOf('$secondaryColor') === 0) {
                var parts = val.split(':');
                return NINJA.secondaryColor || parts[1];
            }
        }

        // determine whether or not to show the header/footer
        if (invoice.is_pro) {
            if (key === 'header') {
                return function(page, pages) {
                    return page === 1 || invoice.account.all_pages_header == '1' ? val : '';
                }
            } else if (key === 'footer') {
                return function(page, pages) {
                    return page === pages || invoice.account.all_pages_footer == '1' ? val : '';
                }
            }
        }

        // check for markdown
        if (key === 'text') {
            val = NINJA.parseMarkdownText(val, true);
        }

        /*
        if (key === 'stack') {
            val = NINJA.parseMarkdownStack(val);
            val = NINJA.parseMarkdownText(val, false);
        }
        */
        
        return val;
    }


    // Add ninja logo to the footer
    var dd = JSON.parse(javascript, jsonCallBack);
    var designId = invoice.invoice_design_id;
    if (!invoice.is_pro) {
        if (designId == NINJA.TEMPLATES.CLEAN || designId == NINJA.TEMPLATES.NORMAL) {
            dd.footer.columns.push({image: logoImages.imageLogo1, alignment: 'right', width: 130, margin: [0, 0, 0, 0]})
        } else if (designId == NINJA.TEMPLATES.BOLD) {
            dd.footer[1].columns.push({image: logoImages.imageLogo2, alignment: 'right', width: 130, margin: [0, -20, 20, 0]})
        } else if (designId == NINJA.TEMPLATES.MODERN) {
            dd.footer[1].columns[0].stack.push({image: logoImages.imageLogo3, alignment: 'left', width: 130, margin: [40, 6, 0, 0]});
        }
    }
    
    
    
    pdfMake.fonts = {}
    fonts = window.invoiceFonts || invoice.invoice_fonts;

    // Add only the loaded fonts
    $.each(fonts, function(i,font){
        addFont(font);
    });


    function addFont(font){
        if(window.ninjaFontVfs[font.folder]){
            pdfMake.fonts[font.name] = {
                normal: font.folder+'/'+font.normal,
                italics: font.folder+'/'+font.italics,
                bold: font.folder+'/'+font.bold,
                bolditalics: font.folder+'/'+font.bolditalics
            }
        }
    }
        
    if(!dd.defaultStyle)dd.defaultStyle = {font:NINJA.bodyFont};
    else if(!dd.defaultStyle.font)dd.defaultStyle.font = NINJA.bodyFont;
    
    doc = pdfMake.createPdf(dd);
    doc.save = function(fileName) {
        this.download(fileName);
    };
    
    return doc;
}

NINJA.decodeJavascript = function(invoice, javascript)
{
    var account = invoice.account;
    var blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

    // search/replace variables
    var json = {
        'accountName': account.name || ' ',
        'accountLogo': window.accountLogo || blankImage,
        'accountDetails': NINJA.accountDetails(invoice), 
        'accountAddress': NINJA.accountAddress(invoice),
        'invoiceDetails': NINJA.invoiceDetails(invoice),
        'invoiceDetailsHeight': (NINJA.invoiceDetails(invoice).length * 16) + 16,
        'invoiceLineItems': NINJA.invoiceLines(invoice),
        'invoiceLineItemColumns': NINJA.invoiceColumns(invoice),
        'quantityWidth': NINJA.quantityWidth(invoice),
        'taxWidth': NINJA.taxWidth(invoice),
        'clientDetails': NINJA.clientDetails(invoice),
        'notesAndTerms': NINJA.notesAndTerms(invoice),
        'subtotals': NINJA.subtotals(invoice),
        'subtotalsHeight': (NINJA.subtotals(invoice).length * 16) + 16,
        'subtotalsWithoutBalance': NINJA.subtotals(invoice, true),        
        'subtotalsBalance': NINJA.subtotalsBalance(invoice),
        'balanceDue': formatMoneyInvoice(invoice.balance_amount, invoice),
        'invoiceFooter': NINJA.invoiceFooter(invoice),
        'invoiceNumber': invoice.invoice_number || ' ',
        'entityType': invoice.is_quote ? invoiceLabels.quote : invoiceLabels.invoice,
        'entityTypeUC': (invoice.is_quote ? invoiceLabels.quote : invoiceLabels.invoice).toUpperCase(),
        'fontSize': NINJA.fontSize,
        'fontSizeLarger': NINJA.fontSize + 1,
        'fontSizeLargest': NINJA.fontSize + 2,
        'fontSizeSmaller': NINJA.fontSize - 1,
        'bodyFont': NINJA.bodyFont,
        'headerFont': NINJA.headerFont,
    }

    for (var key in json) {
        // remove trailing commas for these fields
        if (['quantityWidth', 'taxWidth'].indexOf(key) >= 0) {
            var regExp = new RegExp('"\\$'+key+'",', 'g');
            val = json[key];
        } else {
            var regExp = new RegExp('"\\$'+key+'"', 'g');
            var val = JSON.stringify(json[key]);
            val = doubleDollarSign(val);
        }
        javascript = javascript.replace(regExp, val);
    }

    // search/replace labels 
    var regExp = new RegExp('"\\$\\\w*?Label(UC)?(:)?(\\\?)?"', 'g');
    var matches = javascript.match(regExp);    
    
    if (matches) {
        for (var i=0; i<matches.length; i++) {
            var match = matches[i];
            field = match.substring(2, match.indexOf('Label'));
            field = toSnakeCase(field);
            var value = getDescendantProp(invoice, field);
            if (match.indexOf('?') < 0 || value) {
                if (invoice.partial && field == 'balance_due') {
                    field = 'partial_due';
                } else if (invoice.is_quote) {
                    field = field.replace('invoice', 'quote');
                }
                var label = invoiceLabels[field];
                if (match.indexOf('UC') >= 0) {
                    label = label.toUpperCase();
                }
                if (match.indexOf(':') >= 0) {
                    label = label + ':';
                }
            } else {
                label = ' ';
            }
            javascript = javascript.replace(match, '"'+label+'"');
        }        
    }

    // search/replace values 
    var regExp = new RegExp('"\\$[a-z][\\\w\\\.]*?[Value]?"', 'g');
    var matches = javascript.match(regExp);    

    if (matches) {
        for (var i=0; i<matches.length; i++) {
            var match = matches[i];

            // reserved words
            if (['"$none"', '"$firstAndLast"', '"$notFirstAndLastColumn"', '"$notFirst"', '"$amount"', '"$primaryColor"', '"$secondaryColor"'].indexOf(match) >= 0) {
                continue;
            }

            // legacy style had 'Value' at the end
            if (endsWith(match, 'Value"')) {
                field = match.substring(2, match.indexOf('Value'));
            } else {
                field = match.substring(2, match.length - 1);
            }            
            field = toSnakeCase(field);

            var value = getDescendantProp(invoice, field) || ' ';
            value = doubleDollarSign(value);
            javascript = javascript.replace(match, '"'+value+'"');
        }
    }

    return javascript;
}


NINJA.notesAndTerms = function(invoice)
{
    var data = [];

    if (invoice.public_notes) {
        data.push({stack:[{text: invoice.public_notes, style: ['notes']}]});
        data.push({text:' '});
    }

    if (invoice.terms) {
        data.push({text:invoiceLabels.terms, style: ['termsLabel']});
        data.push({stack:[{text: invoice.terms, style: ['terms']}]});
    }

    return NINJA.prepareDataList(data, 'notesAndTerms');
}

NINJA.invoiceColumns = function(invoice)
{
    var account = invoice.account;
    var columns = [];

    if (invoice.has_product_key) {
        columns.push("15%");
    }

    columns.push("*")

    if (invoice.is_pro && account.custom_invoice_item_label1) {
        columns.push("10%");
    }
    if (invoice.is_pro && account.custom_invoice_item_label2) {
        columns.push("10%");
    }

    var count = 3;
    if (account.hide_quantity == '1') {
        count--;
    }
    if (account.show_item_taxes == '1') {
        count++;
    }
    for (var i=0; i<count; i++) {
        columns.push("14%");
    }

    return columns;
}

NINJA.invoiceFooter = function(invoice)
{
    if (!invoice.is_pro && invoice.invoice_design_id == 3) {
        return invoice.invoice_footer ? invoice.invoice_footer.substring(0, 200) : ' ';
    } else {
        return invoice.invoice_footer || ' ';
    }
}

NINJA.quantityWidth = function(invoice)
{
    return invoice.account.hide_quantity == '1' ? '' : '"14%", ';
}

NINJA.taxWidth = function(invoice)
{
    return invoice.account.show_item_taxes == '1' ? '"14%", ' : '';
}

NINJA.invoiceLines = function(invoice) {
    var account = invoice.account;
    var total = 0;
    var shownItem = false;
    var hideQuantity = invoice.account.hide_quantity == '1';
    var showItemTaxes = invoice.account.show_item_taxes == '1';

    var grid = [[]];

    if (invoice.has_product_key) {
        grid[0].push({text: invoiceLabels.item, style: ['tableHeader', 'itemTableHeader']});
    }

    grid[0].push({text: invoiceLabels.description, style: ['tableHeader', 'descriptionTableHeader']});

    if (invoice.is_pro && account.custom_invoice_item_label1) {
        grid[0].push({text: account.custom_invoice_item_label1, style: ['tableHeader', 'custom1TableHeader']});
    }
    if (invoice.is_pro && account.custom_invoice_item_label2) {
        grid[0].push({text: account.custom_invoice_item_label2, style: ['tableHeader', 'custom2TableHeader']});
    }

    grid[0].push({text: invoiceLabels.unit_cost, style: ['tableHeader', 'costTableHeader']});

    if (!hideQuantity) {
        grid[0].push({text: invoiceLabels.quantity, style: ['tableHeader', 'qtyTableHeader']});
    }
    if (showItemTaxes) {
        grid[0].push({text: invoiceLabels.tax, style: ['tableHeader', 'taxTableHeader']});
    }

    grid[0].push({text: invoiceLabels.line_total, style: ['tableHeader', 'lineTotalTableHeader']});

    for (var i = 0; i < invoice.invoice_items.length; i++) {

        var row = [];
        var item = invoice.invoice_items[i];
        var cost = formatMoneyInvoice(item.cost, invoice, true);
        var qty = NINJA.parseFloat(item.qty) ? roundToTwo(NINJA.parseFloat(item.qty)) + '' : '';
        var notes = item.notes;
        var productKey = item.product_key;
        var tax = '';        
        
        if (showItemTaxes) {
            if (item.tax && parseFloat(item.tax.rate)) {
                tax = parseFloat(item.tax.rate);
            } else if (item.tax_rate && parseFloat(item.tax_rate)) {
                tax = parseFloat(item.tax_rate);
            }
        }

        // show at most one blank line
        if (shownItem && !notes && !productKey && (!cost || cost == '0' || cost == '0.00' || cost == '0,00')) {
            continue;
        }

        shownItem = true;

        // process date variables
        if (invoice.is_recurring) {
            notes = processVariables(notes);
            productKey = processVariables(productKey);
        }

        var lineTotal = roundToTwo(NINJA.parseFloat(item.cost)) * roundToTwo(NINJA.parseFloat(item.qty));
        lineTotal = formatMoneyInvoice(lineTotal, invoice);

        rowStyle = (i % 2 == 0) ? 'odd' : 'even';
        
        if (invoice.has_product_key) {
            row.push({style:["productKey", rowStyle], text:productKey || ' '}); // product key can be blank when selecting from a datalist
        }
        row.push({style:["notes", rowStyle], stack:[{text:notes || ' '}]}); 
        if (invoice.is_pro && account.custom_invoice_item_label1) {
            row.push({style:["customValue1", rowStyle], text:item.custom_value1 || ' '});
        }
        if (invoice.is_pro && account.custom_invoice_item_label2) {
            row.push({style:["customValue2", rowStyle], text:item.custom_value2 || ' '});
        }
        row.push({style:["cost", rowStyle], text:cost});
        if (!hideQuantity) {
            row.push({style:["quantity", rowStyle], text:qty || ' '});
        }
        if (showItemTaxes) {
            row.push({style:["tax", rowStyle], text:tax ? (tax.toString() + '%') : ' '});
        }
        row.push({style:["lineTotal", rowStyle], text:lineTotal || ' '});

        grid.push(row);
    }   

    return NINJA.prepareDataTable(grid, 'invoiceItems');
}

NINJA.subtotals = function(invoice, hideBalance)
{
    if (!invoice) {
        return;
    }

    var account = invoice.account;
    var data = [];
    data.push([{text: invoiceLabels.subtotal}, {text: formatMoneyInvoice(invoice.subtotal_amount, invoice)}]);

    if (invoice.discount_amount != 0) {
        data.push([{text: invoiceLabels.discount}, {text: formatMoneyInvoice(invoice.discount_amount, invoice)}]);
    }
    
    if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 == '1') {
        data.push([{text: account.custom_invoice_label1}, {text: formatMoneyInvoice(invoice.custom_value1, invoice)}]);
    }
    if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 == '1') {
        data.push([{text: account.custom_invoice_label2}, {text: formatMoneyInvoice(invoice.custom_value2, invoice)}]);
    }

    for (var key in invoice.item_taxes) {
        if (invoice.item_taxes.hasOwnProperty(key)) {
            var taxRate = invoice.item_taxes[key];            
            var taxStr = taxRate.name + ' ' + (taxRate.rate*1).toString() + '%';
            data.push([{text: taxStr}, {text: formatMoneyInvoice(taxRate.amount, invoice)}]);
        }
    }

    if (invoice.tax && invoice.tax.name || invoice.tax_name) {
        var taxStr = invoice.tax_name + ' ' + (invoice.tax_rate*1).toString() + '%';
        data.push([{text: taxStr}, {text: formatMoneyInvoice(invoice.tax_amount, invoice)}]);        
    }

    if (NINJA.parseFloat(invoice.custom_value1) && invoice.custom_taxes1 != '1') {        
        data.push([{text: account.custom_invoice_label1}, {text: formatMoneyInvoice(invoice.custom_value1, invoice)}]);
    }
    if (NINJA.parseFloat(invoice.custom_value2) && invoice.custom_taxes2 != '1') {
        data.push([{text: account.custom_invoice_label2}, {text: formatMoneyInvoice(invoice.custom_value2, invoice)}]);        
    }    

    var paid = invoice.amount - invoice.balance;
    if (invoice.account.hide_paid_to_date != '1' || paid) {
        data.push([{text:invoiceLabels.paid_to_date}, {text:formatMoneyInvoice(paid, invoice)}]);        
    }

    var isPartial = NINJA.parseFloat(invoice.partial);
        
    if (!hideBalance || isPartial) {
        data.push([
            { text: invoiceLabels.balance_due, style: [isPartial ? '' : 'balanceDueLabel'] },
            { text: formatMoneyInvoice(invoice.total_amount, invoice), style: [isPartial ? '' : 'balanceDue'] }
        ]);
    }
    
    if (!hideBalance) {
        if (isPartial) {
            data.push([
                { text: invoiceLabels.partial_due, style: ['balanceDueLabel'] },
                { text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['balanceDue'] }
            ]);
        }
    }        

    return NINJA.prepareDataPairs(data, 'subtotals');
}

NINJA.subtotalsBalance = function(invoice) {
    var isPartial = NINJA.parseFloat(invoice.partial);
    return [[
        {text: isPartial ? invoiceLabels.partial_due : invoiceLabels.balance_due, style:['balanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style:['balanceDue']}
    ]];
}

NINJA.accountDetails = function(invoice) {
    var account = invoice.account;
    var data = [
        {text:account.name, style: ['accountName']},
        {text:account.id_number},
        {text:account.vat_number},
        {text:account.website},
        {text:account.work_email},
        {text:account.work_phone}
    ];
    return NINJA.prepareDataList(data, 'accountDetails');
}

NINJA.accountAddress = function(invoice) {
    var account = invoice.account;
    var cityStatePostal = '';    
    if (account.city || account.state || account.postal_code) {
        var swap = account.country && account.country.swap_postal_code;
        cityStatePostal = formatAddress(account.city, account.state, account.postal_code, swap);
    }
    var data = [
        {text: account.address1},
        {text: account.address2},
        {text: cityStatePostal},
        {text: account.country ? account.country.name : ''},
    ];

    if (invoice.is_pro) {
        data.push({text: invoice.account.custom_value1 ? invoice.account.custom_label1 + ' ' + invoice.account.custom_value1 : false});
        data.push({text: invoice.account.custom_value2 ? invoice.account.custom_label2 + ' ' + invoice.account.custom_value2 : false});
    }

    return NINJA.prepareDataList(data, 'accountAddress');
}

NINJA.invoiceDetails = function(invoice) {

    var data = [
    [
        {text: (invoice.is_quote ? invoiceLabels.quote_number : invoiceLabels.invoice_number), style: ['invoiceNumberLabel']},
        {text: invoice.invoice_number, style: ['invoiceNumber']}
    ],
    [
        {text: invoiceLabels.po_number},            
        {text: invoice.po_number}
    ],
    [
        {text:  (invoice.is_quote ? invoiceLabels.quote_date : invoiceLabels.invoice_date)}, 
        {text: invoice.invoice_date}
    ],
    [
        {text: (invoice.is_quote ? invoiceLabels.valid_until : invoiceLabels.due_date)}, 
        {text: invoice.due_date}
    ]
    ];

    if (invoice.custom_text_value1) {
        data.push([
            {text: invoice.account.custom_invoice_text_label1},
            {text: invoice.custom_text_value1}
        ])
    }
    if (invoice.custom_text_value2) {
        data.push([
            {text: invoice.account.custom_invoice_text_label2},
            {text: invoice.custom_text_value2}
        ])
    }

    var isPartial = NINJA.parseFloat(invoice.partial);
    
    if (NINJA.parseFloat(invoice.balance) < NINJA.parseFloat(invoice.amount)) {
        data.push([
            {text: invoiceLabels.balance_due},
            {text: formatMoneyInvoice(invoice.amount, invoice)}
        ]);
    } else if (isPartial) {
        data.push([
            {text: invoiceLabels.balance_due},
            {text: formatMoneyInvoice(invoice.total_amount, invoice)}
        ]);
    }

    data.push([
        {text: isPartial ? invoiceLabels.partial_due : invoiceLabels.balance_due, style: ['invoiceDetailBalanceDueLabel']},
        {text: formatMoneyInvoice(invoice.balance_amount, invoice), style: ['invoiceDetailBalanceDue']}
    ])

    return NINJA.prepareDataPairs(data, 'invoiceDetails');
}

NINJA.clientDetails = function(invoice) {
    var client = invoice.client;
    var data;
    if (!client) {
        return;
    }
    var account = invoice.account;
    var contact = client.contacts[0];
    var clientName = client.name || (contact.first_name || contact.last_name ? (contact.first_name + ' ' + contact.last_name) : contact.email);
    var clientEmail = client.contacts[0].email == clientName ? '' : client.contacts[0].email; 

    var cityStatePostal = '';
    if (client.city || client.state || client.postal_code) {
        var swap = client.country && client.country.swap_postal_code;
        cityStatePostal = formatAddress(client.city, client.state, client.postal_code, swap);
    }

    // if a custom field is used in the invoice/quote number then we'll hide it from the PDF
    var pattern = invoice.is_quote ? account.quote_number_pattern : account.invoice_number_pattern;
    var custom1InPattern = (pattern && pattern.indexOf('{$custom1}') >= 0);
    var custom2InPattern = (pattern && pattern.indexOf('{$custom2}') >= 0);

    data = [
        {text:clientName || ' ', style: ['clientName']},
        {text:client.id_number},
        {text:client.vat_number},
        {text:client.address1},
        {text:client.address2},
        {text:cityStatePostal},
        {text:client.country ? client.country.name : ''},
        {text:clientEmail},
        {text: client.custom_value1 && !custom1InPattern ? account.custom_client_label1 + ' ' + client.custom_value1 : false},
        {text: client.custom_value2 && !custom2InPattern ? account.custom_client_label2 + ' ' + client.custom_value2 : false}
    ];

    return NINJA.prepareDataList(data, 'clientDetails');
}

NINJA.getPrimaryColor = function(defaultColor) {
    return NINJA.primaryColor ? NINJA.primaryColor : defaultColor;
}

NINJA.getSecondaryColor = function(defaultColor) {
    return NINJA.primaryColor ? NINJA.secondaryColor : defaultColor;
}

// remove blanks and add section style to all elements
NINJA.prepareDataList = function(oldData, section) {
    var newData = [];
    for (var i=0; i<oldData.length; i++) {
        var item = NINJA.processItem(oldData[i], section);
        if (item.text || item.stack) {
            newData.push(item);
        }
    }
    return newData;    
}

NINJA.prepareDataTable = function(oldData, section) {
    var newData = [];
    for (var i=0; i<oldData.length; i++) {
        var row = oldData[i];        
        var newRow = [];
        for (var j=0; j<row.length; j++) {
            var item = NINJA.processItem(row[j], section);
            if (item.text || item.stack) {
                newRow.push(item);
            }
        }            
        if (newRow.length) {
            newData.push(newRow);
        }
    }
    return newData;    
}

NINJA.prepareDataPairs = function(oldData, section) {
    var newData = [];
    for (var i=0; i<oldData.length; i++) {
        var row = oldData[i];
        var isBlank = false;
        for (var j=0; j<row.length; j++) {
            var item = NINJA.processItem(row[j], section);
            if (!item.text) {
                isBlank = true;
            }
            if (j == 1) {
                NINJA.processItem(row[j], section + "Value");
            }
        }
        if (!isBlank) {
            newData.push(oldData[i]);
        }
    }
    return newData;
}

NINJA.processItem = function(item, section) {
    if (item.style && item.style instanceof Array) {
        item.style.push(section);
    } else {
        item.style = [section];
    }
    return item;
}


NINJA.parseMarkdownText = function(val, groupText)
{
    var rules = [
        ['\\\*\\\*(\\\w.+?)\\\*\\\*', {'bold': true}], // **value**
        ['\\\*(\\\w.+?)\\\*', {'italics': true}], // *value*
        ['^###(.*)', {'style': 'help'}], // ### Small/gray help
        ['^##(.*)', {'style': 'subheader'}], // ## Header
        ['^#(.*)', {'style': 'header'}] // # Subheader
    ];

    var parts = typeof val === 'string' ? [val] : val;
    for (var i=0; i<rules.length; i++) {
        var rule = rules[i];
        var formatter = function(data) {
            return $.extend(data, rule[1]);
        }
        parts = NINJA.parseRegExp(parts, rule[0], formatter, true);
    }

    return parts.length > 1 ? parts : val;
}

/*
NINJA.parseMarkdownStack = function(val)
{
    if (val.length == 1) {
        var item = val[0];
        var line = item.hasOwnProperty('text') ? item.text : item;

        if (typeof line === 'string') {
            line = [line];
        }
        
        var regExp = '^\\\* (.*[\r\n|\n|\r]?)';
        var formatter = function(data) {
            return {"ul": [data.text]};
        }

        val = NINJA.parseRegExp(line, regExp, formatter, false);
    }
    
    return val;
}
*/

NINJA.parseRegExp = function(val, regExpStr, formatter, groupText)
{
    var regExp = new RegExp(regExpStr, 'gm');
    var parts = [];
    
    for (var i=0; i<val.length; i++) {
        var line = val[i];
        parts = parts.concat(NINJA.parseRegExpLine(line, regExp, formatter, groupText));
    }

    return parts.length > 1 ? parts : val;
}

NINJA.parseRegExpLine = function(line, regExp, formatter, groupText)
{
    var parts = [];
    var lastIndex = 0;
    
    while (match = regExp.exec(line)) {
        if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
        }
        var data = {};
        data.text = match[1];
        data = formatter(data);
        parts.push(data);
        lastIndex = match.index + match[0].length;
    }

    if (parts.length) {
        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }
        return parts;
    }

    return line;
}