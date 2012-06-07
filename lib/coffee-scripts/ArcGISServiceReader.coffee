Ext.namespace "GeoExt.data"
GeoExt.data.ArcGISServiceReader = (meta, recordType) ->
  meta = meta or {}
  #meta.format = OpenLayers.Format.JSON  unless meta.format
  if typeof recordType isnt "function"
    recordType = GeoExt.data.LayerRecord.create(recordType or meta.fields or [
      name: "name"
      type: "string"
    ,
      name: "title"
      type: "string"
    ,
      name: "abstract"
      type: "string"
    ,
      name: "queryable"
      type: "boolean"
    ,
      name: "opaque"
      type: "boolean"
    ,
      name: "noSubsets"
      type: "boolean"
    ,
      name: "id"
      type: "int"
    ,
      name: "cascaded"
      type: "int"
    ,
      name: "fixedWidth"
      type: "int"
    ,
      name: "fixedHeight"
      type: "int"
    ,
      name: "id"
      type: "int"
    ,
      name: "parentLayerId"
      type: "int"
    ,
      name: "minScale"
      type: "float"
    ,
      name: "maxScale"
      type: "float"
    ,
      name: "prefix"
      type: "string"
    ,
      name: "subLayerIds" #Array
    ,
      name: "formats"
    ,
      name: "styles"
    ,
      name: "srs"
    ,
      name: "dimensions"
    ,
      name: "bbox"
    ,
      name: "llbbox"
    ,
      name: "attribution"
    ,
      name: "keywords"
    ,
      name: "identifiers"
    ,
      name: "authorityURLs"
    ,
      name: "metadataURLs"
    ])
  GeoExt.data.ArcGISServiceReader.superclass.constructor.call this, meta, recordType

Ext.extend GeoExt.data.ArcGISServiceReader, Ext.data.DataReader,
  attributionCls: "gx-attribution"
  wkid2epgs: 
    102100: 900913
  read: (request) ->
    delete request.responseXML
    @raw = Ext.util.JSON.decode request.responseText
    records = []
    for layer in @raw.layers
      values = {}
      for field in this.recordType.prototype.fields.items
        v = layer[field.mapping || field.name] ||
        field.defaultValue
        v = field.convert v
        values[field.name] = v
      values.srs = @srs()
      records.push new this.recordType(values, layer.id)
    {
      totalRecords: records.length
      success: true
      records: records
    }

  srs: ->
    t = {}
    t[ "EPSG:#{ @wkid2epgs[ @raw.spatialReference.wkid ] }" ] = 1
    t
