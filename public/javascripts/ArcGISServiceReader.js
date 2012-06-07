
Ext.namespace("GeoExt.data");

GeoExt.data.ArcGISServiceReader = function(meta, recordType) {
  meta = meta || {};
  if (typeof recordType !== "function") {
    recordType = GeoExt.data.LayerRecord.create(recordType || meta.fields || [
      {
        name: "name",
        type: "string"
      }, {
        name: "title",
        type: "string"
      }, {
        name: "abstract",
        type: "string"
      }, {
        name: "queryable",
        type: "boolean"
      }, {
        name: "opaque",
        type: "boolean"
      }, {
        name: "noSubsets",
        type: "boolean"
      }, {
        name: "id",
        type: "int"
      }, {
        name: "cascaded",
        type: "int"
      }, {
        name: "fixedWidth",
        type: "int"
      }, {
        name: "fixedHeight",
        type: "int"
      }, {
        name: "id",
        type: "int"
      }, {
        name: "parentLayerId",
        type: "int"
      }, {
        name: "minScale",
        type: "float"
      }, {
        name: "maxScale",
        type: "float"
      }, {
        name: "prefix",
        type: "string"
      }, {
        name: "subLayerIds"
      }, {
        name: "formats"
      }, {
        name: "styles"
      }, {
        name: "srs"
      }, {
        name: "dimensions"
      }, {
        name: "bbox"
      }, {
        name: "llbbox"
      }, {
        name: "attribution"
      }, {
        name: "keywords"
      }, {
        name: "identifiers"
      }, {
        name: "authorityURLs"
      }, {
        name: "metadataURLs"
      }
    ]);
  }
  return GeoExt.data.ArcGISServiceReader.superclass.constructor.call(this, meta, recordType);
};

Ext.extend(GeoExt.data.ArcGISServiceReader, Ext.data.DataReader, {
  attributionCls: "gx-attribution",
  wkid2epgs: {
    102100: 900913
  },
  read: function(request) {
    var field, layer, records, v, values, _i, _j, _len, _len2, _ref, _ref2;
    delete request.responseXML;
    this.raw = Ext.util.JSON.decode(request.responseText);
    records = [];
    _ref = this.raw.layers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      values = {};
      _ref2 = this.recordType.prototype.fields.items;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        field = _ref2[_j];
        v = layer[field.mapping || field.name] || field.defaultValue;
        v = field.convert(v);
        values[field.name] = v;
      }
      values.srs = this.srs();
      records.push(new this.recordType(values, layer.id));
    }
    return {
      totalRecords: records.length,
      success: true,
      records: records
    };
  },
  srs: function() {
    var t;
    t = {};
    t["EPSG:" + this.wkid2epgs[this.raw.spatialReference.wkid]] = 1;
    return t;
  }
});
