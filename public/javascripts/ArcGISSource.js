
Ext.namespace("gxp.plugins");

gxp.plugins.ArcGISSource = Ext.extend(gxp.plugins.LayerSource, {
  ptype: "gispro_arcgis",
  restUrl: null,
  baseParams: null,
  format: null,
  describeLayerStore: null,
  describedLayers: null,
  schemaCache: null,
  ready: false,
  lazy: false,
  url: '',
  createStore: function() {
    var baseParams;
    baseParams = this.baseParams || {
      f: "json"
    };
    if (this.version) baseParams.VERSION = this.version;
    this.store = new GeoExt.data.ArcGISServiceStore({
      url: this.trimUrl(this.url, baseParams),
      baseParams: baseParams,
      format: this.format,
      autoLoad: !this.lazy,
      layerParams: {
        exceptions: null
      },
      listeners: {
        load: function() {
          if (!this.store.reader.raw || !this.store.reader.raw.layers) {
            return this.fireEvent("failure", this, "Invalid capabilities document.");
          } else {
            if (!this.title) this.title = this.store.reader.raw.documentInfo.Title;
            if (!this.ready) {
              this.ready = true;
              return this.fireEvent("ready", this);
            }
          }
        },
        exception: function(proxy, type, action, options, response, error) {
          var details, msg, report, status;
          delete this.store;
          msg = void 0;
          details = "";
          if (type === "response") {
            if (typeof error === "string") {
              msg = error;
            } else {
              msg = "Invalid response from server.";
              status = response.status;
              if (status >= 200 && status < 300) {
                if (error.arg) {
                  report = error.arg.exceptionReport;
                  details = gxp.util.getOGCExceptionText(report);
                } else {
                  details = "Status: " + status + " ErrName: " + error.name + " Message: " + error.message + " Description: " + error.description;
                }
              } else {
                details = "Status: " + status;
              }
            }
          } else {
            msg = "Trouble creating layer store from response.";
            details = "Unable to handle response.";
          }
          return this.fireEvent("failure", this, msg, details);
        },
        scope: this
      }
    });
    if (this.lazy) {
      return window.setTimeout((function() {
        return this.fireEvent("ready", this);
      }).createDelegate(this), 0);
    }
  },
  trimUrl: function(url, params, respectCase) {
    var key, keys, urlParams;
    urlParams = OpenLayers.Util.getParameters(url);
    params = OpenLayers.Util.upperCaseObject(params);
    keys = 0;
    for (key in urlParams) {
      ++keys;
      if (key.toUpperCase() in params) {
        --keys;
        delete urlParams[key];
      }
    }
    return url.split("?").shift() + (keys ? "?" + OpenLayers.Util.getParameterString(urlParams) : "");
  },
  createLayerRecord: function(config) {
    var Record, data, fields, fullExtent, index, initialExtent, layer, maxExtent, original, record, restrictedExtent;
    record = void 0;
    index = this.store.findExact("id", config.id);
    if (index > -1) {
      original = this.store.getAt(index);
      layer = new OpenLayers.Layer.ArcGIS93Rest(original.get('name'), this.url + '/export', {
        layers: config.id,
        transparent: config.transparent === null || config.transparent === void 0 ? true : config.transparent
      });
      maxExtent = null;
      restrictedExtent = null;
      initialExtent = this.store.reader.raw.initialExtent;
      if (initialExtent) {
        restrictedExtent = new OpenLayers.Bounds.fromArray([initialExtent.xmin, initialExtent.ymin, initialExtent.xmax, initialExtent.ymax]);
        restrictedExtent.transform(new OpenLayers.Projection(this.target.map.projection), new OpenLayers.Projection("EPSG:4326"));
      }
      fullExtent = this.store.reader.raw.fullExtent;
      if (fullExtent) {
        maxExtent = new OpenLayers.Bounds.fromArray([fullExtent.xmin, fullExtent.ymin, fullExtent.xmax, fullExtent.ymax]);
        maxExtent.transform(new OpenLayers.Projection(this.target.map.projection), new OpenLayers.Projection("EPSG:4326"));
      }
      if (!this.viewMangerUsed) {
        layer.addOptions({
          maxExtent: maxExtent,
          restrictedExtent: restrictedExtent
        }, true);
      }
      data = Ext.applyIf({
        title: original.get('name'),
        group: config.group,
        source: config.source,
        fixed: config.fixed,
        selected: ("selected" in config ? config.selected : false),
        layer: layer,
        llbbox: maxExtent.toArray(),
        rbbox: restrictedExtent.toArray()
      }, original.data);
      fields = [
        {
          name: "rbbox"
        }, {
          name: "source",
          type: "string"
        }, {
          name: "group",
          type: "string"
        }, {
          name: "properties",
          type: "string"
        }, {
          name: "fixed",
          type: "boolean"
        }, {
          name: "selected",
          type: "boolean"
        }
      ];
      original.fields.each(function(field) {
        return fields.push(field);
      });
      Record = GeoExt.data.LayerRecord.create(fields);
      record = new Record(data, layer.id);
    }
    return record;
  },
  getConfigForRecord: function(record) {
    var config, layer, params;
    config = gxp.plugins.ArcGISSource.superclass.getConfigForRecord.apply(this, arguments);
    layer = record.getLayer();
    params = layer.params;
    return Ext.apply(config, {
      transparent: params.TRANSPARENT,
      id: layer.params.LAYERS
    });
  },
  getState: function() {
    var state;
    state = Ext.apply({}, this.initialConfig);
    return Ext.apply(state, {
      title: this.title,
      ptype: this.ptype
    });
  }
});

Ext.preg(gxp.plugins.ArcGISSource.prototype.ptype, gxp.plugins.ArcGISSource);
